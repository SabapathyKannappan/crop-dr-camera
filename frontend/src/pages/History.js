import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Trash2, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../utils/api';

const History = () => {
  const navigate = useNavigate();
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await apiClient.get('/diagnoses', {
        timeout: 10000,
      });
      
      // Validate response
      if (Array.isArray(response.data)) {
        setDiagnoses(response.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      setError(error.response?.data?.detail || 'Failed to load history');
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, plantName, e) => {
    e.stopPropagation();
    
    // Prevent multiple deletes
    if (deletingId) {
      return;
    }
    
    // Confirm deletion
    if (!window.confirm(`Delete "${plantName}" scan?\n\nThis action cannot be undone.`)) {
      return;
    }

    // Set deleting state
    setDeletingId(id);
    
    try {
      // Send delete request to backend with proper ID
      await apiClient.delete(`/diagnoses/${id}`, {
        timeout: 5000,
      });
      
      // Immediately remove from frontend state (optimistic update)
      setDiagnoses(prevDiagnoses => prevDiagnoses.filter(d => d.id !== id));
      
      // Show success message
      toast.success(`"${plantName}" scan deleted successfully`, {
        duration: 3000,
      });
      
      // Re-fetch all data to update counters
      // This ensures Total Scans and Active Plans are correct
      setTimeout(() => {
        fetchHistory();
      }, 500);
      
    } catch (error) {
      console.error('Error deleting diagnosis:', error);
      
      // Handle specific error cases
      let errorMessage = 'Failed to delete scan';
      
      if (error.response?.status === 404) {
        errorMessage = 'Scan not found or already deleted';
        // Remove from state anyway since it doesn't exist
        setDiagnoses(prevDiagnoses => prevDiagnoses.filter(d => d.id !== id));
        // Still refresh to update counters
        setTimeout(() => {
          fetchHistory();
        }, 500);
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to delete this scan';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Delete request timed out. Please try again.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      toast.error(errorMessage, {
        duration: 4000,
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getHealthColor = (score) => {
    if (score >= 80) return '#344E41';
    if (score >= 60) return '#588157';
    if (score >= 40) return '#A3B18A';
    return '#D4A373';
  };

  const groupByDate = (diagnoses) => {
    const groups = {};
    diagnoses.forEach(diagnosis => {
      const date = new Date(diagnosis.timestamp).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(diagnosis);
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite">
        <div className="text-[#344E41] text-lg font-medium loading-pulse">Loading history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pb-32 px-6 pt-20 animate-grow">
        <div className="max-w-md mx-auto">
          <div 
            className="bg-[#BC4749]/10 border border-[#BC4749]/30 rounded-3xl p-8 text-center"
            role="alert"
          >
            <div className="text-5xl mb-4">⚠️</div>
            <h2 
              className="text-xl font-semibold mb-3" 
              style={{ color: '#BC4749', fontFamily: 'Playfair Display, serif' }}
            >
              Failed to Load History
            </h2>
            <p className="text-[#588157] mb-6">{error}</p>
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="bg-[#344E41] text-white rounded-full px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all btn-press disabled:opacity-50 min-h-[48px]"
              aria-label="Retry loading history"
            >
              {loading ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const groupedDiagnoses = groupByDate(diagnoses);

  return (
    <div className="min-h-screen pb-nav animate-grow">
      {/* Header */}
      <div className="bg-[#344E41] text-white px-6 pt-8 pb-6">
        <h1 
          className="text-3xl font-bold mb-2" 
          style={{ fontFamily: 'Playfair Display, serif' }}
          data-testid="history-title"
        >
          Your Private History
        </h1>
        <div className="flex items-center gap-2 text-white/80 text-sm">
          <Lock size={14} />
          <span>Only visible to you • Private by default</span>
        </div>
      </div>

      <div className="px-6 mt-6">
        {/* Stats Summary */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#A3B18A]/20 mb-6">
          <div className="text-center">
            <div className="text-4xl font-bold mb-1" style={{ color: '#344E41', fontFamily: 'Playfair Display, serif' }}>
              {diagnoses.length}
            </div>
            <p className="text-[#588157] text-sm">
              {diagnoses.length === 1 ? 'plant scanned' : 'plants scanned'}
            </p>
          </div>
        </div>

        {/* History List */}
        {diagnoses.length === 0 ? (
          <div 
            className="bg-white rounded-3xl p-12 shadow-sm border border-[#A3B18A]/20 text-center"
            data-testid="empty-history"
          >
            <div className="text-6xl mb-4">🌿</div>
            <h3 
              className="text-xl font-semibold mb-2" 
              style={{ color: '#344E41', fontFamily: 'Playfair Display, serif' }}
            >
              No scans yet
            </h3>
            <p className="text-[#588157] mb-6">
              Your private scan history will appear here
            </p>
            <button
              onClick={() => navigate('/scan')}
              className="bg-[#344E41] text-white rounded-full px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all btn-press"
              data-testid="empty-scan-button"
            >
              Scan Your First Plant
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedDiagnoses).map(([date, items]) => (
              <div key={date}>
                <h2 
                  className="text-lg font-semibold mb-4" 
                  style={{ color: '#344E41', fontFamily: 'Playfair Display, serif' }}
                >
                  {date}
                </h2>
                <div className="space-y-4">
                  {items.map((diagnosis) => (
                    <div
                      key={diagnosis.id}
                      onClick={() => navigate(`/results/${diagnosis.id}`)}
                      className="bg-white rounded-3xl p-4 shadow-sm border border-[#A3B18A]/20 card-lift cursor-pointer"
                      data-testid={`history-item-${diagnosis.id}`}
                    >
                      <div className="flex gap-4">
                        <img
                          src={`data:image/jpeg;base64,${diagnosis.image_data}`}
                          alt={diagnosis.plant_name}
                          className="w-24 h-24 rounded-2xl object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 
                            className="font-bold text-lg mb-1 truncate" 
                            style={{ color: '#344E41', fontFamily: 'Playfair Display, serif' }}
                          >
                            {diagnosis.plant_name}
                          </h3>
                          <p className="text-sm text-[#588157] mb-2 truncate italic">
                            {diagnosis.disease_name}
                          </p>
                          <div className="flex items-center gap-2 mb-2">
                            <div 
                              className="text-xs font-mono px-3 py-1 rounded-full text-white font-semibold"
                              style={{ backgroundColor: getHealthColor(diagnosis.health_score) }}
                            >
                              {diagnosis.health_score}%
                            </div>
                          </div>
                          <p className="text-xs text-[#A3B18A]">
                            {new Date(diagnosis.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <button
                            onClick={(e) => handleDelete(diagnosis.id, diagnosis.plant_name, e)}
                            disabled={deletingId === diagnosis.id}
                            className="p-2 hover:bg-[#BC4749]/10 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center"
                            data-testid={`delete-button-${diagnosis.id}`}
                            aria-label={`Delete ${diagnosis.plant_name} scan`}
                          >
                            {deletingId === diagnosis.id ? (
                              <Loader2 className="text-[#BC4749] animate-spin" size={18} aria-hidden="true" />
                            ) : (
                              <Trash2 className="text-[#BC4749]" size={18} aria-hidden="true" />
                            )}
                          </button>
                          <ChevronRight className="text-[#A3B18A]" size={20} aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
