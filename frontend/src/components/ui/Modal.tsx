import type { ReactNode } from 'react';
import { Modal as BsModal } from 'react-bootstrap';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const bsSize = size === 'md' ? undefined : (size as 'sm' | 'lg' | 'xl');
  return (
    <BsModal show={isOpen} onHide={onClose} size={bsSize} centered>
      <BsModal.Header closeButton>
        <BsModal.Title>{title}</BsModal.Title>
      </BsModal.Header>
      <BsModal.Body>{children}</BsModal.Body>
    </BsModal>
  );
}
