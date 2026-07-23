import { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { GlassCard, Button, Input } from '../components/ui';
import { AnimatedLogo } from '../components/brand';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/reset-password', { token, newPassword: password });
            toast.success('Password reset successful! You can now login with your new password.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reset password. Link may be expired.');
            setError(err.response?.data?.message || 'Failed to reset password. Link may be expired.');
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
                        <AnimatedLogo size={40} animate={false} />
                        <h2 className="text-2xl font-light text-foreground mb-1">
                            Reset Password
                        </h2>
                        <p className="text-foreground-muted text-sm">
                            Enter your new password
                        </p>
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

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="New Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />

                        <Input
                            label="Confirm Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </Button>
                    </form>
                </GlassCard>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
