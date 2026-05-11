import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, clearError } from '../store/authSlice';
import logo from '../assets/logo.png';

export default function LoginPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, user } = useSelector((state) => state.auth);

    const [form, setForm] = useState({ email: '', password: '' });

    useEffect(() => {
        if (user) navigate(getDashboardPath(user.role));
    }, [user, navigate]);

    useEffect(() => {
        return () => dispatch(clearError());
    }, [dispatch]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await dispatch(loginUser(form));
        if (loginUser.fulfilled.match(result)) {
            navigate(getDashboardPath(result.payload.user.role));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl shadow-md w-full max-w-sm p-8">

                {/* Logo */}
                <div className="text-center mb-8">
                    <img src={logo} alt="FuelDrop logo" className="mx-auto h-16 w-auto" />
                    <h1 className="text-2xl font-bold text-gray-900 mt-4">FuelDrop</h1>
                    <p className="text-gray-500 text-sm">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            autoComplete="email"
                            placeholder="ankur@example.com"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            autoComplete="current-password"
                            placeholder="Your password"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-5">
                    New to FuelDrop?{' '}
                    <Link to="/register" className="text-orange-500 hover:underline font-medium">Create account</Link>
                </p>
            </div>
        </div>
    );
}

function getDashboardPath(role) {
    if (role === 'pump_owner') return '/pump-dashboard';
    if (role === 'delivery_agent') return '/agent-dashboard';
    return '/home';
}