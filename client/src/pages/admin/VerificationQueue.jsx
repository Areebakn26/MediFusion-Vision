import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getPendingDoctors } from '../../services/api';
import { GlassCard, Button, Badge } from '../../components/ui';

const VerificationQueue = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        setLoading(true);
        try {
            const { data } = await getPendingDoctors();
            setDoctors(data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch doctors", error);
            setLoading(false);
        }
    };

    const getConfidenceBadge = (score) => {
        let variant = 'danger';
        if (score >= 0.8) variant = 'success';
        else if (score >= 0.5) variant = 'warning';

        return <Badge variant={variant}>{(score * 100).toFixed(0)}% Match</Badge>;
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Doctor Verification Queue
                </h1>
                <div className="bg-white/50 px-4 py-2 rounded-full text-sm font-medium text-gray-600">
                    Pending: <span className="text-blue-600 font-bold">{doctors.length}</span>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading queue...</div>
            ) : doctors.length === 0 ? (
                <GlassCard className="p-12 text-center">
                    <div className="text-4xl mb-4">✅</div>
                    <h3 className="text-xl font-bold text-gray-800">All Caught Up!</h3>
                    <p className="text-gray-500">No pending doctor verifications.</p>
                </GlassCard>
            ) : (
                <div className="space-y-4">
                    {doctors.map((doctor, index) => (
                        <motion.div
                            key={doctor._id || doctor.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <GlassCard className="p-6 flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-lg transition-all border border-transparent hover:border-blue-200">
                                <div className="flex items-center space-x-4 w-full md:w-auto">
                                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600 shadow-sm">
                                        {(doctor.User?.name || doctor.name || 'D').charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">{doctor.User?.name || doctor.name}</h3>
                                        <div className="text-sm text-gray-500 flex flex-wrap gap-2 mt-1">
                                            <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-medium">PMDC: {doctor.pmdc_number || doctor.pmdcNumber}</span>
                                            <span>•</span>
                                            <span>{doctor.specialization}</span>
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {doctor.medical_college || doctor.medicalCollege}, {doctor.passing_year || doctor.passingYear}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">Confidence</div>
                                        {getConfidenceBadge(doctor.confidence_score || doctor.confidenceScore || 0.75)}
                                    </div>

                                    <Button onClick={() => navigate(`/admin/verification/${doctor._id || doctor.id}`)} className="bg-blue-600 text-white hover:bg-blue-700">
                                        Review Application
                                    </Button>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VerificationQueue;
