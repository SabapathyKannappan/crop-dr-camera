import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "@/App.css";
import SignIn from "./pages/SignIn";
import Home from "./pages/Home";
import Scan from "./pages/Scan";
import Results from "./pages/Results";
import History from "./pages/History";
import Profile from "./pages/Profile";
import FloatingDock from "./components/FloatingDock";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";
import { authService } from "./utils/auth";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = checking, true/false = checked
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  useEffect(() => {
    // Clean authentication check on app load
    const checkAuth = async () => {
      const hasAuth = authService.isAuthenticated();
      
      if (hasAuth) {
        // Verify auth is still valid with backend
        const isValid = await authService.refreshAuth();
        setIsAuthenticated(isValid);
      } else {
        setIsAuthenticated(false);
      }
      
      setAuthCheckComplete(true);
    };
    
    checkAuth();
  }, []);
  
  // Listen for auth changes (sign-in/sign-out)
  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(authService.isAuthenticated());
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-tab auth changes
    const handleAuthChange = (e) => {
      setIsAuthenticated(e.detail.isAuthenticated);
    };
    window.addEventListener('authStateChanged', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

  // Show loading while checking auth
  if (!authCheckComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#F9F9F7' }}>
        <div className="text-[#344E41] text-lg font-medium loading-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen paper-texture" style={{ background: '#F9F9F7' }}>
      {/* Made with Emergent Badge - Always visible */}
      <a
        href="https://emergent.sh"
        target="_blank"
        rel="noopener noreferrer"
        className="emergent-badge text-xs font-medium"
        style={{ color: '#344E41' }}
        aria-label="Made with Emergent"
      >
        <span className="flex items-center gap-2">
          <span>Made with</span>
          <span className="font-bold" style={{ color: '#588157' }}>Emergent</span>
        </span>
      </a>
      
      <BrowserRouter>
        <Routes>
          {/* Public route */}
          <Route 
            path="/signin" 
            element={isAuthenticated ? <Navigate to="/" replace /> : <SignIn onAuthChange={(auth) => setIsAuthenticated(auth)} />} 
          />
          
          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scan"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Scan />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results/:id"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Results />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Profile onSignOut={() => setIsAuthenticated(false)} />
              </ProtectedRoute>
            }
          />
          
          {/* Catch all */}
          <Route 
            path="*" 
            element={<Navigate to={isAuthenticated ? "/" : "/signin"} replace />} 
          />
        </Routes>
        
        {/* Only show navigation if authenticated */}
        {isAuthenticated && <FloatingDock />}
      </BrowserRouter>
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}

export default App;
