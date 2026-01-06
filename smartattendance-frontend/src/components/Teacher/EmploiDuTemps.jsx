import React, { useState, useEffect } from 'react';
import { enseignantAPI } from '../../services/enseignantAPI';

const EmploiDuTemps = () => {
  const [selectedFiliere, setSelectedFiliere] = useState('all');
  const [selectedNiveau, setSelectedNiveau] = useState('all');
  const [selectedGroupe, setSelectedGroupe] = useState('all');
  const [emploiData, setEmploiData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, [selectedFiliere, selectedNiveau, selectedGroupe]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const filiere = selectedFiliere !== 'all' ? selectedFiliere : undefined;
      const niveau = selectedNiveau !== 'all' ? parseInt(selectedNiveau) : undefined;
      const groupe = selectedGroupe !== 'all' ? selectedGroupe : undefined;
      const data = await enseignantAPI.getSchedule(filiere, niveau, groupe);
      setEmploiData(data);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'emploi du temps:', error);
    } finally {
      setLoading(false);
    }
  };

  // Données de l'emploi du temps (basé exactement sur ton image + réalisme) - FALLBACK
  const fallbackData = [
    // Lundi
    { jour: 'Lundi', plage: '14:00 - 16:00', module: 'M.I. & D.L.', professeur: 'redouane eddabbi', salle: 'SC-74' },
    { jour: 'Lundi', plage: '16:15 - 18:15', module: 'Système d\'information décisionnel', professeur: 'Hassan BADIR', salle: 'SC-74' },

    // Mardi
    { jour: 'Mardi', plage: '14:00 - 16:00', module: 'Frameworks JEE', professeur: 'Hicham ATTARIUAS', salle: 'SC-74' },
    { jour: 'Mardi', plage: '16:15 - 18:15', module: 'Ecosystème BigData', professeur: 'Hassan BADIR', salle: 'SC-74' },

    // Mercredi
    { jour: 'Mercredi', plage: '09:00 - 10:30', module: 'Développement Multiplateforme', professeur: 'Khalid AMECHNOUE', salle: 'SC-74' },
    { jour: 'Mercredi', plage: '10:45 - 12:15', module: 'Management des entreprises étendues', professeur: 'Zenab ELMENZHI', salle: 'SC-74' },
    { jour: 'Mercredi', plage: '14:30 - 16:00', module: 'Marketing des N.T.I.C', professeur: 'Lamia CHIBANI', salle: 'SC-74' },
    { jour: 'Mercredi', plage: '16:15 - 17:45', module: 'Devops', professeur: 'Mohamed Kouissi', salle: 'SC-74' },

    // Jeudi
    { jour: 'Jeudi', plage: '09:00 - 10:30', module: 'Anglais 5', professeur: 'Rachid EL MACHEHOURI', salle: 'SC-74' },
    { jour: 'Jeudi', plage: '10:45 - 12:45', module: 'ERP', professeur: 'Khaoula AHBAL', salle: 'SC-74' },
    { jour: 'Jeudi', plage: '14:30 - 16:00', module: 'Architecture Micro-services', professeur: 'Hicham ATTARIUAS', salle: 'SC-74' },

    // Vendredi
    { jour: 'Vendredi', plage: '14:30 - 16:00', module: 'Communication professionnelle 3', professeur: 'Ghizlan MAMOURI', salle: 'SC-74' },
    { jour: 'Vendredi', plage: '16:15 - 18:15', module: 'Gouvernance des systèmes d\'information', professeur: 'Lamia LAKSIR', salle: 'SC-74' },
  ];

  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const coursFiltres = emploiData.length > 0 ? emploiData : fallbackData;

  // Générer les plages horaires à partir des données réelles
  const generateTimeSlots = (data) => {
    // Extraire toutes les plages horaires uniques des données
    const slotsFromData = [...new Set(data.map(c => c.plage).filter(Boolean))];
    
    // Créneaux horaires standards (8h-18h) - seulement si pas de données
    const standardSlots = [
      '08:00 - 09:30', '08:00 - 10:00',
      '09:00 - 10:30', '09:00 - 11:00',
      '10:00 - 11:30', '10:00 - 12:00',
      '10:45 - 12:15', '10:45 - 12:45',
      '11:00 - 12:30', '11:00 - 13:00',
      '14:00 - 15:30', '14:00 - 16:00',
      '14:30 - 16:00', '14:30 - 16:30',
      '15:00 - 16:30', '15:00 - 17:00',
      '16:00 - 17:30', '16:00 - 18:00',
      '16:15 - 17:45', '16:15 - 18:15',
      '17:00 - 18:30', '17:00 - 19:00',
    ];
    
    // Utiliser les données réelles si disponibles, sinon les standards
    const allSlots = slotsFromData.length > 0 
      ? [...new Set([...slotsFromData, ...standardSlots])]
      : standardSlots;
    
    // Trier par heure de début
    return allSlots.sort((a, b) => {
      const timeA = a.split(' - ')[0];
      const timeB = b.split(' - ')[0];
      return timeA.localeCompare(timeB);
    });
  };

  const plagesHoraires = generateTimeSlots(coursFiltres);

  // Organiser les données par jour et plage horaire
  const organizeSchedule = (data) => {
    const organized = {};
    jours.forEach(jour => {
      organized[jour] = {};
      plagesHoraires.forEach(plage => {
        organized[jour][plage] = null;
      });
    });
    
    data.forEach(cours => {
      const jour = cours.jour;
      const plage = cours.plage;
      if (organized[jour] && plage && organized[jour][plage] === null) {
        organized[jour][plage] = cours;
      } else if (organized[jour] && plage && organized[jour][plage]) {
        // Si plusieurs cours au même créneau, créer un tableau
        if (!Array.isArray(organized[jour][plage])) {
          organized[jour][plage] = [organized[jour][plage]];
        }
        organized[jour][plage].push(cours);
      }
    });
    
    return organized;
  };

  const scheduleOrganized = organizeSchedule(coursFiltres);

  if (loading) {
    return (
      <div style={{ fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#64748b' }}>Chargement de l'emploi du temps...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', padding: '24px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px', textAlign: 'center' }}>
        Mon Emploi du Temps
      </h1>
      <p style={{ color: '#64748b', marginBottom: '8px', textAlign: 'center' }}>
        Horaire hebdomadaire de tous vos cours • Toutes années et filières confondues
      </p>
      <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '32px', textAlign: 'center', fontStyle: 'italic' }}>
        Consultez vos cours programmés pour chaque jour de la semaine. Les cours sont organisés par créneaux horaires.
      </p>

      {/* Filtres (optionnels pour l'enseignant) */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Filière</label>
            <select value={selectedFiliere} onChange={(e) => setSelectedFiliere(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <option value="all">Toutes les filières</option>
              <option>IIR</option>
              <option>Génie Civil</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Niveau</label>
            <select value={selectedNiveau} onChange={(e) => setSelectedNiveau(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <option value="all">Tous les niveaux</option>
              <option value="5">5ème année</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Groupe</label>
            <select value={selectedGroupe} onChange={(e) => setSelectedGroupe(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <option value="all">Tous les groupes</option>
              <option>G3</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tableau emploi du temps */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e293b' }}>
                <th style={{ padding: '16px', textAlign: 'center', color: 'white', fontWeight: '600', width: '120px' }}>Jour</th>
                {plagesHoraires.map(plage => (
                  <th key={plage} style={{ padding: '16px', textAlign: 'center', color: 'white', fontWeight: '600', minWidth: '180px' }}>
                    {plage}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jours.map(jour => (
                <tr key={jour} style={{ borderBottom: '2px solid #f1f5f9' }}>
                  <td style={{ padding: '20px', textAlign: 'center', fontWeight: '600', color: '#1e293b', backgroundColor: '#f8fafc', position: 'sticky', left: 0, zIndex: 10 }}>
                    {jour}
                  </td>
                  {plagesHoraires.map(plage => {
                    const seance = scheduleOrganized[jour]?.[plage];
                    const isOccupied = seance !== null && seance !== undefined;
                    const isMultiple = Array.isArray(seance);
                    
                    return (
                      <td key={plage} style={{ padding: '8px', verticalAlign: 'top', minHeight: '80px', borderLeft: '1px solid #e2e8f0', width: '180px' }}>
                        {isOccupied ? (
                          isMultiple ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {seance.map((s, idx) => (
                                <div key={idx} style={{ backgroundColor: '#f0fdfa', borderRadius: '6px', padding: '8px', borderLeft: '3px solid #00A651', fontSize: '12px' }}>
                                  <p style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px', fontSize: '11px' }}>
                                    {s.module}
                                  </p>
                                  <p style={{ fontSize: '10px', color: '#64748b' }}>
                                    {s.groupe || ''} • {s.salle || 'N/A'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ backgroundColor: '#f0fdfa', borderRadius: '8px', padding: '10px', height: '100%', borderLeft: '4px solid #00A651', cursor: 'pointer' }}
                                 onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e0f2f1'}
                                 onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f0fdfa'}>
                              <p style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '6px', fontSize: '13px', lineHeight: '1.3' }}>
                                {seance.module || seance.cours || 'Cours'}
                              </p>
                              <div style={{ fontSize: '10px', color: '#475569', marginBottom: '4px', lineHeight: '1.4' }}>
                                {seance.niveau && (
                                  <span style={{ display: 'block', marginBottom: '2px' }}>
                                    📚 Niveau {seance.niveau}
                                  </span>
                                )}
                                {seance.groupe && (
                                  <span style={{ display: 'block', marginBottom: '2px' }}>
                                    👥 Groupe {seance.groupe}
                                  </span>
                                )}
                                {seance.filiere && (
                                  <span style={{ display: 'block', marginBottom: '2px' }}>
                                    🏛️ {seance.filiere}
                                  </span>
                                )}
                              </div>
                              <p style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>
                                📍 {seance.salle || 'Salle non définie'}
                              </p>
                            </div>
                          )
                        ) : (
                          <div style={{ color: '#e2e8f0', textAlign: 'center', padding: '10px 0', fontSize: '12px' }}>
                            —
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: '32px', padding: '16px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', textAlign: 'center' }}>
          <div>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Total Cours</p>
            <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>{coursFiltres.length}</p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Jours avec cours</p>
            <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>
              {new Set(coursFiltres.map(c => c.jour)).size}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Heures par semaine</p>
            <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>
              {coursFiltres.reduce((sum, c) => {
                const [start, end] = c.plage.split(' - ');
                const startTime = new Date(`2000-01-01 ${start}`);
                const endTime = new Date(`2000-01-01 ${end}`);
                const hours = (endTime - startTime) / (1000 * 60 * 60);
                return sum + hours;
              }, 0).toFixed(1)}h
            </p>
          </div>
        </div>
        <p style={{ marginTop: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
          Pause déjeuner généralement entre 12h15 et 14h00 • 15 minutes entre chaque séance
        </p>
      </div>
    </div>
  );
};

export default EmploiDuTemps;