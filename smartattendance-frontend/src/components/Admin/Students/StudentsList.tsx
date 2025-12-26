import React, { useState, useEffect } from 'react';
import { Users, UserCheck } from 'lucide-react';
import { studentAPI } from '../../../services/studentAPI';
import { Student } from '../../../types/student';
import PendingStudents from './PendingStudents';
import ActiveStudents from './ActiveStudents';
import './Students.css';

type TabType = 'pending' | 'active';

const StudentsList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [pendingStudents, setPendingStudents] = useState<Student[]>([]);
  const [activeStudents, setActiveStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllStudents(); // ← CHARGER LES DEUX LISTES
  }, []);

  const loadAllStudents = async () => {
    setLoading(true);
    try {
      const [pendingData, activeData] = await Promise.all([
        studentAPI.getPending(),
        studentAPI.getActive()
      ]);
      setPendingStudents(pendingData);
      setActiveStudents(activeData);
    } catch (error) {
      console.error('Erreur chargement étudiants:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="students-page">
      <div className="page-header">
        <h1 className="page-title">Gestion des Étudiants</h1>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Users size={20} />
          En attente ({pendingStudents.length})
        </button>
        <button
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <UserCheck size={20} />
          Activés ({activeStudents.length})
        </button>
      </div>

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : activeTab === 'pending' ? (
        <PendingStudents students={pendingStudents} onUpdate={loadAllStudents} />
      ) : (
        <ActiveStudents students={activeStudents} onUpdate={loadAllStudents} />
      )}
    </div>
  );
};

export default StudentsList;