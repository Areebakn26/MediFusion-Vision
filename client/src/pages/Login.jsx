import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { getMe } from '../services/api';
import { AnimatedLogo } from '../components/brand';
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

            if (data.role === 'patient') {
                navigate('/patient/dashboard');
            } else if (data.role === 'doctor') {
                try {
                    const { data: userData } = await getMe();
                    const profile = userData.profile;

                    if (!profile || !profile.pmdc_number || !profile.specialization) {
                        navigate('/doctor/profile');
                    }
                    else if (profile.verification_status === 'approved') {
                        navigate('/doctor/dashboard');
                    }
                    else {
                        navigate('/doctor/dashboard');
                    }
                } catch (err) {
                    console.error('Error checking doctor profile:', err);
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
        <div className="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden">
            <div className="fixed inset-0 bg-gradient-to-br from-accent-subtle/20 via-surface to-medical-subtle/20" />
            <motion.div
                className="absolute top-20 left-20 w-64 h-64 bg-accent-subtle/30 rounded-full blur-3xl"
                animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
                transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
                className="absolute bottom-20 right-20 w-96 h-96 bg-medical-subtle/30 rounded-full blur-3xl"
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
                    <div className="text-center mb-8">
                        <Link to="/" className="inline-block mb-4">
                            <AnimatedLogo size={40} animate={false} />
                            <span className="text-xl font-light text-foreground">
                                Medi<span className="text-accent font-normal">Fusion</span>
                            </span>
                        </Link>
                        <h2 className="text-2xl font-light text-foreground mb-1">
                            {t('auth.welcomeBack', 'Welcome Back')}
                        </h2>
                        <p className="text-foreground-muted text-sm">{t('auth.signInToAccount', 'Sign in to your account')}</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            aria-live="polite"
                            className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            id="login-email"
                            label={t('auth.email', 'Email Address')}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('auth.emailPlaceholder', 'your@email.com')}
                            required
                            aria-required="true"
                        />

                        <Input
                            id="login-password"
                            label={t('auth.password', 'Password')}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            aria-required="true"
                        />

                        <div className="flex items-center justify-between text-sm">
                            <Link
                                to="/forgot-password"
                                className="text-accent hover:underline font-medium"
                                aria-label={t('auth.forgotPassword', 'Forgot password?')}
                            >
                                {t('auth.forgotPassword', 'Forgot password?')}
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            aria-busy={loading}
                            className={`w-full py-3.5 rounded-button font-medium text-sm bg-accent hover:bg-accent-hover text-white transition-all active:scale-[0.97] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] focus:ring-2 focus:ring-accent/35 focus:outline-none ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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

                    <div className="mt-6 text-center">
                        <p className="text-sm text-foreground-muted">
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                className="text-accent hover:underline font-medium"
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
