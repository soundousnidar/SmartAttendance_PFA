import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { Cours, CoursCreate } from '../../../types/cours';
import { moduleAPI } from '../../../services/moduleAPI';
import { groupeAPI } from '../../../services/groupeAPI';
import { Module } from '../../../types/module';
import { Groupe } from '../../../types/groupe';
import { User } from '../../../types/auth';
import api from '../../../services/api';
import '../Filieres/Filieres.css';

interface CoursFormProps {
  cours?: Cours;
  onSubmit: (data: CoursCreate) => Promise<void>;
  onCancel: () => void;
}

const CoursForm: React.FC<CoursFormProps> = ({ cours, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<CoursCreate>({
    module_id: 0,
    groupe_id: 0,
    enseignant_id: 0,
    jour: 'Lundi',
    heure_debut: '08:00',
    heure_fin: '10:00',
    salle: '',
  });

  const [modules, setModules] = useState<Module[]>([]);
  const [allGroupes, setAllGroupes] = useState<Groupe[]>([]);
  const [filteredGroupes, setFilteredGroupes] = useState<Groupe[]>([]);
  const [enseignants, setEnseignants] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (cours) {
      setFormData({
        module_id: cours.module.id,
        groupe_id: cours.groupe.id,
        enseignant_id: cours.enseignant.id,
        jour: cours.jour,
        heure_debut: cours.heure_debut,
        heure_fin: cours.heure_fin,
        salle: cours.salle || '',
      });
      
      // Filtrer les groupes pour le module sélectionné
      const selectedModule = modules.find(m => m.id === cours.module.id);
      if (selectedModule) {
        filterGroupesByModule(selectedModule);
      }
    }
  }, [cours, modules]);

  // ← FILTRER GROUPES QUAND MODULE CHANGE
  useEffect(() => {
    if (formData.module_id > 0) {
      const selectedModule = modules.find(m => m.id === formData.module_id);
      if (selectedModule) {
        filterGroupesByModule(selectedModule);
      }
    } else {
      setFilteredGroupes([]);
    }
  }, [formData.module_id, allGroupes, modules]);

  const loadData = async () => {
    try {
      const [modulesData, groupesData, enseignantsData] = await Promise.all([
        moduleAPI.getAll(),
        groupeAPI.getAll(),
        api.get('/auth/users').then((res) => res.data),
      ]);

      setModules(modulesData);
      setAllGroupes(groupesData);
      setEnseignants(enseignantsData.filter((u: User) => u.role === 'enseignant'));
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  // ← FONCTION DE FILTRAGE
  const filterGroupesByModule = (module: Module) => {
    const filtered = allGroupes.filter(
      g => g.filiere_id === module.filiere_id && g.annee === module.annee
    );
    setFilteredGroupes(filtered);
    
    // Si le groupe actuel n'est pas dans la liste filtrée, réinitialiser
    if (formData.groupe_id > 0 && !filtered.find(g => g.id === formData.groupe_id)) {
      setFormData(prev => ({ ...prev, groupe_id: 0 }));
    }
  };

  const handleModuleChange = (moduleId: number) => {
    setFormData({ 
      ...formData, 
      module_id: moduleId,
      groupe_id: 0  // Réinitialiser le groupe
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.module_id === 0 || formData.groupe_id === 0 || formData.enseignant_id === 0) {
      setError('Tous les champs sont requis');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const jourOptions = jours.map(j => ({ value: j, label: j }));

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      borderColor: state.isFocused ? '#00A651' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(0, 166, 81, 0.1)' : 'none',
      '&:hover': {
        borderColor: '#00A651',
      },
      minHeight: '40px',
      borderRadius: '6px',
      fontSize: '0.875rem',
    }),
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#00A651'
        : state.isFocused
        ? '#f0fdf4'
        : 'white',
      color: state.isSelected ? 'white' : '#1e293b',
      fontSize: '0.875rem',
      padding: '8px 12px',
      '&:hover': {
        backgroundColor: state.isSelected ? '#00A651' : '#f0fdf4',
      },
    }),
  };

  return (
    <div className="cours-form-wrapper">  
    <form onSubmit={handleSubmit} className="filiere-form filiere-form-compact">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-group form-group-compact">
        <label>Module *</label>
        <Select
          options={modules.map((m) => ({ 
            value: m.id, 
            label: `${m.code} - ${m.nom} (${m.filiere?.code} - ${m.annee}ère année)` 
          }))}
          value={
            modules
              .map((m) => ({ 
                value: m.id, 
                label: `${m.code} - ${m.nom} (${m.filiere?.code} - ${m.annee}ère année)` 
              }))
              .find((opt) => opt.value === formData.module_id) || null
          }
          onChange={(opt) => handleModuleChange(opt?.value || 0)}
          placeholder="Sélectionner un module"
          menuPortalTarget={document.body}
          menuPosition="fixed"
          styles={customStyles}
        />
      </div>

      <div className="form-group form-group-compact">
        <label>Groupe *</label>
        <Select
          options={filteredGroupes.map((g) => ({ value: g.id, label: g.code }))}
          value={
            filteredGroupes
              .map((g) => ({ value: g.id, label: g.code }))
              .find((opt) => opt.value === formData.groupe_id) || null
          }
          onChange={(opt) => setFormData({ ...formData, groupe_id: opt?.value || 0 })}
          placeholder={
            formData.module_id === 0 
              ? "Sélectionner d'abord un module" 
              : filteredGroupes.length === 0
              ? "Aucun groupe pour ce module"
              : "Sélectionner un groupe"
          }
          isDisabled={formData.module_id === 0 || filteredGroupes.length === 0}
          menuPortalTarget={document.body}
          menuPosition="fixed"
          styles={customStyles}
        />
      </div>

      <div className="form-group form-group-compact">
        <label>Enseignant *</label>
        <Select
          options={enseignants.map((e) => ({ value: e.id, label: e.full_name }))}
          value={
            enseignants
              .map((e) => ({ value: e.id, label: e.full_name }))
              .find((opt) => opt.value === formData.enseignant_id) || null
          }
          onChange={(opt) => setFormData({ ...formData, enseignant_id: opt?.value || 0 })}
          placeholder="Sélectionner un enseignant"
          menuPortalTarget={document.body}
          menuPosition="fixed"
          styles={customStyles}
        />
      </div>

      <div className="form-group form-group-compact">
        <label>Jour *</label>
        <Select
          options={jourOptions}
          value={jourOptions.find(opt => opt.value === formData.jour)}
          onChange={(opt) => setFormData({ ...formData, jour: opt?.value || 'Lundi' })}
          menuPortalTarget={document.body}
          menuPosition="fixed"
          styles={customStyles}
        />
      </div>

      <div className="form-row">
        <div className="form-group form-group-compact">
          <label>Heure début *</label>
          <input
            type="time"
            value={formData.heure_debut}
            onChange={(e) => setFormData({ ...formData, heure_debut: e.target.value })}
            required
          />
        </div>

        <div className="form-group form-group-compact">
          <label>Heure fin *</label>
          <input
            type="time"
            value={formData.heure_fin}
            onChange={(e) => setFormData({ ...formData, heure_fin: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="form-group form-group-compact">
        <label>Salle</label>
        <input
          type="text"
          value={formData.salle}
          onChange={(e) => setFormData({ ...formData, salle: e.target.value })}
          placeholder="Ex: A101, B205"
        />
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
          Annuler
        </button>
        <button type="submit" className="btn-primary-create" disabled={loading}>
          {loading ? 'Enregistrement...' : cours ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
    </div>
  );
};

export default CoursForm;