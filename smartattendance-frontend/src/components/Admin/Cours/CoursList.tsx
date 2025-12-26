import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Calendar } from 'lucide-react';
import { coursAPI } from '../../../services/coursAPI';
import { Cours, CoursCreate } from '../../../types/cours';
import Modal from '../Shared/Modal';
import ConfirmModal from '../Shared/ConfirmModal';
import CoursForm from './CoursForm';
import './Cours.css';
import '../Shared/Shared.css';

const CoursList: React.FC = () => {
  const [cours, setCours] = useState<Cours[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCours, setSelectedCours] = useState<Cours | undefined>();
  const [coursToDelete, setCoursToDelete] = useState<Cours | undefined>();

  useEffect(() => {
    loadCours();
  }, []);

  const loadCours = async () => {
    try {
      const data = await coursAPI.getAll();
      setCours(data);
    } catch (error) {
      console.error('Erreur chargement cours:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CoursCreate) => {
    await coursAPI.create(data);
    setIsModalOpen(false);
    loadCours();
  };

  const handleUpdate = async (data: CoursCreate) => {
    if (selectedCours) {
      await coursAPI.update(selectedCours.id, data);
      setIsModalOpen(false);
      setSelectedCours(undefined);
      loadCours();
    }
  };

  const openDeleteModal = (c: Cours) => {
    setCoursToDelete(c);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (coursToDelete) {
      try {
        await coursAPI.delete(coursToDelete.id);
        setIsDeleteModalOpen(false);
        setCoursToDelete(undefined);
        loadCours();
      } catch (error: any) {
        alert(error.response?.data?.detail || 'Erreur lors de la suppression');
      }
    }
  };

  const openCreateModal = () => {
    setSelectedCours(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Cours) => {
    setSelectedCours(c);
    setIsModalOpen(true);
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  // Grouper par jour
  const coursByDay = cours.reduce((acc, c) => {
    if (!acc[c.jour]) acc[c.jour] = [];
    acc[c.jour].push(c);
    return acc;
  }, {} as Record<string, Cours[]>);

  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  return (
  <div className="cours-page">
    {/* Header */}
    <div className="page-header">
      <h1 className="page-title">Emploi du Temps</h1>
      <button onClick={openCreateModal} className="btn-primary-cours">
        <Plus size={20} />
        Nouveau cours
      </button>
    </div>

    {/* Timetable Grid */}
    <div className="timetable">
      {/* Time column */}
      <div className="time-column">
        {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'].map((h) => (
          <div key={h} className="time-slot">{h}</div>
        ))}
      </div>

      {/* Days columns */}
      {jours.map((jour) => (
        <div key={jour} className="day-column">
          <div className="day-header">{jour}</div>

          {coursByDay[jour]?.length > 0 ? (
            coursByDay[jour].map((c) => (
              <div
                key={c.id}
                className="course-block"
                style={{
                  top: `${(parseInt(c.heure_debut.split(':')[0]) - 8) * 80}px`,
                  height: `${
                    (parseInt(c.heure_fin.split(':')[0]) -
                      parseInt(c.heure_debut.split(':')[0])) * 80
                  }px`,
                }}
              >
                <div className="course-title">{c.module.nom}</div>
                <div className="course-meta">
                  <span>{c.groupe.code}</span>
                  <span>{c.enseignant.full_name}</span>
                </div>
                {c.salle && <div className="course-room">{c.salle}</div>}

                <div className="course-actions">
                  <button onClick={() => openEditModal(c)}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => openDeleteModal(c)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-course-column">—</div>
          )}
        </div>
      ))}
    </div>

    {/* Create / Edit Modal */}
    <Modal
      isOpen={isModalOpen}
      onClose={() => {
        setIsModalOpen(false);
        setSelectedCours(undefined);
      }}
      title={selectedCours ? 'Modifier le cours' : 'Nouveau cours'}
    >
      <CoursForm
        cours={selectedCours}
        onSubmit={selectedCours ? handleUpdate : handleCreate}
        onCancel={() => {
          setIsModalOpen(false);
          setSelectedCours(undefined);
        }}
      />
    </Modal>

    {/* Delete Confirmation */}
    <ConfirmModal
      isOpen={isDeleteModalOpen}
      onConfirm={confirmDelete}
      onCancel={() => {
        setIsDeleteModalOpen(false);
        setCoursToDelete(undefined);
      }}
      title="Supprimer le cours"
      message={`Supprimer le cours ${coursToDelete?.module.nom} ?`}
      confirmText="Supprimer"
      cancelText="Annuler"
    />
  </div>
);

};

export default CoursList;