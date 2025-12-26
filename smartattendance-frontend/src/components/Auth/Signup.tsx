import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './Auth.css';
import logoEMSI from "../../assets/images/logo-emsi.png";
import campusEMSI from "../../assets/images/campus-emsi.jpg";


const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = (location.state as any)?.message;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      await authAPI.signup({
        email: formData.email,
        full_name: formData.full_name,
        password: formData.password,
      });
      
      // Redirection vers login
      navigate('/login', { state: { message: 'Compte créé avec succès !' } });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'inscription');
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
            <h1>Créer un compte</h1>
            <p>Inscription au système Smart Attendance</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="alert alert-error">{error}</div>}
            {successMessage && <div className="alert alert-success">{successMessage}</div>}

            <div className="form-group">
              <label htmlFor="full_name">Nom complet</label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="Prénom Nom"
                value={formData.full_name}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email EMSI</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="nom@emsi.ma ou nom@emsi-edu.ma"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <small className="form-hint">
                Utilisez votre email @emsi.ma (enseignant) ou @emsi-edu.ma (étudiant)
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Inscription...' : 'Créer mon compte'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Déjà un compte ?{' '}
              <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
                Se connecter
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

export default Signup;