import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Camera, Calendar, TrendingUp, Shield, Lock, AlertCircle, LogOut, Copy, Check } from 'lucide-react';
import { authService } from '../utils/auth';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Profile = ({ onSignOut } = {}) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  
  const authCode = authService.getAuthCode();

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const [profileRes, diagnosesRes] = await Promise.all([
        axios.get(`${API}/profile`, { headers: authService.getAuthHeaders() }),
        axios.get(`${API}/diagnoses`, { headers: authService.getAuthHeaders() })
      ]);
      
      setProfile(profileRes.data);
      setDiagnoses(diagnosesRes.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.response?.status === 401) {
        authService.clearAuthCode();
        navigate('/signin');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopyCode = () => {
    if (authCode) {
      navigator.clipboard.writeText(authCode);
      setCopied(true);
      toast.success('Sign-in code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleSignOut = async () => {
    if (!window.confirm('Are you sure you want to sign out?\n\nMake sure you\'ve saved your sign-in code to access your data later.')) {
      return;
    }
    
    setSigningOut(true);
    try {
      // Call backend signout
      await axios.post(`${API}/auth/signout`, {}, { headers: authService.getAuthHeaders() });
    } catch (error) {
      console.error('Sign out error:', error);
    }
    
    // Always clear auth regardless of backend response
    authService.clearAuthCode();
    
    // Notify parent component if callback provided
    if (onSignOut && typeof onSignOut === 'function') {
      onSignOut();
    }
    
    // Dispatch custom event for auth change
    window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { isAuthenticated: false } }));
    
    // Clear component state
    setProfile(null);
    setDiagnoses([]);
    
    // Show success and redirect
    toast.success('Signed out successfully. All data cleared.');
    
    // Force page reload to clear all cached data
    setTimeout(() => {
      window.location.href = '/signin';
    }, 500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#344E41] text-lg font-medium">Loading profile...</div>
      </div>
    );
  }

  const avgHealth = diagnoses.length > 0
    ? Math.round(diagnoses.reduce((sum, d) => sum + d.health_score, 0) / diagnoses.length)
    : 0;

  return (
    <div className="min-h-screen pb-32 animate-grow">
      {/* Header */}
      <div className="bg-[#344E41] text-white px-6 pt-8 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <User size={32} className="text-white" />
          </div>
          <div>
            <h1 
              className="text-3xl font-bold" 
              style={{ fontFamily: 'Playfair Display, serif' }}
              data-testid="profile-title"
            >
              Your Garden
            </h1>
            <p className="text-white/80 text-sm">Plant care statistics</p>
          </div>
        </div>
      </div>

      <div className="px-6 mt-6 space-y-6">
        {/* Sign-in Code Card */}
        <div 
          className="bg-white rounded-3xl p-6 shadow-sm border border-[#A3B18A]/20"
          data-testid="signin-code-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 
              className="text-lg font-semibold" 
              style={{ color: '#344E41', fontFamily: 'Playfair Display, serif' }}
            >
              Your Sign-In Code
            </h3>
            <button
              onClick={handleCopyCode}
              className="p-2 hover:bg-[#A3B18A]/10 rounded-full transition-all"
              aria-label="Copy sign-in code"
              data-testid="copy-code-button"
            >
              {copied ? (
                <Check className="text-[#344E41]" size={20} />
              ) : (
                <Copy className="text-[#588157]" size={20} />
              )}
            </button>
          </div>
          <div className="bg-[#E8F5E9] rounded-2xl p-4 mb-3">
            <div 
              className="text-3xl font-bold text-center tracking-widest font-mono"
              style={{ color: '#344E41' }}
            >
              {authCode}
            </div>
          </div>
          <p className="text-sm text-[#588157] text-center">
            Save this code to access your data from any device
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div 
            className="bg-white rounded-3xl p-6 shadow-sm border border-[#A3B18A]/20"
            data-testid="total-scans-stat"
          >
            <div className="flex items-center gap-2 mb-3">
              <Camera className="text-[#344E41]" size={18} />
              <span className="text-xs font-medium uppercase tracking-wide text-[#A3B18A]">
                Total Scans
              </span>
            </div>
            <div 
              className="text-4xl font-bold" 
              style={{ color: '#344E41', fontFamily: 'Playfair Display, serif' }}
            >
              {profile?.total_diagnoses || 0}
            </div>
          </div>

          <div 
            className="bg-white rounded-3xl p-6 shadow-sm border border-[#A3B18A]/20"
            data-testid="active-plans-stat"
          >
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="text-[#D4A373]" size={18} />
              <span className="text-xs font-medium uppercase tracking-wide text-[#A3B18A]">
                Active Plans
              </span>
            </div>
            <div 
              className="text-4xl font-bold" 
              style={{ color: '#344E41', fontFamily: 'Playfair Display, serif' }}
            >
              {profile?.active_care_plans || 0}
            </div>
          </div>

          <div 
            className="col-span-2 bg-[#A3B18A]/10 rounded-3xl p-6 shadow-sm border border-[#A3B18A]/20"
            data-testid="avg-health-stat"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="text-[#588157]" size={18} />
                  <span className="text-xs font-medium uppercase tracking-wide text-[#588157]">
                    Average Health
                  </span>
                </div>
                <div 
                  className="text-4xl font-bold" 
                  style={{ color: '#344E41', fontFamily: 'Playfair Display, serif' }}
                >
                  {avgHealth}%
                </div>
              </div>
              <div className="text-5xl">🌱</div>
            </div>
          </div>
        </div>

        {/* Privacy Info */}
        <div 
          className="bg-white rounded-3xl p-6 shadow-sm border border-[#A3B18A]/20"
          data-testid="privacy-card"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#344E41]/10 rounded-2xl">
              <Shield className="text-[#344E41]" size={24} />
            </div>
            <div>
              <h3 
                className="text-lg font-semibold mb-2" 
                style={{ color: '#344E41', fontFamily: 'Playfair Display, serif' }}
              >
                Your Privacy Matters
              </h3>
              <div className="space-y-2 text-sm text-[#588157]">
                <div className="flex items-start gap-2">
                  <Lock size={16} className="mt-0.5 flex-shrink-0" />
                  <span>All your plant scans are <strong>private by default</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <Lock size={16} className="mt-0.5 flex-shrink-0" />
                  <span>Only you can access your scan history</span>
                </div>
                <div className="flex items-start gap-2">
                  <Lock size={16} className="mt-0.5 flex-shrink-0" />
                  <span>Your photos are never shared with other users</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Information Card */}
        <div 
          className="bg-[#D4A373]/10 rounded-3xl p-6 shadow-sm border border-[#D4A373]/20"
          data-testid="info-card"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#D4A373]/20 rounded-2xl">
              <AlertCircle className="text-[#D4A373]" size={24} />
            </div>
            <div>
              <h3 
                className="text-lg font-semibold mb-2" 
                style={{ color: '#344E41', fontFamily: 'Playfair Display, serif' }}
              >
                About Plant Doctor
              </h3>
              <p className="text-sm text-[#588157] leading-relaxed">
                Plant Doctor uses advanced AI (GPT-5.1 Vision) to analyze your plants and provide 
                personalized care recommendations. For best results, take clear photos in natural light 
                and follow the 7-day care schedules.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/scan')}
            className="w-full bg-[#344E41] text-white rounded-full px-6 py-4 font-semibold shadow-lg hover:shadow-xl transition-all btn-press"
            data-testid="profile-scan-button"
          >
            <div className="flex items-center justify-center gap-2">
              <Camera size={20} />
              <span>Scan Another Plant</span>
            </div>
          </button>
          
          <button
            onClick={() => navigate('/history')}
            className="w-full bg-white text-[#344E41] border-2 border-[#344E41] rounded-full px-6 py-4 font-semibold shadow-sm hover:shadow-lg transition-all btn-press"
            data-testid="view-history-button"
          >
            View Full History
          </button>
          
          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full bg-[#BC4749]/10 text-[#BC4749] border-2 border-[#BC4749]/30 rounded-full px-6 py-4 font-semibold shadow-sm hover:shadow-lg hover:bg-[#BC4749]/20 transition-all btn-press disabled:opacity-50"
            data-testid="signout-button"
            aria-label="Sign out from account"
          >
            <div className="flex items-center justify-center gap-2">
              <LogOut size={20} />
              <span>{signingOut ? 'Signing Out...' : 'Sign Out'}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
