import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
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
  ArcElement,
} from 'chart.js';
import '../Student/Student.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface StudentStats {
  totalCours: number;
  presences: number;
  absences: number;
  retards: number;
  tauxPresence: number;
}

const StudentDashboard: React.FC = () => {
  const [stats, setStats] = useState<StudentStats>({
    totalCours: 0,
    presences: 0,
    absences: 0,
    retards: 0,
    tauxPresence: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const statsRes = await fetch('http://127.0.0.1:8000/students/me/stats', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  const presenceChartData = {
    labels: ['Sept', 'Oct', 'Nov', 'Déc'],
    datasets: [{
      label: 'Taux de présence (%)',
      data: [85, 88, 90, stats.tauxPresence || 0],
      borderColor: '#00A651',
      backgroundColor: 'rgba(0, 166, 81, 0.1)',
      tension: 0.4,
    }],
  };

  const attendanceDonutData = {
    labels: ['Présent', 'Absent', 'Retard'],
    datasets: [{
      data: [stats.presences, stats.absences, stats.retards],
      backgroundColor: ['#00A651', '#ef4444', '#f59e0b'],
      borderWidth: 0,
    }],
  };

  const moduleChartData = {
    labels: ['Informatique'],
    datasets: [
      {
        label: 'Présences',
        data: [stats.presences],
        backgroundColor: '#00A651',
      },
      {
        label: 'Absences',
        data: [stats.absences],
        backgroundColor: '#ef4444',
      },
    ],
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
        <h1 className="page-title">Tableau de Bord Étudiant</h1>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-content">
            <div>
              <p className="stat-label">Total Cours</p>
              <p className="stat-value">{stats.totalCours}</p>
            </div>
            <div className="stat-icon blue">
              <BookOpen size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-content">
            <div>
              <p className="stat-label">Présences</p>
              <p className="stat-value">{stats.presences}</p>
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
              <p className="stat-value">{stats.absences}</p>
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
              <p className="stat-value">{stats.tauxPresence}%</p>
            </div>
            <div className="stat-icon purple">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-row">
        {/* Line Chart */}
        <div className="chart-card">
          <h2 className="chart-title">Évolution du Taux de Présence</h2>
          <div className="chart-wrapper">
            <Line
              data={presenceChartData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { callback: (value) => value + '%' },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Donut Chart */}
        <div className="chart-card">
          <h2 className="chart-title">Répartition Présence/Absence</h2>
          <div className="chart-wrapper" style={{ height: '250px' }}>
            <Doughnut
              data={attendanceDonutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { padding: 15, font: { size: 12 } },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="chart-card-full">
        <h2 className="chart-title">Présence par Module</h2>
        <div className="chart-wrapper">
          <Bar
            data={moduleChartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                  labels: { padding: 15, font: { size: 12 } },
                },
              },
              scales: { y: { beginAtZero: true } },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;