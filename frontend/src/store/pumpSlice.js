import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { pumpService } from '../services/api';

// ─── Async thunks ──────────────────────────────────────────────────────────
export const fetchNearbyPumps = createAsyncThunk(
    'pump/fetchNearby',
    async (params, { rejectWithValue }) => {
        try {
            const res = await pumpService.getNearby(params);
            return res.data.pumps;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to fetch pumps');
        }
    }
);

export const fetchMyPump = createAsyncThunk(
    'pump/fetchMine',
    async (_, { rejectWithValue }) => {
        try {
            const res = await pumpService.myPump();
            return res.data.pump;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'No pump found');
        }
    }
);

export const createPump = createAsyncThunk(
    'pump/create',
    async (data, { rejectWithValue }) => {
        try {
            const res = await pumpService.create(data);
            return res.data.pump;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to register pump');
        }
    }
);

export const updatePumpStock = createAsyncThunk(
    'pump/updateStock',
    async ({ id, fuelStock }, { rejectWithValue }) => {
        try {
            const res = await pumpService.updateStock(id, { fuelStock });
            return res.data.pump;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to update stock');
        }
    }
);

// ─── Slice ─────────────────────────────────────────────────────────────────
const pumpSlice = createSlice({
    name: 'pump',
    initialState: {
        nearbyPumps: [],
        selectedPump: null,
        myPump: null,
        userLocation: null,   // { lat, lng }
        loading: false,
        error: null,
    },
    reducers: {
        setSelectedPump: (state, { payload }) => { state.selectedPump = payload; },
        setUserLocation: (state, { payload }) => { state.userLocation = payload; },
        clearPumpError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        // Nearby pumps
        builder
            .addCase(fetchNearbyPumps.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchNearbyPumps.fulfilled, (state, { payload }) => { state.loading = false; state.nearbyPumps = payload; })
            .addCase(fetchNearbyPumps.rejected, (state, { payload }) => { state.loading = false; state.error = payload; });

        // My pump
        builder
            .addCase(fetchMyPump.fulfilled, (state, { payload }) => { state.myPump = payload; })
            .addCase(fetchMyPump.rejected, (state) => { state.myPump = null; });

        // Create pump
        builder
            .addCase(createPump.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(createPump.fulfilled, (state, { payload }) => { state.loading = false; state.myPump = payload; })
            .addCase(createPump.rejected, (state, { payload }) => { state.loading = false; state.error = payload; });

        // Update stock
        builder
            .addCase(updatePumpStock.fulfilled, (state, { payload }) => { state.myPump = payload; });
    },
});

export const { setSelectedPump, setUserLocation, clearPumpError } = pumpSlice.actions;
export default pumpSlice.reducer;