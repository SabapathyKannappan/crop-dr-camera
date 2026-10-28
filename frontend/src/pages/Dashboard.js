import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Camera, Calendar, Leaf, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [recentDiagnoses, setRecentDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [profileRes, diagnosesRes] = await Promise.all([
        axios.get(`${API}/profile`),
        axios.get(`${API}/diagnoses`)
      ]);
      
      setProfile(profileRes.data);
      setRecentDiagnoses(diagnosesRes.data.slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#1A4D2E] text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-6 pt-8 max-w-md mx-auto animate-in">
      {/* Header with Logo */}
      <div className="mb-8">
        <div className="flex items-center justify-center mb-6">
          <img 
            src="https://customer-assets.emergentagent.com/job_leaf-remedy/artifacts/h49aefpj_ad2f1414-609a-4818-a5e0-b8e259b77e48.png" 
            alt="Crop Doctor Logo" 
            className="w-48 h-auto"
            data-testid="app-logo"
          />
        </div>
        <p className="text-center text-base text-[#5A5A5A]" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Your daily plant health companion
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Active Care Plans Card */}
        <div 
          className="col-span-1 bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#1A4D2E]/5"
          data-testid="active-plans-card"
        >
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="text-[#FF6B35]" size={20} />
            <span className="text-xs font-medium uppercase tracking-wide text-[#888888]">
              Active Plans
            </span>
          </div>
          <div className="text-4xl font-bold" style={{ color: '#1A4D2E', fontFamily: 'Playfair Display, serif' }}>
            {profile?.active_care_plans || 0}
          </div>
          <p className="text-sm text-[#5A5A5A] mt-1">care schedules</p>
        </div>

        {/* Total Scans Card */}
        <div 
          className="col-span-1 bg-[#E8F5E9] rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#1A4D2E]/5"
          data-testid="total-scans-card"
        >
          <div className="flex items-center gap-2 mb-3">
            <Camera className="text-[#1A4D2E]" size={20} />
            <span className="text-xs font-medium uppercase tracking-wide text-[#1A4D2E]">
              Total Scans
            </span>
          </div>
          <div className="text-4xl font-bold" style={{ color: '#1A4D2E', fontFamily: 'Playfair Display, serif' }}>
            {profile?.total_diagnoses || 0}
          </div>
          <p className="text-sm text-[#1A4D2E] mt-1">plants checked</p>
        </div>

        {/* Upload Button - Hero Element */}
        <div className="col-span-2">
          <button
            onClick={() => navigate('/upload')}
            className="w-full bg-[#1A4D2E] text-white rounded-full px-8 py-8 text-lg font-medium btn-primary shadow-lg hover:shadow-xl"
            style={{ fontFamily: 'Manrope, sans-serif' }}
            data-testid="upload-photo-button"
          >
            <div className="flex items-center justify-center gap-3">
              <Camera size={28} />
              <span className="text-xl font-semibold">Scan Plant Now</span>
            </div>
          </button>
        </div>
      </div>

      {/* Today's Reminder */}
      <div 
        className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#1A4D2E]/5 mb-8"
        data-testid="reminder-card"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#E8F5E9] rounded-full">
            <AlertCircle className="text-[#1A4D2E]" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1" style={{ color: '#1A4D2E', fontFamily: 'Playfair Display, serif' }}>
              Daily Plant Care
            </h3>
            <p className="text-sm text-[#5A5A5A]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {profile?.active_care_plans > 0 
                ? `You have ${profile.active_care_plans} active care ${profile.active_care_plans === 1 ? 'plan' : 'plans'}. Check your plants and follow today's care schedule!`
                : 'Start your journey to healthier plants! Upload your first plant photo to get a personalized care schedule.'}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Diagnoses */}
      {recentDiagnoses.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 
              className="text-2xl font-semibold" 
              style={{ color: '#1A4D2E', fontFamily: 'Playfair Display, serif' }}
            >
              Recent Scans
            </h2>
            <button
              onClick={() => navigate('/history')}
              className="text-sm font-medium text-[#1A4D2E] hover:underline"
              data-testid="view-all-button"
            >
              View All
            </button>
          </div>

          <div className="space-y-4">
            {recentDiagnoses.map((diagnosis) => (
              <div
                key={diagnosis.id}
                onClick={() => navigate(`/diagnosis/${diagnosis.id}`)}
                className="bg-white rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#1A4D2E]/5 card-hover cursor-pointer"
                data-testid={`recent-diagnosis-${diagnosis.id}`}
              >
                <div className="flex gap-4">
                  <img
                    src={`data:image/jpeg;base64,${diagnosis.image_data}`}
                    alt={diagnosis.plant_name}
                    className="w-20 h-20 rounded-2xl object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1" style={{ color: '#1A1A1A' }}>
                      {diagnosis.plant_name}
                    </h3>
                    <p className="text-xs text-[#5A5A5A] mb-1">{diagnosis.disease_name}</p>
                    <div className="flex items-center gap-2">
                      <span 
                        className="text-xs font-medium px-2 py-1 rounded-full"
                        style={{ 
                          backgroundColor: `${getSeverityColor(diagnosis.severity)}20`,
                          color: getSeverityColor(diagnosis.severity)
                        }}
                      >
                        {diagnosis.severity}
                      </span>
                      <span className="text-xs text-[#888888]">
                        {new Date(diagnosis.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
