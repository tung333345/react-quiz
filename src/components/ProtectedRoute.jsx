import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './content/AuthContent';
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" />;
  }

  return children;
}

export default ProtectedRoute;