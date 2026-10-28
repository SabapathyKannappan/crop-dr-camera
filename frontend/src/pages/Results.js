import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Leaf, Calendar, Clock, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../utils/api';

const Results = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiagnosis();
  }, [id]);

  const fetchDiagnosis = async () => {
    try {
      const response = await apiClient.get(`/diagnoses/${id}`);
      setDiagnosis(response.data);
    } catch (error) {
      console.error('Error fetching diagnosis:', error);
      toast.error('Failed to load results');
      navigate('/history');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'healthy':
        return <CheckCircle2 className="text-[#344E41]" size={32} />;
      case 'mild':
        return <CheckCircle2 className="text-[#588157]" size={32} />;
      case 'moderate':
        return <AlertTriangle className="text-[#D4A373]" size={32} />;
      case 'severe':
      case 'critical':
        return <XCircle className="text-[#BC4749]" size={32} />;
      default:
        return <Leaf className="text-[#344E41]" size={32} />;
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'healthy': '#344E41',
      'mild': '#588157',
      'moderate': '#D4A373',
      'severe': '#BC4749',
      'critical': '#BC4749'
    };
    return colors[severity] || '#A3B18A';
  };

  const getConfidenceClass = (score) => {
    if (score >= 80) return 'confidence-high';
    if (score >= 60) return 'confidence-medium';
    return 'confidence-low';
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
        <div className="text-[#344E41] text-lg font-medium">Loading results...</div>
      </div>
    );
  }

  if (!diagnosis) return null;

  return (
    <div className="min-h-screen pb-32 animate-grow">
      {/* Header */}
      <div className="bg-[#344E41] text-white px-6 pt-8 pb-6">
        <button
          onClick={() => navigate('/history')}
          className="flex items-center gap-2 text-white/90 mb-4 hover:text-white transition-colors"
          data-testid="back-button"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back to History</span>
        </button>
        <h1 
          className="text-3xl font-bold" 
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Analysis Results
        </h1>
      </div>

      <div className="px-6 mt-6 space-y-6">
        {/* Plant Image */}
        <div 
          className="bg-white rounded-3xl p-4 shadow-sm border border-[#A3B18A]/20"
          data-testid="plant-image"
        >
          <img
            src={`data:image/jpeg;base64,${diagnosis.image_data}`}
            alt={diagnosis.plant_name}
            className="w-full h-auto rounded-2xl"
          />
        </div>

        {/* Confidence Score */}
        <div 
          className={`${getConfidenceClass(diagnosis.health_score)} text-white rounded-3xl p-6 shadow-sm`}
          data-testid="confidence-card"
        >
          <div className="text-center">
            <div className="text-sm font-mono uppercase tracking-wider mb-2 opacity-90">
              Confidence Score
            </div>
            <div 
              className="text-6xl font-bold mb-3"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              {diagnosis.health_score}%
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 mb-2">
              <div
                className="h-2 rounded-full bg-white transition-all duration-700"
                style={{ width: `${diagnosis.health_score}%` }}
              />
            </div>
            <p className="text-sm opacity-90">Health assessment reliability</p>
          </div>
        </div>

        {/* Diagnosis Card */}
        <div 
          className="bg-white rounded-3xl p-6 shadow-sm border border-[#A3B18A]/20"
          data-testid="diagnosis-card"
        >
          <div className="flex items-start gap-4 mb-4">
            <div 
              className="p-3 rounded-2xl"
              style={{ backgroundColor: `${getSeverityColor(diagnosis.severity)}20` }}
            >
              {getSeverityIcon(diagnosis.severity)}
            </div>
            <div className="flex-1">
              <h2 
                className="text-2xl font-bold mb-2" 
                style={{ color: '#344E41', fontFamily: 'Playfair Display, serif' }}
              >
                {diagnosis.plant_name}
              </h2>
              <p className="text-base text-[#588157] mb-3 italic">{diagnosis.disease_name}</p>
              <span 
                className="inline-block text-xs font-semibold px-3 py-2 rounded-full text-white"
                style={{ backgroundColor: getSeverityColor(diagnosis.severity) }}
              >
                {diagnosis.severity.charAt(0).toUpperCase() + diagnosis.severity.slice(1)} Severity
              </span>
            </div>
          </div>
          
          <p className="text-[#588157] leading-relaxed">
            {diagnosis.description}
          </p>
        </div>

        {/* Treatment Steps */}
        <div 
          className="bg-white rounded-3xl p-6 shadow-sm border border-[#A3B18A]/20"
          data-testid="treatment-card"
        >
          <h3 
            className="text-xl font-semibold mb-4 flex items-center gap-2" 
            style={{ color: '#344E41', fontFamily: 'Playfair Display, serif' }}
          >
            <Leaf size={22} />
            <span>General Treatment</span>
          </h3>
          <div className="space-y-4">
            {diagnosis.treatment_steps.map((step, index) => (
              <div key={index} className="flex gap-4" data-testid={`treatment-step-${index}`}>
                <div 
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: '#344E41' }}
                >
                  {index + 1}
                </div>
                <p className="flex-1 text-[#588157] pt-1">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 7-Day Care Schedule */}
        {diagnosis.care_schedule && diagnosis.care_schedule.length > 0 && (
          <div 
            className="bg-white rounded-3xl p-6 shadow-sm border border-[#A3B18A]/20"
            data-testid="care-schedule"
          >
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="text-[#344E41]" size={24} />
              <h3 
                className="text-xl font-semibold" 
                style={{ color: '#344E41', fontFamily: 'Playfair Display, serif' }}
              >
                7-Day Care Schedule
              </h3>
            </div>
            
            <div className="space-y-4">
              {diagnosis.care_schedule.map((dayAction, index) => (
                <div 
                  key={index} 
                  className="bg-[#A3B18A]/10 rounded-2xl p-4 border border-[#A3B18A]/20"
                  data-testid={`care-day-${dayAction.day}`}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div 
                      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: '#344E41' }}
                    >
                      {dayAction.day}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 
                          className="font-semibold text-base" 
                          style={{ color: '#344E41', fontFamily: 'Playfair Display, serif' }}
                        >
                          {dayAction.title}
                        </h4>
                        <span className="text-lg">{getTimeIcon(dayAction.time_of_day)}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={14} className="text-[#588157]" />
                        <span className="text-xs text-[#588157] capitalize font-medium">
                          {dayAction.time_of_day}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-[#588157] leading-relaxed pl-13">
                    {dayAction.action}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-center text-sm text-[#A3B18A]">
          Scanned on {new Date(diagnosis.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default Results;
