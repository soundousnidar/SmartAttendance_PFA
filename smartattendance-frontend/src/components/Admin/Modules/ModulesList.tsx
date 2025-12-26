import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import { moduleAPI } from '../../../services/moduleAPI';
import { Module, ModuleCreate } from '../../../types/module';
import Modal from '../Shared/Modal';
import ConfirmModal from '../Shared/ConfirmModal';
import ModuleForm from './ModuleForm';
import './Modules.css';
import '../Shared/Shared.css';

const ModulesList: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | undefined>();
  const [moduleToDelete, setModuleToDelete] = useState<Module | undefined>();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadModules();
  }, []);

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
        loadModules();
      } catch (error: any) {
        alert(error.response?.data?.detail || 'Erreur lors de la suppression');
      }
    }
  };

  const openCreateModal = () => {
    setSelectedModule(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (module: Module) => {
    setSelectedModule(module);
    setIsModalOpen(true);
  };

  const filteredModules = modules.filter(module =>
    module.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="modules-page">
      <div className="page-header">
        <h1 className="page-title">
          
          Modules
        </h1>
        <button onClick={openCreateModal} className="btn-primary-module">
          <Plus size={20} />
          Nouveau module
        </button>
      </div>

      <div className="filter-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Rechercher par code ou nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Nom du module</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredModules.length === 0 ? (
              <tr>
                <td colSpan={3}>
                  <div className="empty-state">
                    <p>
                      {searchTerm
                        ? 'Aucun module trouvé pour cette recherche'
                        : 'Aucun module enregistré'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredModules.map((module) => (
                <tr key={module.id}>
                  <td>
                    <span className="module-code">{module.code}</span>
                  </td>
                  <td>
                    <strong>{module.nom}</strong>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        onClick={() => openEditModal(module)}
                        className="btn-icon btn-edit"
                        title="Modifier"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(module)}
                        className="btn-icon btn-delete"
                        title="Supprimer"
                      >
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
        onClose={() => {
          setIsModalOpen(false);
          setSelectedModule(undefined);
        }}
        title={selectedModule ? 'Modifier le module' : 'Nouveau module'}
      >
        <ModuleForm
          module={selectedModule}
          onSubmit={selectedModule ? handleUpdate : handleCreate}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedModule(undefined);
          }}
        />
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setModuleToDelete(undefined);
        }}
        title="Supprimer le module"
        message={`Êtes-vous sûr de vouloir supprimer le module "${moduleToDelete?.code} - ${moduleToDelete?.nom}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
      />
    </div>
  );
};

export default ModulesList;