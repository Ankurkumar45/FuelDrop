import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser } from './store/authSlice';

import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';

// Placeholder pages — replace with full components in Phase 2+
const SeekerHome = () => <div className="p-8 text-2xl font-bold">🗺️ Seeker Home — Phase 2 coming soon</div>;
const PumpDashboard = () => <div className="p-8 text-2xl font-bold">⛽ Pump Dashboard — Phase 2 coming soon</div>;
const AgentDashboard = () => <div className="p-8 text-2xl font-bold">🛵 Agent Dashboard — Phase 2 coming soon</div>;

export default function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  // On app load, if a token exists, verify it and refresh user data
  useEffect(() => {
    if (token) dispatch(loadUser());
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes — role specific */}
        <Route path="/home" element={
          <ProtectedRoute role="seeker">
            <SeekerHome />
          </ProtectedRoute>
        } />

        <Route path="/pump-dashboard" element={
          <ProtectedRoute role="pump_owner">
            <PumpDashboard />
          </ProtectedRoute>
        } />

        <Route path="/agent-dashboard" element={
          <ProtectedRoute role="delivery_agent">
            <AgentDashboard />
          </ProtectedRoute>
        } />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}