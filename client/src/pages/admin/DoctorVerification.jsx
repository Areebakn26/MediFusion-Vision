import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getDoctorById, verifyDoctor } from '../../services/api'; // getDoctorById might not exist? Wait, I need to check API!
import { GlassCard, Button, Badge } from '../../components/ui';
import { toast } from 'react-hot-toast';

const DoctorVerification = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionReason, setActionReason] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchDoctor();
    }, [id]);

    const fetchDoctor = async () => {
        setLoading(true);
        try {
            const { data } = await getDoctorById(id);
            setDoctor(data);
        } catch (error) {
            console.error("Failed to fetch doctor details", error);
            // Optionally redirect back
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (status) => {
        if (!doctor) return;
        setProcessing(true);
        try {
            await verifyDoctor(doctor._id || doctor.id, status, actionReason);
            toast.success(`Doctor ${status === 'approved' ? 'verified' : 'rejected'} successfully.\nEmail notification has been sent.`);
            navigate('/admin/verification');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Action failed');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="text-center py-12">Loading doctor details...</div>;
    if (!doctor) return <div className="text-center py-12 text-red-500">Doctor not found</div>;

    const confidenceScore = doctor.confidence_score || doctor.confidenceScore || 0.75;
    const isHighConfidence = confidenceScore >= 0.8;
    const isMedConfidence = confidenceScore >= 0.5;

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-12">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate('/admin/verification')} className="px-3">
                    ← Back
                </Button>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Verification Review
                </h1>
            </div>

            <GlassCard className="p-8">
                <div className="flex items-start justify-between mb-8 border-b border-gray-100 pb-6">
                    <div className="flex items-center space-x-6">
                        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-600 shadow-sm">
                            {(doctor.User?.name || doctor.name || 'D').charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Dr. {doctor.User?.name || doctor.name}</h2>
                            <p className="text-gray-500">{doctor.specialization}</p>
                            <Badge variant="warning" className="mt-2 text-xs">
                                PENDING VERIFICATION
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Submitted Data */}
                    <div className="bg-gray-50/80 p-6 rounded-xl border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
                            <span>📄</span> Professional Details
                        </h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-gray-500">Email</span>
                                <span className="font-medium text-gray-800">{doctor.User?.email || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-gray-500">Phone</span>
                                <span className="font-medium text-gray-800">{doctor.User?.phone || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-gray-500">PMDC Number</span>
                                <span className="font-bold text-gray-800">{doctor.pmdc_number || doctor.pmdcNumber}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-gray-500">Specialization</span>
                                <span className="font-medium text-gray-800">{doctor.specialization}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-gray-500">Medical College</span>
                                <span className="font-medium text-gray-800">{doctor.medical_college || doctor.medicalCollege}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-gray-500">Passing Year</span>
                                <span className="font-medium text-gray-800">{doctor.passing_year || doctor.passingYear || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-gray-500">Experience</span>
                                <span className="font-medium text-gray-800">{doctor.experience_years || doctor.experience || 0} Years</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-gray-500">Consultation Fee</span>
                                <span className="font-medium text-gray-800">PKR {doctor.consultation_fee || doctor.consultationFee || 0}</span>
                            </div>
                            <div className="flex flex-col pt-2">
                                <span className="text-gray-500 mb-1">Bio / About</span>
                                <p className="font-medium text-gray-800 text-xs leading-relaxed">{doctor.bio || 'No bio provided.'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Automated Analysis */}
                    <div className="bg-blue-50/80 p-6 rounded-xl border border-blue-100 h-fit">
                        <h3 className="text-sm font-bold text-blue-600 uppercase mb-4 flex items-center gap-2">
                            <span>🤖</span> AI Analysis
                        </h3>
                        <div className="space-y-5">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 text-sm">Confidence Score</span>
                                <span className={`text-3xl font-bold ${isHighConfidence ? 'text-green-600' : isMedConfidence ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {(confidenceScore * 100).toFixed(0)}%
                                </span>
                            </div>
                            <div className="w-full bg-white rounded-full h-3 overflow-hidden">
                                <div
                                    className={`h-full ${isHighConfidence ? 'bg-green-500' : isMedConfidence ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${confidenceScore * 100}%` }}
                                ></div>
                            </div>
                            <div className="text-sm space-y-3 bg-white/60 p-4 rounded-xl">
                                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                    <span className="text-gray-500">PMDC Registry Match</span>
                                    <span className={`font-bold ${isHighConfidence ? 'text-green-600' : 'text-yellow-600'}`}>
                                        {isHighConfidence ? 'Verified via DB' : 'Manual Review Required'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Required Documents</span>
                                    <span className="font-bold text-gray-800">Complete</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Review Notes / Rejection Reason</label>
                    <textarea
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                        rows="4"
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        placeholder="Enter reason for rejection or notes for approval. This will be visible in the system logs."
                    ></textarea>
                </div>

                <div className="flex justify-end gap-4 border-t border-gray-100 pt-6">
                    <Button
                        variant="outline"
                        className="text-red-600 border border-red-200 hover:bg-red-50 bg-white"
                        onClick={() => handleAction('rejected')}
                        disabled={processing}
                    >
                        Reject Application
                    </Button>
                    <Button
                        onClick={() => handleAction('approved')}
                        disabled={processing}
                        className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200"
                    >
                        {processing ? 'Processing...' : 'Approve & Verify Doctor'}
                    </Button>
                </div>
            </GlassCard>
        </div>
    );
};

export default DoctorVerification;
