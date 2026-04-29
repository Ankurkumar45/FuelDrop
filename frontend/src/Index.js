import { configureStore } from '@reduxjs/toolkit';
import authReducer from './store/authSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        // Phase 2: pump: pumpReducer
        // Phase 3: order: orderReducer
        // Phase 4: sos: sosReducer
    },
});

export default store;