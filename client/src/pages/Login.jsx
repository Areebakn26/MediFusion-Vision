import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { getMe } from '../services/api';
import { GlassCard, Input } from '../components/ui';
import { useTranslation } from 'react-i18next';

const Login = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await login(email, password);

            // Route based on role and verification status
            if (data.role === 'patient') {
                navigate('/patient/dashboard');
            } else if (data.role === 'doctor') {
                // Check verification status and profile completion
                try {
                    const { data: userData } = await getMe();
                    const profile = userData.profile;

                    // If no profile or profile incomplete, go to profile page
                    if (!profile || !profile.pmdc_number || !profile.specialization) {
                        navigate('/doctor/profile');
                    }
                    // If verified, go to dashboard
                    else if (profile.verification_status === 'approved') {
                        navigate('/doctor/dashboard');
                    }
                    // If pending or rejected, go to dashboard (will show banner)
                    else {
                        navigate('/doctor/dashboard');
                    }
                } catch (err) {
                    console.error('Error checking doctor profile:', err);
                    // If can't fetch profile, go to profile page
                    navigate('/doctor/profile');
                }
            } else if (data.role === 'admin') {
                navigate('/admin/dashboard');
            }
        } catch (err) {
            if (err.response?.status === 423) {
                setError('Account locked due to too many failed attempts. Please try again in 15 minutes.');
            } else if (err.response?.status === 403) {
                const msg = err.response?.data?.message || '';
                if (msg.toLowerCase().includes('lock')) {
                    setError(msg);
                } else {
                    setError('Please verify your email before logging in. Check your inbox for the verification link.');
                }
            } else {
                setError(err.response?.data?.message || 'Invalid email or password');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50 relative overflow-hidden">
            {/* Floating Background Shapes */}
            <motion.div
                className="absolute top-20 left-20 w-64 h-64 bg-teal-200/40 rounded-full blur-3xl"
                animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
                transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
                className="absolute bottom-20 right-20 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl"
                animate={{ y: [0, -30, 0], x: [0, -20, 0] }}
                transition={{ duration: 10, repeat: Infinity }}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md px-4 z-10"
            >
                <GlassCard className="p-8" hover={false}>
                    {/* Header */}
                    <div className="text-center mb-8">
                        <Link to="/" className="inline-block mb-4">
                            <span className="text-2xl font-bold text-gray-800">
                                Medi<span className="text-teal-600">Fusion</span>
                            </span>
                        </Link>
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">
                            {t('auth.welcomeBack', 'Welcome Back')}
                        </h2>
                        <p className="text-gray-600">{t('auth.signInToAccount', 'Sign in to your account')}</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            aria-live="polite"
                            className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm"
                        >
                            ❌ {error}
                        </motion.div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="login-email" className="block text-sm font-medium mb-2 text-gray-700">
                                {t('auth.email', 'Email Address')}
                            </label>
                            <input
                                id="login-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('auth.emailPlaceholder', 'your@email.com')}
                                required
                                aria-required="true"
                                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label htmlFor="login-password" className="block text-sm font-medium mb-2 text-gray-700">
                                {t('auth.password', 'Password')}
                            </label>
                            <input
                                id="login-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                aria-required="true"
                                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
                            />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <Link
                                to="/forgot-password"
                                className="text-teal-600 hover:underline font-medium"
                                aria-label={t('auth.forgotPassword', 'Forgot password?')}
                            >
                                {t('auth.forgotPassword', 'Forgot password?')}
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            aria-busy={loading}
                            className={`w-full py-4 rounded-xl font-bold text-lg bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-lg shadow-teal-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg aria-hidden="true" className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    {t('auth.signingIn', 'Signing in...')}
                                </span>
                            ) : (
                                t('auth.signIn', 'Sign In')
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                className="text-teal-600 hover:underline font-medium"
                            >
                                Sign up
                            </Link>
                        </p>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
};

export default Login;
