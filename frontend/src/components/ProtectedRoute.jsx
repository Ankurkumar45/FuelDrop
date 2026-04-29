import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Usage:
//   <ProtectedRoute>          — any logged-in user
//   <ProtectedRoute role="pump_owner">  — specific role only
export default function ProtectedRoute({ children, role }) {
    const { user, token } = useSelector((state) => state.auth);

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (role && user.role !== role) {
        // Redirect to the user's correct dashboard instead of login
        if (user.role === 'pump_owner') return <Navigate to="/pump-dashboard" replace />;
        if (user.role === 'delivery_agent') return <Navigate to="/agent-dashboard" replace />;
        return <Navigate to="/home" replace />;
    }

    return children;
}