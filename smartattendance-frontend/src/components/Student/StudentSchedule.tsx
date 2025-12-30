import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import './Student.css';

interface CourseSession {
  id: number;
  courseName: string;
  module: string;
  professor: string;
  room: string;
  startTime: string;
  endTime: string;
  day: string;
  color: string;
}

const StudentSchedule: React.FC = () => {
  const [currentWeek, setCurrentWeek] = useState(0);
  const [schedule, setSchedule] = useState<CourseSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, [currentWeek]);

  const fetchSchedule = async () => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`http://127.0.0.1:8000/students/me/schedule?week=${currentWeek}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSchedule(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  const getWeekDates = () => {
    const today = new Date();
    const firstDay = new Date(today);
    firstDay.setDate(today.getDate() - today.getDay() + 1 + (currentWeek * 7));
    const lastDay = new Date(firstDay);
    lastDay.setDate(lastDay.getDate() + 5);
    return `${firstDay.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })} - ${lastDay.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`;
  };

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  const getCoursesForDay = (day: string) => {
    return schedule.filter(course => course.day === day);
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
        <h1 className="page-title">Mon Emploi du Temps</h1>
      </div>

      {/* Week Navigation */}
      <div className="week-nav-card">
        <button onClick={() => setCurrentWeek(currentWeek - 1)} className="btn-nav">
          <ChevronLeft size={18} />
          Semaine précédente
        </button>
        <div className="week-info">
          <Calendar size={20} />
          <span>{getWeekDates()}</span>
        </div>
        <button onClick={() => setCurrentWeek(currentWeek + 1)} className="btn-nav">
          Semaine suivante
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Schedule Grid */}
      {schedule.length === 0 ? (
        <div className="empty-card">
          <p>Aucun cours cette semaine</p>
        </div>
      ) : (
        <div className="schedule-card">
          <div className="schedule-grid">
            {/* Time column */}
            <div className="time-col">
              <div className="time-header">Horaires</div>
              {timeSlots.map((time) => (
                <div key={time} className="time-cell">{time}</div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day) => {
              const courses = getCoursesForDay(day);
              return (
                <div key={day} className="day-col">
                  <div className="day-header">{day}</div>
                  
                  {timeSlots.map((_, idx) => (
                    <div key={idx} className="empty-cell"></div>
                  ))}
                  
                  {courses.map((course) => {
                    const startHour = parseInt(course.startTime.split(':')[0]);
                    const endHour = parseInt(course.endTime.split(':')[0]);
                    const startMin = parseInt(course.startTime.split(':')[1]);
                    const endMin = parseInt(course.endTime.split(':')[1]);
                    
                    const top = ((startHour - 8) * 60) + (startMin / 60 * 60) + 41;
                    const height = ((endHour - startHour) * 60) + ((endMin - startMin) / 60 * 60);
                    
                    return (
                      <div
                        key={course.id}
                        className="course-block"
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <div className="course-name">{course.courseName}</div>
                        <div className="course-time">{course.startTime} - {course.endTime}</div>
                        <div className="course-room">{course.room}</div>
                        <div className="course-prof">{course.professor}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSchedule;