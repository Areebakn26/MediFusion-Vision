import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
    const { user, loading } = useAuth();

    // Don't block - if loading, just show children (they'll handle their own loading)
    // Only redirect if we're sure there's no user
    if (!loading && !user) {
        return <Navigate to="/login" />;
    }

    // Check role if specified
    if (!loading && user && role && user.role !== role) {
        return <Navigate to="/" />;
    }

    // Always render children - never show blocking screen
    return children;
};

export default ProtectedRoute;
