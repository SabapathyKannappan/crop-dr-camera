import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Camera, Clock, User, Heart } from 'lucide-react';

export const FloatingDock = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav 
      className="fixed bottom-nav-safe left-0 right-0 z-50 pb-safe"
      role="navigation"
      aria-label="Main navigation"
      data-testid="floating-dock-navigation"
    >
      <div className="mx-auto max-w-md px-4 pb-2">
        <div className="floating-dock rounded-full shadow-[0_10px_40px_-10px_rgba(52,78,65,0.2)] px-4 py-3">
          <div className="flex items-center justify-around gap-2">
            {/* Home */}
            <button
              onClick={() => navigate('/')}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 min-w-[60px] py-2 rounded-2xl ${
                isActive('/') ? 'text-[#344E41] bg-[#A3B18A]/10' : 'text-[#A3B18A]'
              }`}
              aria-label="Home - Health Status"
              aria-current={isActive('/') ? 'page' : undefined}
              data-testid="dock-home-button"
            >
              <Heart size={24} fill={isActive('/') ? '#344E41' : 'none'} aria-hidden="true" />
              <span className="text-[10px] font-medium">Health</span>
            </button>

            {/* Scan - Elevated & Touch-friendly */}
            <button
              onClick={() => navigate('/scan')}
              className="flex items-center justify-center scan-btn-elevated bg-[#344E41] text-white p-4 rounded-full transition-all duration-300 hover:shadow-xl btn-press min-w-[64px] min-h-[64px]"
              aria-label="Scan Plant - Primary Action"
              data-testid="dock-scan-button"
            >
              <Camera size={32} aria-hidden="true" />
            </button>

            {/* History */}
            <button
              onClick={() => navigate('/history')}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 min-w-[60px] py-2 rounded-2xl ${
                isActive('/history') ? 'text-[#344E41] bg-[#A3B18A]/10' : 'text-[#A3B18A]'
              }`}
              aria-label="History - Your Private Scans"
              aria-current={isActive('/history') ? 'page' : undefined}
              data-testid="dock-history-button"
            >
              <Clock size={24} aria-hidden="true" />
              <span className="text-[10px] font-medium">History</span>
            </button>

            {/* Profile */}
            <button
              onClick={() => navigate('/profile')}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 min-w-[60px] py-2 rounded-2xl ${
                isActive('/profile') ? 'text-[#344E41] bg-[#A3B18A]/10' : 'text-[#A3B18A]'
              }`}
              aria-label="Profile - Your Settings"
              aria-current={isActive('/profile') ? 'page' : undefined}
              data-testid="dock-profile-button"
            >
              <User size={24} aria-hidden="true" />
              <span className="text-[10px] font-medium">Profile</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default FloatingDock;
