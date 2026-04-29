import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../services/api';

// ─── Async thunks ──────────────────────────────────────────────────────────
export const registerUser = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
    try {
        const res = await authService.register(data);
        localStorage.setItem('fueldrop_token', res.data.token);
        localStorage.setItem('fueldrop_user', JSON.stringify(res.data.user));
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
});

export const loginUser = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
    try {
        const res = await authService.login(data);
        localStorage.setItem('fueldrop_token', res.data.token);
        localStorage.setItem('fueldrop_user', JSON.stringify(res.data.user));
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
});

export const loadUser = createAsyncThunk('auth/loadUser', async (_, { rejectWithValue }) => {
    try {
        const res = await authService.getMe();
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Session expired');
    }
});

// ─── Slice ─────────────────────────────────────────────────────────────────
const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: JSON.parse(localStorage.getItem('fueldrop_user')) || null,
        token: localStorage.getItem('fueldrop_token') || null,
        loading: false,
        error: null,
    },
    reducers: {
        logout: (state) => {
            localStorage.removeItem('fueldrop_token');
            localStorage.removeItem('fueldrop_user');
            state.user = null;
            state.token = null;
            state.error = null;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Register
        builder
            .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(registerUser.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.user = payload.user;
                state.token = payload.token;
            })
            .addCase(registerUser.rejected, (state, { payload }) => {
                state.loading = false;
                state.error = payload;
            });

        // Login
        builder
            .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(loginUser.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.user = payload.user;
                state.token = payload.token;
            })
            .addCase(loginUser.rejected, (state, { payload }) => {
                state.loading = false;
                state.error = payload;
            });

        // Load user
        builder
            .addCase(loadUser.fulfilled, (state, { payload }) => {
                state.user = payload.user;
                localStorage.setItem('fueldrop_user', JSON.stringify(payload.user));
            })
            .addCase(loadUser.rejected, (state) => {
                state.user = null;
                state.token = null;
                localStorage.removeItem('fueldrop_token');
                localStorage.removeItem('fueldrop_user');
            });
    },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;