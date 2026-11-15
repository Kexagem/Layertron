
import React from 'react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footerContent }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center modal-backdrop z-50">
      <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">{title}</h2>
        <div className="text-[var(--text-primary)]">
            {children}
        </div>
        {footerContent && (
          <div className="mt-6 flex justify-end gap-3">
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );
};
