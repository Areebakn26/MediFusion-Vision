import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/ui';
import { AnimatedLogo } from '../components/brand';
import api from '../services/api';

const VerifyEmail = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying');

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                await api.post('/auth/verify-email', { token });
                setStatus('success');
                setTimeout(() => navigate('/login'), 3000);
            } catch (error) {
                setStatus('error');
            }
        };

        if (token) {
            verifyEmail();
        }
    }, [token, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden">
            <div className="fixed inset-0 bg-gradient-to-br from-accent-subtle/20 via-surface to-medical-subtle/20" />
            <motion.div
                className="absolute top-20 left-20 w-64 h-64 bg-accent-subtle/30 rounded-full blur-3xl"
                animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
                transition={{ duration: 8, repeat: Infinity }}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md px-4 z-10"
            >
                <GlassCard className="p-8 text-center" hover={false}>
                    <AnimatedLogo size={48} animate={false} className="mb-4" />
                    {status === 'verifying' && (
                        <>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="w-14 h-14 mx-auto mb-4 border-3 border-accent border-t-transparent rounded-full"
                            />
                            <h2 className="text-xl font-light text-foreground mb-1">
                                Verifying Your Email
                            </h2>
                            <p className="text-foreground-muted text-sm">Please wait...</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', duration: 0.5 }}
                                className="w-14 h-14 mx-auto mb-4 bg-medical-subtle rounded-full flex items-center justify-center"
                            >
                                <svg className="w-8 h-8 text-medical" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </motion.div>
                            <h2 className="text-xl font-light text-medical mb-1">
                                Email Verified!
                            </h2>
                            <p className="text-foreground-muted text-sm">
                                Redirecting to login...
                            </p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', duration: 0.5 }}
                                className="w-14 h-14 mx-auto mb-4 bg-error/10 rounded-full flex items-center justify-center"
                            >
                                <svg className="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </motion.div>
                            <h2 className="text-xl font-light text-error mb-1">
                                Verification Failed
                            </h2>
                            <p className="text-foreground-muted text-sm mb-4">
                                Invalid or expired verification link.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="text-accent hover:underline font-medium"
                            >
                                Go to Login
                            </button>
                        </>
                    )}
                </GlassCard>
            </motion.div>
        </div>
    );
};

export default VerifyEmail;
