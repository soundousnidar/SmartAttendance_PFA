import React, { useState, useEffect } from 'react';
import { Users, UserCheck } from 'lucide-react';
import { enseignantAPI } from '../../../services/enseignantAPI';
import { Enseignant } from '../../../types/enseignant';
import PendingEnseignants from './PendingEnseignants';
import ActiveEnseignants from './ActiveEnseignants';
import './Enseignants.css';

type TabType = 'pending' | 'active';

const EnseignantsList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [pendingEnseignants, setPendingEnseignants] = useState<Enseignant[]>([]);
  const [activeEnseignants, setActiveEnseignants] = useState<Enseignant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllEnseignants();
  }, []);

  const loadAllEnseignants = async () => {
    setLoading(true);
    try {
      const [pendingData, activeData] = await Promise.all([
        enseignantAPI.getPending(),
        enseignantAPI.getActive()
      ]);
      setPendingEnseignants(pendingData);
      setActiveEnseignants(activeData);
    } catch (error) {
      console.error('Erreur chargement enseignants:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="enseignants-page">
      <div className="page-header">
        <h1 className="page-title">Gestion des Enseignants</h1>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Users size={20} />
          En attente ({pendingEnseignants.length})
        </button>
        <button
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <UserCheck size={20} />
          Activés ({activeEnseignants.length})
        </button>
      </div>

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : activeTab === 'pending' ? (
        <PendingEnseignants enseignants={pendingEnseignants} onUpdate={loadAllEnseignants} />
      ) : (
        <ActiveEnseignants enseignants={activeEnseignants} onUpdate={loadAllEnseignants} />
      )}
    </div>
  );
};

export default EnseignantsList;