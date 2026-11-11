import { UserRound } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { useTreeStore } from '../../store/familyTreeStore';
import { useUiStore, toast } from '../../store/uiStore';
import { Row, Toggle, Slider, Select, SectionTitle } from '../ui/Controls';
import { ResetButton } from './TreeSettings';

export default function PrivacySettings() {
  const p = useSettingsStore((s) => s.privacy);
  const profile = useSettingsStore((s) => s.profile);
  const update = useSettingsStore((s) => s.update);
  const openModal = useUiStore((s) => s.openModal);
  const set = (patch) => update('privacy', patch);

  const changeStorage = (v) => {
    set({ storage: v });
    // Write the current data to the newly selected storage straight away.
    const s = useTreeStore.getState();
    useTreeStore.setState({ trees: { ...s.trees } });
    toast(v === 'session' ? 'Data will be cleared when this tab is closed.' : 'Data is saved on this device.', 'info');
  };

  return (
    <div>
      <SectionTitle action={<ResetButton sections={['privacy']} />}>Profile visibility</SectionTitle>
      <Row label="Hide living people’s dates on cards" hint="Useful when presenting or screen-sharing">
        <Toggle checked={p.hideLivingDatesOnCards} onChange={(v) => set({ hideLivingDatesOnCards: v })} label="Hide living dates" />
      </Row>
      <Row label="Hide living people’s dates in exports" hint="Applies to PNG, JPEG, SVG and PDF exports">
        <Toggle checked={p.maskLivingInExports} onChange={(v) => set({ maskLivingInExports: v })} label="Mask living in exports" />
      </Row>

      <SectionTitle>Data storage</SectionTitle>
      <Row label="Where to keep your trees" hint="Everything stays in this browser; nothing is uploaded">
        <Select value={p.storage} onChange={changeStorage} label="Storage" className="w-56"
          options={[{ id: 'persistent', label: 'This device (persistent)' }, { id: 'session', label: 'This tab only (private)' }]} />
      </Row>

      <SectionTitle>Image storage</SectionTitle>
      <Row label="Maximum photo size" hint="Larger photos are scaled down on upload">
        <Slider value={p.imageMaxSize} min={240} max={2048} step={16} unit="px" onChange={(v) => set({ imageMaxSize: v })} label="Max photo size" />
      </Row>
      <Row label="Photo quality" hint="Lower quality uses less storage">
        <Slider value={Math.round(p.imageQuality * 100)} min={40} max={100} unit="%" onChange={(v) => set({ imageQuality: v / 100 })} label="Photo quality" />
      </Row>

      <SectionTitle>Account</SectionTitle>
      <div className="flex items-center gap-3 py-2">
        <div className="h-9 w-9 rounded-full bg-accent/12 text-accent flex items-center justify-center"><UserRound size={17} /></div>
        <div className="flex-1 text-[0.85rem]">
          {profile.signedIn ? <><div className="font-medium">{profile.name}</div><div className="text-muted text-[0.75rem]">{profile.email || 'Local profile'}</div></> : <div className="text-muted">Not signed in. Profiles are stored locally.</div>}
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => openModal('profile-account')}>{profile.signedIn ? 'Manage' : 'Sign in'}</button>
      </div>
    </div>
  );
}
