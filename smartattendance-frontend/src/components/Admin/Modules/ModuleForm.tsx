import React, { useState, useEffect } from 'react';
import { Module, ModuleCreate } from '../../../types/module';
import '../Filieres/Filieres.css';

interface ModuleFormProps {
  module?: Module;
  onSubmit: (data: ModuleCreate) => Promise<void>;
  onCancel: () => void;
}

const ModuleForm: React.FC<ModuleFormProps> = ({ 
  module, 
  onSubmit, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<ModuleCreate>({
    code: '',
    nom: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (module) {
      setFormData({
        code: module.code,
        nom: module.nom,
      });
    }
  }, [module]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.code.trim() || !formData.nom.trim()) {
      setError('Tous les champs sont requis');
      return;
    }

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
        <label htmlFor="code">Code du module *</label>
        <input
          id="code"
          name="code"
          type="text"
          placeholder="Ex: M101, MATH1, INFO2"
          value={formData.code}
          onChange={handleChange}
          required
          disabled={loading}
          maxLength={20}
        />
      </div>

      <div className="form-group">
        <label htmlFor="nom">Nom du module *</label>
        <input
          id="nom"
          name="nom"
          type="text"
          placeholder="Ex: Algèbre Linéaire, Programmation Orientée Objet"
          value={formData.nom}
          onChange={handleChange}
          required
          disabled={loading}
          maxLength={100}
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
          {loading ? 'Enregistrement...' : module ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  );
};

export default ModuleForm;