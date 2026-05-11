import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { placeOrder } from '../store/orderSlice';
import useGeolocation from '../hooks/useGeolocation';
import useRazorpay from '../hooks/useRazorpay';

const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash on Delivery', icon: '💵' },
    { value: 'online', label: 'Pay Online (UPI/Card)', icon: '📱' },
];

export default function OrderCreation() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const locationState = useLocation();
    const pump = locationState.state?.pump;
    const { loading, error } = useSelector((s) => s.order);
    const { user } = useSelector((s) => s.auth);
    const { location: userLocation, loading: geoLoading } = useGeolocation();
    const { initiatePayment, paying: paymentLoading, payError } = useRazorpay();

    const availableFuels = useMemo(
        () => pump?.fuelStock?.filter((f) => f.isAvailable && f.availableLitres > 0) || [],
        [pump]
    );

    const [form, setForm] = useState({
        fuelType: availableFuels[0]?.fuelType || 'petrol',
        quantity: pump?.minimumDeliveryLitres || 2,
        paymentMethod: 'cash',
        address: { street: '', city: '', state: '', pincode: '' },
        instructions: '',
    });

    const selectedFuel = availableFuels.find((f) => f.fuelType === form.fuelType);
    const fuelCost = selectedFuel ? selectedFuel.pricePerLitre * form.quantity : 0;
    const totalCost = fuelCost + (pump?.deliveryCharge || 0);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!pump) return;

        if (!userLocation) {
            alert('Cannot determine your location. Please allow location access.');
            return;
        }

        if (!form.address.street || !form.address.city || !form.address.state || !form.address.pincode) {
            alert('Please fill complete delivery address.');
            return;
        }

        const result = await dispatch(placeOrder({
            pumpId: pump._id,
            fuelType: form.fuelType,
            quantityLitres: Number(form.quantity),
            paymentMethod: form.paymentMethod,
            deliveryAddress: form.address,
            specialInstructions: form.instructions,
            deliveryLocation: {
                type: 'Point',
                coordinates: [userLocation.lng, userLocation.lat],
            },
        }));

        if (placeOrder.fulfilled.match(result)) {
            const order = result.payload;
            
            if (form.paymentMethod === 'online') {
                // Initiate online payment
                initiatePayment({
                    orderId: order._id,
                    userName: user?.name,
                    userEmail: user?.email,
                    userPhone: user?.phone,
                    onSuccess: (paymentId) => {
                        // Payment successful, navigate to order tracking
                        navigate('/order-tracking');
                    },
                    onFailure: (error) => {
                        // Payment failed, show error but order is still created
                        alert(`Payment failed: ${error}. Your order has been created but payment is pending.`);
                        navigate('/order-tracking');
                    },
                });
            } else {
                // Cash payment, navigate immediately
                navigate('/order-tracking');
            }
        }
    };

    if (!pump) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-sm p-6 max-w-md w-full text-center">
                    <h1 className="text-lg font-semibold text-gray-900">No pump selected</h1>
                    <p className="text-sm text-gray-500 mt-2">
                        Select a nearby pump from home to create an order.
                    </p>
                    <button
                        onClick={() => navigate('/home')}
                        className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg text-sm font-semibold"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
                <button onClick={() => navigate('/home')} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
                <div>
                    <h1 className="font-bold text-gray-900">Create Order</h1>
                    <p className="text-xs text-gray-400">from {pump.name}</p>
                </div>
            </div>

            <div className="max-w-xl mx-auto p-4">
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-5 space-y-4">
                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fuel type</label>
                        <div className="flex gap-2 mt-2">
                            {availableFuels.map((f) => (
                                <button
                                    key={f.fuelType}
                                    type="button"
                                    onClick={() => setForm({ ...form, fuelType: f.fuelType })}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                                        form.fuelType === f.fuelType
                                            ? 'border-orange-500 bg-orange-50 text-orange-600'
                                            : 'border-gray-200 text-gray-600'
                                    }`}
                                >
                                    <div className="capitalize">{f.fuelType}</div>
                                    <div className="text-xs font-normal mt-0.5">₹{f.pricePerLitre}/L</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Quantity (litres) - min {pump.minimumDeliveryLitres}L
                        </label>
                        <div className="flex items-center gap-3 mt-2">
                            <button
                                type="button"
                                onClick={() => setForm((f) => ({ ...f, quantity: Math.max(pump.minimumDeliveryLitres || 1, f.quantity - 1) }))}
                                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-lg font-bold flex items-center justify-center"
                            >
                                -
                            </button>
                            <span className="text-2xl font-bold text-gray-800 w-12 text-center">{form.quantity}</span>
                            <button
                                type="button"
                                onClick={() => setForm((f) => ({ ...f, quantity: Math.min(selectedFuel?.availableLitres || 50, f.quantity + 1) }))}
                                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-lg font-bold flex items-center justify-center"
                            >
                                +
                            </button>
                            <span className="text-gray-400 text-sm ml-1">litres</span>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Delivery address / landmark</label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <input
                                value={form.address.street}
                                onChange={(e) => setForm({ ...form, address: { ...form.address, street: e.target.value } })}
                                placeholder="Street / landmark"
                                className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                required
                            />
                            <input
                                value={form.address.city}
                                onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })}
                                placeholder="City"
                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                required
                            />
                            <input
                                value={form.address.state}
                                onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })}
                                placeholder="State"
                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                required
                            />
                            <input
                                value={form.address.pincode}
                                onChange={(e) => setForm({ ...form, address: { ...form.address, pincode: e.target.value } })}
                                placeholder="Pincode"
                                className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                required
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            {geoLoading ? 'Getting your GPS location...' : 'GPS location will be shared automatically'}
                        </p>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Payment</label>
                        <div className="flex gap-2 mt-2">
                            {PAYMENT_METHODS.map((method) => (
                                <button
                                    key={method.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, paymentMethod: method.value })}
                                    className={`flex-1 py-2.5 px-3 rounded-lg text-sm border-2 transition-colors flex items-center gap-2 ${
                                        form.paymentMethod === method.value
                                            ? 'border-orange-500 bg-orange-50 text-orange-600'
                                            : 'border-gray-200 text-gray-600'
                                    }`}
                                >
                                    <span>{method.icon}</span>
                                    <span className="text-xs font-medium">{method.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Special instructions (optional)</label>
                        <input
                            value={form.instructions}
                            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                            placeholder="Any notes for the delivery agent"
                            className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Fuel ({form.quantity}L x ₹{selectedFuel?.pricePerLitre || 0})</span>
                            <span>₹{fuelCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Delivery charge</span>
                            <span>₹{pump.deliveryCharge || 0}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-bold text-gray-900">
                            <span>Total</span>
                            <span>₹{totalCost.toFixed(2)}</span>
                        </div>
                    </div>

                    {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}
                    {payError && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{payError}</div>}

                    <button
                        type="submit"
                        disabled={loading || geoLoading || availableFuels.length === 0 || paymentLoading}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
                    >
                        {loading ? 'Placing order...' : paymentLoading ? 'Processing payment...' : `Place order - ₹${totalCost.toFixed(2)}`}
                    </button>
                </form>
            </div>
        </div>
    );
}
