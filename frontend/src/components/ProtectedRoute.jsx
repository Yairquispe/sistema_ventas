import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly) {
    const isAdmin = user.rol === 'ADMIN' || user.rol === 'admin' || user.rol === 'Administrador';
    if (!isAdmin) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'calc(100vh - 64px)',
          marginTop: '64px',
          color: '#666'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🚫</div>
          <h2 style={{ color: '#f44336', marginBottom: '8px' }}>Acceso denegado</h2>
          <p>No tienes permisos para acceder a esta sección.</p>
        </div>
      );
    }
  }

  return children;
}

export default ProtectedRoute;
