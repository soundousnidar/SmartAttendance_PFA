import React, { useState, useEffect } from 'react';
import { Filiere, FiliereCreate } from '../../../types/filiere';
import './Filieres.css';

interface FiliereFormProps {
  filiere?: Filiere;
  onSubmit: (data: FiliereCreate) => Promise<void>;
  onCancel: () => void;
}

const FiliereForm: React.FC<FiliereFormProps> = ({ filiere, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<FiliereCreate>({
    code: '',
    nom: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (filiere) {
      setFormData({
        code: filiere.code,
        nom: filiere.nom,
      });
    }
  }, [filiere]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="filiere-form">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="code">Code *</label>
        <input
          id="code"
          name="code"
          type="text"
          placeholder="Ex: INF, GC, GM"
          value={formData.code}
          onChange={handleChange}
          required
          disabled={loading}
          maxLength={10}
        />
      </div>

      <div className="form-group">
        <label htmlFor="nom">Nom *</label>
        <input
          id="nom"
          name="nom"
          type="text"
          placeholder="Ex: Génie Informatique"
          value={formData.nom}
          onChange={handleChange}
          required
          disabled={loading}
        />
      </div>

      <div className="form-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          disabled={loading}
        >
          Annuler
        </button>
        <button
          type="submit"
          className="btn-primary-create"
          disabled={loading}
        >
          {loading ? 'Enregistrement...' : filiere ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  );
};

export default FiliereForm;