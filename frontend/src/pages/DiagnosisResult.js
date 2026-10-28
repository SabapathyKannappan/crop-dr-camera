import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Leaf, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DiagnosisResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiagnosis();
  }, [id]);

  const fetchDiagnosis = async () => {
    try {
      const response = await axios.get(`${API}/diagnoses/${id}`);
      setDiagnosis(response.data);
    } catch (error) {
      console.error('Error fetching diagnosis:', error);
      toast.error('Failed to load diagnosis');
      navigate('/history');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'healthy':
        return <CheckCircle2 className="text-[#22c55e]" size={32} />;
      case 'mild':
        return <CheckCircle2 className="text-[#84cc16]" size={32} />;
      case 'moderate':
        return <AlertTriangle className="text-[#eab308]" size={32} />;
      case 'severe':
        return <XCircle className="text-[#FF6B35]" size={32} />;
      case 'critical':
        return <XCircle className="text-[#ef4444]" size={32} />;
      default:
        return <Leaf className="text-[#1A4D2E]" size={32} />;
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'healthy': '#22c55e',
      'mild': '#84cc16',
      'moderate': '#eab308',
      'severe': '#FF6B35',
      'critical': '#ef4444'
    };
    return colors[severity] || '#888888';
  };

  const getHealthScoreColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#84cc16';
    if (score >= 40) return '#eab308';
    if (score >= 20) return '#f97316';
    return '#ef4444';
  };

  const getTimeIcon = (timeOfDay) => {
    const icons = {
      'morning': '🌅',
      'afternoon': '☀️',
      'evening': '🌙'
    };
    return icons[timeOfDay] || '⏰';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#1A4D2E] text-lg">Loading diagnosis...</div>
      </div>
    );
  }

  if (!diagnosis) {
    return null;
  }

  return (
    <div className="min-h-screen pb-24 px-6 pt-8 max-w-md mx-auto animate-in">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/history')}
          className="flex items-center gap-2 text-[#1A4D2E] mb-4"
          data-testid="back-to-history-button"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back to History</span>
        </button>
      </div>

      {/* Plant Image */}
      <div 
        className="bg-white rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#1A4D2E]/5 mb-6"
        data-testid="diagnosis-image"
      >
        <img
          src={`data:image/jpeg;base64,${diagnosis.image_data}`}
          alt={diagnosis.plant_name}
          className="w-full h-auto rounded-2xl"
        />
      </div>

      {/* Health Score */}
      <div 
        className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#1A4D2E]/5 mb-6"
        data-testid="health-score-card"
      >
        <div className="text-center">
          <div className="text-xs font-medium uppercase tracking-wide text-[#888888] mb-2">
            Health Score
          </div>
          <div 
            className="text-6xl font-bold mb-2"
            style={{ color: getHealthScoreColor(diagnosis.health_score), fontFamily: 'Playfair Display, serif' }}
          >
            {diagnosis.health_score}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className="h-3 rounded-full transition-all duration-700"
              style={{ 
                width: `${diagnosis.health_score}%`,
                backgroundColor: getHealthScoreColor(diagnosis.health_score)
              }}
            />
          </div>
          <p className="text-sm text-[#5A5A5A]">out of 100</p>
        </div>
      </div>

      {/* Diagnosis Details */}
      <div 
        className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#1A4D2E]/5 mb-6"
        data-testid="diagnosis-details"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-[#E8F5E9] rounded-full">
            {getSeverityIcon(diagnosis.severity)}
          </div>
          <div className="flex-1">
            <h2 
              className="text-2xl font-bold mb-1" 
              style={{ color: '#1A4D2E', fontFamily: 'Playfair Display, serif' }}
            >
              {diagnosis.plant_name}
            </h2>
            <p className="text-base text-[#5A5A5A] mb-2">{diagnosis.disease_name}</p>
            <span 
              className="inline-block text-xs font-medium px-3 py-1 rounded-full"
              style={{ 
                backgroundColor: `${getSeverityColor(diagnosis.severity)}20`,
                color: getSeverityColor(diagnosis.severity)
              }}
            >
              {diagnosis.severity.charAt(0).toUpperCase() + diagnosis.severity.slice(1)} Severity
            </span>
          </div>
        </div>
        
        <p className="text-base text-[#5A5A5A] leading-relaxed">
          {diagnosis.description}
        </p>
      </div>

      {/* Treatment Steps */}
      <div 
        className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#1A4D2E]/5 mb-6"
        data-testid="treatment-steps-card"
      >
        <h3 
          className="text-xl font-semibold mb-4" 
          style={{ color: '#1A4D2E', fontFamily: 'Playfair Display, serif' }}
        >
          General Treatment Steps
        </h3>
        <div className="space-y-4">
          {diagnosis.treatment_steps.map((step, index) => (
            <div key={index} className="flex gap-4" data-testid={`treatment-step-${index}`}>
              <div 
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: '#1A4D2E' }}
              >
                {index + 1}
              </div>
              <p className="flex-1 text-base text-[#1A1A1A] pt-1">
                {step}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 7-Day Care Schedule */}
      {diagnosis.care_schedule && diagnosis.care_schedule.length > 0 && (
        <div 
          className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#1A4D2E]/5 mb-6"
          data-testid="care-schedule-card"
        >
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="text-[#1A4D2E]" size={24} />
            <h3 
              className="text-xl font-semibold" 
              style={{ color: '#1A4D2E', fontFamily: 'Playfair Display, serif' }}
            >
              7-Day Care Schedule
            </h3>
          </div>
          
          <div className="space-y-4">
            {diagnosis.care_schedule.map((dayAction, index) => (
              <div 
                key={index} 
                className="bg-[#E8F5E9] rounded-2xl p-4"
                data-testid={`care-day-${dayAction.day}`}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div 
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: '#1A4D2E' }}
                  >
                    {dayAction.day}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-base" style={{ color: '#1A4D2E' }}>
                        {dayAction.title}
                      </h4>
                      <span className="text-lg">{getTimeIcon(dayAction.time_of_day)}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={14} className="text-[#1A4D2E]" />
                      <span className="text-xs text-[#1A4D2E] capitalize">
                        {dayAction.time_of_day}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-[#1A1A1A] leading-relaxed pl-13">
                  {dayAction.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timestamp */}
      <div className="text-center text-sm text-[#888888]">
        Scanned on {new Date(diagnosis.timestamp).toLocaleString()}
      </div>
    </div>
  );
};

export default DiagnosisResult;
