import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { socketOrderUpdate, setAgentLocation } from '../store/orderSlice';
import { socketSosNew, socketSosRemove, socketSosAccepted, socketSosNoResponse } from '../store/sosSlice';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socketInstance = null;

export default function useSocket() {
    const dispatch = useDispatch();
    const { user, token } = useSelector((s) => s.auth);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!token || !user) return;

        // Create socket only once
        if (!socketInstance) {
            socketInstance = io(SOCKET_URL, { transports: ['websocket'] });
        }
        socketRef.current = socketInstance;

        // Join personal room
        socketInstance.emit('join', user._id);

        // ── Listeners ───────────────────────────────────────────────────────────
        socketInstance.on('order:new', ({ order }) => {
            dispatch(socketOrderUpdate({ order }));
        });

        socketInstance.on('order:statusUpdate', ({ order }) => {
            dispatch(socketOrderUpdate({ order }));
        });

        socketInstance.on('order:cancelled', ({ orderId }) => {
            // Will be handled by status update from server
        });

        socketInstance.on('agent:locationUpdate', ({ lat, lng }) => {
            dispatch(setAgentLocation({ lat, lng }));
        });
		
		socketInstance.on('sos:new', (payload) => dispatch(socketSosNew(payload)));
		socketInstance.on('sos:resolve', (payload) => dispatch(socketSosRemove(payload)));
		socketInstance.on('sos:cancelled', (payload) => dispatch(socketSosRemove(payload)));
		socketInstance.on('sos:accepted', (payload) => dispatch(socketSosAccepted(payload)));
		socketInstance.on('sos:noResponse', (payload) => dispatch(socketSosNoResponse(payload)));
        return () => {
            socketInstance?.off('order:new');
            socketInstance?.off('order:statusUpdate');
            socketInstance?.off('order:cancelled');
            socketInstance?.off('agent:locationUpdate');
			
			socketInstance?.off('sos:new');
			socketInstance?.off('sos:resolve');
			socketInstance?.off('sos:cancelled');
			socketInstance?.off('sos:accepted');
			socketInstance?.off('sos:noResponse');
        };
    }, [token, user?._id]);

    // Expose emit for agent location broadcasting
    const emitLocation = ({ orderId, seekerId, agentId, lat, lng }) => {
        socketInstance?.emit('agent:locationUpdate', { orderId, seekerId, agentId, lat, lng });
    };

    const emitAvailability = (isAvailable) => {
        socketInstance?.emit('agent:setAvailability', { agentId: user?._id, isAvailable });
    };

    return { socket: socketRef.current, emitLocation, emitAvailability };
}