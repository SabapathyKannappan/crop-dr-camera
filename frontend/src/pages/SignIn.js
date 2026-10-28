import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Leaf, Key, Loader2, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../utils/auth';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SignIn = ({ onAuthChange }) => {
  const navigate = useNavigate();
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAutoSignIn = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/signin`, {});
      
      // Store auth code
      authService.setAuthCode(response.data.auth_code);
      
      // Notify parent of auth change
      if (onAuthChange) onAuthChange(true);
      window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { isAuthenticated: true } }));
      
      // Show success message
      toast.success(response.data.message, {
        duration: 5000,
      });
      
      // Small delay then navigate
      setTimeout(() => navigate('/'), 100);
    } catch (error) {
      console.error('Auto sign-in error:', error);
      toast.error('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSignIn = async (e) => {
    e.preventDefault();
    
    if (!code.trim()) {
      toast.error('Please enter your sign-in code');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/signin`, {
        code: code.trim().toUpperCase()
      });
      
      // Store auth code
      authService.setAuthCode(response.data.auth_code);
      
      // Notify parent of auth change
      if (onAuthChange) onAuthChange(true);
      window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { isAuthenticated: true } }));
      
      // Show success message
      toast.success(response.data.message, {
        duration: 4000,
      });
      
      // Small delay then navigate to allow state to update
      setTimeout(() => navigate('/'), 100);
    } catch (error) {
      console.error('Code sign-in error:', error);
      
      if (error.response?.status === 404) {
        toast.error('Sign-in code not found. Please check your code.');
      } else {
        toast.error('Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ background: '#F9F9F7' }}>
      <div className="w-full max-w-md animate-grow">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white/98 backdrop-blur-md rounded-2xl p-6 mb-6 shadow-2xl">
            <img 
              src="https://customer-assets.emergentagent.com/job_leaf-remedy/artifacts/h49aefpj_ad2f1414-609a-4818-a5e0-b8e259b77e48.png" 
              alt="Plant Doctor Camera Logo" 
              className="h-20 w-auto"
              data-testid="signin-logo"
            />
          </div>
          <h1 
            className="text-3xl font-bold mb-2" 
            style={{ color: '#344E41', fontFamily: 'Playfair Display, serif' }}
          >
            Welcome to Plant Doctor
          </h1>
          <p className="text-[#588157] text-base">
            Your personal plant health companion
          </p>
        </div>

        {!showCodeInput ? (
          /* Auto Sign-In */
          <div className="space-y-6">
            <div 
              className="bg-white rounded-3xl p-8 shadow-sm border border-[#A3B18A]/20 text-center"
              data-testid="auto-signin-card"
            >
              <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="text-[#344E41]" size={32} aria-hidden="true" />
              </div>
              <h2 
                className="text-xl font-semibold mb-3" 
                style={{ color: '#344E41', fontFamily: 'Playfair Display, serif' }}
              >
                Get Started
              </h2>
              <p className="text-[#588157] mb-6 text-sm">
                Create a new account with a unique sign-in code that you can use on any device
              </p>
              <button
                onClick={handleAutoSignIn}
                disabled={loading}
                className="w-full bg-[#344E41] text-white rounded-full px-8 py-4 font-semibold shadow-lg hover:shadow-xl transition-all btn-press disabled:opacity-50 min-h-[56px]"
                data-testid="create-account-button"
                aria-label="Create new account"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={20} aria-hidden="true" />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  'Create New Account'
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#A3B18A]/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#F9F9F7] text-[#A3B18A]">or</span>
              </div>
            </div>

            {/* Show Code Input Button */}
            <button
              onClick={() => setShowCodeInput(true)}
              className="w-full bg-white text-[#344E41] border-2 border-[#344E41] rounded-full px-6 py-4 font-semibold shadow-sm hover:shadow-lg transition-all btn-press min-h-[56px]"
              data-testid="show-code-input-button"
              aria-label="Sign in with existing code"
            >
              <div className="flex items-center justify-center gap-2">
                <Key size={20} aria-hidden="true" />
                <span>Already have an account? Enter code</span>
              </div>
            </button>
          </div>
        ) : (
          /* Code Input */
          <form onSubmit={handleCodeSignIn} className="space-y-6">
            <div 
              className="bg-white rounded-3xl p-8 shadow-sm border border-[#A3B18A]/20"
              data-testid="code-signin-card"
            >
              <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="text-[#344E41]" size={32} aria-hidden="true" />
              </div>
              <h2 
                className="text-xl font-semibold mb-3 text-center" 
                style={{ color: '#344E41', fontFamily: 'Playfair Display, serif' }}
              >
                Enter Your Code
              </h2>
              <p className="text-[#588157] mb-6 text-sm text-center">
                Enter your 6-character sign-in code to access your data
              </p>
              
              <div className="mb-6">
                <label htmlFor="signin-code" className="sr-only">Sign-in code</label>
                <input
                  id="signin-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g., V56790"
                  maxLength={6}
                  className="w-full px-6 py-4 text-2xl text-center font-mono font-bold tracking-widest border-2 border-[#A3B18A]/30 rounded-2xl focus:border-[#344E41] focus:outline-none transition-colors"
                  style={{ color: '#344E41' }}
                  disabled={loading}
                  autoFocus
                  data-testid="code-input"
                  aria-label="Enter your 6-character sign-in code"
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-[#344E41] text-white rounded-full px-8 py-4 font-semibold shadow-lg hover:shadow-xl transition-all btn-press disabled:opacity-50 min-h-[56px]"
                data-testid="signin-button"
                aria-label="Sign in with code"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={20} aria-hidden="true" />
                    <span>Signing In...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <LogIn size={20} aria-hidden="true" />
                    <span>Sign In</span>
                  </div>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowCodeInput(false);
                setCode('');
              }}
              className="w-full text-[#588157] font-medium hover:text-[#344E41] transition-colors"
              disabled={loading}
              data-testid="back-button"
              aria-label="Go back to create new account"
            >
              Back to create new account
            </button>
          </form>
        )}

        {/* Privacy Notice */}
        <div className="mt-8 text-center text-xs text-[#A3B18A]">
          <p>
            🔒 Your data is private and secure. Save your sign-in code to access your plant history from any device.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
