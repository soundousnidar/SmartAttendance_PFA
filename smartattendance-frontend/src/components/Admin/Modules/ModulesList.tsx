import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Select from 'react-select';
import { moduleAPI } from '../../../services/moduleAPI';
import { filiereAPI } from '../../../services/filiereAPI';
import { Module, ModuleCreate } from '../../../types/module';
import { Filiere } from '../../../types/filiere';
import Modal from '../Shared/Modal';
import ConfirmModal from '../Shared/ConfirmModal';
import AlertModal from '../Shared/AlertModal';
import ModuleForm from './ModuleForm';
import './Modules.css';
import '../Shared/Shared.css';

const ModulesList: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [selectedFiliereId, setSelectedFiliereId] = useState<number>(0);
  const [selectedAnnee, setSelectedAnnee] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | undefined>();
  const [moduleToDelete, setModuleToDelete] = useState<Module | undefined>();

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'error' as 'error' | 'success' | 'warning'
  });

  useEffect(() => {
    loadFilieres();
    loadModules();
  }, []);

  useEffect(() => {
    filterModules();
  }, [selectedFiliereId, selectedAnnee]);

  const loadFilieres = async () => {
    try {
      const data = await filiereAPI.getAll();
      setFilieres(data);
    } catch (error) {
      console.error('Erreur chargement filières:', error);
    }
  };

  const loadModules = async () => {
    try {
      const data = await moduleAPI.getAll();
      setModules(data);
    } catch (error) {
      console.error('Erreur chargement modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterModules = () => {
    // Filter logic handled by displaying filtered data
  };

  const filteredModules = modules.filter(m => {
    if (selectedFiliereId > 0 && m.filiere_id !== selectedFiliereId) return false;
    if (selectedAnnee > 0 && m.annee !== selectedAnnee) return false;
    return true;
  });

  const handleCreate = async (data: ModuleCreate) => {
    await moduleAPI.create(data);
    setIsModalOpen(false);
    loadModules();
  };

  const handleUpdate = async (data: ModuleCreate) => {
    if (selectedModule) {
      await moduleAPI.update(selectedModule.id, data);
      setIsModalOpen(false);
      setSelectedModule(undefined);
      loadModules();
    }
  };

  const openDeleteModal = (module: Module) => {
    setModuleToDelete(module);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (moduleToDelete) {
      try {
        await moduleAPI.delete(moduleToDelete.id);
        setIsDeleteModalOpen(false);
        setModuleToDelete(undefined);
        setAlertConfig({
          title: 'Suppression réussie',
          message: 'Le module a été supprimé avec succès.',
          type: 'success'
        });
        setIsAlertOpen(true);
        loadModules();
      } catch (error: any) {
        setIsDeleteModalOpen(false);
        setModuleToDelete(undefined);
        const errorMessage = error.response?.data?.detail || 'Erreur lors de la suppression';
        setAlertConfig({
          title: 'Suppression impossible',
          message: errorMessage,
          type: 'error'
        });
        setIsAlertOpen(true);
      }
    }
  };

  const filiereOptions = [
    { value: 0, label: 'Toutes les filières' },
    ...filieres.map(f => ({ value: f.id, label: `${f.code} - ${f.nom}` }))
  ];

  const anneeOptions = [
    { value: 0, label: 'Toutes les années' },
    { value: 1, label: '1ère année' },
    { value: 2, label: '2ème année' },
    { value: 3, label: '3ème année' },
    { value: 4, label: '4ème année' },
    { value: 5, label: '5ème année' },
  ];

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      borderColor: state.isFocused ? '#00A651' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(0, 166, 81, 0.1)' : 'none',
      '&:hover': { borderColor: '#00A651' },
      minHeight: '48px',
      borderRadius: '6px',
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#00A651' : state.isFocused ? '#f0fdf4' : 'white',
      color: state.isSelected ? 'white' : '#1e293b',
      '&:hover': { backgroundColor: state.isSelected ? '#00A651' : '#f0fdf4' },
    }),
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="modules-page">
      <div className="page-header">
        <h1 className="page-title">Modules</h1>
        <button onClick={() => { setSelectedModule(undefined); setIsModalOpen(true); }} className="btn-primary-module">
          <Plus size={20} />
          Nouveau module
        </button>
      </div>

      <div className="filter-section">
        <div className="filter-group">
          <label>Filière :</label>
          <Select
            options={filiereOptions}
            value={filiereOptions.find(opt => opt.value === selectedFiliereId)}
            onChange={(opt) => setSelectedFiliereId(opt?.value || 0)}
            styles={customStyles}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>
        <div className="filter-group">
          <label>Année :</label>
          <Select
            options={anneeOptions}
            value={anneeOptions.find(opt => opt.value === selectedAnnee)}
            onChange={(opt) => setSelectedAnnee(opt?.value || 0)}
            styles={customStyles}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Filière</th>
              <th>Année</th>
              <th>Code</th>
              <th>Nom</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredModules.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">Aucun module</div>
                </td>
              </tr>
            ) : (
              filteredModules.map((module) => (
                <tr key={module.id}>
                  <td>
                    <span className="filiere-badge">{module.filiere?.code || 'N/A'}</span>
                  </td>
                  <td>
                    <span className="annee-badge">{module.annee}ère année</span>
                  </td>
                  <td><strong>{module.code}</strong></td>
                  <td>{module.nom}</td>
                  <td>
                    <div className="table-actions">
                      <button onClick={() => { setSelectedModule(module); setIsModalOpen(true); }} className="btn-icon btn-edit">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => openDeleteModal(module)} className="btn-icon btn-delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedModule(undefined); }}
        title={selectedModule ? 'Modifier le module' : 'Nouveau module'}
      >
        <ModuleForm
          module={selectedModule}
          onSubmit={selectedModule ? handleUpdate : handleCreate}
          onCancel={() => { setIsModalOpen(false); setSelectedModule(undefined); }}
          preselectedFiliereId={selectedFiliereId > 0 ? selectedFiliereId : undefined}
          preselectedAnnee={selectedAnnee > 0 ? selectedAnnee : undefined}
        />
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onConfirm={confirmDelete}
        onCancel={() => { setIsDeleteModalOpen(false); setModuleToDelete(undefined); }}
        title="Supprimer le module"
        message={`Êtes-vous sûr de vouloir supprimer le module "${moduleToDelete?.code}" ?`}
      />

      <AlertModal
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </div>
  );
};

export default ModulesList;