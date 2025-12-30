import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Calendar, Filter, Search, Download, TrendingUp, TrendingDown } from 'lucide-react';
import './Student.css';

interface AttendanceRecord {
  id: number;
  courseName: string;
  module: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'present' | 'absent' | 'retard';
  professor: string;
  room: string;
}

interface AttendanceStats {
  totalSessions: number;
  present: number;
  absent: number;
  late: number;
  attendanceRate: number;
}

const StudentAttendance: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalSessions: 0,
    present: 0,
    absent: 0,
    late: 0,
    attendanceRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [searchTerm, statusFilter, moduleFilter, attendanceRecords]);

  const fetchAttendanceData = async () => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/students/me/attendance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAttendanceRecords(data.records);
        setStats(data.stats);
      }
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...attendanceRecords];
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.professor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }
    if (moduleFilter !== 'all') {
      filtered = filtered.filter(record => record.module === moduleFilter);
    }
    setFilteredRecords(filtered);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      present: { class: 'status-badge present', icon: <CheckCircle size={14} />, text: 'Présent' },
      absent: { class: 'status-badge absent', icon: <XCircle size={14} />, text: 'Absent' },
      retard: { class: 'status-badge retard', icon: <Clock size={14} />, text: 'Retard' },
    };
    const badge = badges[status as keyof typeof badges];
    if (!badge) return null;
    return (
      <span className={badge.class}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  const getUniqueModules = () => {
    const modules = attendanceRecords.map(record => record.module);
    return Array.from(new Set(modules));
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Cours', 'Module', 'Horaire', 'Professeur', 'Salle', 'Statut'];
    const csvData = filteredRecords.map(record => [
      new Date(record.date).toLocaleDateString('fr-FR'),
      record.courseName,
      record.module,
      `${record.startTime} - ${record.endTime}`,
      record.professor,
      record.room,
      record.status === 'present' ? 'Présent' : record.status === 'absent' ? 'Absent' : 'Retard'
    ]);
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presences_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="student-page">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Mes Présences</h1>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-content">
            <div>
              <p className="stat-label">Total Séances</p>
              <p className="stat-value">{stats.totalSessions}</p>
            </div>
            <div className="stat-icon blue">
              <Calendar size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-content">
            <div>
              <p className="stat-label">Présences</p>
              <p className="stat-value">{stats.present}</p>
            </div>
            <div className="stat-icon green">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card red">
          <div className="stat-content">
            <div>
              <p className="stat-label">Absences</p>
              <p className="stat-value">{stats.absent}</p>
            </div>
            <div className="stat-icon red">
              <XCircle size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-content">
            <div>
              <p className="stat-label">Taux de Présence</p>
              <p className="stat-value">{stats.attendanceRate}%</p>
            </div>
            <div className="stat-icon purple">
              {stats.attendanceRate >= 75 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-card">
        <div className="filter-row">
          <div className="search-box">
            <Search size={18} className="search-icon-in" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-box"
            />
          </div>

          <div className="filter-select">
            <Filter size={18} className="filter-icon-in" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select-box">
              <option value="all">Tous les statuts</option>
              <option value="present">Présent</option>
              <option value="absent">Absent</option>
              <option value="retard">Retard</option>
            </select>
          </div>

          <div className="filter-select">
            <Filter size={18} className="filter-icon-in" />
            <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className="select-box">
              <option value="all">Tous les modules</option>
              {getUniqueModules().map(module => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>
          </div>

          <button onClick={exportToCSV} className="btn-export">
            <Download size={18} />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Cours</th>
              <th>Module</th>
              <th>Horaire</th>
              <th>Professeur</th>
              <th>Salle</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <tr key={record.id}>
                  <td>
                    {new Date(record.date).toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                    })}
                  </td>
                  <td><strong>{record.courseName}</strong></td>
                  <td>{record.module}</td>
                  <td>{record.startTime} - {record.endTime}</td>
                  <td>{record.professor}</td>
                  <td>{record.room}</td>
                  <td>{getStatusBadge(record.status)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="empty-row">
                  Aucune présence trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Results count */}
      <div className="results-count">
        Affichage de {filteredRecords.length} sur {attendanceRecords.length} enregistrements
      </div>
    </div>
  );
};

export default StudentAttendance;