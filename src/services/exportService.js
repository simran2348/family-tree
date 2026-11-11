import { toPng, toJpeg, toSvg } from 'html-to-image';
import { getNodesBounds } from '@xyflow/react';
import { HEADING_FONTS, BODY_FONTS } from '../constants/themes';
import { getAncestors, getDescendants, getPartners } from '../utils/graph';

// ---- scope -----------------------------------------------------------------

export function getExportIds(tree, scope, { selectedId, multiSelect }) {
  if (scope === 'all') return null;
  if (scope === 'selection') return new Set(multiSelect.length ? multiSelect : selectedId ? [selectedId] : []);
  if (!selectedId) return new Set();
  if (scope === 'ancestors') return new Set([selectedId, ...getAncestors(tree, selectedId).keys()]);
  if (scope === 'descendants') return new Set([selectedId, ...getDescendants(tree, selectedId).keys()]);
  // branch: selected person, partners, all descendants and their partners
  const ids = new Set([selectedId, ...getDescendants(tree, selectedId).keys()]);
  for (const id of [...ids]) for (const p of getPartners(tree, id)) ids.add(p);
  return ids;
}

export function subsetTree(tree, ids) {
  if (!ids) return tree;
  const people = Object.fromEntries(Object.entries(tree.people).filter(([id]) => ids.has(id)));
  return {
    ...tree,
    people,
    relationships: tree.relationships.filter((r) => ids.has(r.source) && ids.has(r.target)),
    positions: Object.fromEntries(Object.entries(tree.positions || {}).filter(([id]) => ids.has(id))),
    collapsed: (tree.collapsed || []).filter((id) => ids.has(id)),
    homePersonId: ids.has(tree.homePersonId) ? tree.homePersonId : Object.keys(people)[0] || null,
  };
}

// ---- fonts -----------------------------------------------------------------
// Web fonts must be inlined for html-to-image, otherwise exported images fall back to system fonts.

const GOOGLE_FAMILIES = {
  cormorant: 'Cormorant+Garamond:wght@600;700',
  playfair: 'Playfair+Display:wght@500;600',
  baskerville: 'Libre+Baskerville:wght@400;700',
  garamond: 'EB+Garamond:wght@500;600',
  inter: 'Inter:wght@400;500;600',
  source: 'Source+Sans+3:wght@400;500;600',
  lato: 'Lato:wght@400;700',
};
const fontCache = new Map();

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

async function getFontEmbedCSS(headingFont, bodyFont) {
  const families = [...new Set([headingFont, bodyFont])].map((f) => GOOGLE_FAMILIES[f]).filter(Boolean);
  if (!families.length) return '';
  const key = families.join('|');
  if (fontCache.has(key)) return fontCache.get(key);
  const url = `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f}`).join('&')}&display=swap`;
  const css = await (await fetch(url)).text();
  const blocks = css.split(/\/\*\s*([\w-]+)\s*\*\//).reduce((acc, part, i, arr) => {
    if (i % 2 === 1 && part === 'latin') acc.push(arr[i + 1]);
    return acc;
  }, []);
  let out = blocks.length ? blocks.join('\n') : css;
  const urls = [...new Set([...out.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]))];
  for (const u of urls) {
    const dataUrl = await blobToDataUrl(await (await fetch(u)).blob());
    out = out.split(u).join(dataUrl);
  }
  fontCache.set(key, out);
  return out;
}

// ---- image -----------------------------------------------------------------

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const frame = () => new Promise((r) => requestAnimationFrame(() => r()));

export async function waitForRender() {
  await frame();
  await frame();
  await wait(180);
}

export async function captureTree(rf, { format, pixelRatio, background, transparent, padding = 48, appearance }) {
  const nodes = rf.getNodes();
  if (!nodes.length) throw new Error('There is nothing to export for this selection.');
  const bounds = getNodesBounds(nodes);
  const width = Math.ceil(bounds.width + padding * 2);
  const height = Math.ceil(bounds.height + padding * 2);
  const MAX = 16000;
  const ratio = Math.min(pixelRatio, MAX / width, MAX / height);
  const viewport = document.querySelector('.react-flow__viewport');
  if (!viewport) throw new Error('Open the tree view to export an image.');

  let fontEmbedCSS;
  try {
    fontEmbedCSS = await getFontEmbedCSS(appearance.headingFont, appearance.bodyFont);
  } catch {
    fontEmbedCSS = undefined;
  }

  const options = {
    backgroundColor: transparent && format !== 'jpeg' ? undefined : background,
    width,
    height,
    pixelRatio: ratio,
    quality: 0.95,
    fontEmbedCSS,
    skipFonts: fontEmbedCSS === undefined,
    style: { width: `${width}px`, height: `${height}px`, transform: `translate(${padding - bounds.x}px, ${padding - bounds.y}px) scale(1)` },
    filter: (el) => !el.classList?.contains('nodrag'), // hide collapse buttons
  };
  const fn = format === 'jpeg' ? toJpeg : format === 'svg' ? toSvg : toPng;
  const dataUrl = await fn(viewport, options);
  return { dataUrl, width, height };
}

/** Adds a title banner above a raster image. */
export async function addTitleBanner(dataUrl, { title, subtitle, background, color, muted, headingFont, format }) {
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });
  const scale = img.width / 1000 > 1 ? img.width / 1400 : 1;
  const banner = Math.round(84 * scale);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height + banner;
  const ctx = canvas.getContext('2d');
  if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  ctx.drawImage(img, 0, banner);
  const heading = (HEADING_FONTS.find((f) => f.id === headingFont) || HEADING_FONTS[0]).css;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.font = `600 ${Math.round(30 * scale)}px ${heading}`;
  ctx.fillText(title, canvas.width / 2, Math.round(46 * scale));
  ctx.fillStyle = muted;
  ctx.font = `${Math.round(13 * scale)}px ${BODY_FONTS[0].css}`;
  ctx.fillText(subtitle, canvas.width / 2, Math.round(70 * scale));
  return canvas.toDataURL(format === 'jpeg' ? 'image/jpeg' : 'image/png', 0.95);
}

export async function toPdf(dataUrl, { title, width, height }) {
  const { jsPDF } = await import('jspdf');
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });
  const w = width;
  const h = Math.round((img.height / img.width) * width) || height;
  const pdf = new jsPDF({ orientation: w > h ? 'landscape' : 'portrait', unit: 'pt', format: [w, h], compress: true });
  pdf.setProperties({ title });
  pdf.addImage(dataUrl, dataUrl.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG', 0, 0, w, h, undefined, 'FAST');
  return pdf;
}
