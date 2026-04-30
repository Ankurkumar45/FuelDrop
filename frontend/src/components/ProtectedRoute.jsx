import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ children, role }) {
    const { user, token } = useSelector((state) => state.auth);

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (role && user.role !== role) {
        if (user.role === 'pump_owner') return <Navigate to="/pump-dashboard" replace />;
        return <Navigate to="/home" replace />;
    }

    return children;
}