import React, { useState } from 'react';
import { Download, Save, Edit, Check, X, Clock, UserCheck, UserX, AlertTriangle } from 'lucide-react';

const Presences = () => {
  const [selectedCours, setSelectedCours] = useState('prog-web');
  const [selectedGroupe, setSelectedGroupe] = useState('G1');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editMode, setEditMode] = useState(false);

  // État des présences
  const [presences, setPresences] = useState([
    {
      id: 1,
      cne: 'R123456789',
      nom: 'ALAOUI',
      prenom: 'Sara',
      statut: 'present',
      heureArrivee: '08:05',
      sortieTemp: null,
      remarque: ''
    },
    {
      id: 2,
      cne: 'R987654321',
      nom: 'BENALI',
      prenom: 'Mohamed',
      statut: 'retard',
      heureArrivee: '08:15',
      sortieTemp: null,
      remarque: ''
    },
    {
      id: 3,
      cne: 'R456789123',
      nom: 'CHAKIR',
      prenom: 'Fatima',
      statut: 'absent',
      heureArrivee: null,
      sortieTemp: null,
      remarque: ''
    },
    {
      id: 4,
      cne: 'R789123456',
      nom: 'DERRAZ',
      prenom: 'Nour',
      statut: 'present',
      heureArrivee: '08:02',
      sortieTemp: '09:30',
      remarque: 'Sortie pour rendez-vous médical'
    },
    {
      id: 5,
      cne: 'R321654987',
      nom: 'EL AMRANI',
      prenom: 'Youssef',
      statut: 'present',
      heureArrivee: '08:00',
      sortieTemp: null,
      remarque: ''
    },
    {
      id: 6,
      cne: 'R654321789',
      nom: 'FASSI',
      prenom: 'Leila',
      statut: 'tres-retard',
      heureArrivee: '08:45',
      sortieTemp: null,
      remarque: 'Plus de 30 minutes de retard'
    }
  ]);

  const coursList = [
    { id: 'prog-web', name: 'Programmation Web', groupe: ['G1', 'G2'], salle: 'A101' },
    { id: 'bdd', name: 'Base de Données', groupe: ['G1', 'G2'], salle: 'B205' },
    { id: 'ia', name: 'Intelligence Artificielle', groupe: ['G1'], salle: 'C301' }
  ];

  const getStatutStyle = (statut) => {
    const styles = {
      present: { bg: '#dcfce7', color: '#166534', label: 'Présent', icon: <Check size={16} /> },
      retard: { bg: '#fef3c7', color: '#92400e', label: 'Retard', icon: <Clock size={16} /> },
      'tres-retard': { bg: '#fed7aa', color: '#9a3412', label: 'Très en retard', icon: <AlertTriangle size={16} /> },
      absent: { bg: '#fee2e2', color: '#991b1b', label: 'Absent', icon: <X size={16} /> }
    };
    return styles[statut];
  };

  const handleStatutChange = (id, newStatut) => {
    setPresences(presences.map(p => 
      p.id === id ? { ...p, statut: newStatut } : p
    ));
  };

  const handleSave = () => {
    console.log('Sauvegarde des présences:', presences);
    setEditMode(false);
    alert('Présences enregistrées avec succès !');
  };

  const handleExportPDF = () => {
    console.log('Export PDF');
    alert('Export PDF en cours...');
  };

  const handleExportExcel = () => {
    console.log('Export Excel');
    alert('Export Excel en cours...');
  };

  const stats = {
    presents: presences.filter(p => p.statut === 'present').length,
    absents: presences.filter(p => p.statut === 'absent').length,
    retards: presences.filter(p => p.statut === 'retard' || p.statut === 'tres-retard').length,
    total: presences.length
  };

  const tauxPresence = Math.round((stats.presents / stats.total) * 100);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
          Gestion des Présences
        </h1>
        <p style={{ color: '#64748b', fontSize: '16px' }}>
          Consultez et modifiez les présences de vos séances
        </p>
      </div>

      {/* Sélection cours et date */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#475569' }}>
              Cours
            </label>
            <select
              value={selectedCours}
              onChange={(e) => setSelectedCours(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
            >
              {coursList.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#475569' }}>
              Groupe
            </label>
            <select
              value={selectedGroupe}
              onChange={(e) => setSelectedGroupe(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
            >
              <option value="G1">Groupe 1</option>
              <option value="G2">Groupe 2</option>
              <option value="G3">Groupe 3</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#475569' }}>
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setEditMode(!editMode)}
            style={{
              padding: '10px 20px',
              backgroundColor: editMode ? '#64748b' : '#00A651',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Edit size={16} />
            {editMode ? 'Annuler' : 'Modifier'}
          </button>

          {editMode && (
            <button
              onClick={handleSave}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Save size={16} />
              Sauvegarder
            </button>
          )}

          <button
            onClick={handleExportPDF}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Download size={16} />
            PDF
          </button>

          <button
            onClick={handleExportExcel}
            style={{
              padding: '10px 20px',
              backgroundColor: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Download size={16} />
            Excel
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <UserCheck size={20} color="#00A651" />
            <span style={{ fontSize: '14px', color: '#64748b' }}>Présents</span>
          </div>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#00A651' }}>{stats.presents}</p>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <UserX size={20} color="#ef4444" />
            <span style={{ fontSize: '14px', color: '#64748b' }}>Absents</span>
          </div>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4444' }}>{stats.absents}</p>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Clock size={20} color="#f59e0b" />
            <span style={{ fontSize: '14px', color: '#64748b' }}>Retards</span>
          </div>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{stats.retards}</p>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: '#64748b' }}>Taux</span>
          </div>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>{tauxPresence}%</p>
        </div>
      </div>

      {/* Tableau de présences */}
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
            Liste de présence - {coursList.find(c => c.id === selectedCours)?.name}
          </h3>
          <span style={{ fontSize: '14px', color: '#64748b' }}>
            {stats.total} étudiants
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '14px' }}>CNE</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Nom</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Prénom</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Statut</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Heure d'arrivée</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Sortie temp.</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Remarque</th>
              </tr>
            </thead>
            <tbody>
              {presences.map(p => {
                const style = getStatutStyle(p.statut);
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px', color: '#64748b', fontSize: '14px' }}>{p.cne}</td>
                    <td style={{ padding: '12px', fontWeight: '500', color: '#1e293b', fontSize: '14px' }}>{p.nom}</td>
                    <td style={{ padding: '12px', color: '#64748b', fontSize: '14px' }}>{p.prenom}</td>
                    <td style={{ padding: '12px' }}>
                      {editMode ? (
                        <select
                          value={p.statut}
                          onChange={(e) => handleStatutChange(p.id, e.target.value)}
                          style={{
                            padding: '6px 12px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '13px',
                            backgroundColor: style.bg,
                            color: style.color,
                            fontWeight: '500'
                          }}
                        >
                          <option value="present">Présent</option>
                          <option value="retard">Retard</option>
                          <option value="tres-retard">Très en retard</option>
                          <option value="absent">Absent</option>
                        </select>
                      ) : (
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: '500',
                          backgroundColor: style.bg,
                          color: style.color,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          {style.icon}
                          {style.label}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px', color: '#64748b', fontSize: '14px' }}>
                      {editMode && p.statut !== 'absent' ? (
                        <input
                          type="time"
                          value={p.heureArrivee || ''}
                          onChange={(e) => {
                            setPresences(presences.map(pr => 
                              pr.id === p.id ? { ...pr, heureArrivee: e.target.value } : pr
                            ));
                          }}
                          style={{ padding: '6px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }}
                        />
                      ) : (
                        p.heureArrivee || '-'
                      )}
                    </td>
                    <td style={{ padding: '12px', color: '#64748b', fontSize: '14px' }}>
                      {editMode && p.statut === 'present' ? (
                        <input
                          type="time"
                          value={p.sortieTemp || ''}
                          onChange={(e) => {
                            setPresences(presences.map(pr => 
                              pr.id === p.id ? { ...pr, sortieTemp: e.target.value } : pr
                            ));
                          }}
                          style={{ padding: '6px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }}
                        />
                      ) : (
                        p.sortieTemp || '-'
                      )}
                    </td>
                    <td style={{ padding: '12px', color: '#64748b', fontSize: '14px', maxWidth: '200px' }}>
                      {editMode ? (
                        <input
                          type="text"
                          value={p.remarque}
                          onChange={(e) => {
                            setPresences(presences.map(pr => 
                              pr.id === p.id ? { ...pr, remarque: e.target.value } : pr
                            ));
                          }}
                          placeholder="Ajouter une remarque..."
                          style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }}
                        />
                      ) : (
                        p.remarque || '-'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Presences;