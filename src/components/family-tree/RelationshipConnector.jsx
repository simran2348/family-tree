import { memo } from 'react';
import { BaseEdge, useInternalNode } from '@xyflow/react';
import { useSettingsStore } from '../../store/settingsStore';
import { getYear } from '../../utils/dates';

const rectOf = (node) =>
  node && {
    x: node.internals.positionAbsolute.x,
    y: node.internals.positionAbsolute.y,
    w: node.measured?.width ?? node.width ?? 0,
    h: node.measured?.height ?? node.height ?? 0,
  };

// Converts a rect into axis-local coordinates: `m` runs along generations, `c` across them.
const toLocal = (r, vertical) =>
  vertical ? { c: r.x, m: r.y, cs: r.w, ms: r.h } : { c: r.y, m: r.x, cs: r.h, ms: r.w };
const toXY = (p, vertical) => (vertical ? { x: p.c, y: p.m } : { x: p.m, y: p.c });

/** Polyline with rounded corners. */
function roundedPath(points, radius) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const next = points[i + 1];
    const d1 = Math.hypot(cur.x - prev.x, cur.y - prev.y);
    const d2 = Math.hypot(next.x - cur.x, next.y - cur.y);
    const r = Math.min(radius, d1 / 2, d2 / 2);
    if (r < 0.5) { d += ` L ${cur.x} ${cur.y}`; continue; }
    const a = { x: cur.x + ((prev.x - cur.x) / d1) * r, y: cur.y + ((prev.y - cur.y) / d1) * r };
    const b = { x: cur.x + ((next.x - cur.x) / d2) * r, y: cur.y + ((next.y - cur.y) / d2) * r };
    d += ` L ${a.x} ${a.y} Q ${cur.x} ${cur.y} ${b.x} ${b.y}`;
  }
  const last = points[points.length - 1];
  return `${d} L ${last.x} ${last.y}`;
}

function useConnectorStyle() {
  const c = useSettingsStore((s) => s.connector);
  return c;
}

export const FamilyEdge = memo(function FamilyEdge({ id, target, data }) {
  const [p1, p2] = data.parents;
  const a = useInternalNode(p1);
  const b = useInternalNode(p2 || p1);
  const child = useInternalNode(target);
  const conn = useConnectorStyle();
  if (!a || !child) return null;

  const vertical = data.axis !== 'horizontal';
  const pa = toLocal(rectOf(a), vertical);
  const pb = toLocal(rectOf(p2 ? b : a), vertical);
  const ch = toLocal(rectOf(child), vertical);
  const parentsMid = (pa.m + pb.m) / 2 + pa.ms / 2;
  const childCenterM = ch.m + ch.ms / 2;
  const down = childCenterM >= parentsMid; // child sits after the parents along the generation axis

  const couple = Boolean(p2) && p2 !== p1;
  const parentEdge = down ? Math.max(pa.m + pa.ms, pb.m + pb.ms) : Math.min(pa.m, pb.m);
  const start = couple
    ? { c: (pa.c + pa.cs / 2 + pb.c + pb.cs / 2) / 2, m: (pa.m + pa.ms / 2 + pb.m + pb.ms / 2) / 2 }
    : { c: pa.c + pa.cs / 2, m: parentEdge };
  const end = { c: ch.c + ch.cs / 2, m: down ? ch.m : ch.m + ch.ms };
  const elbow = (parentEdge + end.m) / 2;

  let path;
  if (conn.style === 'straight') {
    const s = toXY(start, vertical);
    const e = toXY(end, vertical);
    path = `M ${s.x} ${s.y} L ${e.x} ${e.y}`;
  } else if (conn.style === 'curved') {
    const s0 = toXY(start, vertical);
    const s1 = toXY({ c: start.c, m: parentEdge }, vertical);
    const c1 = toXY({ c: start.c, m: elbow }, vertical);
    const c2 = toXY({ c: end.c, m: elbow }, vertical);
    const e = toXY(end, vertical);
    path = `M ${s0.x} ${s0.y} L ${s1.x} ${s1.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${e.x} ${e.y}`;
  } else {
    const pts = [start, { c: start.c, m: elbow }, { c: end.c, m: elbow }, end].map((p) => toXY(p, vertical));
    path = roundedPath(pts, conn.cornerRadius);
  }

  const nonBio = data.subtype && data.subtype !== 'biological';
  const dash = nonBio ? '2 5' : conn.dashed ? '6 5' : undefined;
  const labelPos = toXY({ c: end.c, m: end.m + (down ? -12 : 12) }, vertical);

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: conn.color || 'var(--c-connector)',
          strokeWidth: conn.thickness,
          strokeDasharray: dash,
          strokeLinecap: 'round',
          fill: 'none',
        }}
      />
      {conn.showLabels && nonBio && (
        <text x={labelPos.x + 6} y={labelPos.y} fontSize={10} fill="var(--c-muted)" dominantBaseline="middle" style={{ fontFamily: 'var(--f-body)' }}>
          {data.subtype === 'adoptive' ? 'adopted' : data.subtype}
        </text>
      )}
    </>
  );
});

