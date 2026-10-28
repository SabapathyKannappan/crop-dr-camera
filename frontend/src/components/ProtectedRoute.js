import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children, isAuthenticated }) => {
  if (isAuthenticated === false) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

export default ProtectedRoute;
