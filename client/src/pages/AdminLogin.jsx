import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/ui';
import { AnimatedLogo } from '../components/brand';

const AdminLogin = () => {
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
            if (data.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                setError('Access denied. Admin credentials required.');
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden">
            <div className="fixed inset-0 bg-gradient-to-br from-error/10 via-surface to-accent-subtle/10" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNCkiLz48L2c+PC9zdmc+')] opacity-30" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md px-4 z-10"
            >
                <GlassCard className="p-8" hover={false}>
                    <div className="text-center mb-8">
                        <Link to="/" className="inline-block mb-4">
                            <AnimatedLogo size={56} animate={false} variant="inverse" />
                            <span className="text-xl font-light text-foreground">
                                Medi<span className="text-accent font-normal">Fusion</span>
                            </span>
                        </Link>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-foreground">Admin Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@medifusion.com"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-white/[0.06] text-foreground placeholder-foreground-subtle focus:border-error focus:ring-2 focus:ring-error/20 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-foreground">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-white/[0.06] text-foreground placeholder-foreground-subtle focus:border-error focus:ring-2 focus:ring-error/20 outline-none transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3.5 rounded-button font-medium text-sm bg-error hover:bg-error/90 text-white transition-all active:scale-[0.97] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] focus:ring-2 focus:ring-error/35 focus:outline-none ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Authenticating...' : 'Access Admin Panel'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-foreground-subtle">
                            This page is monitored. Unauthorized access attempts will be logged.
                        </p>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
