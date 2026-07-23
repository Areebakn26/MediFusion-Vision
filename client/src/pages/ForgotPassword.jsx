import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { GlassCard, Button, Input } from '../components/ui';
import { AnimatedLogo } from '../components/brand';
import api from '../services/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            await api.post('/auth/forgot-password', { email });
            setMessage('Password reset link sent to your email! Please check your inbox.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
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
                    </div>

                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 rounded-xl bg-medical-subtle border border-medical/20 text-medical text-sm"
                        >
                            {message}
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

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                        />

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="text-sm text-accent hover:underline font-medium"
                        >
                            {'\u2190'} Back to Login
                        </Link>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
