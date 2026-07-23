import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { GlassCard, Button, Badge } from '../../components/ui';
import {
    FaArrowLeft,
    FaBrain,
    FaEye,
    FaLungs,
    FaXRay,
    FaCheckCircle,
    FaExclamationTriangle,
    FaCalendarAlt,
    FaUserMd,
    FaDownload,
    FaSpinner,
    FaPlay,
    FaStop,
    FaVolumeUp,
    FaInfoCircle,
    FaMicroscope,
    FaCertificate
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { speakText, stopSpeaking } from '../../utils/tts';

const ScanResults = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const ttsEnabled = user?.accessibilitySettings?.ttsEnabled || false;
    const [isSpeakingAI, setIsSpeakingAI] = useState(false);
    const [isSpeakingDoc, setIsSpeakingDoc] = useState(false);
    const [scan, setScan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    useEffect(() => {
        fetchScanResults();
    }, [id]);

    const fetchScanResults = async () => {
        try {
            const { data } = await api.get(`/scans/${id}`);
            setScan(data);
        } catch (error) {
            console.error("Error fetching scan:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async (report) => {
        const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        if (report?.final_report) {
            window.open(`${base}${report.final_report}`, '_blank');
            return;
        }
        // Fallback: generate on-demand for reports finalized before PDF path was saved
        setDownloadingPdf(true);
        try {
            const response = await api.post(`/scans/${id}/report/pdf`, {}, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `MediFusion_Report_${id.slice(0, 8)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            alert('PDF generation failed. Please try again later.');
        } finally {
            setDownloadingPdf(false);
        }
    };

    const getMockScan = () => ({
        id: id,
        scan_type: 'mri_brain',
        file_url: '/uploads/sample-scan.jpg',
        status: 'verified',
        ai_prediction: {
            scan_type: 'brain_mri',
            tumor: { prediction: 'No Tumor Detected', confidence: 0.98 },
            alzheimer: { prediction: 'Mild Demented', confidence: 0.82 }
        },
        ai_explanation: {
            tumor_finding: 'No mass effect or midline shift. Brain tissue shows no abnormal growth.',
            alz_finding: 'Moderate hippocampal atrophy and ventricular enlargement observed.',
            clinical_note: 'Findings consistent with early-stage neurodegeneration.'
        },
        Reports: [{
            diagnosis: 'Early-stage Alzheimer\'s Disease (Probable)',
            doctor_notes: 'MRI findings show characteristic patterns of early Alzheimer\'s disease including hippocampal volume loss and ventricular enlargement. Recommend neuropsychological testing.',
            recommendations: 'Consult with neurology, start cognitive enhancement therapy, follow-up MRI in 6 months.',
            report_patient_friendly: 'The scan shows signs of early memory-related changes (Alzheimer\'s), but no tumors were found.',
            Doctor: { 
                User: { name: 'Dr. Ahmed Neurologist' },
                specialization: 'Neurology Specialist',
                pmdc_number: 'PMDC-12345-N'
            },
            finalized: true,
            finalized_at: new Date().toISOString(),
            final_report: '/uploads/reports/sample.pdf'
        }],
        createdAt: new Date().toISOString()
    });

    const parseAIResult = (scan) => {
        const aiPred = scan?.ai_prediction;
        if (!aiPred) return { condition: 'Analysis Pending', confidence: 0 };

        // Brain MRI format
        if (aiPred.scan_type === 'brain_mri') {
            const tumorConf = aiPred.tumor?.confidence || 0;
            const alzConf = aiPred.alzheimer?.confidence || 0;
            
            if (tumorConf > alzConf && aiPred.tumor?.prediction !== 'No Tumor Detected') {
                return { 
                    condition: aiPred.tumor?.prediction || 'No Tumor Detected', 
                    confidence: tumorConf 
                };
            } else {
                return { 
                    condition: aiPred.alzheimer?.prediction || 'Normal Brain', 
                    confidence: alzConf 
                };
            }
        }

        // Retinal format
        if (aiPred.class_name) {
            return { 
                condition: aiPred.class_name, 
                confidence: aiPred.confidence 
            };
        }

        return { 
            condition: aiPred.primary?.condition || 'Analysis Complete', 
            confidence: aiPred.primary?.confidence || 0 
        };
    };

    const renderAIExplanation = (explanation) => {
        if (!explanation) return null;
        
        let data = explanation;
        if (typeof explanation === 'string') {
            try {
                data = JSON.parse(explanation);
            } catch (e) {
                return <p className="text-sm text-foreground-muted">{explanation}</p>;
            }
        }

        return (
            <div className="space-y-4">
                {data.tumor_finding && (
                    <div className="bg-surface-secondary/60 p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] font-bold text-foreground-subtle uppercase tracking-wider mb-1">Tumor Analysis</p>
                        <p className="text-sm text-foreground leading-relaxed">{data.tumor_finding}</p>
                    </div>
                )}
                {data.alz_finding && (
                    <div className="bg-surface-secondary/60 p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] font-bold text-foreground-subtle uppercase tracking-wider mb-1">Alzheimer's Analysis</p>
                        <p className="text-sm text-foreground leading-relaxed">{data.alz_finding}</p>
                    </div>
                )}
                {data.why_prediction && (
                    <div className="bg-accent-subtle/50 p-3 rounded-xl border border-accent/20">
                        <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1">Clinical Pattern Detected</p>
                        <p className="text-sm text-foreground leading-relaxed">{data.why_prediction}</p>
                    </div>
                )}
                {data.clinical_note && (
                    <div className="bg-warning/10 p-3 rounded-xl border border-warning/20">
                        <p className="text-[10px] font-bold text-warning uppercase tracking-wider mb-1">Diagnostic Note</p>
                        <p className="text-sm text-foreground italic leading-relaxed">{data.clinical_note}</p>
                    </div>
                )}
            </div>
        );
    };

    const getScanIcon = (type) => {
        const icons = {
            mri_brain: <FaBrain className="text-accent" />,
            retinal: <FaEye className="text-accent" />,
            xray: <FaLungs className="text-accent" />,
            ct_scan: <FaXRay className="text-accent" />
        };
        return icons[type] || <FaLungs className="text-foreground-muted" />;
    };

    const getConfidenceColor = (confidence) => {
        if (confidence >= 0.8) return 'text-success';
        if (confidence >= 0.6) return 'text-warning';
        return 'text-error';
    };

    const getSeverityFromConfidence = (confidence) => {
        if (confidence >= 0.85) return { text: 'High Confidence', color: 'bg-success/10 text-success' };
        if (confidence >= 0.7) return { text: 'Moderate Confidence', color: 'bg-warning/10 text-warning' };
        return { text: 'Low Confidence', color: 'bg-error/10 text-error' };
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-accent mx-auto mb-4" />
                    <p className="text-foreground-muted animate-pulse">Retrieving diagnostic data...</p>
                </div>
            </div>
        );
    }

    if (!scan) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <GlassCard className="p-8 text-center max-w-md">
                    <FaExclamationTriangle className="text-4xl text-warning mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-foreground mb-2">Scan Record Unreachable</h2>
                    <p className="text-foreground-muted mb-6">The requested diagnostic scan could not be found or access was denied.</p>
                    <Link to="/patient/scans">
                        <Button className="w-full">Back to My Scans</Button>
                    </Link>
                </GlassCard>
            </div>
        );
    }

    const aiInfo = parseAIResult(scan);
    const report = scan.Reports?.[0];
    const isFinalized = report?.finalized;
    const severityInfo = getSeverityFromConfidence(aiInfo.confidence);

    return (
        <div className="min-h-screen bg-surface p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/patient/scans">
                            <button className="p-2 hover:bg-surface-tertiary rounded-full transition-colors">
                                <FaArrowLeft className="text-foreground-muted" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                {isFinalized ? 'Diagnostic Report' : 'Scan Analysis Results'}
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-foreground-muted mt-1">
                                <Badge variant="primary" className="bg-accent-subtle text-accent uppercase text-[10px]">
                                    ID: {scan.id?.slice(0, 8)}
                                </Badge>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <FaCalendarAlt className="text-[10px]" /> 
                                    {new Date(scan.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {isFinalized && (
                            <Button
                                onClick={() => handleDownloadPDF(report)}
                                disabled={downloadingPdf}
                                className="bg-accent hover:bg-accent-hover text-white"
                            >
                                <FaDownload className="mr-2" />
                                {downloadingPdf ? 'Generating...' : 'Download Official PDF'}
                            </Button>
                        )}
                        <Badge variant={isFinalized ? 'success' : 'warning'} className="px-4 py-1.5 uppercase tracking-wider text-[10px]">
                            {isFinalized ? 'Finalized' : 'Preliminary AI Preview'}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LEFT COLUMN: Image & View Controls */}
                    <div className="lg:col-span-7 space-y-6">
                            <GlassCard className="overflow-hidden border-0 shadow-card">
                            <div className="bg-surface p-2 md:p-6 relative min-h-[400px] flex flex-col">
                                {/* Image Overlay Controls */}
                                <div className="absolute top-6 left-6 z-20 flex gap-2">
                                    <button
                                        onClick={() => setShowHeatmap(false)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!showHeatmap ? 'bg-surface-secondary text-foreground shadow-card' : 'bg-surface-tertiary text-foreground hover:bg-surface-tertiary/80'}`}
                                    >
                                        Original
                                    </button>
                                    <button
                                        onClick={() => setShowHeatmap(true)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${showHeatmap ? 'bg-surface-secondary text-foreground shadow-card' : 'bg-surface-tertiary text-foreground hover:bg-surface-tertiary/80'}`}
                                    >
                                        AI Analysis Overlay
                                    </button>
                                </div>

                                {/* Main Image */}
                                <div className="flex-1 flex items-center justify-center relative overflow-hidden rounded-xl">
                                    <AnimatePresence mode="wait">
                                        <motion.img
                                            key={showHeatmap ? 'heatmap' : 'original'}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            src={showHeatmap && scan.ai_heatmap_url ? `${import.meta.env.VITE_API_URL.split('/api')[0]}${scan.ai_heatmap_url}` : `${import.meta.env.VITE_API_URL.split('/api')[0]}${scan.file_url}`}
                                            alt="Medical Scan"
                                            className="max-h-[600px] w-auto object-contain"
                                            onError={(e) => {
                                                e.target.src = 'https://prod-images-static.radiopaedia.org/images/157210/332ea09151e9639f66a439777d617d_jumbo.jpg';
                                            }}
                                        />
                                    </AnimatePresence>
                                </div>

                                {/* Legend */}
                                {showHeatmap && (
                                    <div className="mt-4 flex items-center justify-center gap-6 text-white text-[10px] font-medium uppercase tracking-widest bg-white/5 py-3 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-sm bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                                            <span>Abnormal Activity</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-sm bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]"></div>
                                            <span>Suspicious Region</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Scan Meta Footer */}
                            <div className="px-6 py-4 bg-surface-secondary flex items-center justify-between border-t border-white/5">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-surface-secondary/60 rounded-xl">
                                            {getScanIcon(scan.scan_type)}
                                        </div>
                                        <span className="text-sm font-bold text-foreground-muted capitalize">
                                            {(scan.scan_type || 'unknown').replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="h-4 w-px bg-white/[0.06]"></div>
                                    <div className="flex items-center gap-2 text-foreground-muted">
                                        <FaMicroscope className="text-xs" />
                                        <span className="text-xs font-medium uppercase">{scan.facility_name || 'Standard Radiology'}</span>
                                    </div>
                                </div>
                                <button className="text-accent hover:text-accent-hover transition-colors">
                                    <FaDownload className="text-sm" />
                                </button>
                            </div>
                        </GlassCard>

                        {/* Additional Clinical Info if present */}
                        {scan.notes && (
                            <div className="p-6 bg-accent-subtle/50 rounded-xl border border-accent/20">
                                <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                                    <FaInfoCircle /> Patient Clinical History
                                </h4>
                                <p className="text-sm text-foreground-muted leading-relaxed">
                                    {scan.notes}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Results & Reports */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* 1. DOCTOR'S REPORT (IF FINALIZED) */}
                        {isFinalized ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <div className="bg-surface-secondary rounded-xl shadow-card overflow-hidden border border-white/5 ring-1 ring-white/5">
                                    <div className="bg-surface p-8 text-white">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-2 bg-white/10 rounded-lg">
                                                <FaUserMd className="text-2xl text-accent" />
                                            </div>
                                            <Badge className="bg-accent-subtle text-accent border-accent/20 font-bold px-3 py-1">OFFICIAL REPORT</Badge>
                                        </div>
                                        <h3 className="text-2xl font-black tracking-tight">Official Physician Report</h3>
                                        <p className="text-foreground-subtle text-sm mt-1">Verified Medical Diagnostic Document</p>
                                    </div>
                                    
                                    <div className="p-8 space-y-6">
                                        {/* Physician Info */}
                                        <div className="flex items-center gap-4 pb-6 border-b border-white/5">
                                            <div className="w-14 h-14 bg-accent-subtle rounded-xl flex items-center justify-center text-accent">
                                                <FaUserMd className="text-2xl" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-foreground">{report.Doctor?.User?.name || 'Assigned Physician'}</p>
                                                <p className="text-sm text-foreground-muted font-medium">{report.Doctor?.specialization || 'Radiology Specialist'}</p>
                                                <p className="text-[10px] text-foreground-subtle font-bold tracking-widest mt-1">LICENSE: {report.Doctor?.pmdc_number || 'N/A'}</p>
                                            </div>
                                        </div>

                                        {/* Findings */}
                                        <div>
                                            <h4 className="text-xs font-bold text-foreground-subtle uppercase tracking-widest mb-3">Findings</h4>
                                            <p className="text-foreground-muted text-sm leading-relaxed whitespace-pre-wrap">
                                                {report.doctor_notes || 'No specific findings documented.'}
                                            </p>
                                        </div>

                                        {/* Impression */}
                                        <div className="p-4 bg-accent-subtle/50 rounded-xl border border-accent/20">
                                            <h4 className="text-xs font-bold text-accent uppercase tracking-widest mb-2">Impression / Conclusion</h4>
                                            <p className="text-foreground font-bold leading-relaxed">
                                                {report.diagnosis}
                                            </p>
                                        </div>

                                        {/* Recommendations */}
                                        {report.recommendations && (
                                            <div>
                                                <h4 className="text-xs font-bold text-foreground-subtle uppercase tracking-widest mb-3">Recommendations</h4>
                                                <div className="p-4 bg-surface-secondary/60 rounded-xl">
                                                    <p className="text-foreground-muted text-sm italic leading-relaxed">
                                                        {report.recommendations}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Patient Friendly Summary */}
                                        {report.report_patient_friendly && (
                                            <div className="bg-accent-subtle p-5 rounded-xl border border-accent/20">
                                                <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                                                    <FaInfoCircle /> Patient Summary
                                                </h4>
                                                <p className="text-foreground-muted text-sm leading-relaxed">
                                                    {report.report_patient_friendly}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="px-8 py-4 bg-surface-secondary/60 border-t border-white/5 flex justify-between items-center text-[10px] text-foreground-subtle font-bold">
                                        <span>FINALIZED: {new Date(report.finalized_at).toLocaleString()}</span>
                                        <span className="text-accent flex items-center gap-1">
                                            <FaCheckCircle /> DIGITALLY SIGNED
                                        </span>
                                    </div>
                                </div>
                                
                            </motion.div>
                        ) : (
                            /* 2. PRELIMINARY AI INSIGHT (WHEN NOT FINALIZED) */
                            <div className="space-y-6">
                                <div className="bg-surface-secondary rounded-xl shadow-card overflow-hidden border border-white/5">
                                    <div className="bg-accent p-6 text-white">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-2 bg-surface-tertiary rounded-lg">
                                                <FaBrain className="text-xl" />
                                            </div>
                                            <Badge className="bg-warning/10 text-warning border-0 font-bold">PRELIMINARY</Badge>
                                        </div>
                                        <h3 className="text-xl font-bold">Preliminary AI Insights</h3>
                                        <p className="text-foreground-muted text-sm mt-1">Deep Learning Diagnostic Support</p>
                                    </div>

                                    <div className="p-8 space-y-8">
                                        {/* Status Message */}
                                        <div className="flex items-start gap-4 p-4 bg-accent-subtle rounded-xl border border-accent/20">
                                            <FaInfoCircle className="text-accent mt-1 flex-shrink-0" />
                                            <p className="text-xs text-foreground-muted leading-relaxed font-medium">
                                                This analysis is performed by our AI diagnostic engine. A licensed physician is currently reviewing these results. Please do not take medical action until the report is finalized.
                                            </p>
                                        </div>

                                        {/* Primary Finding - Simplified for Patient */}
                                        <div className="text-center py-8 bg-surface-secondary/60 rounded-xl border border-white/5 relative overflow-hidden">
                                            <div className="relative z-10">
                                                <p className="text-xs font-bold text-foreground-subtle uppercase tracking-widest mb-2">Current Status</p>
                                                <h2 className="text-2xl font-black text-foreground mb-2 leading-tight px-4">
                                                    Initial Analysis Complete
                                                </h2>
                                                <div className="flex items-center justify-center gap-2 font-bold text-accent">
                                                    <FaMicroscope className="text-xl" />
                                                    <span className="text-lg">Awaiting Physician Review</span>
                                                </div>
                                            </div>
                                            {/* Subtle background decoration */}
                                            <FaBrain className="absolute -bottom-4 -right-4 text-8xl text-foreground-subtle/20 rotate-12" />
                                        </div>

                                        {/* Info Box */}
                                        <div className="p-5 bg-accent-subtle rounded-xl border border-accent/20">
                                            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                                                <FaInfoCircle /> What happens next?
                                            </h4>
                                            <ul className="space-y-3">
                                                <li className="flex items-start gap-3 text-xs text-foreground-muted">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0"></div>
                                                    <span>Our AI has processed your scan and identified key patterns for the doctor to investigate.</span>
                                                </li>
                                                <li className="flex items-start gap-3 text-xs text-foreground-muted">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0"></div>
                                                    <span>A licensed radiologist will now verify these findings and provide a final diagnosis.</span>
                                                </li>
                                                <li className="flex items-start gap-3 text-xs text-foreground-muted">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0"></div>
                                                    <span>You will receive a notification as soon as your official report is ready for download.</span>
                                                </li>
                                            </ul>
                                        </div>




                                    </div>

                                    <div className="px-8 py-6 bg-surface text-white flex flex-col items-center gap-4">
                                        <div className="flex items-center gap-4 w-full">
                                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center animate-pulse">
                                                <FaUserMd className="text-accent text-xl" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold">Verification in Progress</p>
                                                <p className="text-[10px] text-foreground-subtle font-medium">Your scan is queued for physician review</p>
                                            </div>
                                        </div>
                                        <Link to="/patient/book-appointment" className="w-full">
                                            <button className="w-full bg-accent hover:bg-accent-hover py-3 rounded-xl font-bold text-sm transition-all">
                                                Fast-Track Review
                                            </button>
                                        </Link>
                                    </div>
                                </div>

                                {/* Disclaimer */}
                                <div className="text-center">
                                    <p className="text-[10px] text-foreground-subtle font-bold uppercase tracking-widest leading-relaxed">
                                        Artificial Intelligence is a support tool. <br/> 
                                        Final Diagnosis is only valid when signed by a Physician.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* GLOBAL ACTIONS */}
                        <div className="flex gap-4 pt-4">
                            <Link to="/patient/scans" className="flex-1">
                                <button className="w-full bg-surface-secondary border border-white/[0.06] py-3 rounded-xl text-foreground-muted font-bold text-sm hover:bg-surface-tertiary/50 transition-all flex items-center justify-center gap-2">
                                    <FaArrowLeft className="text-xs" /> All Records
                                </button>
                            </Link>
                            <Link to="/patient/support" className="flex-1">
                                <button className="w-full bg-surface-secondary border border-white/[0.06] py-3 rounded-xl text-foreground-muted font-bold text-sm hover:bg-surface-tertiary/50 transition-all flex items-center justify-center gap-2">
                                    <FaInfoCircle className="text-xs" /> Need Help?
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScanResults;
