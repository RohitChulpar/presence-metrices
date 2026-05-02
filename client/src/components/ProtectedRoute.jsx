import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  // 1. If no token, send them back to Login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. If they have a token but the wrong role (e.g., employee trying to see manager stats)
  if (allowedRole && userRole !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}