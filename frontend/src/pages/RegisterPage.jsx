import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, clearError } from '../store/authSlice';
import logo from '../assets/logo.png';

const ROLES = [
    { value: 'seeker', label: 'Rider / Driver', icon: '🏍️', desc: 'Find pumps & order fuel' },
    { value: 'pump_owner', label: 'Pump Owner', icon: '⛽', desc: 'List your pump & take orders' },
];

export default function RegisterPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, user } = useSelector((state) => state.auth);

    const [form, setForm] = useState({
        name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'seeker',
    });
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        if (user) navigate(getDashboardPath(user.role));
    }, [user, navigate]);

    useEffect(() => {
        return () => dispatch(clearError());
    }, [dispatch]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');

        if (form.password !== form.confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }

        const { confirmPassword, ...submitData } = form;
        const result = await dispatch(registerUser(submitData));
        if (registerUser.fulfilled.match(result)) {
            navigate(getDashboardPath(result.payload.user.role));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-10 px-4">
            <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">

                <div className="text-center mb-6">
                    <img src={logo} alt="FuelDrop logo" className="mx-auto h-16 w-auto" />
                    <h1 className="text-2xl font-bold text-gray-900 mt-4">FuelDrop</h1>
                    <p className="text-gray-500 text-sm">Create your account</p>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-6">
                    {ROLES.map((r) => (
                        <button
                            key={r.value}
                            type="button"
                            onClick={() => setForm({ ...form, role: r.value })}
                            className={`p-3 rounded-xl border-2 text-center transition-all ${form.role === r.value
                                    ? 'border-orange-500 bg-orange-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="text-xl">{r.icon}</div>
                            <div className="text-xs font-medium text-gray-700 mt-1">{r.label}</div>
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            placeholder="Ankur Kumar"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            placeholder="ankur@example.com"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                        <div className="flex">
                            <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-500 text-sm">+91</span>
                            <input
                                name="phone"
                                type="tel"
                                value={form.phone}
                                onChange={handleChange}
                                required
                                maxLength={10}
                                placeholder=""
                                className="flex-1 border border-gray-300 rounded-r-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            minLength={6}
                            placeholder="Min 6 characters"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                        <input
                            name="confirmPassword"
                            type="password"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            required
                            placeholder="Re-enter password"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                    </div>

                    {(error || localError) && (
                        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
                            {localError || error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
                    >
                        {loading ? 'Creating account...' : 'Create account'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-4">
                    Already have an account?{' '}
                    <Link to="/login" className="text-orange-500 hover:underline font-medium">Sign in</Link>
                </p>
            </div>
        </div>
    );
}

function getDashboardPath(role) {
    if (role === 'pump_owner') return '/pump-dashboard';
    return '/home';
}