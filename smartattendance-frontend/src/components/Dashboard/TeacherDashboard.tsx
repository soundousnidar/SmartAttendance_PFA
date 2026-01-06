import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { enseignantAPI, TeacherDashboardResponse } from '../../services/enseignantAPI';
import { getAuthData } from '../../utils/authStorage';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const TeacherDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<TeacherDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await enseignantAPI.getDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Erreur lors du chargement du dashboard:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#64748b' }}>Chargement...</div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div style={{ fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#ef4444', marginBottom: '8px' }}>Erreur</div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>{error || 'Impossible de charger les données'}</div>
        </div>
      </div>
    );
  }

  // Map backend data to frontend format
  const teacherStats = {
    totalCoursSemaine: dashboardData.stats.total_cours_semaine,
    coursAujourdhui: dashboardData.stats.cours_aujourdhui,
    totalEtudiantsSuivis: dashboardData.stats.total_etudiants,
    tauxPresenceMoyen: dashboardData.stats.taux_presence_moyen,
  };

  const coursAujourdhui = dashboardData.cours_aujourdhui.map(c => ({
    id: c.id,
    heure: c.heure,
    cours: c.cours,
    niveau: c.niveau,
    groupe: c.groupe,
    salle: c.salle,
    presents: c.presents,
    absents: c.absents,
    retards: c.retards,
  }));

  // Graphiques
  const evolutionPresence = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'],
    datasets: [{
      label: 'Taux de présence (%)',
      data: dashboardData.evolution_presence.length === 5 ? dashboardData.evolution_presence : [0, 0, 0, 0, 0],
      borderColor: '#00A651',
      backgroundColor: 'rgba(0, 166, 81, 0.1)',
      tension: 0.4,
    }],
  };

  const tauxParCours = {
    labels: dashboardData.taux_presence_par_cours.map(t => t.cours),
    datasets: [{
      label: 'Taux de présence (%)',
      data: dashboardData.taux_presence_par_cours.map(t => t.taux),
      backgroundColor: ['#3b82f6', '#22c55e', '#a855f7', '#fb923c', '#00A651'],
    }],
  };

  // Étudiants à risque
  const etudiantsARisque = dashboardData.etudiants_a_risque.map(e => ({
    nom: e.nom,
    cours: e.cours,
    niveau: e.niveau,
    absences: e.absences,
    taux: e.taux_presence,
  }));

  // Liste des cours pour le filtre (dérivée des cours du jour)
  const mesCours = coursAujourdhui.map(c => ({
    id: c.id,
    nom: c.cours,
    niveau: c.niveau,
    groupe: c.groupe,
  }));

  // Get teacher name from auth storage
  const { user } = getAuthData();
  const teacherName = user?.full_name || 'Enseignant';

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
          Tableau de Bord Enseignant
        </h1>
        <p style={{ color: '#64748b', fontSize: '16px' }}>
          {teacherName} • Suivi de vos cours et présences étudiantes
        </p>
      </div>

      {/* ==================== TOUT LE CONTENU DIRECTEMENT ==================== */}

      {/* 4 cartes statistiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '14px' }}>Cours cette semaine</p>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b' }}>{teacherStats.totalCoursSemaine}</p>
            </div>
            <div style={{ backgroundColor: '#dbeafe', padding: '12px', borderRadius: '8px' }}><BookOpen size={24} color="#3b82f6" /></div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '14px' }}>Cours aujourd'hui</p>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b' }}>{teacherStats.coursAujourdhui}</p>
            </div>
            <div style={{ backgroundColor: '#d1fae5', padding: '12px', borderRadius: '8px' }}><Clock size={24} color="#10b981" /></div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '14px' }}>Étudiants suivis</p>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b' }}>{teacherStats.totalEtudiantsSuivis}</p>
            </div>
            <div style={{ backgroundColor: '#fef3c7', padding: '12px', borderRadius: '8px' }}><Users size={24} color="#f59e0b" /></div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '14px' }}>Taux présence moyen</p>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b' }}>{teacherStats.tauxPresenceMoyen}%</p>
            </div>
            <div style={{ backgroundColor: '#dcfce7', padding: '12px', borderRadius: '8px' }}><TrendingUp size={24} color="#00A651" /></div>
          </div>
        </div>
      </div>

      {/* Filtres (ex-onglet Statistiques) */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#475569' }}>Période</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
            >
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="semester">Ce semestre</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#475569' }}>Cours</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
            >
              <option value="all">Tous mes cours</option>
              {mesCours.map(c => (
                <option key={c.id} value={c.id}>{c.nom} ({c.niveau}ème année)</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#1e293b' }}>
            Évolution de la présence cette semaine
          </h3>
          <Line data={evolutionPresence} options={{ responsive: true }} />
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#1e293b' }}>
            Taux de présence par cours
          </h3>
          <Bar data={tauxParCours} options={{ responsive: true }} />
        </div>
      </div>

      {/* Mes cours aujourd'hui */}
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: '#1e293b' }}>
          Mes cours aujourd'hui
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {coursAujourdhui.map(c => (
            <div key={c.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                    {c.cours} - {c.niveau}ème année (G{c.groupe})
                  </h4>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#64748b' }}>
                    <span>🕒 {c.heure}</span>
                    <span>🚪 Salle {c.salle}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#00A651' }}>{c.presents}</p>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>Présents</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{c.absents}</p>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>Absents</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{c.retards}</p>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>Retards</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Étudiants avec absences répétées */}
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={24} color="#ef4444" />
          Étudiants avec absences répétées
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {etudiantsARisque.map((e, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #fee2e2', borderRadius: '8px', backgroundColor: '#fef2f2' }}>
              <div>
                <p style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>{e.nom}</p>
                <p style={{ fontSize: '14px', color: '#64748b' }}>{e.cours} • {e.niveau}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>{e.absences}</p>
                <p style={{ fontSize: '12px', color: '#64748b' }}>absences • {e.taux}% présence</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;