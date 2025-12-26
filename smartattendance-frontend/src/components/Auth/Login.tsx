import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { saveAuthData } from '../../utils/authStorage';
import './Auth.css';
import logoEMSI from "../../assets/images/logo-emsi.png";
import campusEMSI from "../../assets/images/campus-emsi.jpg";


const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({ username, password });
      saveAuthData(response);
      
      // Redirection selon le rôle
      if (response.user.role === 'super_admin' || response.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (response.user.role === 'enseignant') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Navbar verte avec logo */}
      <div className="auth-navbar">
        <img 
          src={logoEMSI}
          alt="EMSI Logo"
          className="auth-logo"
        />
      </div>


      {/* Contenu principal */}
      <div className="auth-content">
        {/* Colonne gauche - Formulaire */}
        <div className="auth-form-section">
          <div className="auth-header">
            <h1>Connexion</h1>
            <p>Accédez au système Smart Attendance</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="username">Email ou Nom complet</label>
              <input
                id="username"
                type="text"
                placeholder="nom@emsi.ma"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Pas de compte ?{' '}
              <a href="/signup" onClick={(e) => { e.preventDefault(); navigate('/signup'); }}>
                Créer un compte
              </a>
            </p>
          </div>
        </div>

        {/* Colonne droite - Image établissement */}
        <div className="auth-image-section">
          <img 
            src={campusEMSI}
            alt="Campus EMSI"
          />
        </div>

      </div>
    </div>
  );
};

export default Login;