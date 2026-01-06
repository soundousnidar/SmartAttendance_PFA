import React, { useState, useEffect } from 'react';
import { Bell, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { enseignantAPI } from '../../services/enseignantAPI';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await enseignantAPI.getNotifications(50);
      // Transform backend data to frontend format
      const transformed = data.map((notif) => {
        // Determine type from message or use default
        let type = 'info';
        if (notif.message?.toLowerCase().includes('risque') || notif.message?.toLowerCase().includes('absence')) {
          type = 'warning';
        } else if (notif.message?.toLowerCase().includes('généré') || notif.message?.toLowerCase().includes('succès')) {
          type = 'success';
        }
        
        // Format date
        const date = new Date(notif.date);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        
        let dateStr = '';
        if (diffDays > 0) {
          dateStr = diffDays === 1 ? 'Hier' : `Il y a ${diffDays} jours`;
        } else if (diffHours > 0) {
          dateStr = `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
        } else {
          const diffMins = Math.floor(diffMs / (1000 * 60));
          dateStr = diffMins > 0 ? `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}` : 'À l\'instant';
        }
        
        return {
          id: notif.id,
          type,
          titre: notif.title || notif.titre || 'Notification',
          message: notif.message || notif.content || '',
          date: dateStr
        };
      });
      setNotifications(transformed);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconAndColor = (type) => {
    switch (type) {
      case 'warning': return { icon: AlertCircle, color: '#f59e0b' };
      case 'success': return { icon: CheckCircle, color: '#00A651' };
      default: return { icon: Info, color: '#3b82f6' };
    }
  };

  if (loading) {
    return (
      <div style={{ fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#64748b' }}>Chargement des notifications...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <Bell size={36} color="#1e293b" />
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b' }}>
          Notifications
        </h1>
      </div>

      {notifications.length === 0 ? (
        <div style={{ backgroundColor: 'white', padding: '60px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '16px' }}>Aucune notification</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {notifications.map(notif => {
          const { icon: Icon, color } = getIconAndColor(notif.type);
          return (
            <div key={notif.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', gap: '16px' }}>
              <div style={{ padding: '12px', backgroundColor: color + '20', borderRadius: '8px' }}>
                <Icon size={28} color={color} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>{notif.titre}</h3>
                <p style={{ color: '#64748b', marginBottom: '8px' }}>{notif.message}</p>
                <p style={{ fontSize: '14px', color: '#94a3b8' }}>{notif.date}</p>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};

export default Notifications;