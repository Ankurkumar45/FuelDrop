import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNearbyPumps, setSelectedPump, setUserLocation } from '../store/pumpSlice';
import { logout } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';
import MapView from '../components/MapView';
import PumpCard from '../components/PumpCard';
import useGeolocation from '../hooks/useGeolocation';
import useSocket from '../hooks/useSocket';
import logo from '../assets/logo.png';

const FUEL_FILTERS = ['all', 'petrol', 'diesel', 'cng'];

export default function SeekerHome() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((s) => s.auth);
    const { nearbyPumps, selectedPump, loading, error } = useSelector((s) => s.pump);
	const { myOrders } = useSelector((s) => s.order);
	const { activeSos } = useSelector((s) => s.sos);

    const { location, error: geoError, loading: geoLoading } = useGeolocation();
    useSocket();
	
	const [fuelFilter, setFuelFilter] = useState('all');
    const [radius, setRadius] = useState(10);
    const [showList, setShowList] = useState(true);

    useEffect(() => {
        if (location) {
            dispatch(setUserLocation(location));
            dispatch(fetchNearbyPumps({
                lat: location.lat,
                lng: location.lng,
                radius,
                fuelType: fuelFilter === 'all' ? undefined : fuelFilter,
            }));
        }
    }, [location, fuelFilter, radius]);
	
	const activeOrderCount = myOrders.filter((o) => 
			['pending', 'accepted', 'assigned', 'en_route'].includes(o.status)
		).length;

    const handleOrderClick = (pump) => {
        alert(`Order flow coming in Phase 3!\nPump: ${pump.name}`);
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">

            {/* Top navbar */}
            <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                    <img src={logo} alt="FuelDrop logo" className="h-8 w-auto" />
                    <span className="font-bold text-gray-800">FuelDrop</span>
                </div>
				<div className="flex items-center gap-3">
                    <button onClick={() => navigate('/order-tracking')} className="relative text-sm text-gray-600 font-medium">
						Orders
						{activeOrderCount > 0 && (
							<span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
								{activeOrderCount}
							</span>
						)}
					</button>
					<span className="text-sm text-gray-400">
						{user?.name?.split(' ')[0]}
					</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">Hi, {user?.name?.split(' ')[0]}</span>
                    <button
                        onClick={() => { dispatch(logout()); navigate('/login'); }}
                        className="text-xs text-red-500 hover:underline"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Filter bar */}
            <div className="bg-white border-b px-4 py-2 flex items-center gap-3 overflow-x-auto">
                <span className="text-xs text-gray-500 shrink-0">Fuel type:</span>
                {FUEL_FILTERS.map((f) => (
                    <button
                        key={f}
                        onClick={() => setFuelFilter(f)}
                        className={`text-xs px-3 py-1 rounded-full shrink-0 transition-colors ${fuelFilter === f
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}

                <span className="text-xs text-gray-400 shrink-0 ml-2">Radius:</span>
                <select
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                >
                    {[2, 5, 10, 20, 50, 100].map((r) => (
                        <option key={r} value={r}>{r} km</option>
                    ))}
                </select>
            </div>

            {/* Main content: map + list */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* Map */}
                <div className={`${showList ? 'hidden md:block md:flex-1' : 'flex-1'} relative`}>
                    {geoLoading ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-3xl mb-2">📍</div>
                                <p className="text-gray-500 text-sm">Getting your location...</p>
                            </div>
                        </div>
                    ) : geoError ? (
                        <div className="h-full flex items-center justify-center p-6">
                            <div className="text-center bg-white rounded-xl p-6 shadow">
                                <div className="text-3xl mb-2">🚫</div>
                                <p className="text-gray-700 font-medium text-sm">{geoError}</p>
                                <p className="text-gray-400 text-xs mt-1">Enable location access in your browser settings</p>
                            </div>
                        </div>
                    ) : (
                        <MapView
                            userLocation={location}
                            pumps={nearbyPumps}
                            selectedPump={selectedPump}
                            onPumpClick={(pump) => {
                                dispatch(setSelectedPump(pump));
                                setShowList(true);
                            }}
                        />
                    )}
                </div>

                {/* Pump list panel */}
                {showList && (
                    <div className="w-full md:w-96 bg-gray-50 overflow-y-auto flex flex-col">
                        {/* Panel header */}
                        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold text-gray-800 text-sm">
                                    {loading ? 'Searching...' : `${nearbyPumps.length} pump${nearbyPumps.length !== 1 ? 's' : ''} nearby`}
                                </h2>
                                {location && (
                                    <p className="text-xs text-gray-400 mt-0.5">Within {radius} km of your location</p>
                                )}
                            </div>
                            <button
                                onClick={() => setShowList(false)}
                                className="md:hidden text-xs text-orange-500 font-medium"
                            >
                                View map
                            </button>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mx-4 mb-3 bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg">{error}</div>
                        )}

                        {/* SOS button */}
                        <div className="px-4 mb-3">
                            <button
                                onClick={() => navigate('/sos')}
                                className={`w-full text-black text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
									activeSos?.status === 'active' ? 'bg-red-600 animate-pulse text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                            >
                                {activeSos?.status === 'active' ? 'SOS Active - tap to view' : '🆘 Emergency SOS — I need fuel now!'}
                            </button>
                        </div>

                        {/* Pump cards */}
                        <div className="px-4 pb-4 flex flex-col gap-3">
                            {loading && (
                                <div className="text-center py-8">
                                    <div className="text-2xl mb-2">⛽</div>
                                    <p className="text-gray-400 text-sm">Finding pumps near you...</p>
                                </div>
                            )}

                            {!loading && nearbyPumps.length === 0 && location && (
                                <div className="text-center py-8">
                                    <div className="text-3xl mb-2">😕</div>
                                    <p className="text-gray-600 font-medium text-sm">No pumps found nearby</p>
                                    <p className="text-gray-400 text-xs mt-1">Try increasing the radius</p>
                                </div>
                            )}

                            {nearbyPumps.map((pump) => (
                                <PumpCard
                                    key={pump._id}
                                    pump={pump}
                                    onOrderClick={(pumpToOrder) => navigate('/order-create', { state: { pump: pumpToOrder } })}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Mobile: show list toggle when map is open */}
                {!showList && (
                    <button
                        onClick={() => setShowList(true)}
                        className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 bg-white shadow-lg text-sm font-medium px-5 py-2.5 rounded-full border border-gray-200 z-20"
                    >
                        📋 Show {nearbyPumps.length} pumps
                    </button>
                )}
            </div>
			
        </div>
    );
}