import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser } from './store/authSlice';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SeekerHome from './pages/SeekerHome';
import PumpDashboard from './pages/PumpDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import OrderTracking from './pages/OrderTracking';
import AgentDashboard from './pages/AgentDashboard';
import PumpOrders from './components/PumpOrders';
import SosPage from './pages/SosPage';
import OrderCreation from './pages/OrderCreation';

export default function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) dispatch(loadUser());
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

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

        <Route path="/order-tracking" element={
          <ProtectedRoute role="seeker">
            <OrderTracking />
          </ProtectedRoute>
        } />

        <Route path="/order-create" element={
          <ProtectedRoute role="seeker">
            <OrderCreation />
          </ProtectedRoute>
        } />

        <Route path="/sos" element={
          <ProtectedRoute role="seeker">
            <SosPage />
          </ProtectedRoute>
        } />

        <Route path="/agent-dashboard" element={
          <ProtectedRoute role="delivery_agent">
            <AgentDashboard />
          </ProtectedRoute>
        } />

        <Route path="/pump-orders" element={
          <ProtectedRoute role="pump_owner">
            <PumpOrders />
            </ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}