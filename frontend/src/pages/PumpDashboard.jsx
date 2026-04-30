import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyPump, createPump, updatePumpStock } from '../store/pumpSlice';
import { logout } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';

const INITIAL_FORM = {
    name: '',
    address: { street: '', city: '', state: '', pincode: '' },
    location: { type: 'Point', coordinates: ['', ''] },
    fuelStock: [
        { fuelType: 'petrol', pricePerLitre: '', availableLitres: '', isAvailable: true },
    ],
    offersDelivery: false,
    deliveryRadiusKm: 5,
    deliveryCharge: 0,
    minimumDeliveryLitres: 2,
    open24Hours: false,
    openTime: '06:00',
    closeTime: '22:00',
};

export default function PumpDashboard() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((s) => s.auth);
    const { myPump, loading, error } = useSelector((s) => s.pump);

    const [tab, setTab] = useState('overview');
    const [form, setForm] = useState(INITIAL_FORM);
    const [stockEdit, setStockEdit] = useState(false);
    const [locLoading, setLocLoading] = useState(false);

    useEffect(() => {
        dispatch(fetchMyPump());
    }, []);

    // Auto-fill form if pump already exists (for editing later)
    useEffect(() => {
        if (myPump) setTab('overview');
    }, [myPump]);

    // ── Get current location for the registration form ────────────────────────
    const getLocation = () => {
        setLocLoading(true);
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                setForm((f) => ({
                    ...f,
                    location: { type: 'Point', coordinates: [coords.longitude, coords.latitude] },
                }));
                setLocLoading(false);
            },
            () => { alert('Could not get location. Please enter coordinates manually.'); setLocLoading(false); }
        );
    };

    // ── Registration form submit ──────────────────────────────────────────────
    const handleRegister = async (e) => {
        e.preventDefault();
        // Validate coordinates
        if (!form.location.coordinates[0] || !form.location.coordinates[1]) {
            alert('Please set your pump location using the button or enter coordinates.');
            return;
        }
        const payload = {
            ...form,
            location: {
                type: 'Point',
                coordinates: [parseFloat(form.location.coordinates[0]), parseFloat(form.location.coordinates[1])],
            },
            fuelStock: form.fuelStock.map((f) => ({
                ...f,
                pricePerLitre: parseFloat(f.pricePerLitre),
                availableLitres: parseFloat(f.availableLitres),
            })),
        };
        const result = await dispatch(createPump(payload));
        if (createPump.fulfilled.match(result)) {
            alert('✅ Pump registered successfully!');
        }
    };

    // ── Add fuel type row ─────────────────────────────────────────────────────
    const addFuelRow = () => {
        const used = form.fuelStock.map((f) => f.fuelType);
        const next = ['petrol', 'diesel', 'cng'].find((f) => !used.includes(f));
        if (!next) return;
        setForm((f) => ({
            ...f,
            fuelStock: [...f.fuelStock, { fuelType: next, pricePerLitre: '', availableLitres: '', isAvailable: true }],
        }));
    };

    // ── Update stock submit ───────────────────────────────────────────────────
    const handleStockUpdate = async () => {
        if (!myPump) return;
        await dispatch(updatePumpStock({ id: myPump._id, fuelStock: myPump.fuelStock }));
        setStockEdit(false);
        alert('✅ Stock updated!');
    };

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Navbar */}
            <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">⛽</span>
                    <span className="font-bold text-gray-800">FuelDrop</span>
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full ml-1">Pump Owner</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">{user?.name?.split(' ')[0]}</span>
                    <button onClick={() => { dispatch(logout()); navigate('/login'); }} className="text-xs text-red-500 hover:underline">Logout</button>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6">

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {['overview', myPump ? 'stock' : 'register'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${tab === t ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border'
                                }`}
                        >
                            {t === 'overview' ? '📊 Overview' : t === 'stock' ? '📦 Update Stock' : '➕ Register Pump'}
                        </button>
                    ))}
                </div>

                {/* ── Overview tab ─────────────────────────────────────────── */}
                {tab === 'overview' && (
                    <div>
                        {!myPump ? (
                            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                                <div className="text-4xl mb-3">⛽</div>
                                <h2 className="font-semibold text-gray-800 mb-1">Register your pump</h2>
                                <p className="text-gray-500 text-sm mb-4">List your petrol pump on FuelDrop to receive orders from nearby riders.</p>
                                <button onClick={() => setTab('register')} className="bg-orange-500 text-white px-5 py-2 rounded-lg text-sm font-medium">
                                    Register now
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Pump info card */}
                                <div className="bg-white rounded-xl p-5 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="font-bold text-gray-900">{myPump.name}</h2>
                                            <p className="text-sm text-gray-500 mt-0.5">{myPump.address?.street}, {myPump.address?.city}</p>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${myPump.isVerified ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                            {myPump.isVerified ? '✅ Verified' : '⏳ Pending verification'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 mt-4">
                                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                                            <p className="text-lg font-bold text-gray-800">{myPump.fuelStock?.length || 0}</p>
                                            <p className="text-xs text-gray-400">Fuel types</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                                            <p className="text-lg font-bold text-gray-800">{myPump.offersDelivery ? myPump.deliveryRadiusKm + ' km' : '—'}</p>
                                            <p className="text-xs text-gray-400">Delivery radius</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                                            <p className="text-lg font-bold text-gray-800">{myPump.averageRating > 0 ? myPump.averageRating.toFixed(1) : '—'}</p>
                                            <p className="text-xs text-gray-400">Rating</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Fuel stock */}
                                <div className="bg-white rounded-xl p-5 shadow-sm">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="font-semibold text-gray-800 text-sm">Current stock</h3>
                                        <button onClick={() => setTab('stock')} className="text-xs text-orange-500 hover:underline">Update stock</button>
                                    </div>
                                    <div className="space-y-2">
                                        {myPump.fuelStock?.map((f) => (
                                            <div key={f.fuelType} className="flex justify-between items-center text-sm">
                                                <span className="capitalize font-medium text-gray-700">{f.fuelType}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-gray-500">₹{f.pricePerLitre}/L</span>
                                                    <span className="text-gray-500">{f.availableLitres}L available</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${f.isAvailable ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                                                        {f.isAvailable ? 'Available' : 'Out of stock'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Orders placeholder */}
                                <div className="bg-white rounded-xl p-5 shadow-sm text-center">
                                    <p className="text-gray-400 text-sm">📦 Order management coming in Phase 3</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Register pump tab ────────────────────────────────────── */}
                {tab === 'register' && !myPump && (
                    <form onSubmit={handleRegister} className="space-y-4">

                        <div className="bg-white rounded-xl p-5 shadow-sm space-y-3">
                            <h3 className="font-semibold text-gray-800">Pump details</h3>
                            <div>
                                <label className="text-xs text-gray-500">Pump name</label>
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Sharma Petrol Pump" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500">Street</label>
                                    <input value={form.address.street} onChange={(e) => setForm({ ...form, address: { ...form.address, street: e.target.value } })} required placeholder="NH-30, near bus stand" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">City</label>
                                    <input value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} required placeholder="Patna" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">State</label>
                                    <input value={form.address.state} onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })} required placeholder="Bihar" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Pincode</label>
                                    <input value={form.address.pincode} onChange={(e) => setForm({ ...form, address: { ...form.address, pincode: e.target.value } })} required placeholder="800001" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="bg-white rounded-xl p-5 shadow-sm space-y-3">
                            <h3 className="font-semibold text-gray-800">Pump location</h3>
                            <button type="button" onClick={getLocation} disabled={locLoading} className="w-full border-2 border-dashed border-orange-300 rounded-lg py-3 text-sm text-orange-500 font-medium hover:bg-orange-50 transition-colors disabled:opacity-60">
                                {locLoading ? 'Getting location...' : form.location.coordinates[0] ? `✅ Location set (${parseFloat(form.location.coordinates[1]).toFixed(4)}, ${parseFloat(form.location.coordinates[0]).toFixed(4)})` : '📍 Use my current location'}
                            </button>
                            <p className="text-xs text-gray-400 text-center">Go to your pump location and tap the button above, or enter coordinates manually below.</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500">Longitude</label>
                                    <input type="number" step="any" value={form.location.coordinates[0]} onChange={(e) => setForm({ ...form, location: { type: 'Point', coordinates: [e.target.value, form.location.coordinates[1]] } })} placeholder="85.1376" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Latitude</label>
                                    <input type="number" step="any" value={form.location.coordinates[1]} onChange={(e) => setForm({ ...form, location: { type: 'Point', coordinates: [form.location.coordinates[0], e.target.value] } })} placeholder="25.5941" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                                </div>
                            </div>
                        </div>

                        {/* Fuel stock */}
                        <div className="bg-white rounded-xl p-5 shadow-sm space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-gray-800">Fuel stock</h3>
                                {form.fuelStock.length < 3 && (
                                    <button type="button" onClick={addFuelRow} className="text-xs text-orange-500 hover:underline">+ Add fuel type</button>
                                )}
                            </div>
                            {form.fuelStock.map((fuel, i) => (
                                <div key={i} className="grid grid-cols-3 gap-2 items-center">
                                    <select value={fuel.fuelType} onChange={(e) => { const s = [...form.fuelStock]; s[i].fuelType = e.target.value; setForm({ ...form, fuelStock: s }); }} className="border rounded-lg px-2 py-2 text-sm">
                                        <option value="petrol">Petrol</option>
                                        <option value="diesel">Diesel</option>
                                        <option value="cng">CNG</option>
                                    </select>
                                    <input type="number" value={fuel.pricePerLitre} onChange={(e) => { const s = [...form.fuelStock]; s[i].pricePerLitre = e.target.value; setForm({ ...form, fuelStock: s }); }} placeholder="₹/litre" required className="border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                                    <input type="number" value={fuel.availableLitres} onChange={(e) => { const s = [...form.fuelStock]; s[i].availableLitres = e.target.value; setForm({ ...form, fuelStock: s }); }} placeholder="Litres" required className="border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                                </div>
                            ))}
                        </div>

                        {/* Delivery options */}
                        <div className="bg-white rounded-xl p-5 shadow-sm space-y-3">
                            <h3 className="font-semibold text-gray-800">Delivery options</h3>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.offersDelivery} onChange={(e) => setForm({ ...form, offersDelivery: e.target.checked })} className="w-4 h-4 accent-orange-500" />
                                <span className="text-sm text-gray-700">I can deliver fuel to customers</span>
                            </label>
                            {form.offersDelivery && (
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-500">Radius (km)</label>
                                        <input type="number" value={form.deliveryRadiusKm} onChange={(e) => setForm({ ...form, deliveryRadiusKm: e.target.value })} className="mt-1 w-full border rounded-lg px-2 py-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Min litres</label>
                                        <input type="number" value={form.minimumDeliveryLitres} onChange={(e) => setForm({ ...form, minimumDeliveryLitres: e.target.value })} className="mt-1 w-full border rounded-lg px-2 py-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Delivery charge (₹)</label>
                                        <input type="number" value={form.deliveryCharge} onChange={(e) => setForm({ ...form, deliveryCharge: e.target.value })} className="mt-1 w-full border rounded-lg px-2 py-2 text-sm" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}

                        <button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-60 transition-colors">
                            {loading ? 'Registering...' : '⛽ Register my pump'}
                        </button>
                    </form>
                )}

                {/* ── Stock update tab ─────────────────────────────────────── */}
                {tab === 'stock' && myPump && (
                    <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
                        <h3 className="font-semibold text-gray-800">Update fuel stock & prices</h3>
                        {myPump.fuelStock?.map((f, i) => (
                            <div key={f.fuelType} className="border rounded-lg p-4 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium capitalize text-gray-700">{f.fuelType}</span>
                                    <label className="flex items-center gap-1.5 text-xs">
                                        <input type="checkbox" checked={f.isAvailable} onChange={(e) => {
                                            const updated = [...myPump.fuelStock];
                                            updated[i] = { ...updated[i], isAvailable: e.target.checked };
                                            dispatch({ type: 'pump/updateLocalStock', payload: updated });
                                        }} className="accent-orange-500" />
                                        Available
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-500">Price per litre (₹)</label>
                                        <input type="number" defaultValue={f.pricePerLitre} onChange={(e) => {
                                            const updated = myPump.fuelStock.map((item, idx) =>
                                                idx === i ? { ...item, pricePerLitre: parseFloat(e.target.value) } : item
                                            );
                                            // handled on submit
                                        }} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Available litres</label>
                                        <input type="number" defaultValue={f.availableLitres} onChange={(e) => { }} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button onClick={handleStockUpdate} disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-60 transition-colors">
                            {loading ? 'Saving...' : '💾 Save stock update'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}