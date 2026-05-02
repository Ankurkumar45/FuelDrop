import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { placeOrder } from '../store/orderSlice';

const PAYMENT_METHODS = [
    { value: 'cod', label: 'Cash on Delivery', icon: '💵' },
    { value: 'online', label: 'Pay Online (UPI/Card)', icon: '📱' },
];

export default function OrderModal({ pump, userLocation, onClose, onSuccess }) {
    const dispatch = useDispatch();
    const { loading, error } = useSelector((s) => s.order);

    const availableFuels = pump.fuelStock?.filter((f) => f.isAvailable && f.availableLitres > 0) || [];

    const [form, setForm] = useState({
        fuelType: availableFuels[0]?.fuelType || 'petrol',
        quantity: pump.minimumDeliveryLitres || 2,
        paymentMethod: 'cod',
        address: '',
        instructions: '',
    });

    const selectedFuel = availableFuels.find((f) => f.fuelType === form.fuelType);
    const fuelCost = selectedFuel ? selectedFuel.pricePerLitre * form.quantity : 0;
    const totalCost = fuelCost + (pump.deliveryCharge || 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userLocation) {
            alert('Cannot determine your location. Please allow location access.');
            return;
        }

        const result = await dispatch(placeOrder({
            pumpId: pump._id,
            fuelType: form.fuelType,
            quantityLitres: parseFloat(form.quantity),
            paymentMethod: form.paymentMethod,
            deliveryAddress: form.address,
            specialInstructions: form.instructions,
            deliveryLocation: {
                type: 'Point',
                coordinates: [userLocation.lng, userLocation.lat],
            },
        }));

        if (placeOrder.fulfilled.match(result)) {
            onSuccess(result.payload);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b">
                    <div>
                        <h2 className="font-bold text-gray-900">Order fuel</h2>
                        <p className="text-xs text-gray-400 mt-0.5">from {pump.name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">

                    {/* Fuel type */}
                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fuel type</label>
                        <div className="flex gap-2 mt-2">
                            {availableFuels.map((f) => (
                                <button
                                    key={f.fuelType}
                                    type="button"
                                    onClick={() => setForm({ ...form, fuelType: f.fuelType })}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors ${form.fuelType === f.fuelType
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

                    {/* Quantity */}
                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Quantity (litres) — min {pump.minimumDeliveryLitres}L
                        </label>
                        <div className="flex items-center gap-3 mt-2">
                            <button
                                type="button"
                                onClick={() => setForm((f) => ({ ...f, quantity: Math.max(pump.minimumDeliveryLitres || 1, f.quantity - 1) }))}
                                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-lg font-bold flex items-center justify-center"
                            >−</button>
                            <span className="text-2xl font-bold text-gray-800 w-12 text-center">{form.quantity}</span>
                            <button
                                type="button"
                                onClick={() => setForm((f) => ({ ...f, quantity: Math.min(selectedFuel?.availableLitres || 50, f.quantity + 1) }))}
                                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-lg font-bold flex items-center justify-center"
                            >+</button>
                            <span className="text-gray-400 text-sm ml-1">litres</span>
                        </div>
                    </div>

                    {/* Delivery address */}
                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Delivery address / landmark</label>
                        <textarea
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            required
                            rows={2}
                            placeholder="e.g. Near Patna Junction gate 2, black Pulsar bike"
                            className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                        />
                        <p className="text-xs text-gray-400 mt-1">📍 Your GPS location is also shared automatically</p>
                    </div>

                    {/* Payment method */}
                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Payment</label>
                        <div className="flex gap-2 mt-2">
                            {PAYMENT_METHODS.map((m) => (
                                <button
                                    key={m.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, paymentMethod: m.value })}
                                    className={`flex-1 py-2.5 px-3 rounded-lg text-sm border-2 transition-colors flex items-center gap-2 ${form.paymentMethod === m.value
                                            ? 'border-orange-500 bg-orange-50 text-orange-600'
                                            : 'border-gray-200 text-gray-600'
                                        }`}
                                >
                                    <span>{m.icon}</span>
                                    <span className="text-xs font-medium">{m.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Special instructions */}
                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Special instructions (optional)</label>
                        <input
                            value={form.instructions}
                            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                            placeholder="Any notes for the delivery agent"
                            className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                    </div>

                    {/* Price summary */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Fuel ({form.quantity}L × ₹{selectedFuel?.pricePerLitre || 0})</span>
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

                    <button
                        type="submit"
                        disabled={loading || availableFuels.length === 0}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
                    >
                        {loading ? 'Placing order...' : `⛽ Place order — ₹${totalCost.toFixed(2)}`}
                    </button>
                </form>
            </div>
        </div>
    );
}