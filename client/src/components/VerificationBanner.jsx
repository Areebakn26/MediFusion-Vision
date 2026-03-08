import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaHourglassHalf, FaTimesCircle, FaCheckCircle } from 'react-icons/fa';

const VerificationBanner = ({ status, role = 'doctor' }) => {
    if (status === 'approved') {
        return null; // Don't show banner if approved
    }

    const isPending = status === 'pending';
    const isRejected = status === 'rejected';

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border-l-4 p-4 mb-6 rounded-r-xl ${
                isPending
                    ? 'bg-yellow-50 border-yellow-500'
                    : 'bg-red-50 border-red-500'
            }`}
        >
            <div className="flex items-start gap-4">
                <div className="text-2xl">
                    {isPending ? (
                        <FaHourglassHalf className="text-yellow-600" />
                    ) : (
                        <FaTimesCircle className="text-red-600" />
                    )}
                </div>
                <div className="flex-1">
                    <h3 className={`font-bold mb-1 ${isPending ? 'text-yellow-800' : 'text-red-800'}`}>
                        {isPending ? 'Verification Pending' : 'Verification Rejected'}
                    </h3>
                    <p className={`text-sm mb-2 ${isPending ? 'text-yellow-700' : 'text-red-700'}`}>
                        {isPending
                            ? 'Your profile is under review by our administration. You can browse the platform, but some features are limited until verification is complete. You will receive an email notification once verified.'
                            : 'Your verification was rejected. Please review your profile details and contact support if needed.'}
                    </p>
                    <Link
                        to={role === 'doctor' ? '/doctor/profile' : '/patient/profile'}
                        className={`text-sm font-medium underline ${isPending ? 'text-yellow-800' : 'text-red-800'}`}
                    >
                        {isPending ? 'View Profile →' : 'Update Profile →'}
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

export default VerificationBanner;

