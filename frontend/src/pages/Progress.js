import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Progress = () => {
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await axios.get(`${API}/progress`);
      const points = response.data.progress_points || [];
      
      // Format data for chart
      const chartData = points.map(point => ({
        date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        healthScore: point.health_score,
        timestamp: new Date(point.date).getTime()
      })).sort((a, b) => a.timestamp - b.timestamp);

      setProgressData(chartData);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTrend = () => {
    if (progressData.length < 2) return null;
    
    const recent = progressData.slice(-5);
    const avgRecent = recent.reduce((sum, p) => sum + p.healthScore, 0) / recent.length;
    
    const older = progressData.slice(-10, -5);
    if (older.length === 0) return null;
    
    const avgOlder = older.reduce((sum, p) => sum + p.healthScore, 0) / older.length;
    
    const diff = avgRecent - avgOlder;
    
    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
  };

  const getTrendIcon = () => {
    const trend = calculateTrend();
    switch (trend) {
      case 'improving':
        return <TrendingUp className="text-[#22c55e]" size={24} />;
      case 'declining':
        return <TrendingDown className="text-[#FF6B35]" size={24} />;
      default:
        return <Minus className="text-[#eab308]" size={24} />;
    }
  };

  const getTrendText = () => {
    const trend = calculateTrend();
    switch (trend) {
      case 'improving':
        return { text: 'Improving', color: '#22c55e', bg: '#22c55e20' };
      case 'declining':
        return { text: 'Needs Attention', color: '#FF6B35', bg: '#FF6B3520' };
      default:
        return { text: 'Stable', color: '#eab308', bg: '#eab30820' };
    }
  };

  const avgHealthScore = progressData.length > 0 
    ? Math.round(progressData.reduce((sum, p) => sum + p.healthScore, 0) / progressData.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#1A4D2E] text-lg">Loading progress...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-6 pt-8 max-w-md mx-auto animate-in">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[#1A4D2E] mb-4"
          data-testid="back-to-dashboard-button"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back</span>
        </button>
        <h1 
          className="text-4xl md:text-5xl font-bold tracking-tight mb-2" 
          style={{ fontFamily: 'Playfair Display, serif', color: '#1A4D2E' }}
          data-testid="progress-title"
        >
          Plant Progress
        </h1>
        <p className="text-base text-[#5A5A5A]" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Track your plant health over time
        </p>
      </div>

      {progressData.length === 0 ? (
        <div 
          className="bg-white rounded-3xl p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#1A4D2E]/5 text-center"
          data-testid="empty-progress"
        >
          <p className="text-base text-[#5A5A5A] mb-4">
            No progress data yet. Start scanning plants to track their health!
          </p>
          <button
            onClick={() => navigate('/upload')}
            className="bg-[#1A4D2E] text-white rounded-full px-6 py-3 font-medium btn-primary"
            data-testid="start-scanning-button"
          >
            Start Scanning
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div 
              className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#1A4D2E]/5"
              data-testid="avg-health-card"
            >
              <div className="text-xs font-medium uppercase tracking-wide text-[#888888] mb-2">
                Avg Health
              </div>
              <div 
                className="text-3xl font-bold"
                style={{ color: '#1A4D2E', fontFamily: 'Playfair Display, serif' }}
              >
                {avgHealthScore}%
              </div>
            </div>

            <div 
              className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#1A4D2E]/5"
              data-testid="trend-card"
            >
              <div className="text-xs font-medium uppercase tracking-wide text-[#888888] mb-2">
                Trend
              </div>
              <div className="flex items-center gap-2">
                {getTrendIcon()}
                <span 
                  className="text-sm font-medium px-2 py-1 rounded-full"
                  style={{ 
                    backgroundColor: getTrendText().bg,
                    color: getTrendText().color
                  }}
                >
                  {getTrendText().text}
                </span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div 
            className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#1A4D2E]/5"
            data-testid="health-chart"
          >
            <h3 
              className="text-lg font-semibold mb-6" 
              style={{ color: '#1A4D2E', fontFamily: 'Playfair Display, serif' }}
            >
              Health Score Over Time
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={progressData}>
                <defs>
                  <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A4D2E" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1A4D2E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8F5E9" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: '#888888' }}
                  stroke="#E8F5E9"
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#888888' }}
                  stroke="#E8F5E9"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E8F5E9',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="healthScore" 
                  stroke="#1A4D2E" 
                  strokeWidth={3}
                  fill="url(#colorHealth)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Color Indicators Legend */}
          <div 
            className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#1A4D2E]/5"
            data-testid="health-legend"
          >
            <h3 
              className="text-lg font-semibold mb-4" 
              style={{ color: '#1A4D2E', fontFamily: 'Playfair Display, serif' }}
            >
              Health Indicators
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#22c55e' }} />
                <span className="text-sm text-[#5A5A5A]">Excellent (80-100)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#84cc16' }} />
                <span className="text-sm text-[#5A5A5A]">Good (60-79)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#eab308' }} />
                <span className="text-sm text-[#5A5A5A]">Fair (40-59)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#f97316' }} />
                <span className="text-sm text-[#5A5A5A]">Poor (20-39)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                <span className="text-sm text-[#5A5A5A]">Critical (0-19)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Progress;
