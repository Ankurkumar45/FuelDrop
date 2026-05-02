import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPumpOrders, updateStatus } from '../store/orderSlice';

const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-blue-100 text-blue-700',
    assigned: 'bg-indigo-100 text-indigo-700',
    en_route: 'bg-orange-100 text-orange-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-500',
    rejected: 'bg-red-100 text-red-600',
};

export default function PumpOrders() {
    const dispatch = useDispatch();
    const { pumpOrders, loading } = useSelector((s) => s.order);
    const [filter, setFilter] = useState('pending');
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        dispatch(fetchPumpOrders());
    }, []);

    const handleAction = async (orderId, status) => {
        setProcessingId(orderId);
        await dispatch(updateStatus({ id: orderId, status }));
        setProcessingId(null);
    };

    const filtered = pumpOrders.filter((o) =>
        filter === 'all' ? true : o.status === filter
    );

    const pendingCount = pumpOrders.filter((o) => o.status === 'pending').length;

    return (
        <div>
            {/* Filter tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
                {['pending', 'accepted', 'en_route', 'delivered', 'all'].map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`text-xs px-3 py-1.5 rounded-full shrink-0 font-medium transition-colors ${filter === s ? 'bg-orange-500 text-white' : 'bg-white border text-gray-600'
                            }`}
                    >
                        {s === 'pending' ? `🔔 Pending${pendingCount > 0 ? ` (${pendingCount})` : ''}` : s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
                    </button>
                ))}
            </div>

            {loading && <p className="text-center text-gray-400 text-sm py-8">Loading orders...</p>}

            {!loading && filtered.length === 0 && (
                <div className="text-center py-10 bg-white rounded-xl">
                    <p className="text-gray-400 text-sm">No {filter} orders</p>
                </div>
            )}

            <div className="space-y-3">
                {filtered.map((order) => (
                    <div key={order._id} className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${order.status === 'pending' ? 'border-yellow-400' :
                            order.status === 'accepted' ? 'border-blue-400' :
                                order.status === 'delivered' ? 'border-green-400' : 'border-gray-200'
                        }`}>
                        {/* Order header */}
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="font-semibold text-gray-800 text-sm">{order.seeker?.name}</p>
                                <p className="text-xs text-gray-400">{order.seeker?.phone}</p>
                            </div>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>
                                {order.status.replace('_', ' ')}
                            </span>
                        </div>

                        {/* Order details */}
                        <div className="space-y-1 mb-3 text-xs text-gray-500">
                            <p>⛽ {order.quantityLitres}L {order.fuelType} · ₹{order.totalAmount}</p>
                            <p>📍 {order.deliveryAddress}</p>
                            <p>💳 {order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Online payment'}</p>
                            {order.specialInstructions && <p>📝 {order.specialInstructions}</p>}
                            <p className="text-gray-300">#{order._id.slice(-6).toUpperCase()}</p>
                        </div>

                        {/* Actions based on status */}
                        {order.status === 'pending' && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAction(order._id, 'accepted')}
                                    disabled={processingId === order._id}
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-60"
                                >
                                    ✅ Accept
                                </button>
                                <button
                                    onClick={() => handleAction(order._id, 'rejected')}
                                    disabled={processingId === order._id}
                                    className="flex-1 border border-red-200 text-red-500 text-sm py-2 rounded-lg hover:bg-red-50 disabled:opacity-60"
                                >
                                    ✕ Reject
                                </button>
                            </div>
                        )}

                        {order.status === 'accepted' && (
                            <button
                                onClick={() => handleAction(order._id, 'assigned')}
                                disabled={processingId === order._id}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-60"
                            >
                                🛵 Assign delivery agent
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}