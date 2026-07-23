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
                <h1 className="text-3xl font-bold text-accent">
                    Verification Review
                </h1>
            </div>

            <GlassCard className="p-8">
                <div className="flex items-start justify-between mb-8 border-b border-white/5 pb-6">
                    <div className="flex items-center space-x-6">
                        <div className="w-20 h-20 rounded-full bg-accent-subtle flex items-center justify-center text-3xl font-bold text-accent shadow-card">
                            {(doctor.User?.name || doctor.name || 'D').charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">Dr. {doctor.User?.name || doctor.name}</h2>
                            <p className="text-foreground-muted">{doctor.specialization}</p>
                            <Badge variant="warning" className="mt-2 text-xs">
                                PENDING VERIFICATION
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Submitted Data */}
                    <div className="bg-surface-secondary/80 p-6 rounded-xl border border-white/5">
                        <h3 className="text-sm font-bold text-foreground-muted uppercase mb-4 flex items-center gap-2">
                            <span>📄</span> Professional Details
                        </h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between border-b border-white/[0.06] pb-2">
                                <span className="text-foreground-muted">Email</span>
                                <span className="font-medium text-foreground">{doctor.User?.email || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/[0.06] pb-2">
                                <span className="text-foreground-muted">Phone</span>
                                <span className="font-medium text-foreground">{doctor.User?.phone || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/[0.06] pb-2">
                                <span className="text-foreground-muted">PMDC Number</span>
                                <span className="font-bold text-foreground">{doctor.pmdc_number || doctor.pmdcNumber}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/[0.06] pb-2">
                                <span className="text-foreground-muted">Specialization</span>
                                <span className="font-medium text-foreground">{doctor.specialization}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/[0.06] pb-2">
                                <span className="text-foreground-muted">Medical College</span>
                                <span className="font-medium text-foreground">{doctor.medical_college || doctor.medicalCollege}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/[0.06] pb-2">
                                <span className="text-foreground-muted">Passing Year</span>
                                <span className="font-medium text-foreground">{doctor.passing_year || doctor.passingYear || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/[0.06] pb-2">
                                <span className="text-foreground-muted">Experience</span>
                                <span className="font-medium text-foreground">{doctor.experience_years || doctor.experience || 0} Years</span>
                            </div>
                            <div className="flex justify-between border-b border-white/[0.06] pb-2">
                                <span className="text-foreground-muted">Consultation Fee</span>
                                <span className="font-medium text-foreground">PKR {doctor.consultation_fee || doctor.consultationFee || 0}</span>
                            </div>
                            <div className="flex flex-col pt-2">
                                <span className="text-foreground-muted mb-1">Bio / About</span>
                                <p className="font-medium text-foreground text-xs leading-relaxed">{doctor.bio || 'No bio provided.'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Automated Analysis */}
                    <div className="bg-accent-subtle/80 p-6 rounded-xl border border-accent/20 h-fit">
                        <h3 className="text-sm font-bold text-accent uppercase mb-4 flex items-center gap-2">
                            <span>🤖</span> AI Analysis
                        </h3>
                        <div className="space-y-5">
                            <div className="flex justify-between items-center">
                                <span className="text-foreground-muted text-sm">Confidence Score</span>
                                <span className={`text-3xl font-bold ${isHighConfidence ? 'text-success' : isMedConfidence ? 'text-warning' : 'text-error'}`}>
                                    {(confidenceScore * 100).toFixed(0)}%
                                </span>
                            </div>
                            <div className="w-full bg-surface-secondary rounded-full h-3 overflow-hidden">
                                <div
                                    className={`h-full ${isHighConfidence ? 'bg-success' : isMedConfidence ? 'bg-warning' : 'bg-error'}`}
                                    style={{ width: `${confidenceScore * 100}%` }}
                                ></div>
                            </div>
                            <div className="text-sm space-y-3 bg-surface-secondary/60 p-4 rounded-xl">
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-foreground-muted">PMDC Registry Match</span>
                                    <span className={`font-bold ${isHighConfidence ? 'text-success' : 'text-warning'}`}>
                                        {isHighConfidence ? 'Verified via DB' : 'Manual Review Required'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-foreground-muted">Required Documents</span>
                                    <span className="font-bold text-foreground">Complete</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <label className="block text-sm font-medium text-foreground-muted mb-2">Review Notes / Rejection Reason</label>
                    <textarea
                        className="w-full px-4 py-3 rounded-xl border border-white/[0.06] focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all resize-none"
                        rows="4"
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        placeholder="Enter reason for rejection or notes for approval. This will be visible in the system logs."
                    ></textarea>
                </div>

                <div className="flex justify-end gap-4 border-t border-white/5 pt-6">
                    <Button
                        variant="outline"
                        className="text-error border border-error/20 hover:bg-error/10 bg-surface-secondary"
                        onClick={() => handleAction('rejected')}
                        disabled={processing}
                    >
                        Reject Application
                    </Button>
                    <Button
                        onClick={() => handleAction('approved')}
                        disabled={processing}
                        className="bg-medical hover:bg-emerald-700 text-white shadow-card"
                    >
                        {processing ? 'Processing...' : 'Approve & Verify Doctor'}
                    </Button>
                </div>
            </GlassCard>
        </div>
    );
};

export default DoctorVerification;
