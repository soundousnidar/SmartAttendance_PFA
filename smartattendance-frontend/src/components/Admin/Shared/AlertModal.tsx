import React from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import './Shared.css';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'error' | 'success' | 'warning';
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={24} />;
      case 'error':
        return <AlertCircle size={24} />;
      case 'warning':
        return <AlertCircle size={24} />;
    }
  };

  return (
    <div className="alert-modal-overlay" onClick={onClose}>
      <div className="alert-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="alert-modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="alert-modal-header">
          <div className={`alert-icon-wrapper ${type}`}>
            {getIcon()}
          </div>
          <div className="alert-text-content">
            <h2 className={`alert-modal-title ${type}`}>{title}</h2>
            <div className="alert-modal-body">
              <p>{message}</p>
            </div>
          </div>
        </div>
        
        <div className="alert-modal-footer">
          <button onClick={onClose} className={`btn-alert ${type}`}>
            Compris
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;