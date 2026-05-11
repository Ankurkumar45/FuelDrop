import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchMyOrders, setActiveOrder, cancelOrder, submitReview } from '../store/orderSlice';
import { useState } from 'react';

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

function formatDeliveryAddress(address) {
    if (!address) return 'Address unavailable';
    if (typeof address === 'string') return address;
    if (typeof address === 'object') {
        return [address.street, address.city, address.state, address.pincode]
            .filter(Boolean)
            .join(', ');
    }
    return String(address);
}

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

function ReviewForm({ orderId, onDone }) {
    const dispatch = useDispatch();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        await dispatch(submitReview({ id: orderId, rating, comment }));
        onDone();
    };

    return (
        <form onSubmit={handleSubmit} className="bg-yellow-50 rounded-xl p-4 mt-3 space-y-3">
            <p className="text-sm font-semibold text-gray-800">Rate your delivery</p>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setRating(star)}
                        className={`text-2xl transition-transform hover:scale-110 ${star <= rating ? 'opacity-100' : 'opacity-30'}`}>
                        ⭐
                    </button>
                ))}
            </div>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2}
                placeholder="Tell others about your experience..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400" />
            <button type="submit" className="w-full bg-orange-500 text-white py-2 rounded-lg text-sm font-medium">
                Submit review
            </button>
        </form>
    );
}

export default function OrderTracking() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { myOrders, activeOrder, agentLocation, loading } = useSelector((s) => s.order);
    const [showReview, setShowReview] = useState(false);
    const [cancellingId, setCancellingId] = useState(null);

    useEffect(() => {
        dispatch(fetchMyOrders());
    }, []);

    const handleCancel = async (orderId) => {
        if (!window.confirm('Cancel this order?')) return;
        setCancellingId(orderId);
        await dispatch(cancelOrder({ id: orderId, reason: 'Cancelled by customer' }));
        setCancellingId(null);
    };

    const orders = myOrders;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <div className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
                <button onClick={() => navigate('/home')} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
                <h1 className="font-bold text-gray-900">My Orders</h1>
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
                        <p className="text-gray-600 font-medium">No orders yet</p>
                        <p className="text-gray-400 text-sm mt-1">Find a pump and place your first order</p>
                        <button onClick={() => navigate('/home')} className="mt-4 bg-orange-500 text-white px-5 py-2 rounded-lg text-sm font-medium">
                            Find pumps
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
                        <p className="text-xs text-gray-400 mb-3">📍 {formatDeliveryAddress(order.deliveryAddress)}</p>

                        {/* Payment info */}
                        <div className="flex justify-between text-xs text-gray-500 border-t pt-3">
                            <span>{order.paymentMethod === 'cash' ? '💵 Cash on delivery' : '📱 Online payment'}</span>
                            <span className={order.paymentStatus === 'paid' ? 'text-green-500 font-medium' : ''}>
                                {order.paymentStatus === 'paid' ? '✅ Paid' : `₹${order.totalAmount} due`}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-3">
                            {/* Cancel button */}
                            {['pending', 'accepted'].includes(order.status) && (
                                <button
                                    onClick={() => handleCancel(order._id)}
                                    disabled={cancellingId === order._id}
                                    className="flex-1 border border-red-200 text-red-500 text-xs py-2 rounded-lg hover:bg-red-50 disabled:opacity-60"
                                >
                                    {cancellingId === order._id ? 'Cancelling...' : 'Cancel order'}
                                </button>
                            )}

                            {/* Review button */}
                            {order.status === 'delivered' && !order.review?.rating && (
                                <button
                                    onClick={() => setShowReview(order._id)}
                                    className="flex-1 border border-orange-200 text-orange-500 text-xs py-2 rounded-lg hover:bg-orange-50"
                                >
                                    ⭐ Rate delivery
                                </button>
                            )}
                            {order.review?.rating && (
                                <span className="text-xs text-gray-400 py-2">{'⭐'.repeat(order.review.rating)} You rated this delivery</span>
                            )}
                        </div>

                        {/* Inline review form */}
                        {showReview === order._id && (
                            <ReviewForm orderId={order._id} onDone={() => setShowReview(null)} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}