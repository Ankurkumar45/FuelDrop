import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sosService } from '../services/api';

export const sendSos = createAsyncThunk('sos/send', async (data, { rejectWithValue }) => {
	try {
		const res = await sosService.create(data);
		return res.data;
	} catch (err) {
		return rejectWithValue(err.response?.data?.message || 'Failed to send SOS');
	}
});

export const fetchMySos = createAsyncThunk('sos/mySos', async (_, { rejectWithValue }) => {
	try {
		const res = await sosService.getMySos();
		return res.data.alerts;
	} catch (err) {
		return rejectWithValue(err.response?.data?.message || 'Failed to fetch my SOS');
	}
});

export const fetchIncomingSos = createAsyncThunk('sos/incomingSos', async (_, { rejectWithValue }) => {
	try {
		const res = await sosService.getIncoming();
		return res.data.alerts;
	} catch (err) {
		return rejectWithValue(err.response?.data?.message || 'Failed to fetch incoming SOS');
	}
});

export const respondSos = createAsyncThunk('sos/respond', async (data, { rejectWithValue }) => {
	try {
		const res = await sosService.respond(data.id, data.response);
		return res.data.sos;
	} catch (err) {
		return rejectWithValue(err.response?.data?.message || 'Failed to respond to SOS');
	}
});

export const cancelSos = createAsyncThunk('sos/cancel', async (id, { rejectWithValue }) => {
	try {
		const res = await sosService.cancel(id);
		return res.data.sos;
	} catch (err) {
		return rejectWithValue(err.response?.data?.message || 'Failed to cancel SOS');
		}
	});

export const fetchActiveSos = createAsyncThunk('sos/activeSos', async (_, { rejectWithValue }) => {
	try {
		const res = await sosService.getActive();
		return res.data.alerts;
	} catch (err) {
		return rejectWithValue(err.response?.data?.message || 'Failed to fetch active SOS');
		}
	});

const sosSlice = createSlice ({
	name: 'sos',
	initialState: {
		activeSos: null,
		mySosHistory: [],
		incomingSos: [],
		loading: false,
		error: null,
	},
	
	reducers: {
		clearSosError: (state) => { state.error = null; },
		
		socketSosNew: (state, { payload }) => {
			const exists = state.incomingSos.find((s) => s._id === payload.sos._id);
			if (!exists) state.incomingSos.unshift(payload.SOS);
		},
		
		socketSosRemove: (state, { payload }) => {
			state.incomingSos = state.incomingSos.filter((s) => s._id !== payload.sosId);
			if(state.activeSos?._id === payload.sosId) state.activeSos = null;
		},
		
		socketSosAccepted: (state, { payload }) => {
			if(state.activeSos?._id === payload.sosId) {
				state.activeSos = {
					...state.activeSos,
					status: 'responded',
					respondingPump: payload.pump
				};
			}
		},
		
		socketSosNoResponse: (state, { payload }) => {
			if(state.activeSos?._id === payload.sosId) {
				state.activeSos = {
					...state.activeSos,
					status: 'expired'
				};
			}
		},
	},
	
	extraReducers: (builder) => {
		builder
			.addCase(sendSos.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(sendSos.fulfilled, (state, { payload }) => {
				state.loading = false;
				state.activeSos = payload.sos;
			})
			.addCase(sendSos.rejected, (state, { payload }) => {
				state.loading = false;
				state.error = payload;
			});
			builder.addCase(fetchMySos.fulfilled, (state, { payload }) => {
				state.mySosHistory = payload;
			});
			builder.addCase(fetchIncomingSos.fulfilled, (state, { payload }) => {
				state.incomingSos = payload;
			});
			builder.addCase(respondSos.fulfilled, (state, { payload }) => {
				state.activeSos = payload;
			});
			builder.addCase(cancelSos.fulfilled, (state, { payload }) => {
				state.activeSos = payload;
			});
			builder.addCase(fetchActiveSos.fulfilled, (state, { payload }) => {
				state.activeSos = payload;
			});
			builder.addCase(fetchMySos.rejected, (state, { payload }) => {
				state.loading = false;
				state.error = payload;
			});
			builder.addCase(fetchIncomingSos.rejected, (state, { payload }) => {
				state.loading = false;
				state.error = payload;
			});
			builder.addCase(respondSos.rejected, (state, { payload }) => {
				state.loading = false;
				state.error = payload;
			});
			builder.addCase(cancelSos.rejected, (state, { payload }) => {
				state.loading = false;
				state.error = payload;
			});
			builder.addCase(fetchActiveSos.rejected, (state, { payload }) => {
				state.loading = false;
				state.error = payload;
			});
	}
});

export const { clearSosError, socketSosNew, socketSosRemove, socketSosAccepted, socketSosNoResponse } = sosSlice.actions;
export default sosSlice.reducer;