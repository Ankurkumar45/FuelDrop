import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchIncomingSos, respondSos } from '../store/sosSlice';

function timeAgo(dateString) {
	const date = new Date(dateString);
	const now = new Date();
	const secondsAgo = Math.floor((now - date) / 1000);
	if (secondsAgo < 60) return `${secondsAgo} seconds ago`;
	const minutesAgo = Math.floor(secondsAgo / 60);
	if (minutesAgo < 60) return `${minutesAgo} minutes ago`;
	const hoursAgo = Math.floor(minutesAgo / 60);
	if (hoursAgo < 24) return `${hoursAgo} hours ago`;
	const daysAgo = Math.floor(hoursAgo / 24);
	return `${daysAgo} days ago`;
}

export default function SosInbox() {
	const dispatch = useDispatch();
	const { incomingSos, loading } = useSelector((s) => s.sos);

	useEffect(() => {
		dispatch(fetchIncomingSos());

		const interval = setInterval(() => dispatch(fetchIncomingSos()), 30000);
		return () => clearInterval(interval);
	}, []);

	const handleRespond = async (sosId, response) => {
		await dispatch(respondSos({
			id: sosId,
			response
		}));
	};

	if (loading && incomingSos.length === 0) {
		return <p className="text-center text-gray-400 text-sm py-8">Checking for SOS alerts...</p>;
	}

	if (incomingSos.length === 0) {
		return (
			<div className="text-center py-10 bg-white rounded-xl">
				<div className="text-3xl mb-2">🔕</div>
				<p className="text-gray-400 text-sm">No active SOS alerts nearby</p>
				<p className="text-gray-300 text-xs mt-1">Alerts appear here in real-time when riders need emergency fuel</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{incomingSos.map((sos) => (
				<div key={sos._id} className="bg-white rounded-xl shadow-sm border-l-4 border-red-500 p-4">
					{/* Header */}
					<div className="flex items-start justify-between mb-3">
						<div className="flex items-center gap-2">
							<span className="text-2xl animate-pulse">🆘</span>
							<div>
								<p className="font-semibold text-gray-800 text-sm">{sos.seeker?.name}</p>
								<p className="text-xs text-gray-400">{sos.seeker?.phone}</p>
							</div>
						</div>
						<span className="text-xs text-gray-400">{timeAgo(sos.createdAt)}</span>
					</div>

					{/* Details */}
					<div className="space-y-1.5 mb-4 text-xs text-gray-600">
						<div className="flex items-start gap-1.5">
							<span>⛽</span>
							<span className="capitalize font-medium">{sos.fuelType} · {sos.quantityNeeded}L needed</span>
						</div>
						{sos.locationDescription && (
							<div className="flex items-start gap-1.5">
								<span className="mt-0.5">📍</span>
								<span>{sos.locationDescription}</span>
							</div>
						)}
						<div className="flex items-start gap-1.5">
							<span>⏱️</span>
							<span>Expires at {new Date(sos.expiresAt).toLocaleTimeString()}</span>
						</div>
					</div>

					{/* Action buttons */}
					<div className="flex gap-2">
						<button
							onClick={() => handleRespond(sos._id, 'accepted')}
							className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
						>
							✅ Accept & Help
						</button>
						<button
							onClick={() => handleRespond(sos._id, 'declined')}
							className="flex-1 border border-gray-200 text-gray-500 text-sm py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
						>
							Decline
						</button>
					</div>
				</div>
			))}
		</div>
	);
}