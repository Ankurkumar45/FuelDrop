import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { orderService } from '../services/api';

// ─── Async thunks ──────────────────────────────────────────────────────────
export const placeOrder = createAsyncThunk('order/place', async (data, { rejectWithValue }) => {
    try {
        const res = await orderService.place(data);
        return res.data.order;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to place order');
    }
});

export const fetchMyOrders = createAsyncThunk('order/myOrders', async (_, { rejectWithValue }) => {
    try {
        const res = await orderService.myOrders();
        return res.data.orders;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch orders');
    }
});

export const fetchPumpOrders = createAsyncThunk('order/pumpOrders', async (_, { rejectWithValue }) => {
    try {
        const res = await orderService.pumpOrders();
        return res.data.orders;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch pump orders');
    }
});

export const fetchAgentOrders = createAsyncThunk('order/agentOrders', async (_, { rejectWithValue }) => {
    try {
        const res = await orderService.agentOrders();
        return res.data.orders;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch agent orders');
    }
});

export const fetchAvailableOrders = createAsyncThunk('order/available', async (_, { rejectWithValue }) => {
    try {
        const res = await orderService.availableOrders();
        return res.data.orders;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch available orders');
    }
});

export const updateStatus = createAsyncThunk('order/updateStatus', async ({ id, status, agentId }, { rejectWithValue }) => {
    try {
        const res = await orderService.updateStatus(id, { status, agentId });
        return res.data.order;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to update status');
    }
});

export const cancelOrder = createAsyncThunk('order/cancel', async ({ id, reason }, { rejectWithValue }) => {
    try {
        const res = await orderService.cancel(id, { reason });
        return res.data.order;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to cancel order');
    }
});

export const submitReview = createAsyncThunk('order/review', async ({ id, rating, comment }, { rejectWithValue }) => {
    try {
        const res = await orderService.addReview(id, { rating, comment });
        return res.data.order;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to submit review');
    }
});

// ─── Helpers ───────────────────────────────────────────────────────────────
const upsertOrder = (list, updated) => {
    const idx = list.findIndex((o) => o._id === updated._id);
    if (idx >= 0) { const next = [...list]; next[idx] = updated; return next; }
    return [updated, ...list];
};

// ─── Slice ─────────────────────────────────────────────────────────────────
const orderSlice = createSlice({
    name: 'order',
    initialState: {
        myOrders: [],
        pumpOrders: [],
        agentOrders: [],
        availableOrders: [],
        activeOrder: null,   // order being tracked live
        agentLocation: null,   // { lat, lng } from socket
        loading: false,
        error: null,
    },
    reducers: {
        setActiveOrder: (state, { payload }) => { state.activeOrder = payload; },
        setAgentLocation: (state, { payload }) => { state.agentLocation = payload; },
        // Called by socket event to update an order in all lists in real-time
        socketOrderUpdate: (state, { payload }) => {
            const order = payload.order;
            state.myOrders = upsertOrder(state.myOrders, order);
            state.pumpOrders = upsertOrder(state.pumpOrders, order);
            state.agentOrders = upsertOrder(state.agentOrders, order);
            if (state.activeOrder?._id === order._id) state.activeOrder = order;
        },
        clearOrderError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(placeOrder.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(placeOrder.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.myOrders = [payload, ...state.myOrders];
                state.activeOrder = payload;
            })
            .addCase(placeOrder.rejected, (state, { payload }) => { state.loading = false; state.error = payload; });

        builder.addCase(fetchMyOrders.fulfilled, (state, { payload }) => { state.myOrders = payload; });
        builder.addCase(fetchPumpOrders.fulfilled, (state, { payload }) => { state.pumpOrders = payload; });
        builder.addCase(fetchAgentOrders.fulfilled, (state, { payload }) => { state.agentOrders = payload; });
        builder.addCase(fetchAvailableOrders.fulfilled, (state, { payload }) => { state.availableOrders = payload; });

        builder.addCase(updateStatus.fulfilled, (state, { payload }) => {
            state.myOrders = upsertOrder(state.myOrders, payload);
            state.pumpOrders = upsertOrder(state.pumpOrders, payload);
            state.agentOrders = upsertOrder(state.agentOrders, payload);
            // Remove from available once agent picks it up
            state.availableOrders = state.availableOrders.filter((o) => o._id !== payload._id);
            if (state.activeOrder?._id === payload._id) state.activeOrder = payload;
        });

        builder.addCase(cancelOrder.fulfilled, (state, { payload }) => {
            state.myOrders = upsertOrder(state.myOrders, payload);
            if (state.activeOrder?._id === payload._id) state.activeOrder = payload;
        });

        builder.addCase(submitReview.fulfilled, (state, { payload }) => {
            state.myOrders = upsertOrder(state.myOrders, payload);
        });
    },
});

export const { setActiveOrder, setAgentLocation, socketOrderUpdate, clearOrderError } = orderSlice.actions;
export default orderSlice.reducer;