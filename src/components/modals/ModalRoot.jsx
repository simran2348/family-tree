import { useUiStore } from '../../store/uiStore';
import AddPersonModal from './AddPersonModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import ExportModal from './ExportModal';
import ImportModal from './ImportModal';
import TreeNameModal from './TreeNameModal';
import AccountModal from './AccountModal';
import ShortcutsModal from './ShortcutsModal';
import PersonProfile from '../person/PersonProfile';

const MODALS = {
  addPerson: AddPersonModal,
  confirm: ConfirmDeleteModal,
  export: ExportModal,
  import: ImportModal,
  treeName: TreeNameModal,
  'profile-account': AccountModal,
  profile: PersonProfile,
};

export default function ModalRoot() {
  const modal = useUiStore((s) => s.modal);
  const shortcutsOpen = useUiStore((s) => s.shortcutsOpen);
  const Component = modal && MODALS[modal.type];
  return (
    <>
      {Component && <Component key={modal.type + JSON.stringify(modal.props?.personId || modal.props?.kind || '')} {...modal.props} />}
      {shortcutsOpen && <ShortcutsModal />}
    </>
  );
}
