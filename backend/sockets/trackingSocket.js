const User = require('../models/User');

module.exports = function registerSocketHandlers(io, socket) {

    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their personal room.`);
    })

    socket.on('agent: locationUpdate', async ({ orderId, seekrId, agentId, lat, lng }) => {
        try {
            await User.findByIdAndUpdate(agentId, {
                currentLocation: { type: 'Point', coordinates: [lng, lat] },
            });

            io.to(seekrId).emit('agent: locationUpdate', { orderId, agentId, lat, lng });
        } catch (error) {
            console.error('locationUpdate error: ', error);
        }
    });

    socket.on('agent: setAvailability', async({ agentId, isAvailable }) => {
        try {
            await User.findByIdAndUpdate(agentId, { isAvailable });
            console.log(`Agent ${agentId} availability set to ${isAvailable}`);
        } catch (error) {
            console.error('setAvailability error: ', error);
        }
    });

    socket.on('sos: join', (sosId) => {
        socket.join(`sos_${sosId}`);
    });

    socket.on('order: join', (orderId) => {
        socket.join(`order_${orderId}`);
    });

    socket.on('pint', () => socket.emit('pong'));

    socket.on('disconnect', () => {
        console.log('Client disconnected: ', socket.id);
    });
}