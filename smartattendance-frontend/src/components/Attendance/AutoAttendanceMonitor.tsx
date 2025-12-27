import React, { useRef, useState, useEffect } from 'react';
import { Camera, Users, Clock } from 'lucide-react';
import { coursAPI } from '../../services/coursAPI';
import { attendanceAPI, seanceAPI } from '../../services/attendanceAPI';
import { studentAPI } from '../../services/studentAPI';
import { CoursInfo, Seance } from '../../types/attendance';
import './Attendance.css';

const AutoAttendanceMonitor: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const studentsRef = useRef<any[]>([]); // ✅ REF POUR LES ÉTUDIANTS
  
  const [activeCours, setActiveCours] = useState<CoursInfo | null>(null);
  const [activeSeance, setActiveSeance] = useState<Seance | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [attendanceLog, setAttendanceLog] = useState<any[]>([]);
  const [captureInterval, setCaptureInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const init = async () => {
      await loadStudents();
      console.log('✅ Étudiants chargés, démarrage monitoring...');
      await checkAndStartMonitoring();
    };
    
    init();
    
    const checkInterval = setInterval(checkAndStartMonitoring, 60000);
    
    return () => {
      clearInterval(checkInterval);
      stopMonitoring();
    };
  }, []);

  const loadStudents = async () => {
    try {
      const activeStudents = await studentAPI.getActive();
      console.log('📚 Étudiants chargés:', activeStudents);
      studentsRef.current = activeStudents; // ✅ STOCKER DANS LE REF
    } catch (error) {
      console.error('Erreur chargement étudiants:', error);
    }
  };

  const checkAndStartMonitoring = async () => {
    try {
      const allCours = await coursAPI.getAll();
      const currentCours = getCurrentCours(allCours);

      if (currentCours && !activeCours) {
        startMonitoring(currentCours);
      } else if (!currentCours && activeCours) {
        stopMonitoring();
      }
    } catch (error) {
      console.error('Erreur vérification cours:', error);
    }
  };

  const getCurrentCours = (allCours: CoursInfo[]): CoursInfo | null => {
    const now = new Date();
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const currentDay = dayNames[now.getDay()];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const cours of allCours) {
      if (cours.jour !== currentDay) continue;

      const [debutH, debutM] = cours.heure_debut.split(':').map(Number);
      const [finH, finM] = cours.heure_fin.split(':').map(Number);
      const debutMinutes = debutH * 60 + debutM;
      const finMinutes = finH * 60 + finM;

      if (currentMinutes >= debutMinutes && currentMinutes <= finMinutes) {
        return cours;
      }
    }

    return null;
  };

  const startMonitoring = async (cours: CoursInfo) => {
    try {
      const seance = await seanceAPI.start(cours.id);
      setActiveSeance(seance);
      setActiveCours(cours);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        videoRef.current.play();
      }

      const interval = setInterval(() => {
        captureAndRecognize(seance.id);
      }, 30000);

      setCaptureInterval(interval);
      
      console.log(`🎥 Surveillance activée pour: ${cours.module.nom}`);
    } catch (error) {
      console.error('Erreur démarrage surveillance:', error);
    }
  };

  const stopMonitoring = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    if (captureInterval) {
      clearInterval(captureInterval);
      setCaptureInterval(null);
    }

    if (activeSeance) {
      seanceAPI.end(activeSeance.id);
      setActiveSeance(null);
    }

    setActiveCours(null);
    console.log('🛑 Surveillance arrêtée');
  };

  const captureAndRecognize = async (seanceId: number) => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.95);

    try {
      const blob = await fetch(imageData).then((res) => res.blob());
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });

      const attendance = await attendanceAPI.markAttendance(seanceId, file);
      
      // ✅ UTILISER studentsRef.current
      const studentsList = studentsRef.current;
      console.log('🔍 Attendance student_id:', attendance.student_id);
      console.log('🔍 Students IDs:', studentsList.map(s => s.id));
      
      const student = studentsList.find(s => s.id === attendance.student_id);
      
      const studentName = student && student.user && student.user.full_name
        ? student.user.full_name 
        : `Étudiant #${attendance.student_id}`;

      setAttendanceLog(prev => [{
        timestamp: new Date().toLocaleTimeString(),
        student: studentName,
        status: attendance.status,
        confidence: attendance.confidence
      }, ...prev].slice(0, 10));

      console.log(`✅ ${studentName} - ${attendance.status} (${Math.round(attendance.confidence * 100)}%)`);
    } catch (error: any) {
      console.error('❌ Reconnaissance échouée:', error.response?.data?.detail);
    }
  };

  if (!activeCours) {
    return (
      <div className="auto-monitor-idle">
        <Camera size={64} color="#94a3b8" />
        <h2>En attente d'un cours...</h2>
        <p>La surveillance s'activera automatiquement au début du prochain cours</p>
      </div>
    );
  }

  return (
    <div className="auto-monitor-active">
      <div className="monitor-header">
        <div className="monitor-status">
          <div className="status-indicator pulse"></div>
          <span>🎥 SURVEILLANCE ACTIVE</span>
        </div>
        <h2>{activeCours.module.nom}</h2>
        <p>Groupe: {activeCours.groupe.code} | {activeCours.heure_debut} - {activeCours.heure_fin}</p>
      </div>

      <div className="monitor-layout">
        <div className="camera-feed">
          <video ref={videoRef} autoPlay playsInline muted className="monitor-video" />
          <div className="camera-overlay">
            <Clock size={16} />
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="attendance-log">
          <h3><Users size={20} /> Présences détectées</h3>
          {attendanceLog.length === 0 ? (
            <p className="log-empty">En attente de détection...</p>
          ) : (
            <div className="log-list">
              {attendanceLog.map((log, idx) => (
                <div key={idx} className="log-item">
                  <span className="log-time">{log.timestamp}</span>
                  <span className="log-student">{log.student}</span>
                  <span className={`log-status status-${log.status}`}>
                    {log.status === 'present' ? '✅ Présent' : '⚠️ Retard'}
                  </span>
                  <span className="log-confidence">{(log.confidence * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default AutoAttendanceMonitor;