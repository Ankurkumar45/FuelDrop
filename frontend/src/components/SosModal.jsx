import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendSos } from '../store/sosSlice';

export default function SosModal ({ userLocation, onClose }) {
	const dispatch = useDispatch();
	const { activeSos, loading, error } = useSelector((s) => s.sos);
	
	const [form, setForm] = useState({
		fuelType: 'petrol',
		quantityNeeded: 2,
		locationDescription: '',
	});
	
	const handleSend = async (e) => {
		e.preventDefault();
		if(!userLocation) {
			alert('Cannot get your location. Please allow location access and try again.');
			return;
		}
		await dispatch (sendSos({
			latitude: userLocation.lat,
			longitude: userLocation.lng,
			...form,
		}));
	};
	
	if (activeSos && activeSos.status === 'active') {
		return (
			<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
				<div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
		 
				  {/* Pulsing header */}
					<div className="bg-red-500 px-6 py-5 text-center">
						<div className="text-4xl mb-2 animate-bounce">🆘</div>
						<h2 className="text-white font-bold text-lg">SOS Alert Sent!</h2>
						<p className="text-red-100 text-sm mt-1">Notifying nearby petrol pumps...</p>
					</div>
		 
					<div className="p-5 space-y-4">
						{/* Alert details */}
						<div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm text-gray-600">
						  <div className="flex justify-between">
							<span>Fuel needed</span>
							<span className="font-semibold capitalize">{activeSos.fuelType} · {activeSos.quantityNeeded}L</span>
						  </div>
						  <div className="flex justify-between">
							<span>Pumps notified</span>
							<span className="font-semibold">{activeSos.notifiedPumps?.length || 0}</span>
						  </div>
						  <div className="flex justify-between">
							<span>Expires in</span>
							<span className="font-semibold text-red-500">30 minutes</span>
						  </div>
						</div>
			 
						{/* Animated waiting indicator */}
						<div className="flex items-center gap-3 bg-orange-50 rounded-xl p-3">
						  <div className="flex gap-1">
							{[0,1,2].map((i) => (
							  <div key={i} className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
								style={{ animationDelay: `${i * 0.15}s` }} />
							))}
						  </div>
						  <p className="text-sm text-orange-700">Waiting for a pump to accept...</p>
						</div>
			 
						<p className="text-xs text-gray-400 text-center">
						  Stay at your location. A pump will contact you shortly.
						</p>
			 
						<button onClick={handleCancel}
						  className="w-full border border-red-200 text-red-500 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50">
						  Cancel SOS
						</button>
					</div>
				</div>
		  </div>
		)
	}
};