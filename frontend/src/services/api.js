import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('fueldrop_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Global response error handling
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired — clear storage and redirect to login
            localStorage.removeItem('fueldrop_token');
            localStorage.removeItem('fueldrop_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ─── Auth endpoints ────────────────────────────────────────────────────────
export const authService = {
    register: (data) => API.post('/auth/register', data),
    login: (data) => API.post('/auth/login', data),
    getMe: () => API.get('/auth/me'),
    logout: () => API.post('/auth/logout'),
    updateProfile: (data) => API.put('/auth/update-profile', data),
    changePassword: (data) => API.put('/auth/change-password', data),
    updateLocation: (data) => API.put('/auth/update-location', data),
};

// ─── Pump endpoints (Phase 2) ──────────────────────────────────────────────
export const pumpService = {
    getNearby: (params) => API.get('/pumps/nearby', { params }),
    getById: (id) => API.get(`/pumps/${id}`),
    create: (data) => API.post('/pumps', data),
    update: (id, data) => API.put(`/pumps/${id}`, data),
    updateStock: (id, data) => API.put(`/pumps/${id}/stock`, data),
    myPump: () => API.get('/pumps/my-pump'),
};

// ─── Order endpoints (Phase 3) ─────────────────────────────────────────────
export const orderService = {
    place: (data) => API.post('/orders', data),
    getById: (id) => API.get(`/orders/${id}`),
    myOrders: () => API.get('/orders/my-orders'),
    pumpOrders: () => API.get('/orders/pump-orders'),
    agentOrders: () => API.get('/orders/agent-orders'),
    updateStatus: (id, data) => API.put(`/orders/${id}/status`, data),
    cancel: (id, data) => API.put(`/orders/${id}/cancel`, data),
    addReview: (id, data) => API.put(`/orders/${id}/review`, data),
};

// ─── SOS endpoints (Phase 4) ───────────────────────────────────────────────
export const sosService = {
    create: (data) => API.post('/sos', data),
    getActive: () => API.get('/sos/active'),
    respond: (id, data) => API.put(`/sos/${id}/respond`, data),
    cancel: (id) => API.put(`/sos/${id}/cancel`),
};

export default API;