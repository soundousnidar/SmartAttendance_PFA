import React, { useState } from 'react';
import { Upload, Check, Trash2 } from 'lucide-react';
import Select from 'react-select';
import { studentAPI } from '../../../services/studentAPI';
import { filiereAPI } from '../../../services/filiereAPI';
import { groupeAPI } from '../../../services/groupeAPI';
import { Student } from '../../../types/student';
import { Filiere } from '../../../types/filiere';
import { Groupe } from '../../../types/groupe';
import ConfirmModal from '../Shared/ConfirmModal';

interface PendingStudentsProps {
  students: Student[];
  onUpdate: () => void;
}

const PendingStudents: React.FC<PendingStudentsProps> = ({ students, onUpdate }) => {
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [groupes, setGroupes] = useState<{ [key: number]: Groupe[] }>({});
  const [selectedGroupes, setSelectedGroupes] = useState<{ [key: number]: number }>({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

const [selectedFilieres, setSelectedFilieres] = useState<{ [key: number]: number }>({});
const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ 
  show: false, 
  message: '', 
  type: 'success' 
});

  React.useEffect(() => {
    loadFilieres();
  }, []);

  const loadFilieres = async () => {
    const data = await filiereAPI.getAll();
    setFilieres(data);
  };

  const loadGroupes = async (filiereId: number, studentId: number) => {
    const data = await groupeAPI.getByFiliere(filiereId);
    setGroupes(prev => ({ ...prev, [studentId]: data }));
  };

  const handlePhotoUpload = async (studentId: number, file: File) => {
  try {
    await studentAPI.uploadPhoto(studentId, file);
    setToast({ show: true, message: 'Photo uploadée avec succès', type: 'success' });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    onUpdate();
  } catch (error) {
    setToast({ show: true, message: 'Erreur lors de l\'upload de la photo', type: 'error' });
    setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
  }
};

  const handleAssignGroupe = async (studentId: number, groupeId: number) => {
    try {
      await studentAPI.assignGroupe(studentId, groupeId);
      setSelectedGroupes(prev => ({ ...prev, [studentId]: groupeId }));
      setToast({ show: true, message: 'Groupe assigné avec succès', type: 'success' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    } catch (error) {
      setToast({ show: true, message: 'Erreur lors de l\'assignation', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
    }
  };

const handleActivate = async (student: Student) => {
  if (!student.photo_path) {
    setToast({ show: true, message: 'Veuillez d\'abord uploader une photo', type: 'error' });
    setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
    return;
  }
  if (!student.groupe_id) {
    setToast({ show: true, message: 'Veuillez d\'abord assigner un groupe', type: 'error' });
    setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
    return;
  }

  try {
    await studentAPI.activate(student.id);
    setToast({ show: true, message: 'Étudiant activé avec succès !', type: 'success' });
    
    // ← FIX: ATTENDRE 2 SECONDES AVANT DE RECHARGER
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
      onUpdate(); // Recharger les données après l'affichage du toast
    }, 2000);
    
  } catch (error: any) {
    setToast({ show: true, message: error.response?.data?.detail || 'Erreur lors de l\'activation', type: 'error' });
    setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
  }
};

const confirmDelete = async () => {
  if (studentToDelete) {
    try {
      await studentAPI.delete(studentToDelete.id);
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
      setToast({ show: true, message: 'Étudiant supprimé avec succès', type: 'success' });
      
      // ← ATTENDRE 2 SECONDES
      setTimeout(() => {
        setToast({ show: false, message: '', type: 'success' });
        onUpdate();
      }, 2000);
      
    } catch (error: any) {
      setToast({ show: true, message: error.response?.data?.detail || 'Erreur', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
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
              <th>Photo</th>
              <th>Filière</th>
              <th>Groupe</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">Aucun étudiant en attente</div>
                </td>
              </tr>
            ) : (
              students.map(student => (
                <tr key={student.id}>
                  <td>{student.full_name}</td>
                  <td>{student.email}</td>
                  <td>
                    {student.photo_path ? (
                      <span className="badge-success">✓ Uploadée</span>
                    ) : (
                      <label className="btn-upload">
                        <Upload size={16} />
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) =>
                            e.target.files && handlePhotoUpload(student.id, e.target.files[0])
                          }
                        />
                      </label>
                    )}
                  </td>
                  <td>
                    <Select
                      options={filieres.map(f => ({ value: f.id, label: f.nom }))}
                      onChange={(opt) => {
                        if (opt) {
                          setSelectedFilieres(prev => ({ ...prev, [student.id]: opt.value }));
                          loadGroupes(opt.value, student.id);
                        }
                      }}
                      placeholder="Choisir filière"
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 })
                      }}
                    />
                  </td>
                  <td>
                    <Select
                      options={groupes[student.id]?.map(g => ({ value: g.id, label: g.code })) || []}
                      onChange={(opt) => opt && handleAssignGroupe(student.id, opt.value)}
                      placeholder="Choisir groupe"
                      isDisabled={!selectedFilieres[student.id]}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                        control: (base) => ({
                          ...base,
                          opacity: !selectedFilieres[student.id] ? 0.5 : 1,
                          cursor: !selectedFilieres[student.id] ? 'not-allowed' : 'pointer'
                        })
                      }}
                    />
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        onClick={() => handleActivate(student)}
                        className="btn-icon btn-success"
                        title="Activer"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setStudentToDelete(student);
                          setIsDeleteModalOpen(true);
                        }}
                        className="btn-icon btn-delete"
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

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        title="Supprimer l'étudiant"
        message={`Supprimer ${studentToDelete?.full_name} ?`}
      />
    </>
  );
};

export default PendingStudents;