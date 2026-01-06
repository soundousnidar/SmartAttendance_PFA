import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Users, Calendar, TrendingUp } from 'lucide-react';
import { enseignantAPI } from '../../services/enseignantAPI';

const CoursList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiliere, setSelectedFiliere] = useState('all');
  const [selectedNiveau, setSelectedNiveau] = useState('all');
  const [cours, setCours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filieres, setFilieres] = useState([]);

  // Charger les cours depuis l'API
  useEffect(() => {
    fetchCours();
  }, []);

  const fetchCours = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await enseignantAPI.getCours();
      
      // S'assurer que les données sont valides
      const validData = Array.isArray(data) ? data : [];
      setCours(validData);
      
      // Extraire les filières uniques depuis les cours (filtrer les valeurs null/undefined)
      const filiereCodes = validData
        .map(c => c.filiere)
        .filter(f => f && f !== 'N/A' && f !== '');
      
      const uniqueFilieres = [...new Set(filiereCodes)].map(filiereCode => {
        // Mapping des codes de filière vers les noms complets
        const filiereNames = {
          'IIR': 'Ingénierie Informatique et Réseaux',
          'GC': 'Génie Civil',
          'GI': 'Génie Industriel',
          'FIN': 'Finance',
          'GE': 'Génie Électrique',
          'GM': 'Génie Mécanique'
        };
        return {
          id: filiereCode.toLowerCase(),
          name: filiereNames[filiereCode] || filiereCode
        };
      });
      setFilieres(uniqueFilieres);
    } catch (err) {
      console.error('Erreur lors du chargement des cours:', err);
      setError('Erreur lors du chargement des cours. Veuillez réessayer.');
      setCours([]);
      setFilieres([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage des cours
  const filteredCours = cours.filter(c => {
    const matchSearch = c.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       c.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFiliere = selectedFiliere === 'all' || c.filiere.toLowerCase() === selectedFiliere;
    const matchNiveau = selectedNiveau === 'all' || c.niveau.toString() === selectedNiveau;
    return matchSearch && matchFiliere && matchNiveau;
  });

  if (loading) {
    return (
      <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#64748b' }}>Chargement des cours...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#ef4444', marginBottom: '8px' }}>Erreur</div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>{error}</div>
        </div>
      </div>
    );
  }

  const handleEdit = (id) => {
    console.log('Modifier cours:', id);
    // Navigation vers CoursDetails pour modification
  };

  const handleView = (id) => {
    console.log('Voir cours:', id);
    // Navigation vers CoursDetails
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
      console.log('Supprimer cours:', id);
      // Logique de suppression
    }
  };

  const handleAddCourse = () => {
    alert('La création de cours est réservée aux administrateurs. Veuillez contacter un administrateur pour ajouter un nouveau cours.');
  };

  // Calculer les statistiques BASÉES SUR LES COURS FILTRÉS
  const statsCours = filteredCours.length > 0 ? filteredCours : cours;
  
  const totalCours = statsCours.length;
  const totalEtudiants = statsCours.reduce((sum, c) => sum + (Number(c.nbEtudiants) || 0), 0);
  
  // Calculer le taux moyen de présence (moyenne des taux de présence de chaque cours)
  let tauxMoyen = 0;
  if (statsCours.length > 0) {
    const sumTaux = statsCours.reduce((sum, c) => {
      const taux = Number(c.tauxPresence);
      return sum + (isNaN(taux) ? 0 : taux);
    }, 0);
    tauxMoyen = Math.round(sumTaux / statsCours.length);
    if (isNaN(tauxMoyen)) tauxMoyen = 0;
  }
  
  // Nombre de filières uniques dans les cours filtrés
  const filieresUniques = [...new Set(statsCours.map(c => c.filiere).filter(f => f && f !== 'N/A'))];
  const totalFilieres = filieresUniques.length;
  
  // Statistiques par filière si une filière est sélectionnée
  const statsFiliere = selectedFiliere !== 'all' ? {
    nom: filieres.find(f => f.id === selectedFiliere)?.name || selectedFiliere,
    totalCours: statsCours.length,
    totalEtudiants: totalEtudiants,
    tauxMoyen: tauxMoyen
  } : null;
  
  // Statistiques par niveau si un niveau est sélectionné
  const statsNiveau = selectedNiveau !== 'all' ? {
    niveau: selectedNiveau,
    totalCours: statsCours.length,
    totalEtudiants: totalEtudiants,
    tauxMoyen: tauxMoyen,
    filieres: filieresUniques.length
  } : null;

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
            Mes Cours
          </h1>
          <p style={{ color: '#64748b', fontSize: '16px' }}>
            Liste des modules et cours qui vous sont assignés • Consultez vos statistiques et performances
          </p>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px', fontStyle: 'italic' }}>
            Note: Les cours sont créés et assignés par les administrateurs. Consultez "Séances" pour les sessions de classe et "Emploi du Temps" pour votre horaire hebdomadaire.
          </p>
        </div>
      </div>

      {/* Message de filtre actif */}
      {(selectedFiliere !== 'all' || selectedNiveau !== 'all') && (
        <div style={{ backgroundColor: '#fef3c7', padding: '16px', borderRadius: '8px', marginBottom: '24px', borderLeft: '4px solid #f59e0b' }}>
          <p style={{ fontSize: '14px', color: '#92400e', fontWeight: '500', marginBottom: '4px' }}>
            📊 Statistiques filtrées
          </p>
          <p style={{ fontSize: '13px', color: '#78350f' }}>
            {selectedFiliere !== 'all' && `Filière: ${filieres.find(f => f.id === selectedFiliere)?.name || selectedFiliere}`}
            {selectedFiliere !== 'all' && selectedNiveau !== 'all' && ' • '}
            {selectedNiveau !== 'all' && `Niveau: ${selectedNiveau}ère année`}
          </p>
        </div>
      )}

      {/* Statistiques rapides */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>
                {selectedFiliere !== 'all' || selectedNiveau !== 'all' ? 'Cours (filtrés)' : 'Total Cours'}
              </p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>{totalCours}</p>
              {selectedFiliere !== 'all' && (
                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                  dans {statsFiliere?.nom}
                </p>
              )}
              {selectedNiveau !== 'all' && (
                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                  en {selectedNiveau}ère année
                </p>
              )}
            </div>
            <div style={{ backgroundColor: '#dbeafe', padding: '12px', borderRadius: '8px' }}>
              <Users size={24} color="#3b82f6" />
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>
                {selectedFiliere !== 'all' || selectedNiveau !== 'all' ? 'Étudiants (filtrés)' : 'Total Étudiants'}
              </p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>
                {totalEtudiants}
              </p>
              {selectedNiveau !== 'all' && statsNiveau && (
                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                  {statsNiveau.filieres} filière{statsNiveau.filieres > 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div style={{ backgroundColor: '#fef3c7', padding: '12px', borderRadius: '8px' }}>
              <Users size={24} color="#f59e0b" />
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>
                Taux Moyen de Présence
              </p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>
                {tauxMoyen}%
              </p>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                Moyenne des cours
              </p>
            </div>
            <div style={{ backgroundColor: '#dcfce7', padding: '12px', borderRadius: '8px' }}>
              <TrendingUp size={24} color="#00A651" />
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>
                {selectedFiliere !== 'all' || selectedNiveau !== 'all' ? 'Filières (filtrées)' : 'Filières'}
              </p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>
                {totalFilieres}
              </p>
              {selectedFiliere === 'all' && selectedNiveau === 'all' && (
                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                  différentes filières
                </p>
              )}
            </div>
            <div style={{ backgroundColor: '#e0e7ff', padding: '12px', borderRadius: '8px' }}>
              <Calendar size={24} color="#6366f1" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Rechercher par nom ou code..."
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

          <div>
            <select
              value={selectedFiliere}
              onChange={(e) => setSelectedFiliere(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="all">Toutes les filières ({filieres.length})</option>
              {filieres.map(f => {
                const count = cours.filter(c => c.filiere.toLowerCase() === f.id).length;
                return (
                  <option key={f.id} value={f.id}>
                    {f.name} ({count} cours)
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <select
              value={selectedNiveau}
              onChange={(e) => setSelectedNiveau(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="all">Tous les niveaux</option>
              {[1, 2, 3, 4, 5].map(n => {
                const count = cours.filter(c => c.niveau === n).length;
                return (
                  <option key={n} value={n.toString()}>
                    {n}ère année ({count} cours)
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des cours */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {filteredCours.length === 0 ? (
          <div style={{ backgroundColor: 'white', padding: '60px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <p style={{ color: '#64748b', fontSize: '16px' }}>Aucun cours trouvé</p>
          </div>
        ) : (
          filteredCours.map(c => (
            <div
              key={c.id}
              style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
                      {c.nom}
                    </h3>
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {c.code}
                    </span>
                  </div>

                  <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                    {c.description}
                  </p>

                  <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#64748b', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>📚</span>
                      <span>{c.filiere} - Niveau {c.niveau}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={16} />
                      <span>{Number(c.nbEtudiants) || 0} étudiants</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={16} />
                      <span>{Number(c.nbSeances) || 0} séances</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <TrendingUp size={16} />
                      <span>{Number(c.tauxPresence) || 0}% présence</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                      Groupes: {c.groupes.join(', ')}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleView(c.id)}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#e2e8f0'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                  >
                    <Eye size={16} />
                    Voir
                  </button>

                  <button
                    onClick={() => handleEdit(c.id)}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#e2e8f0'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                  >
                    <Edit size={16} />
                    Modifier
                  </button>

                  <button
                    onClick={() => handleDelete(c.id)}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#fecaca'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#fee2e2'}
                  >
                    <Trash2 size={16} />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CoursList;