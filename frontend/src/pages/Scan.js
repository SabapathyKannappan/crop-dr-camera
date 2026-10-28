import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, Sparkles, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../utils/api';

// Image validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const Scan = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const validateImage = (file) => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Please select a valid image file (JPEG, PNG, or WEBP)';
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return 'Image size must be less than 10MB';
    }
    
    return null;
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Reset error
    setUploadError(null);
    
    // Validate image
    const error = validateImage(file);
    if (error) {
      setUploadError(error);
      toast.error(error);
      return;
    }
    
    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file');
      toast.error('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    setAnalyzing(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Show loading toast with specific ID
      const toastId = toast.loading('Analyzing your plant...', { 
        duration: Infinity,
        id: 'plant-analysis'
      });
      
      const response = await apiClient.post('/diagnose', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000
      });

      // Dismiss loading toast and show success
      toast.dismiss(toastId);
      toast.success('Analysis complete!', { 
        duration: 3000,
        id: 'analysis-success'
      });
      
      // Navigate to results after short delay
      setTimeout(() => {
        navigate(`/results/${response.data.id}`);
      }, 500);
      
    } catch (error) {
      console.error('Error analyzing:', error);
      
      // Dismiss loading toast
      toast.dismiss('plant-analysis');
      
      let errorMessage = 'Failed to analyze. Please try again.';
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.detail || 'Invalid image format';
      }
      
      toast.error(errorMessage, { 
        duration: 4000,
        id: 'analysis-error'
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen pb-nav animate-grow">
      {/* Header */}
      <header className="bg-[#344E41] text-white px-4 sm:px-6 pt-6 sm:pt-8 pb-5 sm:pb-6">
        <h1 
          className="text-2xl sm:text-3xl font-bold mb-2" 
          style={{ fontFamily: 'Playfair Display, serif' }}
          data-testid="scan-title"
        >
          Scan Your Plant
        </h1>
        <p className="text-white/80 text-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Take or upload a clear photo of your plant's leaves
        </p>
      </header>

      <main className="px-4 sm:px-6 max-w-2xl mx-auto">
        {!preview ? (
          /* Upload Area - Mobile-first */
          <section className="mt-6 space-y-4 sm:space-y-6">
            {uploadError && (
              <div 
                className="bg-[#BC4749]/10 border border-[#BC4749]/30 rounded-2xl p-4 flex items-start gap-3"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle className="text-[#BC4749] flex-shrink-0" size={20} aria-hidden="true" />
                <p className="text-sm text-[#BC4749]">{uploadError}</p>
              </div>
            )}
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full bg-white rounded-2xl sm:rounded-3xl p-12 sm:p-16 shadow-sm border-2 border-dashed border-[#A3B18A] card-lift overflow-hidden min-h-[300px] sm:min-h-[350px]"
              disabled={analyzing}
              aria-label="Select or capture plant image"
              data-testid="upload-area"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: 'url(https://images.unsplash.com/photo-1694198598050-488edcbf5a89?crop=entropy&cs=srgb&fm=jpg&q=85)',
                }}
                aria-hidden="true"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#344E41]/70 to-[#344E41]/90"></div>
              
              <div className="relative text-center text-white">
                <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 sm:mb-6 animate-breathe">
                  <Camera className="text-white" size={36} aria-hidden="true" />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Capture or Upload
                </h2>
                <p className="text-white/90 mb-4 sm:mb-6 text-sm">
                  Take a photo or choose from your gallery
                </p>
                <div className="flex justify-center gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <Upload size={14} aria-hidden="true" />
                    <span>JPG, PNG, WEBP</span>
                  </div>
                  <div className="text-white/70">Max 10MB</div>
                </div>
              </div>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              disabled={analyzing}
              aria-label="File input for plant image"
              data-testid="file-input"
            />

            {/* Tips Card */}
            <article className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-[#A3B18A]/20">
              <h3 
                className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2" 
                style={{ color: '#344E41', fontFamily: 'Playfair Display, serif' }}
              >
                <Sparkles size={18} aria-hidden="true" />
                <span>Tips for Best Results</span>
              </h3>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-[#588157]">
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="text-[#344E41] font-bold flex-shrink-0">•</span>
                  <span>Use natural daylight for clearer images</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="text-[#344E41] font-bold flex-shrink-0">•</span>
                  <span>Focus on affected leaves showing symptoms</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="text-[#344E41] font-bold flex-shrink-0">•</span>
                  <span>Ensure the image is sharp and not blurry</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="text-[#344E41] font-bold flex-shrink-0">•</span>
                  <span>Fill the frame with the plant for better detection</span>
                </li>
              </ul>
            </article>
          </section>
        ) : (
          /* Preview & Analyze - Mobile-optimized */
          <section className="mt-6 space-y-4 sm:space-y-6">
            <div 
              className="relative bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-sm border border-[#A3B18A]/20"
              data-testid="preview-container"
            >
              <img
                src={preview}
                alt="Preview of selected plant image"
                className="w-full h-auto rounded-xl sm:rounded-2xl"
              />
              <button
                onClick={handleClear}
                disabled={analyzing}
                className="absolute top-4 sm:top-6 right-4 sm:right-6 bg-white/95 backdrop-blur-sm p-2 sm:p-3 rounded-full shadow-lg hover:bg-white transition-all disabled:opacity-50 min-w-[44px] min-h-[44px]"
                aria-label="Clear selected image"
                data-testid="clear-preview-button"
              >
                <X size={20} className="text-[#344E41]" aria-hidden="true" />
              </button>
            </div>

            {/* Primary Action - Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full bg-[#344E41] text-white rounded-full px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold shadow-[0_10px_40px_-10px_rgba(52,78,65,0.3)] hover:shadow-[0_20px_50px_-10px_rgba(52,78,65,0.4)] transition-all duration-300 btn-press disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px]"
              aria-label={analyzing ? 'Analyzing plant, please wait' : 'Analyze plant image'}
              aria-busy={analyzing}
              data-testid="analyze-button"
            >
              {analyzing ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                  <span>Analyzing Plant...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <Sparkles size={24} aria-hidden="true" />
                  <span>Analyze Plant</span>
                </div>
              )}
            </button>
            
            {analyzing && (
              <p className="text-center text-sm text-[#588157]" role="status" aria-live="polite">
                This may take up to 60 seconds...
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default Scan;
