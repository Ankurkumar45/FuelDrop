import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet's broken default icon paths in Vite/webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const userIcon = new L.DivIcon({
    html: `<div style="background:#f97316;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px #f97316aa;"></div>`,
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

const pumpIcon = new L.DivIcon({
    html: `<div style="font-size:24px;line-height:1;">⛽</div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
});

const selectedPumpIcon = new L.DivIcon({
    html: `<div style="font-size:28px;line-height:1;filter:drop-shadow(0 0 6px #f97316);">⛽</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});

// Sub-component: re-centers map when user location changes
function RecenterMap({ lat, lng }) {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) map.setView([lat, lng], 14);
    }, [lat, lng, map]);
    return null;
}

export default function MapView({ userLocation, pumps = [], selectedPump, onPumpClick }) {
    const defaultCenter = userLocation
        ? [userLocation.lat, userLocation.lng]
        : [25.5941, 85.1376]; // Patna, Bihar

    return (
        <MapContainer
            center={defaultCenter}
            zoom={13}
            style={{ height: '100%', width: '100%', borderRadius: '12px' }}
            zoomControl={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Re-center when location loads */}
            {userLocation && <RecenterMap lat={userLocation.lat} lng={userLocation.lng} />}

            {/* User's location marker */}
            {userLocation && (
                <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                    <Popup>
                        <span className="text-sm font-medium">📍 You are here</span>
                    </Popup>
                </Marker>
            )}

            {/* Pump markers */}
            {pumps.map((pump) => {
                const [lng, lat] = pump.location.coordinates;
                const isSelected = selectedPump?._id === pump._id;
                return (
                    <Marker
                        key={pump._id}
                        position={[lat, lng]}
                        icon={isSelected ? selectedPumpIcon : pumpIcon}
                        eventHandlers={{ click: () => onPumpClick && onPumpClick(pump) }}
                    >
                        <Popup>
                            <div className="text-sm">
                                <p className="font-semibold">{pump.name}</p>
                                <p className="text-gray-500 text-xs">{pump.address?.city}</p>
                                {pump.offersDelivery && (
                                    <p className="text-blue-500 text-xs mt-1">🛵 Delivery available</p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}