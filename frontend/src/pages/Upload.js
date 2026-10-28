import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Camera, Upload as UploadIcon, Image as ImageIcon, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Upload = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post(`${API}/diagnose`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Diagnosis completed!');
      navigate(`/diagnosis/${response.data.id}`);
    } catch (error) {
      console.error('Error uploading:', error);
      toast.error('Failed to analyze image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 px-6 pt-8 max-w-md mx-auto animate-in">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[#1A4D2E] mb-4"
          data-testid="back-button"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back</span>
        </button>
        <h1 
          className="text-4xl md:text-5xl font-bold tracking-tight mb-2" 
          style={{ fontFamily: 'Playfair Display, serif', color: '#1A4D2E' }}
          data-testid="upload-title"
        >
          Scan Your Plant
        </h1>
        <p className="text-base text-[#5A5A5A]" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Take or upload a clear photo of your plant's leaves
        </p>
      </div>

      {/* Upload Area */}
      <div className="space-y-6">
        {!preview ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="bg-white rounded-3xl p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-2 border-dashed border-[#1A4D2E]/20 cursor-pointer card-hover"
            data-testid="upload-area"
          >
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center mb-6">
                <Camera className="text-[#1A4D2E]" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#1A4D2E' }}>
                Upload Plant Photo
              </h3>
              <p className="text-sm text-[#5A5A5A] mb-6">
                Click to select a photo from your device
              </p>
              <div className="flex justify-center gap-4">
                <div className="flex items-center gap-2 text-sm text-[#888888]">
                  <ImageIcon size={16} />
                  <span>JPG, PNG, WEBP</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div 
              className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#1A4D2E]/5"
              data-testid="preview-container"
            >
              <img
                src={preview}
                alt="Preview"
                className="w-full h-auto rounded-2xl"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                }}
                className="flex-1 bg-[#E8F5E9] text-[#1A4D2E] rounded-full px-6 py-4 font-medium transition-all hover:bg-[#d0e8d2]"
                data-testid="change-photo-button"
              >
                Change Photo
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 bg-[#1A4D2E] text-white rounded-full px-6 py-4 font-medium btn-primary shadow-lg hover:shadow-xl disabled:opacity-50"
                data-testid="analyze-button"
              >
                {uploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={20} />
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  'Analyze Plant'
                )}
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          data-testid="file-input"
        />

        {/* Tips */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#1A4D2E]/5">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#1A4D2E', fontFamily: 'Playfair Display, serif' }}>
            Tips for Best Results
          </h3>
          <ul className="space-y-3 text-sm text-[#5A5A5A]">
            <li className="flex items-start gap-3">
              <span className="text-[#1A4D2E] font-bold">•</span>
              <span>Take photos in natural daylight for best accuracy</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#1A4D2E] font-bold">•</span>
              <span>Focus on affected leaves or areas showing symptoms</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#1A4D2E] font-bold">•</span>
              <span>Ensure the image is clear and not blurry</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#1A4D2E] font-bold">•</span>
              <span>Fill the frame with the plant for better detection</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Upload;
