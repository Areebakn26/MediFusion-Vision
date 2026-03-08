import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/api';
import { GlassCard } from '../components/ui';

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

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password strength
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
            
            // Clear form
            setFormData({ name: '', email: '', password: '', confirmPassword: '' });

            // Redirect to login after 3 seconds
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50 relative overflow-hidden py-12 px-4">
            {/* Floating Background Shapes */}
            <motion.div
                className="absolute top-20 left-20 w-64 h-64 bg-teal-200/30 rounded-full blur-3xl"
                animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
                transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
                className="absolute bottom-20 right-20 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"
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
                    {/* Header */}
                    <div className="text-center mb-6">
                        <Link to="/" className="inline-block mb-4">
                            <span className="text-2xl font-bold text-gray-800">
                                Medi<span className="text-teal-600">Fusion</span>
                            </span>
                        </Link>
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">
                            Create Account
                        </h2>
                        <p className="text-gray-600">Join MediFusion Vision today</p>
                    </div>

                    {/* Role Selector */}
                    <div className="flex justify-center gap-3 mb-6">
                        <button
                            type="button"
                            onClick={() => setRole('patient')}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
                                role === 'patient'
                                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-200'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <span className="text-lg">👤</span>
                            <span>Patient</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('doctor')}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
                                role === 'doctor'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <span className="text-lg">👨‍⚕️</span>
                            <span>Doctor</span>
                        </button>
                    </div>

                    {/* Info Box */}
                    <div className={`p-3 rounded-xl text-sm mb-6 ${
                        role === 'doctor' 
                            ? 'bg-blue-50 border border-blue-200 text-blue-700'
                            : 'bg-teal-50 border border-teal-200 text-teal-700'
                    }`}>
                        {role === 'doctor' ? (
                            <>
                                <strong>👨‍⚕️ Doctor Registration</strong>
                                <p className="mt-1 text-xs">After signup, you'll complete your professional profile. Access requires admin verification of your PMDC credentials.</p>
                            </>
                        ) : (
                            <>
                                <strong>👤 Patient Registration</strong>
                                <p className="mt-1 text-xs">After signup, you'll complete your medical profile to start booking appointments with verified doctors.</p>
                            </>
                        )}
                    </div>

                    {/* Success Message */}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm"
                        >
                            ✅ {success}
                        </motion.div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm"
                        >
                            ❌ {error}
                        </motion.div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="John Doe"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="your@email.com"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">
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
                                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Re-enter password"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || success}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all mt-6 ${
                                role === 'doctor'
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
                                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-200'
                            } ${(loading || success) ? 'opacity-50 cursor-not-allowed' : ''}`}
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

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="text-teal-600 hover:underline font-medium"
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
