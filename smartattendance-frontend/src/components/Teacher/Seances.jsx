import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, Filter, Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const Seances = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCours, setSelectedCours] = useState('all');
  const [selectedGroupe, setSelectedGroupe] = useState('all');

  // Date actuelle simulée : 3 janvier 2026, par exemple 09:30
  const now = new Date('2026-01-03T09:30:00');

  // Données des séances
  const seances = [
    { id: 1, date: '2026-01-03', debut: '08:00', fin: '10:00', cours: 'Programmation Web', niveau: 3, groupe: 'G1', salle: 'A101', totalEtudiants: 31, presents: 27, retards: 1, absents: 3 },
    { id: 2, date: '2026-01-03', debut: '10:15', fin: '12:15', cours: 'Base de Données', niveau: 4, groupe: 'G1', salle: 'B205', totalEtudiants: 30, presents: 25, retards: 2, absents: 3 },
    { id: 3, date: '2026-01-04', debut: '14:00', fin: '16:00', cours: 'Intelligence Artificielle', niveau: 5, groupe: 'G1', salle: 'C301', totalEtudiants: 23, presents: 22, retards: 0, absents: 1 },
    { id: 4, date: '2026-01-05', debut: '08:00', fin: '10:00', cours: 'Programmation Web', niveau: 3, groupe: 'G2', salle: 'A102', totalEtudiants: 30, presents: 26, retards: 2, absents: 2 },
  ];

  // Détecter la séance en cours
  const seanceEnCours = seances.find(s => {
    const dateSeance = new Date(`${s.date}T${s.debut}:00`);
    const dateFin = new Date(`${s.date}T${s.fin}:00`);
    return now >= dateSeance && now < dateFin;
  });

  // Calcul du temps écoulé pour la séance en cours
  const tempsEcoule = seanceEnCours ? (() => {
    const debut = new Date(`${seanceEnCours.date}T${seanceEnCours.debut}:00`);
    const diff = Math.floor((now.getTime() - debut.getTime()) / 1000);
    const h = String(Math.floor(diff / 3600)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
    const s = String(diff % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  })() : null;

  // Filtrage pour la liste
  const filteredSeances = seances.filter(s => {
    if (seanceEnCours && s.id === seanceEnCours.id) return false; // Ne pas montrer la séance en cours dans la liste
    const matchSearch = s.cours.toLowerCase().includes(searchTerm.toLowerCase()) || s.groupe.includes(searchTerm);
    const matchCours = selectedCours === 'all' || s.cours === selectedCours;
    const matchGroupe = selectedGroupe === 'all' || s.groupe === selectedGroupe;
    return matchSearch && matchCours && matchGroupe;
  });

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', padding: '24px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
        Mes Séances
      </h1>
      <p style={{ color: '#64748b', marginBottom: '32px' }}>
        Gestion en temps réel et historique de vos séances
      </p>

      {/* === SÉANCE EN COURS (prioritaire) === */}
      {seanceEnCours && (
        <div style={{ marginBottom: '40px' }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,166,81,0.15)', textAlign: 'center', border: '2px solid #00A651' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#d1fae5', padding: '8px 16px', borderRadius: '999px', marginBottom: '24px', fontWeight: '600', color: '#166534' }}>
              <div style={{ width: '10px', height: '10px', backgroundColor: '#00A651', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
              Séance en cours
            </div>

            <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px' }}>
              {seanceEnCours.cours}
            </h2>
            <p style={{ fontSize: '18px', color: '#64748b', marginBottom: '32px' }}>
              {seanceEnCours.niveau}ème année - Groupe {seanceEnCours.groupe} • Salle {seanceEnCours.salle}
            </p>

            <div style={{ fontSize: '56px', fontWeight: 'bold', color: '#00A651', marginBottom: '32px', fontFamily: 'monospace' }}>
              {tempsEcoule}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '48px' }}>
              <div>
                <CheckCircle size={48} color="#00A651" />
                <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '12px 0 4px' }}>{seanceEnCours.presents}</p>
                <p style={{ color: '#64748b' }}>Présents</p>
              </div>
              <div>
                <AlertCircle size={48} color="#f59e0b" />
                <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '12px 0 4px' }}>{seanceEnCours.retards}</p>
                <p style={{ color: '#64748b' }}>Retards</p>
              </div>
              <div>
                <XCircle size={48} color="#ef4444" />
                <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '12px 0 4px' }}>{seanceEnCours.absents}</p>
                <p style={{ color: '#64748b' }}>Absents</p>
              </div>
            </div>

            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
              <button style={{ padding: '14px 28px', backgroundColor: '#00A651', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '16px', cursor: 'pointer' }}>
                Marquer un retard
              </button>
              <button style={{ padding: '14px 28px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '16px', cursor: 'pointer' }}>
                Signaler absence
              </button>
              <button style={{ padding: '14px 28px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '16px', cursor: 'pointer' }}>
                Terminer la séance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === LISTE DES SÉANCES (toujours visible, sauf la séance en cours) === */}
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
          {seanceEnCours ? 'Autres séances' : 'Toutes mes séances'}
        </h2>

        {/* Filtres */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '12px', top: '38px', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Rechercher par cours ou groupe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '10px 10px 10px 40px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
              />
            </div>
            <select value={selectedCours} onChange={(e) => setSelectedCours(e.target.value)} style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <option value="all">Tous les cours</option>
              <option>Programmation Web</option>
              <option>Base de Données</option>
              <option>Intelligence Artificielle</option>
            </select>
            <select value={selectedGroupe} onChange={(e) => setSelectedGroupe(e.target.value)} style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <option value="all">Tous les groupes</option>
              <option>G1</option>
              <option>G2</option>
            </select>
          </div>
        </div>

        {/* Liste */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredSeances.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
              Aucune autre séance trouvée pour le moment.
            </p>
          ) : (
            filteredSeances.map(seance => (
              <div key={seance.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>{seance.cours}</h3>
                    <div style={{ display: 'flex', gap: '20px', marginTop: '8px', color: '#64748b', fontSize: '14px' }}>
                      <span><Calendar size={16} style={{ display: 'inline-block', marginRight: '4px' }} />{seance.date}</span>
                      <span><Clock size={16} style={{ display: 'inline-block', marginRight: '4px' }} />{seance.debut} - {seance.fin}</span>
                      <span><Users size={16} style={{ display: 'inline-block', marginRight: '4px' }} />{seance.niveau}ème année - {seance.groupe}</span>
                      <span>Salle {seance.salle}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#00A651' }}>
                      {seance.presents}/{seance.totalEtudiants}
                    </p>
                    <p style={{ fontSize: '14px', color: '#64748b' }}>présents</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Seances;