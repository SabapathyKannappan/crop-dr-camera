import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Camera, Leaf, TrendingUp, Calendar, ChevronRight } from 'lucide-react';
import { authService } from '../utils/auth';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch data whenever we navigate to home page or auth changes
    // Force refetch to ensure fresh data after sign-in
    fetchDashboardData();
    
    // Clear any stale state
    return () => {
      // Cleanup function
    };
  }, [location.pathname]);
  
  useEffect(() => {
    // Refresh data when page becomes visible (user returns from other tabs)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchDashboardData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const [profileRes, diagnosesRes] = await Promise.all([
        axios.get(`${API}/profile`, { headers: authService.getAuthHeaders() }),
        axios.get(`${API}/diagnoses`, { headers: authService.getAuthHeaders() })
      ]);
      
      setProfile(profileRes.data);
      setRecentScans(diagnosesRes.data.slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (score) => {
    if (score >= 80) return '#344E41';
    if (score >= 60) return '#588157';
    if (score >= 40) return '#A3B18A';
    return '#D4A373';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite">
        <div className="text-[#344E41] text-lg font-medium loading-pulse">Loading your garden...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6" role="alert">
        <div className="text-[#BC4749] text-lg font-medium mb-4">{error}</div>
        <button
          onClick={fetchDashboardData}
          className="bg-[#344E41] text-white rounded-full px-6 py-3 font-medium btn-press"
          aria-label="Retry loading dashboard"
        >
          Retry
        </button>
      </div>
    );
  }

  const avgHealth = recentScans.length > 0
    ? Math.round(recentScans.reduce((sum, s) => sum + s.health_score, 0) / recentScans.length)
    : 0;

  return (
    <div className="min-h-screen pb-nav animate-grow">
      {/* Hero Header - Responsive */}
      <header 
        className="relative min-h-[280px] sm:min-h-[320px] md:min-h-[360px] bg-cover bg-center overflow-hidden"
        style={{ 
          backgroundImage: 'url(https://images.unsplash.com/photo-1626965556132-43d76de1004f?crop=entropy&cs=srgb&fm=jpg&q=85)',
        }}
        role="banner"
      >
        {/* Green overlay */}
        <div className="absolute inset-0 bg-[#344E41]/75"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#588157]/30 via-[#344E41]/60 to-[#344E41]/95"></div>
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
          aria-hidden="true"
        ></div>
        
        {/* Centered Logo - Column Layout */}
        <div className="relative h-full flex flex-col items-center justify-center px-4 py-8 sm:px-6 md:px-8">
          <div className="bg-white/98 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
            <img 
              src="https://customer-assets.emergentagent.com/job_leaf-remedy/artifacts/h49aefpj_ad2f1414-609a-4818-a5e0-b8e259b77e48.png" 
              alt="Plant Doctor Camera Logo" 
              className="h-20 sm:h-24 md:h-32 w-auto"
              data-testid="app-logo"
            />
          </div>
          <p className="text-white text-base sm:text-lg md:text-xl font-semibold text-center max-w-md px-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Your digital greenhouse companion
          </p>
        </div>
      </header>

      {/* Content Container */}
      <main className="px-4 sm:px-6 md:px-8 max-w-2xl mx-auto">
        {/* Primary CTA - Touch-friendly */}
        <section className="mt-6 sm:mt-8 mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/scan')}
            className="w-full bg-[#344E41] text-white rounded-full px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold shadow-[0_10px_40px_-10px_rgba(52,78,65,0.3)] hover:shadow-[0_20px_50px_-10px_rgba(52,78,65,0.4)] transition-all duration-300 btn-press min-h-[56px]"
            style={{ fontFamily: 'Manrope, sans-serif' }}
            aria-label="Scan Your Plant Now - Primary Action"
            data-testid="quick-scan-button"
          >
            <div className="flex items-center justify-center gap-3">
              <Camera size={24} aria-hidden="true" />
              <span>Scan Your Plant Now</span>
            </div>
          </button>
        </section>

        {/* Stats Grid - Responsive Columns */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8" aria-label="Health Statistics">
          {/* Avg Health */}
          <div 
            className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-[#A3B18A]/20 card-lift"
            data-testid="avg-health-card"
          >
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Leaf className="text-[#344E41]" size={16} aria-hidden="true" />
              <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-[#A3B18A]">
                Avg Health
              </span>
            </div>
            <div 
              className="text-3xl sm:text-4xl font-bold mb-1"
              style={{ color: getHealthColor(avgHealth), fontFamily: 'Playfair Display, serif' }}
              aria-label={`Average health ${avgHealth} percent`}
            >
              {avgHealth}%
            </div>
            <p className="text-xs sm:text-sm text-[#588157]">Looking good!</p>
          </div>

          {/* Active Plans */}
          <div 
            className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-[#A3B18A]/20 card-lift"
            data-testid="active-plans-card"
          >
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Calendar className="text-[#D4A373]" size={16} aria-hidden="true" />
              <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-[#A3B18A]">
                Active Plans
              </span>
            </div>
            <div 
              className="text-3xl sm:text-4xl font-bold mb-1"
              style={{ color: '#344E41', fontFamily: 'Playfair Display, serif' }}
              aria-label={`${profile?.active_care_plans || 0} active care plans`}
            >
              {profile?.active_care_plans || 0}
            </div>
            <p className="text-xs sm:text-sm text-[#588157]">In progress</p>
          </div>

          {/* Total Scans */}
          <div 
            className="col-span-2 bg-[#A3B18A]/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-[#A3B18A]/20"
            data-testid="total-scans-card"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="text-[#588157]" size={16} aria-hidden="true" />
                  <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-[#588157]">
                    Total Plants Scanned
                  </span>
                </div>
                <div 
                  className="text-2xl sm:text-3xl font-bold"
                  style={{ color: '#344E41', fontFamily: 'Playfair Display, serif' }}
                  aria-label={`${profile?.total_diagnoses || 0} total plants scanned`}
                >
                  {profile?.total_diagnoses || 0}
                </div>
              </div>
              <div className="text-3xl sm:text-4xl" aria-hidden="true">🌱</div>
            </div>
          </div>
        </section>

        {/* Recent Scans */}
        {recentScans.length > 0 ? (
          <section className="mb-8" aria-labelledby="recent-scans-heading">
            <div className="flex justify-between items-center mb-4">
              <h2 
                id="recent-scans-heading"
                className="text-xl sm:text-2xl font-semibold" 
                style={{ color: '#344E41', fontFamily: 'Playfair Display, serif' }}
              >
                Recent Scans
              </h2>
              <button
                onClick={() => navigate('/history')}
                className="text-sm font-medium text-[#588157] flex items-center gap-1 hover:gap-2 transition-all min-h-[44px]"
                aria-label="View all scan history"
                data-testid="view-all-button"
              >
                <span>View All</span>
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {recentScans.map((scan) => (
                <article
                  key={scan.id}
                  onClick={() => navigate(`/results/${scan.id}`)}
                  className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-sm border border-[#A3B18A]/20 card-lift cursor-pointer"
                  data-testid={`recent-scan-${scan.id}`}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && navigate(`/results/${scan.id}`)}
                  aria-label={`View ${scan.plant_name} scan results`}
                >
                  <div className="flex gap-3 sm:gap-4">
                    <img
                      src={`data:image/jpeg;base64,${scan.image_data}`}
                      alt={`${scan.plant_name} scan image`}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="font-semibold text-base sm:text-lg mb-1 truncate" 
                        style={{ color: '#344E41', fontFamily: 'Playfair Display, serif' }}
                      >
                        {scan.plant_name}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#588157] mb-2 truncate">{scan.disease_name}</p>
                      <div 
                        className="text-xs font-mono px-2 py-1 rounded-full text-white inline-block"
                        style={{ backgroundColor: getHealthColor(scan.health_score) }}
                        aria-label={`Health score ${scan.health_score} percent`}
                      >
                        {scan.health_score}% Health
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section 
            className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 shadow-sm border border-[#A3B18A]/20 text-center mb-8"
            data-testid="empty-state"
            role="status"
          >
            <div className="text-5xl sm:text-6xl mb-4" aria-hidden="true">🌿</div>
            <h3 
              className="text-lg sm:text-xl font-semibold mb-2" 
              style={{ color: '#344E41', fontFamily: 'Playfair Display, serif' }}
            >
              No plants scanned yet
            </h3>
            <p className="text-[#588157] mb-6 text-sm sm:text-base">
              Start your plant care journey by scanning your first plant!
            </p>
            <button
              onClick={() => navigate('/scan')}
              className="bg-[#344E41] text-white rounded-full px-6 py-3 font-medium shadow-lg hover:shadow-xl transition-all btn-press min-h-[48px]"
              aria-label="Scan your first plant"
              data-testid="empty-state-scan-button"
            >
              Scan Now
            </button>
          </section>
        )}
      </main>
    </div>
  );
};

export default Home;