export const PartnerEdge = memo(function PartnerEdge({ id, source, target, data }) {
  const a = useInternalNode(source);
  const b = useInternalNode(target);
  const conn = useConnectorStyle();
  if (!a || !b) return null;
  const ra = rectOf(a);
  const rb = rectOf(b);
  const [l, r] = ra.x <= rb.x ? [ra, rb] : [rb, ra];
  const [t, bo] = ra.y <= rb.y ? [ra, rb] : [rb, ra];
  const gapX = r.x - (l.x + l.w);
  const gapY = bo.y - (t.y + t.h);

  let s;
  let e;
  if (gapX >= gapY) {
    s = { x: l.x + l.w, y: l.y + l.h / 2 };
    e = { x: r.x, y: r.y + r.h / 2 };
  } else {
    s = { x: t.x + t.w / 2, y: t.y + t.h };
    e = { x: bo.x + bo.w / 2, y: bo.y };
  }
  const horizontal = gapX >= gapY;
  let path;
  if (Math.abs(horizontal ? s.y - e.y : s.x - e.x) < 1 || conn.style === 'straight') path = `M ${s.x} ${s.y} L ${e.x} ${e.y}`;
  else if (conn.style === 'curved') {
    path = horizontal
      ? `M ${s.x} ${s.y} C ${(s.x + e.x) / 2} ${s.y} ${(s.x + e.x) / 2} ${e.y} ${e.x} ${e.y}`
      : `M ${s.x} ${s.y} C ${s.x} ${(s.y + e.y) / 2} ${e.x} ${(s.y + e.y) / 2} ${e.x} ${e.y}`;
  } else {
    const mid = horizontal ? (s.x + e.x) / 2 : (s.y + e.y) / 2;
    const pts = horizontal ? [s, { x: mid, y: s.y }, { x: mid, y: e.y }, e] : [s, { x: s.x, y: mid }, { x: e.x, y: mid }, e];
    path = roundedPath(pts, conn.cornerRadius);
  }

  const ended = data.status === 'divorced' || data.status === 'separated';
  const color = conn.partnerColor || conn.color || 'var(--c-connector)';
  const m = { x: (s.x + e.x) / 2, y: (s.y + e.y) / 2 };
  const year = getYear(data.startDate);
  const label = data.status === 'divorced' ? `div.${year ? ` (m. ${year})` : ''}` : data.status === 'separated' ? 'sep.' : year ? `${data.status === 'engaged' ? 'eng.' : 'm.'} ${year}` : '';

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{ stroke: color, strokeWidth: conn.thickness, strokeDasharray: ended || conn.dashed ? '6 5' : undefined, fill: 'none' }}
      />
      {conn.marriageIndicator && (
        <g transform={`translate(${m.x} ${m.y})`} aria-hidden="true">
          <circle r={8} fill="var(--canvas-fill, var(--c-canvas-bg))" stroke={color} strokeWidth={1} />
          {data.status === 'married' && (
            <>
              <circle cx={-1.8} r={2.6} fill="none" stroke="var(--c-accent2)" strokeWidth={1.2} />
              <circle cx={1.8} r={2.6} fill="none" stroke="var(--c-accent2)" strokeWidth={1.2} />
            </>
          )}
          {data.status === 'engaged' && <circle r={2.8} fill="none" stroke="var(--c-accent2)" strokeWidth={1.2} />}
          {data.status === 'partner' && <circle r={2} fill="var(--c-accent2)" />}
          {ended && <path d="M -3 3 L 3 -3" stroke={color} strokeWidth={1.4} strokeLinecap="round" />}
        </g>
      )}
      {conn.showLabels && label && (
        <text x={m.x} y={m.y + (horizontal ? 18 : 0)} dx={horizontal ? 0 : 14} textAnchor={horizontal ? 'middle' : 'start'} fontSize={10} fill="var(--c-muted)" dominantBaseline="middle" style={{ fontFamily: 'var(--f-body)' }}>
          {label}
        </text>
      )}
    </>
  );
});
