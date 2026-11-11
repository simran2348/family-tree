import { useState } from 'react';
import { UserRound, LogOut } from 'lucide-react';
import Modal from '../ui/Modal';
import { useSettingsStore } from '../../store/settingsStore';
import { useUiStore, toast } from '../../store/uiStore';

// There is no backend yet, so "signing in" creates a local profile on this device.
export default function AccountModal() {
  const profile = useSettingsStore((s) => s.profile);
  const update = useSettingsStore((s) => s.update);
  const closeModal = useUiStore((s) => s.closeModal);
  const openSettings = useUiStore((s) => s.openSettings);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const emailOk = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const save = (e) => {
    e.preventDefault();
    if (!name.trim() || !emailOk) return;
    update('profile', { signedIn: true, name: name.trim(), email: email.trim() });
    toast(profile.signedIn ? 'Profile updated.' : `Welcome, ${name.trim()}.`, 'success');
    closeModal();
  };

  return (
    <Modal
      title={profile.signedIn ? 'Your profile' : 'Sign in'}
      subtitle="Profiles are stored on this device only — no account server is used yet."
      icon={UserRound}
      onClose={closeModal}
      width="max-w-md"
      footer={
        <>
          {profile.signedIn && (
            <button type="button" className="btn btn-ghost mr-auto" onClick={() => { update('profile', { signedIn: false, name: '', email: '' }); toast('Signed out.'); closeModal(); }}>
              <LogOut size={15} /> Sign out
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={() => { closeModal(); openSettings('privacy'); }}>Privacy settings</button>
          <button type="submit" form="account-form" className="btn btn-primary" disabled={!name.trim() || !emailOk}>{profile.signedIn ? 'Save' : 'Continue'}</button>
        </>
      }
    >
      <form id="account-form" onSubmit={save} className="space-y-3">
        <label className="block"><span className="label">Display name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </label>
        <label className="block"><span className="label">Email (optional)</span>
          <input className="input" type="email" value={email} aria-invalid={!emailOk} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          {!emailOk && <span className="field-error">Enter a valid email address</span>}
        </label>
      </form>
    </Modal>
  );
}
