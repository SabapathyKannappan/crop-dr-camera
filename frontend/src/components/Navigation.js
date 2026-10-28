import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Camera, Clock, TrendingUp } from 'lucide-react';

export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 glass-nav shadow-lg"
      data-testid="bottom-navigation"
    >
      <div className="max-w-md mx-auto px-6 py-4">
        <div className="flex justify-around items-center">
          <button
            onClick={() => navigate('/')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              isActive('/') ? 'text-[#1A4D2E]' : 'text-gray-500'
            }`}
            data-testid="nav-home-button"
          >
            <Home size={24} />
            <span className="text-xs font-medium">Home</span>
          </button>

          <button
            onClick={() => navigate('/upload')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              isActive('/upload') ? 'text-[#1A4D2E]' : 'text-gray-500'
            }`}
            data-testid="nav-camera-button"
          >
            <Camera size={24} />
            <span className="text-xs font-medium">Scan</span>
          </button>

          <button
            onClick={() => navigate('/history')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              isActive('/history') ? 'text-[#1A4D2E]' : 'text-gray-500'
            }`}
            data-testid="nav-history-button"
          >
            <Clock size={24} />
            <span className="text-xs font-medium">History</span>
          </button>

          <button
            onClick={() => navigate('/progress')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              isActive('/progress') ? 'text-[#1A4D2E]' : 'text-gray-500'
            }`}
            data-testid="nav-progress-button"
          >
            <TrendingUp size={24} />
            <span className="text-xs font-medium">Progress</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
