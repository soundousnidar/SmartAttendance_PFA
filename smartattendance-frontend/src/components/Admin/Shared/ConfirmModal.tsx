import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './Shared.css';

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="confirm-modal-modern" onClick={(e) => e.stopPropagation()}>
        <button onClick={onCancel} className="confirm-close-btn">
          <X size={20} />
        </button>
        
        <div className="confirm-content">
          <div className="confirm-icon-modern">
            <AlertTriangle size={24} />
          </div>
          
          <div className="confirm-text">
            <h2 className="confirm-title-modern">{title}</h2>
            <p className="confirm-message-modern">{message}</p>
          </div>
        </div>

        <div className="confirm-actions-modern">
          <button onClick={onCancel} className="btn-cancel-modern">
            {cancelText}
          </button>
          <button onClick={onConfirm} className="btn-confirm-modern">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;