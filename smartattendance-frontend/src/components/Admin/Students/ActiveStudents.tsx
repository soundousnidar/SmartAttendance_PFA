import React, { useState, useEffect } from 'react';
import { Trash2, Eye } from 'lucide-react';
import { studentAPI } from '../../../services/studentAPI';
import { filiereAPI } from '../../../services/filiereAPI';
import { groupeAPI } from '../../../services/groupeAPI';
import { Student } from '../../../types/student';
import { Filiere } from '../../../types/filiere';
import { Groupe } from '../../../types/groupe';
import ConfirmModal from '../Shared/ConfirmModal';
import './Students.css';

interface ActiveStudentsProps {
  students: Student[];
  onUpdate: () => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
}

const ActiveStudents: React.FC<ActiveStudentsProps> = ({ students, onUpdate, showToast }) => {
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ 
    show: false, 
    message: '', 
    type: 'success' 
  });

  useEffect(() => {
    loadFilieres();
    loadGroupes();
  }, []);

  const loadFilieres = async () => {
    try {
      const data = await filiereAPI.getAll();
      setFilieres(data);
    } catch (error) {
      console.error('Erreur chargement filières:', error);
    }
  };

  const loadGroupes = async () => {
    try {
      const data = await groupeAPI.getAll();
      setGroupes(data);
    } catch (error) {
      console.error('Erreur chargement groupes:', error);
    }
  };

  const getGroupeInfo = (groupeId: number | null) => {
    if (!groupeId) return { code: 'N/A', filiere: 'N/A' };
    
    const groupe = groupes.find(g => g.id === groupeId);
    if (!groupe) return { code: 'N/A', filiere: 'N/A' };

    const filiere = filieres.find(f => f.id === groupe.filiere_id);
    
    return {
      code: groupe.code,
      filiere: filiere?.code || 'N/A'
    };
  };

  const confirmDelete = async () => {
    if (studentToDelete) {
      try {
        await studentAPI.delete(studentToDelete.id);
        setIsDeleteModalOpen(false);
        setStudentToDelete(null);
        const message = 'Étudiant supprimé avec succès';
        if (showToast) {
          showToast(message, 'success');
        } else {
          setToast({ show: true, message, type: 'success' });
          setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
        }
        onUpdate();
      } catch (error: any) {
        const message = error.response?.data?.detail || 'Erreur lors de la suppression';
        if (showToast) {
          showToast(message, 'error');
        } else {
          setToast({ show: true, message, type: 'error' });
          setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
        }
      }
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Filière</th>
              <th>Groupe</th>
              <th>Photo</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <p>Aucun étudiant activé</p>
                  </div>
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const groupeInfo = getGroupeInfo(student.groupe_id);
                return (
                  <tr key={student.id}>
                    <td><strong>{student.full_name}</strong></td>
                    <td>{student.email}</td>
                    <td>
                      <span className="filiere-badge">{groupeInfo.filiere}</span>
                    </td>
                    <td>
                      <span className="groupe-badge">{groupeInfo.code}</span>
                    </td>
                    <td>
                      {student.photo_path ? (
                        <div className="photo-status">
                          <span className="badge-success">✓ Enregistrée</span>
                          {student.photo_path && (
                            <a
                              href={`http://127.0.0.1:8000/${student.photo_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-icon btn-view"
                              title="Voir la photo"
                            >
                              <Eye size={16} />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="badge-warning">Non disponible</span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          onClick={() => {
                            setStudentToDelete(student);
                            setIsDeleteModalOpen(true);
                          }}
                          className="btn-icon btn-delete"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setStudentToDelete(null);
        }}
        title="Supprimer l'étudiant"
        message={`Êtes-vous sûr de vouloir supprimer ${studentToDelete?.full_name} ? Cette action supprimera également son compte utilisateur.`}
        confirmText="Supprimer"
        cancelText="Annuler"
      />
    </>
  );
};

export default ActiveStudents;