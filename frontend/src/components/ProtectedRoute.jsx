import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '../routes';
import { useAuth } from '../context/useAuth';

export default function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, checkingSession } = useAuth();

  if (checkingSession) {
    return (
      <section className="ttt-section" style={{ textAlign: 'center', paddingTop: 90, paddingBottom: 120 }}>
        <h1 style={{ fontWeight: 600, fontSize: 34 }}>Verification de votre session...</h1>
      </section>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.auth} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
