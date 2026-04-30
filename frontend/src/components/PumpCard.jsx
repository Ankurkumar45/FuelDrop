import { useDispatch } from 'react-redux';
import { setSelectedPump } from '../store/pumpSlice';

const FUEL_COLORS = {
    petrol: 'bg-green-100 text-green-700',
    diesel: 'bg-blue-100 text-blue-700',
    cng: 'bg-purple-100 text-purple-700',
};

function formatDistance(metres) {
    if (metres < 1000) return `${Math.round(metres)} m`;
    return `${(metres / 1000).toFixed(1)} km`;
}

export default function PumpCard({ pump, onOrderClick }) {
    const dispatch = useDispatch();

    const availableFuels = pump.fuelStock?.filter((f) => f.isAvailable && f.availableLitres > 0) || [];

    return (
        <div
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => dispatch(setSelectedPump(pump))}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{pump.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{pump.address?.city}, {pump.address?.state}</p>
                </div>
                <div className="text-right">
                    {pump.distanceMetres !== undefined && (
                        <span className="text-xs font-medium text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                            📍 {formatDistance(pump.distanceMetres)}
                        </span>
                    )}
                </div>
            </div>

            {/* Fuel types */}
            <div className="flex flex-wrap gap-1.5 mb-3">
                {availableFuels.length === 0 ? (
                    <span className="text-xs text-gray-400">No fuel available right now</span>
                ) : (
                    availableFuels.map((f) => (
                        <span key={f.fuelType} className={`text-xs font-medium px-2 py-0.5 rounded-full ${FUEL_COLORS[f.fuelType]}`}>
                            {f.fuelType.charAt(0).toUpperCase() + f.fuelType.slice(1)} — ₹{f.pricePerLitre}/L
                        </span>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                    {pump.isOpenNow !== undefined && (
                        <span className={pump.isOpenNow ? 'text-green-500' : 'text-red-400'}>
                            {pump.isOpenNow ? '● Open' : '● Closed'}
                        </span>
                    )}
                    {pump.open24Hours && <span className="text-green-500">● Open 24hrs</span>}
                    {pump.offersDelivery && (
                        <span className="text-blue-500">🛵 Delivery available</span>
                    )}
                    {pump.averageRating > 0 && (
                        <span>⭐ {pump.averageRating.toFixed(1)}</span>
                    )}
                </div>

                {pump.offersDelivery && onOrderClick && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onOrderClick(pump); }}
                        className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                        Order fuel
                    </button>
                )}
            </div>
        </div>
    );
}