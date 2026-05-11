import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { cancelSos, fetchMySos, sendSos } from '../store/sosSlice';
import { logout } from '../store/authSlice';
import useGeolocation from '../hooks/useGeolocation';
import useSocket from '../hooks/useSocket';

const INITIAL_FORM = {
    fuelType: 'petrol',
    quantityNeeded: 2,
    locationDescription: '',
};

export default function SosPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((s) => s.auth);
    const { activeSos, mySosHistory, loading, error } = useSelector((s) => s.sos);
    const { location, loading: geoLoading, error: geoError } = useGeolocation();
    const [form, setForm] = useState(INITIAL_FORM);
    useSocket();

    useEffect(() => {
        dispatch(fetchMySos());
    }, [dispatch]);

    const latestSos = useMemo(() => {
        if (activeSos) return activeSos;
        return mySosHistory.find((item) => item.status === 'active') || mySosHistory[0] || null;
    }, [activeSos, mySosHistory]);

    const isActive = latestSos?.status === 'active';
    const isResponded = latestSos?.status === 'responded';

    const handleSend = async (e) => {
        e.preventDefault();
        if (!location) {
            alert('Cannot get your location. Please enable location access first.');
            return;
        }

        const result = await dispatch(sendSos({
            latitude: location.lat,
            longitude: location.lng,
            ...form,
        }));

        if (sendSos.fulfilled.match(result)) {
            dispatch(fetchMySos());
        }
    };

    const handleCancel = async () => {
        if (!latestSos?._id) return;
        const result = await dispatch(cancelSos(latestSos._id));
        if (cancelSos.fulfilled.match(result)) {
            dispatch(fetchMySos());
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🆘</span>
                    <span className="font-bold text-gray-800">Emergency SOS</span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/home')} className="text-xs text-gray-500 hover:underline">
                        Back to Home
                    </button>
                    <span className="text-sm text-gray-500">Hi, {user?.name?.split(' ')[0]}</span>
                    <button onClick={() => { dispatch(logout()); navigate('/login'); }} className="text-xs text-red-500 hover:underline">
                        Logout
                    </button>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
                {geoLoading && (
                    <div className="bg-white rounded-xl p-4 text-sm text-gray-500">Getting your location...</div>
                )}

                {geoError && (
                    <div className="bg-red-50 text-red-600 rounded-xl p-4 text-sm">{geoError}</div>
                )}

                {isActive && (
                    <div className="bg-white border-l-4 border-red-500 rounded-xl p-5">
                        <h2 className="text-red-600 font-bold">SOS is active</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Your request has been broadcast to nearby pumps. Stay at your current location.
                        </p>
                        <div className="mt-3 text-sm text-gray-700 space-y-1">
                            <p><span className="font-medium">Fuel:</span> {latestSos.fuelType} ({latestSos.quantityNeeded}L)</p>
                            <p><span className="font-medium">Notified pumps:</span> {latestSos.notifiedPumps?.length || 0}</p>
                        </div>
                        <button
                            onClick={handleCancel}
                            disabled={loading}
                            className="mt-4 w-full border border-red-200 text-red-500 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 disabled:opacity-60"
                        >
                            {loading ? 'Cancelling...' : 'Cancel SOS'}
                        </button>
                    </div>
                )}

                {isResponded && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                        <h2 className="text-green-700 font-bold">Pump accepted your SOS</h2>
                        <p className="text-sm text-green-800 mt-1">
                            A pump has accepted your emergency request. Track your order from the tracking page.
                        </p>
                        <button
                            onClick={() => navigate('/order-tracking')}
                            className="mt-4 w-full bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700"
                        >
                            Open Order Tracking
                        </button>
                    </div>
                )}

                {!isActive && (
                    <form onSubmit={handleSend} className="bg-white rounded-xl p-5 space-y-4 shadow-sm">
                        <h2 className="font-semibold text-gray-800">Send emergency fuel request</h2>
                        <p className="text-xs text-gray-500">
                            Use this only when you are stranded and need urgent fuel delivery.
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-500">Fuel Type</label>
                                <select
                                    value={form.fuelType}
                                    onChange={(e) => setForm((prev) => ({ ...prev, fuelType: e.target.value }))}
                                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="petrol">Petrol</option>
                                    <option value="diesel">Diesel</option>
                                    <option value="cng">CNG</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Quantity (litres)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={form.quantityNeeded}
                                    onChange={(e) => setForm((prev) => ({ ...prev, quantityNeeded: Number(e.target.value) }))}
                                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500">Location note (optional)</label>
                            <textarea
                                value={form.locationDescription}
                                onChange={(e) => setForm((prev) => ({ ...prev, locationDescription: e.target.value }))}
                                placeholder="Landmark or nearby shop name"
                                rows={3}
                                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm resize-none"
                            />
                        </div>

                        {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}

                        <button
                            type="submit"
                            disabled={loading || !location}
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-60 transition-colors"
                        >
                            {loading ? 'Sending SOS...' : '🆘 Send SOS Alert'}
                        </button>
                    </form>
                )}

                {mySosHistory.length > 0 && (
                    <div className="bg-white rounded-xl p-5 shadow-sm">
                        <h3 className="font-semibold text-gray-800 text-sm mb-3">Recent SOS alerts</h3>
                        <div className="space-y-2">
                            {mySosHistory.slice(0, 5).map((sos) => (
                                <div key={sos._id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                                    <span className="capitalize text-gray-700">{sos.fuelType} · {sos.quantityNeeded}L</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${sos.status === 'active'
                                        ? 'bg-red-100 text-red-600'
                                        : sos.status === 'responded'
                                            ? 'bg-green-100 text-green-600'
                                            : 'bg-gray-200 text-gray-600'}`}
                                    >
                                        {sos.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
