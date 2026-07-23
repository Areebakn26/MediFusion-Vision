import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/api';
import { GlassCard } from '../components/ui';
import { AnimatedLogo } from '../components/brand';

const Register = () => {
    const [role, setRole] = useState('patient');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            await registerUser({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: role,
            });

            setSuccess('Registration successful! Please check your email to verify your account.');
            setFormData({ name: '', email: '', password: '', confirmPassword: '' });

            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden py-12 px-4">
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md z-10"
            >
                <GlassCard className="p-8" hover={false}>
                    <div className="text-center mb-6">
                        <Link to="/" className="inline-block mb-4">
                            <AnimatedLogo size={40} animate={false} />
                            <span className="text-xl font-light text-foreground">
                                Medi<span className="text-accent font-normal">Fusion</span>
                            </span>
                        </Link>
                        <h2 className="text-2xl font-light text-foreground mb-1">
                            Create Account
                        </h2>
                        <p className="text-foreground-muted text-sm">Join MediFusion Vision today</p>
                    </div>

                    <div className="flex justify-center gap-3 mb-6">
                        <button
                            type="button"
                            onClick={() => setRole('patient')}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all ${
                                role === 'patient'
                                    ? 'bg-accent text-white shadow-sm'
                                    : 'bg-surface-tertiary text-foreground-muted hover:bg-surface-elevated hover:text-foreground'
                            }`}
                        >
                            <span>Patient</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('doctor')}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all ${
                                role === 'doctor'
                                    ? 'bg-accent text-white shadow-sm'
                                    : 'bg-surface-tertiary text-foreground-muted hover:bg-surface-elevated hover:text-foreground'
                            }`}
                        >
                            <span>Doctor</span>
                        </button>
                    </div>

                    <div className={`p-3 rounded-xl text-sm mb-6 border ${
                        role === 'doctor'
                            ? 'bg-accent-subtle/50 border-accent/20 text-accent'
                            : 'bg-medical-subtle/50 border-medical/20 text-medical'
                    }`}>
                        {role === 'doctor' ? (
                            <>
                                <strong>Doctor Registration</strong>
                                <p className="mt-1 text-xs text-foreground-muted">After signup, you'll complete your professional profile. Access requires admin verification of your PMDC credentials.</p>
                            </>
                        ) : (
                            <>
                                <strong>Patient Registration</strong>
                                <p className="mt-1 text-xs text-foreground-muted">After signup, you'll complete your medical profile to start booking appointments with verified doctors.</p>
                            </>
                        )}
                    </div>

                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 rounded-xl bg-medical-subtle border border-medical/20 text-medical text-sm"
                        >
                            {success}
                        </motion.div>
                    )}

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-foreground">
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="John Doe"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-white/[0.06] text-foreground placeholder-foreground-subtle focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-foreground">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="your@email.com"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-white/[0.06] text-foreground placeholder-foreground-subtle focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-foreground">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Min 8 characters"
                                minLength={8}
                                required
                                className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-white/[0.06] text-foreground placeholder-foreground-subtle focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-foreground">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Re-enter password"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-white/[0.06] text-foreground placeholder-foreground-subtle focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || success}
                            className={`w-full py-3.5 rounded-button font-medium text-sm bg-accent hover:bg-accent-hover text-white transition-all active:scale-[0.97] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] focus:ring-2 focus:ring-accent/35 focus:outline-none mt-6 ${(loading || success) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Creating Account...
                                </span>
                            ) : success ? (
                                'Redirecting to Login...'
                            ) : (
                                `Create ${role === 'doctor' ? 'Doctor' : 'Patient'} Account`
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-foreground-muted">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="text-accent hover:underline font-medium"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
};

export default Register;
