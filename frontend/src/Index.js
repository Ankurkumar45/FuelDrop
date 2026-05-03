import { configureStore } from '@reduxjs/toolkit';
import authReducer from './store/authSlice';
import pumpReducer from './store/pumpSlice';
import orderReducer from './store/orderSlice';
// import sosReducer from './store/sosSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        pump: pumpReducer,
        order: orderReducer,
        // sos: sosReducer
    },
});

export default store;