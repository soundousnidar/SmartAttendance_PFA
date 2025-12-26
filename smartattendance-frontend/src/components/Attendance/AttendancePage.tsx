import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users } from 'lucide-react';
import { coursAPI } from '../../services/coursAPI';
import { CoursInfo } from '../../types/attendance';
import AttendanceCamera from './AttendanceCamera';
import { getAuthData } from '../../utils/authStorage';
import './Attendance.css';

const AttendancePage: React.FC = () => {
  const [todayCours, setTodayCours] = useState<CoursInfo[]>([]);
  const [selectedCours, setSelectedCours] = useState<CoursInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayCours();
  }, []);

  const loadTodayCours = async () => {
    try {
      const user = getAuthData().user;
      if (!user) return;

      // Si enseignant, charger ses cours
      if (user.role === 'enseignant') {
        const data = await coursAPI.getByEnseignant(user.id);
        filterTodayCours(data);
      } else {
        // Si admin, charger tous les cours
        const data = await coursAPI.getAll();
        filterTodayCours(data);
      }
    } catch (error) {
      console.error('Erreur chargement cours:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTodayCours = (allCours: CoursInfo[]) => {
    const today = new Date();
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const currentDay = dayNames[today.getDay()];

    const filtered = allCours.filter((c) => c.jour === currentDay);
    setTodayCours(filtered);
  };

  const getCurrentTimeStatus = (cours: CoursInfo) => {
    const now = new Date();
    const [debutH, debutM] = cours.heure_debut.split(':').map(Number);
    const [finH, finM] = cours.heure_fin.split(':').map(Number);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const debutMinutes = debutH * 60 + debutM;
    const finMinutes = finH * 60 + finM;

    if (currentMinutes < debutMinutes) {
      return { status: 'upcoming', text: 'À venir', color: '#94a3b8' };
    } else if (currentMinutes >= debutMinutes && currentMinutes <= finMinutes) {
      return { status: 'ongoing', text: 'En cours', color: '#00A651' };
    } else {
      return { status: 'finished', text: 'Terminé', color: '#64748b' };
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (selectedCours) {
    return (
      <div className="attendance-page">
        <button
          onClick={() => setSelectedCours(null)}
          className="btn-back"
        >
          ← Retour
        </button>
        <AttendanceCamera cours={selectedCours} />
      </div>
    );
  }

  return (
    <div className="attendance-page">
      <div className="page-header">
        <h1 className="page-title">
         
          Gestion des Présences
        </h1>
      </div>

      {todayCours.length === 0 ? (
        <div className="empty-state">
          <p>Aucun cours aujourd'hui</p>
        </div>
      ) : (
        <div className="cours-grid">
          {todayCours.map((cours) => {
            const timeStatus = getCurrentTimeStatus(cours);
            return (
              <div key={cours.id} className="cours-card-attendance">
                <div className="cours-status" style={{ background: timeStatus.color }}>
                  {timeStatus.text}
                </div>
                <h3 className="cours-module">{cours.module.nom}</h3>
                <div className="cours-info-row">
                  <Clock size={16} />
                  <span>{cours.heure_debut} - {cours.heure_fin}</span>
                </div>
                <div className="cours-info-row">
                  <Users size={16} />
                  <span>{cours.groupe.code}</span>
                </div>
                {cours.salle && (
                  <div className="cours-info-row">
                    📍 Salle {cours.salle}
                  </div>
                )}
                <button
                  onClick={() => setSelectedCours(cours)}
                  className="btn-primary"
                  disabled={timeStatus.status !== 'ongoing'}
                >
                  {timeStatus.status === 'ongoing' ? 'Démarrer Présence' : 'Indisponible'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AttendancePage;