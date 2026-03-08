import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/ui';
import api from '../services/api';

const VerifyEmail = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error

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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastel-blue via-white to-pastel-teal relative overflow-hidden">
            {/* Floating Background Shapes */}
            <motion.div
                className="absolute top-20 left-20 w-64 h-64 bg-primary-teal/20 rounded-full blur-3xl"
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
                    {status === 'verifying' && (
                        <>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="w-16 h-16 mx-auto mb-4 border-4 border-primary-blue border-t-transparent rounded-full"
                            />
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                Verifying Your Email
                            </h2>
                            <p className="text-gray-600">Please wait...</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', duration: 0.5 }}
                                className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center"
                            >
                                <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </motion.div>
                            <h2 className="text-2xl font-bold text-green-600 mb-2">
                                Email Verified! ✓
                            </h2>
                            <p className="text-gray-600">
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
                                className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center"
                            >
                                <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </motion.div>
                            <h2 className="text-2xl font-bold text-red-600 mb-2">
                                Verification Failed
                            </h2>
                            <p className="text-gray-600 mb-4">
                                Invalid or expired verification link.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="text-primary-blue hover:underline font-medium"
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
