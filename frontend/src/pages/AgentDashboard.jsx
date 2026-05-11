import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAgentOrders } from '../store/orderSlice';

const STATUS_STEPS = ['pending', 'accepted', 'assigned', 'en_route', 'delivered'];

const STATUS_LABELS = {
    pending: { label: 'Order placed', icon: '📋', color: 'text-yellow-500' },
    accepted: { label: 'Pump accepted', icon: '✅', color: 'text-blue-500' },
    assigned: { label: 'Agent assigned', icon: '🛵', color: 'text-indigo-500' },
    en_route: { label: 'Agent on the way', icon: '🚀', color: 'text-orange-500' },
    delivered: { label: 'Fuel delivered!', icon: '🎉', color: 'text-green-500' },
    cancelled: { label: 'Order cancelled', icon: '❌', color: 'text-red-500' },
    rejected: { label: 'Order rejected', icon: '🚫', color: 'text-red-500' },
};

function StatusBadge({ status }) {
    const s = STATUS_LABELS[status] || {};
    return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 ${s.color}`}>
            {s.icon} {s.label}
        </span>
    );
}

function ProgressBar({ status }) {
    const currentIdx = STATUS_STEPS.indexOf(status);
    if (currentIdx === -1) return null;
    return (
        <div className="flex items-center gap-1 my-3">
            {STATUS_STEPS.map((step, i) => (
                <div key={step} className="flex items-center flex-1">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${i <= currentIdx ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'
                        }`}>
                        {i < currentIdx ? '✓' : i === currentIdx ? '●' : '○'}
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-0.5 ${i < currentIdx ? 'bg-orange-400' : 'bg-gray-200'}`} />
                    )}
                </div>
            ))}
        </div>
    );
}

export default function AgentDashboard() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { agentOrders, agentLocation, loading } = useSelector((s) => s.order);

    useEffect(() => {
        dispatch(fetchAgentOrders());
    }, [dispatch]);

    const orders = agentOrders;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <div className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
                <button onClick={() => navigate('/agent-dashboard')} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
                <h1 className="font-bold text-gray-900">Assigned Orders</h1>
            </div>

            <div className="max-w-xl mx-auto px-4 py-5 space-y-4">

                {loading && (
                    <div className="text-center py-10">
                        <p className="text-gray-400 text-sm">Loading your orders...</p>
                    </div>
                )}

                {!loading && orders.length === 0 && (
                    <div className="text-center py-16">
                        <div className="text-4xl mb-3">📭</div>
                        <p className="text-gray-600 font-medium">No assigned orders yet</p>
                        <p className="text-gray-400 text-sm mt-1">New assignments will appear here in real time</p>
                        <button onClick={() => navigate('/agent-dashboard')} className="mt-4 bg-orange-500 text-white px-5 py-2 rounded-lg text-sm font-medium">
                            Refresh
                        </button>
                    </div>
                )}

                {orders.map((order) => (
                    <div key={order._id} className="bg-white rounded-xl shadow-sm p-5">
                        {/* Order header */}
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="font-semibold text-gray-800 text-sm">{order.pump?.name || 'Pump'}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {order.quantityLitres}L {order.fuelType} · ₹{order.totalAmount}
                                </p>
                            </div>
                            <StatusBadge status={order.status} />
                        </div>

                        {/* Progress bar for active orders */}
                        {!['cancelled', 'rejected'].includes(order.status) && (
                            <ProgressBar status={order.status} />
                        )}

                        {/* Step labels */}
                        <div className="flex justify-between text-xs text-gray-400 mb-3">
                            {STATUS_STEPS.map((step) => (
                                <span key={step} className="capitalize text-center" style={{ width: `${100 / STATUS_STEPS.length}%` }}>
                                    {step.replace('_', ' ')}
                                </span>
                            ))}
                        </div>

                        {/* Agent info if assigned */}
                        {order.deliveryAgent && ['assigned', 'en_route'].includes(order.status) && (
                            <div className="bg-blue-50 rounded-lg px-3 py-2 flex items-center gap-2 mb-3">
                                <span className="text-xl">🛵</span>
                                <div>
                                    <p className="text-xs font-medium text-blue-800">{order.deliveryAgent.name}</p>
                                    <p className="text-xs text-blue-500">{order.deliveryAgent.phone}</p>
                                </div>
                                {order.status === 'en_route' && agentLocation && (
                                    <span className="ml-auto text-xs text-orange-500 font-medium animate-pulse">● Live</span>
                                )}
                            </div>
                        )}

                        {/* Delivery address */}
                        <p className="text-xs text-gray-400 mb-3">📍 {order.deliveryAddress}</p>

                        {/* Payment info */}
                        <div className="flex justify-between text-xs text-gray-500 border-t pt-3">
                            <span>{order.paymentMethod === 'cod' ? '💵 Cash on delivery' : '📱 Online payment'}</span>
                            <span className={order.paymentStatus === 'paid' ? 'text-green-500 font-medium' : ''}>
                                {order.paymentStatus === 'paid' ? '✅ Paid' : `₹${order.totalAmount} due`}
                            </span>
                        </div>

                        {/* Agent view is read-only for now */}
                    </div>
                ))}
            </div>
        </div>
    );
}