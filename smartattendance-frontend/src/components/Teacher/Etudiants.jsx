import React, { useState } from 'react';
import { Search, Filter, Eye, UserCheck, AlertCircle, TrendingUp, Mail, Phone } from 'lucide-react';

const EtudiantsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCours, setSelectedCours] = useState('all');
  const [selectedGroupe, setSelectedGroupe] = useState('all');
  const [selectedFiliere, setSelectedFiliere] = useState('all');
  const [selectedNiveau, setSelectedNiveau] = useState('all');
  const [filterStatut, setFilterStatut] = useState('all'); // all, risque, bon

  // Données des étudiants
  const etudiants = [
    {
      id: 1,
      nom: 'ALAOUI',
      prenom: 'Sara',
      cne: 'R123456789',
      filiere: 'IIR',
      niveau: 3,
      groupe: 'G1',
      email: 'sara.alaoui@example.com',
      telephone: '+212 6 12 34 56 78',
      cours: ['Programmation Web', 'Base de Données'],
      tauxPresence: 95,
      nbAbsences: 2,
      nbRetards: 1,
      totalSeances: 40
    },
    {
      id: 2,
      nom: 'BENALI',
      prenom: 'Mohamed',
      cne: 'R987654321',
      filiere: 'IIR',
      niveau: 3,
      groupe: 'G2',
      email: 'mohamed.benali@example.com',
      telephone: '+212 6 23 45 67 89',
      cours: ['Programmation Web', 'Base de Données'],
      tauxPresence: 88,
      nbAbsences: 5,
      nbRetards: 3,
      totalSeances: 42
    },
    {
      id: 3,
      nom: 'CHAKIR',
      prenom: 'Fatima',
      cne: 'R456789123',
      filiere: 'IIR',
      niveau: 3,
      groupe: 'G1',
      email: 'fatima.chakir@example.com',
      telephone: '+212 6 34 56 78 90',
      cours: ['Programmation Web'],
      tauxPresence: 68,
      nbAbsences: 12,
      nbRetards: 4,
      totalSeances: 38
    },
    {
      id: 4,
      nom: 'DERRAZ',
      prenom: 'Nour',
      cne: 'R789123456',
      filiere: 'IIR',
      niveau: 5,
      groupe: 'G1',
      email: 'nour.derraz@example.com',
      telephone: '+212 6 45 67 89 01',
      cours: ['Intelligence Artificielle'],
      tauxPresence: 97,
      nbAbsences: 1,
      nbRetards: 0,
      totalSeances: 35
    },
    {
      id: 5,
      nom: 'EL AMRANI',
      prenom: 'Youssef',
      cne: 'R321654987',
      filiere: 'GC',
      niveau: 2,
      groupe: 'G1',
      email: 'youssef.elamrani@example.com',
      telephone: '+212 6 56 78 90 12',
      cours: ['Mathématiques Avancées'],
      tauxPresence: 82,
      nbAbsences: 7,
      nbRetards: 2,
      totalSeances: 40
    },
    {
      id: 6,
      nom: 'IDRISSI',
      prenom: 'Amina',
      cne: 'R654987321',
      filiere: 'IIR',
      niveau: 3,
      groupe: 'G2',
      email: 'amina.idrissi@example.com',
      telephone: '+212 6 67 89 01 23',
      cours: ['Base de Données'],
      tauxPresence: 91,
      nbAbsences: 3,
      nbRetards: 2,
      totalSeances: 35
    }
  ];

  const coursList = [
    { id: 'prog-web', name: 'Programmation Web' },
    { id: 'bdd', name: 'Base de Données' },
    { id: 'ia', name: 'Intelligence Artificielle' },
    { id: 'math', name: 'Mathématiques Avancées' }
  ];

  // Filtrage des étudiants
  const filteredEtudiants = etudiants.filter(e => {
    const matchSearch = 
      e.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.cne.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchCours = selectedCours === 'all' || e.cours.some(c => c === selectedCours);
    const matchGroupe = selectedGroupe === 'all' || e.groupe === selectedGroupe;
    const matchFiliere = selectedFiliere === 'all' || e.filiere === selectedFiliere;
    const matchNiveau = selectedNiveau === 'all' || e.niveau.toString() === selectedNiveau;
    
    const matchStatut = 
      filterStatut === 'all' ||
      (filterStatut === 'risque' && e.tauxPresence < 75) ||
      (filterStatut === 'bon' && e.tauxPresence >= 75);

    return matchSearch && matchCours && matchGroupe && matchFiliere && matchNiveau && matchStatut;
  });

  const getStatutColor = (taux) => {
    if (taux >= 90) return { bg: '#dcfce7', color: '#166534', label: 'Excellent' };
    if (taux >= 75) return { bg: '#fef3c7', color: '#92400e', label: 'Bon' };
    return { bg: '#fee2e2', color: '#991b1b', label: 'À risque' };
  };

  const handleViewDetails = (id) => {
    console.log('Voir détails étudiant:', id);
    // Navigation vers EtudiantDetails
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
          Étudiants
        </h1>
        <p style={{ color: '#64748b', fontSize: '16px' }}>
          Consultez et gérez les profils de vos étudiants
        </p>
      </div>

      {/* Statistiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>Total Étudiants</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>{etudiants.length}</p>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>Taux Moyen</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#00A651' }}>
            {Math.round(etudiants.reduce((sum, e) => sum + e.tauxPresence, 0) / etudiants.length)}%
          </p>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>Étudiants à Risque</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4444' }}>
            {etudiants.filter(e => e.tauxPresence < 75).length}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 44px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          <select value={selectedCours} onChange={(e) => setSelectedCours(e.target.value)} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}>
            <option value="all">Tous les cours</option>
            {coursList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>

          <select value={selectedFiliere} onChange={(e) => setSelectedFiliere(e.target.value)} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}>
            <option value="all">Toutes les filières</option>
            <option value="IIR">IIR</option>
            <option value="GC">Génie Civil</option>
          </select>

          <select value={selectedNiveau} onChange={(e) => setSelectedNiveau(e.target.value)} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}>
            <option value="all">Tous les niveaux</option>
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}ère année</option>)}
          </select>

          <select value={selectedGroupe} onChange={(e) => setSelectedGroupe(e.target.value)} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}>
            <option value="all">Tous les groupes</option>
            {['G1', 'G2', 'G3'].map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}>
            <option value="all">Tous les statuts</option>
            <option value="bon">Bon (≥75%)</option>
            <option value="risque">À risque (&lt;75%)</option>
          </select>
        </div>
      </div>

      {/* Liste des étudiants */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {filteredEtudiants.length === 0 ? (
          <div style={{ backgroundColor: 'white', padding: '60px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <p style={{ color: '#64748b', fontSize: '16px' }}>Aucun étudiant trouvé</p>
          </div>
        ) : (
          filteredEtudiants.map(e => {
            const statutColor = getStatutColor(e.tauxPresence);
            return (
              <div key={e.id} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                  <div style={{ flex: 1, minWidth: '300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
                        {e.nom} {e.prenom}
                      </h3>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: statutColor.bg,
                        color: statutColor.color
                      }}>
                        {statutColor.label}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ fontSize: '14px', color: '#64748b' }}>
                        <span style={{ fontWeight: '500', color: '#475569' }}>CNE:</span> {e.cne}
                      </div>
                      <div style={{ fontSize: '14px', color: '#64748b' }}>
                        <span style={{ fontWeight: '500', color: '#475569' }}>Filière:</span> {e.filiere} - Niveau {e.niveau}
                      </div>
                      <div style={{ fontSize: '14px', color: '#64748b' }}>
                        <span style={{ fontWeight: '500', color: '#475569' }}>Groupe:</span> {e.groupe}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#64748b', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={16} />
                        <span>{e.email}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={16} />
                        <span>{e.telephone}</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                      <span style={{ fontWeight: '500', color: '#475569' }}>Cours:</span> {e.cours.join(', ')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '200px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
                      <div>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#00A651' }}>{e.tauxPresence}%</p>
                        <p style={{ fontSize: '12px', color: '#64748b' }}>Présence</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{e.nbAbsences}</p>
                        <p style={{ fontSize: '12px', color: '#64748b' }}>Absences</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{e.nbRetards}</p>
                        <p style={{ fontSize: '12px', color: '#64748b' }}>Retards</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewDetails(e.id)}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: '#00A651',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Eye size={16} />
                      Voir le profil
                    </button>
                  </div>
                </div>

                {/* Barre de progression */}
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${e.tauxPresence}%`,
                        height: '100%',
                        backgroundColor: e.tauxPresence >= 75 ? '#00A651' : '#ef4444',
                        borderRadius: '4px',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                    <span style={{ fontSize: '13px', color: '#64748b', minWidth: '80px' }}>
                      {e.totalSeances - e.nbAbsences}/{e.totalSeances} séances
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default EtudiantsList;