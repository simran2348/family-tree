import { useState } from 'react';
import { TreeDeciduous } from 'lucide-react';
import Modal from '../ui/Modal';
import { useTreeStore } from '../../store/familyTreeStore';
import { useUiStore, toast } from '../../store/uiStore';

export default function TreeNameModal({ mode = 'create' }) {
  const tree = useTreeStore((s) => s.trees[s.activeTreeId]);
  const renameTree = useTreeStore((s) => s.renameTree);
  const createTree = useTreeStore((s) => s.createTree);
  const closeModal = useUiStore((s) => s.closeModal);
  const [name, setName] = useState(mode === 'rename' ? tree.name : '');
  const [description, setDescription] = useState(mode === 'rename' ? tree.description || '' : '');

  const submit = (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    if (mode === 'rename') {
      renameTree(tree.id, n);
      useTreeStore.setState((s) => ({ trees: { ...s.trees, [tree.id]: { ...s.trees[tree.id], description } } }));
      toast('Tree renamed.', 'success');
    } else {
      const id = createTree(n);
      useTreeStore.setState((s) => ({ trees: { ...s.trees, [id]: { ...s.trees[id], description } } }));
      toast(`Created “${n}”.`, 'success');
    }
    closeModal();
  };

  return (
    <Modal
      title={mode === 'rename' ? 'Rename tree' : 'New family tree'}
      icon={TreeDeciduous}
      onClose={closeModal}
      width="max-w-md"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
          <button type="submit" form="tree-name-form" className="btn btn-primary" disabled={!name.trim()}>{mode === 'rename' ? 'Save' : 'Create tree'}</button>
        </>
      }
    >
      <form id="tree-name-form" onSubmit={submit} className="space-y-3">
        <label className="block"><span className="label">Tree name</span>
          <input className="input" value={name} maxLength={80} placeholder="e.g. The Singh Family" onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block"><span className="label">Description (optional)</span>
          <textarea className="textarea" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
      </form>
    </Modal>
  );
}
