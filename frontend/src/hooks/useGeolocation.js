import { useState, useEffect } from 'react';

export default function useGeolocation() {
    const [location, setLocation] = useState(null);   // { lat, lng }
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            setLoading(false);
            return;
        }

        const success = (position) => {
            setLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            });
            setLoading(false);
        };

        const failure = (err) => {
            switch (err.code) {
                case err.PERMISSION_DENIED:
                    setError('Location permission denied. Please allow location access.');
                    break;
                case err.POSITION_UNAVAILABLE:
                    setError('Location information is unavailable.');
                    break;
                case err.TIMEOUT:
                    setError('Location request timed out.');
                    break;
                default:
                    setError('An unknown error occurred.');
            }
            setLoading(false);
        };

        navigator.geolocation.getCurrentPosition(success, failure, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
        });
    }, []);

    return { location, error, loading };
}