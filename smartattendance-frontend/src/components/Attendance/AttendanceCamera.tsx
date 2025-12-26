import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { attendanceAPI, seanceAPI } from '../../services/attendanceAPI';
import { CoursInfo, Seance } from '../../types/attendance';
import './Attendance.css';

interface AttendanceCameraProps {
  cours: CoursInfo;
}

const AttendanceCamera: React.FC<AttendanceCameraProps> = ({ cours }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [seance, setSeance] = useState<Seance | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    startSeance();
    return () => {
      stopCamera();
    };
  }, []);

  const startSeance = async () => {
    try {
      const newSeance = await seanceAPI.start(cours.id);
      setSeance(newSeance);
      startCamera();
    } catch (error) {
      console.error('Erreur démarrage séance:', error);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        videoRef.current.play();

        setTimeout(() => {
          setIsCameraOn(true);
        }, 500);
      }
    } catch (error) {
      console.error('Erreur caméra:', error);
      alert('Impossible d\'accéder à la caméra');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraOn(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(imageData);
  };

  const markAttendance = async () => {
    if (!capturedImage || !seance) return;

    setLoading(true);
    setResult(null);

    try {
      const blob = await fetch(capturedImage).then((res) => res.blob());
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });

      const attendance = await attendanceAPI.markAttendance(seance.id, file);

      setResult({
        success: true,
        ...attendance,
      });

      // Réinitialiser après 3 secondes
      setTimeout(() => {
        setCapturedImage(null);
        setResult(null);
      }, 3000);
    } catch (error: any) {
      setResult({
        success: false,
        error: error.response?.data?.detail || 'Erreur reconnaissance',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle size={48} color="#00A651" />;
      case 'late':
        return <Clock size={48} color="#f59e0b" />;
      default:
        return <AlertCircle size={48} color="#ef4444" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return 'Présent';
      case 'late':
        return 'En retard';
      default:
        return 'Absent';
    }
  };

  return (
    <div className="attendance-camera">
      <div className="cours-info-header">
        <h2>{cours.module.nom}</h2>
        <p>Groupe: {cours.groupe.code} | Salle: {cours.salle || 'N/A'}</p>
        <p className="cours-time">
          {cours.heure_debut} - {cours.heure_fin}
        </p>
      </div>

      <div className="camera-container">
        {isCameraOn && !capturedImage && (
          <div className="video-wrapper">
            <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
            <div className="camera-controls">
              <button onClick={capturePhoto} className="btn-capture">
                📸 Capturer
              </button>
            </div>
          </div>
        )}

        {capturedImage && !result && (
          <div className="captured-wrapper">
            <img src={capturedImage} alt="Captured" className="captured-image" />
            <div className="camera-controls">
              <button onClick={markAttendance} className="btn-primary" disabled={loading}>
                {loading ? '⏳ Analyse...' : '✅ Marquer Présence'}
              </button>
              <button onClick={() => setCapturedImage(null)} className="btn-secondary">
                🔄 Reprendre
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="attendance-result">
            {result.success ? (
              <div className="result-success">
                {getStatusIcon(result.status)}
                <h3>{getStatusText(result.status)}</h3>
                <p>Confiance: {(result.confidence * 100).toFixed(1)}%</p>
                <p className="timestamp">
                  {new Date(result.timestamp).toLocaleTimeString('fr-FR')}
                </p>
              </div>
            ) : (
              <div className="result-error">
                <AlertCircle size={48} color="#ef4444" />
                <h3>Échec</h3>
                <p>{result.error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default AttendanceCamera;