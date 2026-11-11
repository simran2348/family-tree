import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from '../ui/Modal';
import { useUiStore } from '../../store/uiStore';

export default function ConfirmDeleteModal({ title, message, confirmLabel = 'Confirm', danger = true, onConfirm, requireText }) {
  const closeModal = useUiStore((s) => s.closeModal);
  const [typed, setTyped] = useState('');
  const blocked = requireText && typed.trim() !== requireText.trim();
  return (
    <Modal
      title={title}
      icon={AlertTriangle}
      onClose={closeModal}
      width="max-w-md"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
          <button type="button" disabled={blocked} className={`btn ${danger ? 'btn-danger-solid' : 'btn-primary'}`} onClick={() => { closeModal(); onConfirm?.(); }}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-[0.88rem] leading-relaxed text-fg/85">{message}</p>
      {requireText && (
        <label className="block mt-4">
          <span className="label">Type “{requireText}” to confirm</span>
          <input className="input" value={typed} onChange={(e) => setTyped(e.target.value)} />
        </label>
      )}
    </Modal>
  );
}
