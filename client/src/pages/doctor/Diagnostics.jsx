import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { GlassCard, Button, Badge, Input } from '../../components/ui';
import {
    FaBrain, FaEye, FaLungs, FaXRay, FaRobot,
    FaCheckCircle, FaExclamationTriangle, FaSpinner,
    FaFileAlt, FaChartBar, FaMicroscope, FaDownload,
    FaFilePdf
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// ── Helper: is this a brain scan?
const isBrainScan = (scan) => {
    const t = scan?.scanType || scan?.scan_type || '';
    return t === 'mri_brain';
};

const Diagnostics = () => {
    const [scans, setScans] = useState([]);
    const [selectedScan, setSelectedScan] = useState(null);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [diagnosis, setDiagnosis] = useState('');
    const [doctorNotes, setDoctorNotes] = useState('');
    const [patientFriendlySummary, setPatientFriendlySummary] = useState('');
    const [recommendations, setRecommendations] = useState('');
    const [finalizing, setFinalizing] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackReason, setFeedbackReason] = useState('');
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showHeatmap, setShowHeatmap] = useState('original'); // 'original' | 'tumor' | 'alz'
    const [activeTab, setActiveTab] = useState('findings');
    const [reportSubmitted, setReportSubmitted] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [correctedDiagnosis, setCorrectedDiagnosis] = useState('');
    const [feedbackNotes, setFeedbackNotes] = useState('');
    const [finalizedReport, setFinalizedReport] = useState(null);

    useEffect(() => { fetchScans(); }, []);

    const fetchScans = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/scans');
            setScans(data);
        } catch (error) {
            console.error("Error fetching scans", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectScan = (scan) => {
        setSelectedScan(scan);
        setShowHeatmap('original');
        setActiveTab('findings');
        setFinalizedReport(null);

        // Pre-load existing AI analysis so the report form shows without re-running AI
        const existingAI = scan.aiAnalysis || scan.ai_prediction;
        setAiAnalysis(existingAI || null);

        // Check if a finalized report already exists for this scan
        const existingReport = scan.Reports?.[0] || scan.Report;
        if (existingReport?.finalized) {
            setReportSubmitted(true);
            setFinalizedReport(existingReport);
            setDiagnosis(existingReport.diagnosis || '');
            setDoctorNotes(existingReport.doctor_notes || '');
            setPatientFriendlySummary(existingReport.report_patient_friendly || '');
            setRecommendations(existingReport.recommendations || '');
        } else {
            setReportSubmitted(false);
            setDiagnosis('');
            setDoctorNotes('');
            setPatientFriendlySummary('');
            setRecommendations('');
        }
    };

    // ── Run AI Analysis — retinal OR brain ──
    const runAIAnalysis = async () => {
        if (!selectedScan) return;
        // Model Validation Logic
        const scanType = selectedScan.scanType || selectedScan.scan_type;
        const confirmMsg = `This scan is categorized as ${scanType.replace('_', ' ')}. Are you sure you want to run the Brain MRI AI model? The results may not be accurate for other scan types.`;

        if (isBrainScan(selectedScan) && scanType !== 'mri_brain' && !window.confirm(confirmMsg)) {
            return;
        }
        setIsAnalyzing(true);
        try {
            const scanId = selectedScan.id || selectedScan._id;
            const endpoint = isBrainScan(selectedScan)
                ? `/scans/${scanId}/analyze-brain`
                : `/scans/${scanId}/analyze`;

            const { data } = await api.post(endpoint);
            setAiAnalysis(data);

            // Pre-fill diagnosis
            if (isBrainScan(selectedScan)) {
                // Brain: use clinical summary
                const tumorResult = data.tumor?.prediction || '';
                const alzResult = data.alzheimer?.prediction || '';
                setDiagnosis(`Tumor: ${tumorResult} | Alzheimer: ${alzResult}`);
            } else {
                // Retinal
                if (data.prediction?.class_name) {
                    setDiagnosis(data.prediction.class_name.replace(/_/g, ' ')
                        .replace(/\b\w/g, c => c.toUpperCase()));
                }
            }
            toast.success('AI Analysis complete!');
        } catch (error) {
            console.error("AI Analysis Error:", error);
            toast.error(error.response?.data?.message || 'AI Analysis failed');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // ── Submit Report ──
    const handleCreateReport = async (e) => {
        e.preventDefault();
        if (!selectedScan) return;
        setFinalizing(true);
        try {
            const { data: savedReport } = await api.post(`/scans/${selectedScan.id || selectedScan._id}/report`, {
                diagnosis,
                notes: doctorNotes,
                report_patient_friendly: patientFriendlySummary,
                recommendations: recommendations,
                aiFindings: aiAnalysis
            });
            toast.success('Report finalized! Patient notified.');
            setReportSubmitted(true);
            setFinalizedReport(savedReport);
            fetchScans();
        } catch (error) {
            console.error("Error creating report", error);
            toast.error('Failed to create report');
        } finally {
            setFinalizing(false);
        }
    };

    const handleSubmitFeedback = async () => {
        console.log('[Feedback] Submit clicked — correctedDiagnosis:', correctedDiagnosis, '| feedbackReason:', feedbackReason, '| selectedScan:', !!selectedScan, '| aiAnalysis:', !!aiAnalysis);
        if (!correctedDiagnosis) {
            toast.error('Please select a corrected diagnosis.');
            return;
        }
        if (!feedbackReason) {
            toast.error('Please select a reason.');
            return;
        }
        if (!selectedScan || !aiAnalysis) {
            console.error('[Feedback] Blocked — selectedScan or aiAnalysis is null');
            toast.error('No scan or analysis loaded. Please run AI analysis first.');
            return;
        }

        setSubmittingFeedback(true);
        try {
            // Extract prediction + confidence based on scan type
            let aiPrediction, aiConfidence, modelVersion;
            if (isBrainScan(selectedScan)) {
                aiPrediction  = aiAnalysis.tumor?.prediction || 'unknown';
                aiConfidence  = (aiAnalysis.tumor?.confidence || 0) / 100;
                modelVersion  = aiAnalysis.model_version?.tumor_model || 'v1.0';
            } else {
                aiPrediction  = aiAnalysis.prediction?.class_name || 'unknown';
                aiConfidence  = (aiAnalysis.prediction?.confidence || 0) / 100;
                modelVersion  = aiAnalysis.model_version || 'v1.0';
            }

            const payload = {
                scan_id:             selectedScan.id || selectedScan._id,
                ai_prediction:       aiPrediction,
                ai_confidence:       aiConfidence,
                corrected_diagnosis: correctedDiagnosis,
                doctor_notes:        feedbackNotes || null,
                feedback_reason:     feedbackReason,
                model_version:       modelVersion,
            };
            console.log('[Feedback] Sending payload:', payload);
            await api.post('/feedback', payload);

            toast.success('Feedback submitted successfully');
            setShowFeedbackModal(false);
            setCorrectedDiagnosis('');
            setFeedbackNotes('');
            setFeedbackReason('');
        } catch (error) {
            console.error('Feedback error:', error);
            toast.error(error.response?.data?.message || 'Failed to submit feedback');
        } finally {
            setSubmittingFeedback(false);
        }
    };

    // ── PDF Download ──
    const handleDownloadPDF = async () => {
        if (!selectedScan) return;
        setIsGeneratingPdf(true);
        try {
            const response = await api.post(
                `/scans/${selectedScan.id || selectedScan._id}/report/pdf`,
                { diagnosis, notes: doctorNotes, aiFindings: aiAnalysis },
                { responseType: 'blob' }
            );
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download',
                `MediFusion_Report_${selectedScan.Patient?.User?.name || 'Patient'}_${new Date().toISOString().slice(0, 10)}.pdf`
            );
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('PDF downloaded!');
        } catch (error) {
            console.error("PDF Error:", error);
            toast.error('Failed to generate PDF');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const getScanIcon = (type) => {
        const icons = {
            mri_brain: <FaBrain className="text-accent" />,
            retinal: <FaEye className="text-accent" />,
            xray: <FaLungs className="text-accent" />,
            ct_scan: <FaXRay className="text-accent" />
        };
        return icons[type] || <FaMicroscope className="text-foreground-muted" />;
    };

    const getStatusBadge = (status) => {
        const variants = { analyzed: 'success', verified: 'success', pending: 'warning', flagged: 'danger' };
        return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
    };

    const getConfidenceColor = (conf) => {
        if (conf >= 80) return 'text-success';
        if (conf >= 60) return 'text-warning';
        return 'text-error';
    };

    const getPriorityColor = (priority) => {
        const map = { critical: 'bg-error/10 text-error border-error/20', high: 'bg-warning/10 text-warning border-warning/20', medium: 'bg-warning/10 text-warning border-warning/20', low: 'bg-success/10 text-success border-success/20' };
        return map[priority] || 'bg-surface-tertiary text-foreground-muted border-white/[0.06]';
    };

    // ── Diagnosis dropdown options based on scan type ──
    const getDiagnosisOptions = () => {
        const scanType = selectedScan?.scan_type || selectedScan?.scanType;
        if (scanType === 'mri_brain') {
            return [
                { value: 'glioma',                    label: 'Glioma (Tumor)' },
                { value: 'meningioma',                label: 'Meningioma (Tumor)' },
                { value: 'pituitary',                 label: 'Pituitary Tumor' },
                { value: 'no_tumor',                  label: 'No Tumor' },
                { value: 'mild_cognitive_impairment', label: 'Mild Cognitive Impairment (Alzheimer\'s)' },
                { value: 'moderate',                  label: 'Moderate (Alzheimer\'s)' },
                { value: 'very_mild',                 label: 'Very Mild (Alzheimer\'s)' },
                { value: 'non_demented',              label: 'Non-Demented (Alzheimer\'s)' },
            ];
        }
        return [
            { value: 'diabetic_retinopathy', label: 'Diabetic Retinopathy' },
            { value: 'glaucoma',             label: 'Glaucoma' },
            { value: 'normal',               label: 'Normal' },
            { value: 'cataract',             label: 'Cataract' },
        ];
    };

    // ── Get correct image to show ──
    const getDisplayImage = () => {
        const serverBase = import.meta.env.VITE_API_URL.split('/api')[0];
        if (!aiAnalysis?.images) return `${serverBase}${selectedScan?.filePath || selectedScan?.file_url}`;
        const imgs = aiAnalysis.images;
        if (showHeatmap === 'tumor' && imgs.tumor_heatmap) return `data:image/png;base64,${imgs.tumor_heatmap}`;
        if (showHeatmap === 'alz' && imgs.alz_heatmap) return `data:image/png;base64,${imgs.alz_heatmap}`;
        if (showHeatmap === 'overlay' && imgs.overlay) return `data:image/jpeg;base64,${imgs.overlay}`;
        if (imgs.original) return `data:image/png;base64,${imgs.original}`;
        return `${serverBase}${selectedScan?.filePath || selectedScan?.file_url}`;
    };

    // ════════════════════════════════════════════
    // BRAIN SCAN AI RESULTS UI
    // ════════════════════════════════════════════
    const renderBrainResults = () => {
        const { tumor, alzheimer, clinical_summary } = aiAnalysis;

        return (
            <>
                {/* Clinical Summary Banner */}
                <div className={`rounded-xl p-4 border mb-4 ${getPriorityColor(clinical_summary?.priority)}`}>
                    <div className="flex items-center gap-2 mb-1">
                        <FaExclamationTriangle />
                        <span className="font-bold uppercase text-sm tracking-wide">
                            {clinical_summary?.priority} Priority — {clinical_summary?.overall_status}
                        </span>
                    </div>
                    <p className="text-sm">{clinical_summary?.clinical_note}</p>
                    <p className="text-xs mt-1 opacity-80">{clinical_summary?.action_required}</p>
                </div>

                {/* Tumor + Alzheimer Cards side by side */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Tumor Card */}
                    <div className={`rounded-xl p-4 border ${tumor?.is_detected ? 'bg-error/10 border-error/20' : 'bg-success/10 border-success/20'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <FaBrain className={tumor?.is_detected ? 'text-error' : 'text-success'} />
                            <span className="font-bold text-sm text-foreground">Tumor Analysis</span>
                        </div>
                        <p className={`text-lg font-bold capitalize ${tumor?.is_detected ? 'text-error' : 'text-success'}`}>
                            {tumor?.prediction?.replace(/_/g, ' ')}
                        </p>
                        <p className={`text-sm font-medium ${getConfidenceColor(tumor?.confidence)}`}>
                            {tumor?.confidence?.toFixed(1)}% confidence
                        </p>
                        <div className="mt-2 w-full bg-surface-secondary rounded-full h-1.5">
                            <div
                                className={`h-1.5 rounded-full ${tumor?.is_detected ? 'bg-error' : 'bg-success/100'}`}
                                style={{ width: `${tumor?.confidence}%` }}
                            />
                        </div>
                        {tumor?.gradcam_available && (
                            <button
                                onClick={() => setShowHeatmap(showHeatmap === 'tumor' ? 'original' : 'tumor')}
                                className={`mt-2 text-xs px-2 py-1 rounded-full border transition-all ${showHeatmap === 'tumor' ? 'bg-error text-white border-red-500' : 'bg-surface-secondary text-error border-error/20 hover:bg-error/10'}`}
                            >
                                🔥 {showHeatmap === 'tumor' ? 'Hide' : 'Show'} GradCAM
                            </button>
                        )}
                    </div>

                    {/* Alzheimer Card */}
                    <div className={`rounded-xl p-4 border ${alzheimer?.is_detected && alzheimer?.is_applicable ? 'bg-warning/10 border-warning/20' : 'bg-success/10 border-success/20'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <FaBrain className={alzheimer?.is_detected ? 'text-warning' : 'text-success'} />
                            <span className="font-bold text-sm text-foreground">Alzheimer's</span>
                        </div>
                        {!alzheimer?.is_applicable ? (
                            <p className="text-sm text-warning font-medium">Not Applicable</p>
                        ) : (
                            <>
                                <p className={`text-sm font-bold capitalize ${alzheimer?.is_detected ? 'text-warning' : 'text-success'}`}>
                                    {alzheimer?.prediction?.replace(/([A-Z])/g, ' $1').trim()}
                                </p>
                                <p className={`text-sm font-medium ${getConfidenceColor(alzheimer?.confidence)}`}>
                                    {alzheimer?.confidence?.toFixed(1)}% confidence
                                </p>
                                <div className="mt-2 w-full bg-surface-secondary rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full ${alzheimer?.is_detected ? 'bg-warning/100' : 'bg-success/100'}`}
                                        style={{ width: `${alzheimer?.confidence}%` }}
                                    />
                                </div>
                            </>
                        )}
                        {alzheimer?.gradcam_available && (
                            <button
                                onClick={() => setShowHeatmap(showHeatmap === 'alz' ? 'original' : 'alz')}
                                className={`mt-2 text-xs px-2 py-1 rounded-full border transition-all ${showHeatmap === 'alz' ? 'bg-warning/100 text-white border-orange-500' : 'bg-surface-secondary text-warning border-orange-300 hover:bg-warning/10'}`}
                            >
                                🔥 {showHeatmap === 'alz' ? 'Hide' : 'Show'} GradCAM
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs — Findings / Probabilities */}
                <div className="bg-surface-secondary rounded-xl border border-white/5 overflow-hidden">
                    <div className="flex border-b border-white/5">
                        {['findings', 'probabilities'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-3 text-sm font-medium transition-all capitalize ${activeTab === tab
                                    ? 'text-accent border-b-2 border-blue-600 bg-accent-subtle'
                                    : 'text-foreground-muted hover:text-foreground-muted hover:bg-surface-secondary/60'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="p-4">
                        <AnimatePresence mode="wait">
                            {activeTab === 'findings' && (
                                <motion.div key="brain-findings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                                    {tumor?.clinical_finding && (
                                        <div className="p-3 bg-error/10 rounded-xl border border-error/20">
                                            <strong className="text-error text-sm">🧠 Tumor Finding:</strong>
                                            <p className="mt-1 text-sm text-foreground-muted">{tumor.clinical_finding}</p>
                                            {tumor?.xai_reasoning && (
                                                <div className="mt-2 text-xs text-foreground-muted space-y-0.5">
                                                    <p>📍 Primary region: <span className="font-medium">{tumor.xai_reasoning.primary_region}</span></p>
                                                    <p>📍 Secondary: <span className="font-medium">{tumor.xai_reasoning.secondary_region}</span></p>
                                                    <p>⚡ Activation: <span className="font-medium">{tumor.xai_reasoning.activation_pattern}</span> ({tumor.xai_reasoning.signal_intensity})</p>
                                                    <p>🎯 Area highlighted: <span className="font-medium">{tumor.xai_reasoning.area_highlighted}%</span></p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {alzheimer?.clinical_finding && alzheimer?.is_applicable && (
                                        <div className="p-3 bg-warning/10 rounded-xl border border-warning/20">
                                            <strong className="text-warning text-sm">🧬 Alzheimer's Finding:</strong>
                                            <p className="mt-1 text-sm text-foreground-muted">{alzheimer.clinical_finding}</p>
                                            {alzheimer?.xai_reasoning && (
                                                <div className="mt-2 text-xs text-foreground-muted space-y-0.5">
                                                    <p>📍 Primary region: <span className="font-medium">{alzheimer.xai_reasoning.primary_region}</span></p>
                                                    <p>📍 Secondary: <span className="font-medium">{alzheimer.xai_reasoning.secondary_region}</span></p>
                                                    <p>⚡ Activation: <span className="font-medium">{alzheimer.xai_reasoning.activation_pattern}</span> ({alzheimer.xai_reasoning.signal_intensity})</p>
                                                    <p>🎯 Area highlighted: <span className="font-medium">{alzheimer.xai_reasoning.area_highlighted}%</span></p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="p-3 bg-warning/10 rounded-xl border border-warning/20">
                                        <div className="flex items-start gap-2">
                                            <FaExclamationTriangle className="text-warning mt-0.5 shrink-0" />
                                            <p className="text-xs text-warning">AI analysis is for assistance only. Final diagnosis by qualified professional required.</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'probabilities' && (
                                <motion.div key="brain-probs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                                    <div>
                                        <p className="text-xs font-semibold text-foreground-muted uppercase mb-2">Tumor Probabilities</p>
                                        {tumor?.all_probabilities && Object.entries(tumor.all_probabilities)
                                            .sort((a, b) => b[1] - a[1])
                                            .map(([cls, prob], idx) => (
                                                <div key={idx} className="flex items-center justify-between mb-2">
                                                    <span className="text-xs text-foreground-muted capitalize w-32">{cls.replace(/_/g, ' ')}</span>
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <div className="flex-1 bg-surface-secondary rounded-full h-1.5">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${prob}%` }}
                                                                transition={{ duration: 0.8, delay: idx * 0.1 }}
                                                                className="bg-red-400 h-1.5 rounded-full"
                                                            />
                                                        </div>
                                                        <span className="text-xs text-foreground-muted w-10 text-right">{prob.toFixed(1)}%</span>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-foreground-muted uppercase mb-2">Alzheimer's Probabilities</p>
                                        {alzheimer?.all_probabilities && Object.entries(alzheimer.all_probabilities)
                                            .sort((a, b) => b[1] - a[1])
                                            .map(([cls, prob], idx) => (
                                                <div key={idx} className="flex items-center justify-between mb-2">
                                                    <span className="text-xs text-foreground-muted w-32">{cls.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <div className="flex-1 bg-surface-secondary rounded-full h-1.5">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${prob}%` }}
                                                                transition={{ duration: 0.8, delay: idx * 0.1 }}
                                                                className="bg-orange-400 h-1.5 rounded-full"
                                                            />
                                                        </div>
                                                        <span className="text-xs text-foreground-muted w-10 text-right">{prob.toFixed(1)}%</span>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </>
        );
    };

    // ════════════════════════════════════════════
    // RETINAL SCAN AI RESULTS UI (original)
    // ════════════════════════════════════════════
    const renderRetinalResults = () => (
        <>
            {/* Primary Prediction */}
            <div className="bg-gradient-to-br from-accent/10 to-accent/10 rounded-xl p-6 border border-accent/20">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent rounded-xl text-white"><FaRobot /></div>
                        <div>
                            <h3 className="font-bold text-foreground">AI Prediction</h3>
                            <p className="text-xs text-foreground-muted">EfficientNetB3 — GradCAM</p>
                        </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(aiAnalysis.prediction?.confidence)} bg-surface-secondary border`}>
                        {aiAnalysis.explanation?.confidence_text}
                    </span>
                </div>
                <div className="text-center py-4 bg-surface-secondary/60 rounded-xl mb-4">
                    <p className="text-2xl font-bold text-foreground capitalize">
                        {aiAnalysis.prediction?.class_name?.replace(/_/g, ' ')}
                    </p>
                    <p className={`text-lg font-semibold ${getConfidenceColor(aiAnalysis.prediction?.confidence)}`}>
                        {aiAnalysis.prediction?.confidence?.toFixed(1)}% Confidence
                    </p>
                </div>
                <div className="mb-4">
                    <div className="flex justify-between text-xs text-foreground-muted mb-1">
                        <span>Confidence</span>
                        <span>{aiAnalysis.prediction?.confidence?.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${aiAnalysis.prediction?.confidence}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={`h-full rounded-full ${aiAnalysis.prediction?.confidence >= 80 ? 'bg-success/100' : aiAnalysis.prediction?.confidence >= 60 ? 'bg-warning' : 'bg-error'}`}
                        />
                    </div>
                </div>
                {aiAnalysis.explanation?.clinical_note && (
                    <div className="text-sm text-accent bg-accent-subtle rounded-xl p-3">
                        <strong>Clinical Note:</strong> {aiAnalysis.explanation.clinical_note}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="bg-surface-secondary rounded-xl border border-white/5 overflow-hidden">
                <div className="flex border-b border-white/5">
                    {['findings', 'regions', 'probabilities'].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 text-sm font-medium transition-all capitalize ${activeTab === tab ? 'text-accent border-b-2 border-blue-600 bg-accent-subtle' : 'text-foreground-muted hover:text-foreground-muted hover:bg-surface-secondary/60'}`}>
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="p-4">
                    <AnimatePresence mode="wait">
                        {activeTab === 'findings' && (
                            <motion.div key="findings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <div className="space-y-3 text-sm text-foreground-muted">
                                    {aiAnalysis.explanation?.what_model_sees && (
                                        <div className="p-3 bg-accent-subtle rounded-xl"><strong>What model sees:</strong><p className="mt-1">{aiAnalysis.explanation.what_model_sees}</p></div>
                                    )}
                                    {aiAnalysis.explanation?.why_prediction && (
                                        <div className="p-3 bg-success/10 rounded-xl"><strong>Why this prediction:</strong><p className="mt-1">{aiAnalysis.explanation.why_prediction}</p></div>
                                    )}
                                    {aiAnalysis.explanation?.validity_check && (
                                        <div className="p-3 bg-warning/10 rounded-xl"><strong>Validity:</strong><p className="mt-1">{aiAnalysis.explanation.validity_check}</p></div>
                                    )}
                                </div>
                                <div className="mt-3 p-3 bg-warning/10 rounded-xl border border-warning/20">
                                    <div className="flex items-start gap-2">
                                        <FaExclamationTriangle className="text-warning mt-0.5" />
                                        <p className="text-xs text-warning">AI analysis is for assistance only. Final diagnosis by qualified professional required.</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        {activeTab === 'regions' && (
                            <motion.div key="regions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-2">
                                {aiAnalysis.regions?.map((region, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-surface-secondary/60">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${region.is_expected ? 'bg-error' : 'bg-surface-tertiary'}`}></span>
                                            <span className="text-sm font-medium text-foreground-muted">{region.label}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-20 bg-surface-secondary rounded-full h-2">
                                                <div className={`h-2 rounded-full ${region.is_expected ? 'bg-red-400' : 'bg-blue-400'}`} style={{ width: `${Math.min(region.score * 100 * 3, 100)}%` }}></div>
                                            </div>
                                            <span className="text-xs text-foreground-muted w-16 text-right">{(region.coverage_pct).toFixed(0)}% active</span>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                        {activeTab === 'probabilities' && (
                            <motion.div key="probabilities" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                                {aiAnalysis.prediction?.all_probs && Object.entries(aiAnalysis.prediction.all_probs)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([cls, prob], idx) => (
                                        <div key={idx} className="flex items-center justify-between">
                                            <span className="text-sm text-foreground-muted capitalize w-40">{cls.replace(/_/g, ' ')}</span>
                                            <div className="flex items-center gap-2 flex-1">
                                                <div className="flex-1 bg-surface-secondary rounded-full h-2">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${prob}%` }} transition={{ duration: 0.8, delay: idx * 0.1 }} className="bg-accent-subtle0 h-2 rounded-full" />
                                                </div>
                                                <span className="text-xs text-foreground-muted w-12 text-right">{prob.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    ))
                                }
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );

    // ════════════════════════════════════════════
    // MAIN RENDER
    // ════════════════════════════════════════════
    return (
        <div className="h-[calc(100vh-120px)] flex flex-col md:flex-row gap-6">

            {/* ── Scans Sidebar ── */}
            <div className="w-full md:w-80 flex flex-col">
                <GlassCard className="h-full flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-white/5 bg-gradient-to-r from-accent/10 to-accent/10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-accent-subtle0 rounded-xl text-white"><FaRobot /></div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground">AI Diagnostics</h2>
                                <p className="text-sm text-foreground-muted">
                                    {scans.filter(s => s.status === 'pending').length} pending review
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {loading ? (
                            <div className="text-center py-8 text-foreground-muted">
                                <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />Loading scans...
                            </div>
                        ) : scans.length === 0 ? (
                            <div className="text-center py-8 text-foreground-muted">
                                <FaMicroscope className="text-4xl mx-auto mb-2 opacity-50" />
                                <p>No pending scans.</p>
                            </div>
                        ) : (
                            scans.map((scan, index) => (
                                <motion.div
                                    key={scan.id || scan._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => handleSelectScan(scan)}
                                    className={`p-4 rounded-xl cursor-pointer border-2 transition-all ${(selectedScan?.id || selectedScan?._id) === (scan.id || scan._id)
                                        ? 'bg-accent-subtle border-accent/20 shadow-card'
                                        : 'bg-surface-secondary/50 border-transparent hover:bg-surface-secondary hover:border-white/[0.06] hover:shadow-card'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-surface-tertiary rounded-xl text-xl">
                                            {getScanIcon(scan.scanType || scan.scan_type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-semibold text-foreground capitalize">
                                                    {(scan.scanType || scan.scan_type || 'Unknown').replace('_', ' ')}
                                                </span>
                                                {getStatusBadge(scan.status)}
                                            </div>
                                            <p className="text-sm text-foreground-muted truncate">
                                                {scan.Patient?.User?.name || 'Unknown Patient'}
                                            </p>
                                            <p className="text-xs text-foreground-subtle mt-1">
                                                {new Date(scan.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </GlassCard>
            </div>

            {/* ── Detail View ── */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <AnimatePresence mode="wait">
                    {selectedScan ? (
                        <motion.div
                            key={selectedScan.id || selectedScan._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="h-full flex flex-col min-h-0"
                        >
                            <div className="h-full flex flex-col overflow-hidden rounded-2xl bg-surface-secondary border border-white/[0.06] shadow-card">
                                <div className="flex-1 flex flex-col min-h-0">
                                    <div className="relative overflow-hidden rounded-2xl flex-1 flex flex-col min-h-0">
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/45 via-white/15 to-white/45 pointer-events-none" />
                                        <div className="relative flex-1 flex flex-col min-h-0 m-[1px] bg-white/[0.01] backdrop-blur-[4px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">

                                {/* Header */}
                                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-surface-secondary/60 shrink-0">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-br from-accent to-accent rounded-xl text-white text-2xl">
                                            {getScanIcon(selectedScan.scanType || selectedScan.scan_type)}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-foreground capitalize">
                                                {(selectedScan.scanType || selectedScan.scan_type || 'Medical').replace('_', ' ')} Analysis
                                            </h2>
                                            <p className="text-foreground-muted">
                                                Patient: <span className="font-medium">{selectedScan.Patient?.User?.name || 'Unknown'}</span>
                                                {isBrainScan(selectedScan) && (
                                                    <span className="ml-2 text-xs bg-accent-subtle text-accent px-2 py-0.5 rounded-full">
                                                        🧠 Brain MRI — Tumor + Alzheimer's
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-wrap justify-end">
                                        <Button variant="outline" onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${selectedScan.filePath || selectedScan.file_url}`, '_blank')}>
                                            <FaDownload className="mr-2" /> Full Image
                                        </Button>
                                        {!aiAnalysis && (
                                            <Button onClick={runAIAnalysis} disabled={isAnalyzing}
                                                className={`shadow-card ${isBrainScan(selectedScan) ? 'bg-gradient-to-r from-accent to-accent' : 'bg-gradient-to-r from-accent to-accent'}`}>
                                                {isAnalyzing
                                                    ? <><FaSpinner className="animate-spin mr-2" /> Analyzing...</>
                                                    : <><FaRobot className="mr-2" /> {isBrainScan(selectedScan) ? 'Run Brain AI Analysis' : 'Run AI Analysis'}</>
                                                }
                                            </Button>
                                        )}
                                        {aiAnalysis && (
                                            <Button onClick={handleDownloadPDF} disabled={isGeneratingPdf}
                                                className="bg-gradient-to-r from-error to-accent shadow-card text-white">
                                                {isGeneratingPdf
                                                    ? <><FaSpinner className="animate-spin mr-2" /> Generating...</>
                                                    : <><FaFilePdf className="mr-2" /> Download PDF</>
                                                }
                                            </Button>
                                        )}
                                        {aiAnalysis && (
                                            <Button onClick={() => setShowFeedbackModal(true)}
                                                className="bg-gradient-to-r from-warning to-warning shadow-card text-white">
                                                <FaExclamationTriangle className="mr-2" /> Flag as Incorrect
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                        {/* ── Image Panel ── */}
                                        <div className="space-y-4">
                                            <div className="relative bg-surface rounded-xl p-4 overflow-hidden">
                                                {/* Toggle buttons */}
                                                <div className="absolute top-4 left-4 z-10 flex gap-2 flex-wrap">
                                                    <button onClick={() => setShowHeatmap('original')}
                                                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${showHeatmap === 'original' ? 'bg-surface-secondary text-foreground' : 'bg-surface-secondary/20 text-white hover:bg-surface-secondary/30'}`}>
                                                        Original
                                                    </button>
                                                    {/* Retinal overlay toggle */}
                                                    {!isBrainScan(selectedScan) && aiAnalysis?.images?.overlay && (
                                                        <button onClick={() => setShowHeatmap(showHeatmap === 'overlay' ? 'original' : 'overlay')}
                                                            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${showHeatmap === 'overlay' ? 'bg-surface-secondary text-foreground' : 'bg-surface-secondary/20 text-white hover:bg-surface-secondary/30'}`}>
                                                            🔥 GradCAM
                                                        </button>
                                                    )}
                                                    {/* Brain heatmap toggles */}
                                                    {isBrainScan(selectedScan) && aiAnalysis?.images?.tumor_heatmap && (
                                                        <button onClick={() => setShowHeatmap(showHeatmap === 'tumor' ? 'original' : 'tumor')}
                                                            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${showHeatmap === 'tumor' ? 'bg-red-400 text-white' : 'bg-surface-secondary/20 text-white hover:bg-surface-secondary/30'}`}>
                                                            🔥 Tumor CAM
                                                        </button>
                                                    )}
                                                    {isBrainScan(selectedScan) && aiAnalysis?.images?.alz_heatmap && (
                                                        <button onClick={() => setShowHeatmap(showHeatmap === 'alz' ? 'original' : 'alz')}
                                                            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${showHeatmap === 'alz' ? 'bg-orange-400 text-white' : 'bg-surface-secondary/20 text-white hover:bg-surface-secondary/30'}`}>
                                                            🔥 Alzheimer CAM
                                                        </button>
                                                    )}
                                                </div>

                                                <img
                                                    src={getDisplayImage()}
                                                    alt="Scan"
                                                    className="max-h-[400px] w-full object-contain rounded-xl mt-8"
                                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400?text=Scan+Preview'; }}
                                                />

                                                {showHeatmap !== 'original' && (
                                                    <div className="mt-3 flex items-center justify-center gap-2 text-white text-sm">
                                                        <span className="w-3 h-3 rounded bg-error"></span><span>High Attention</span>
                                                        <span className="w-3 h-3 rounded bg-warning ml-2"></span><span>Medium</span>
                                                        <span className="w-3 h-3 rounded bg-accent-subtle0 ml-2"></span><span>Low</span>
                                                    </div>
                                                )}
                                            </div >

                                            {/* Scan Metadata */}
                                            < div className="bg-surface-secondary/60 rounded-xl p-4" >
                                                <h4 className="font-semibold text-foreground-muted mb-3 flex items-center gap-2"><FaFileAlt /> Scan Information</h4>
                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <div><span className="text-foreground-muted">Patient:</span><span className="ml-2 font-medium">{selectedScan.Patient?.User?.name || 'N/A'}</span></div>
                                                    <div><span className="text-foreground-muted">Type:</span><span className="ml-2 font-medium capitalize">{(selectedScan.scanType || selectedScan.scan_type || 'N/A').replace('_', ' ')}</span></div>
                                                    <div><span className="text-foreground-muted">Source:</span><span className="ml-2 font-medium capitalize">{selectedScan.scan_source || 'External'}</span></div>
                                                    <div><span className="text-foreground-muted">Uploaded:</span><span className="ml-2 font-medium">{new Date(selectedScan.createdAt).toLocaleDateString()}</span></div>
                                                    {/* Retinal-specific meta */}
                                                    {aiAnalysis?.analysis_meta && !isBrainScan(selectedScan) && (
                                                        <>
                                                            <div><span className="text-foreground-muted">Eye Side:</span><span className="ml-2 font-medium capitalize">{aiAnalysis.analysis_meta.eye_side} ({aiAnalysis.analysis_meta.eye_confidence})</span></div>
                                                            <div><span className="text-foreground-muted">Threshold:</span><span className="ml-2 font-medium">{aiAnalysis.analysis_meta.otsu_threshold}</span></div>
                                                        </>
                                                    )}
                                                    {/* Brain-specific meta */}
                                                    {isBrainScan(selectedScan) && aiAnalysis && (
                                                        <>
                                                            <div><span className="text-foreground-muted">Tumor Model:</span><span className="ml-2 font-medium">{aiAnalysis.model_version?.tumor_model || 'ResNet18'}</span></div>
                                                            <div><span className="text-foreground-muted">Alz. Model:</span><span className="ml-2 font-medium">{aiAnalysis.model_version?.alzheimer_model || 'DenseNet121'}</span></div>
                                                        </>
                                                    )}
                                                </div>
                                            </div >
                                        </div >

                                        {/* ── AI Results Panel ── */}
                                        < div className="space-y-4" >
                                            {
                                                isAnalyzing ? (
                                                    <div className="bg-gradient-to-br from-accent/10 to-accent/10 rounded-xl p-8 text-center border border-accent/20" >
                                                        <div className="relative w-20 h-20 mx-auto mb-4">
                                                            <div className="absolute inset-0 border-4 border-accent/20 rounded-full"></div>
                                                            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <FaBrain className="text-2xl text-accent" />
                                                            </div>
                                                        </div>
                                                        <h3 className="text-lg font-bold text-foreground mb-2">AI Analysis in Progress</h3>
                                                        <p className="text-foreground-muted text-sm">
                                                            {isBrainScan(selectedScan)
                                                                ? 'Running Tumor (ResNet18) + Alzheimer (DenseNet121) models...'
                                                                : 'Running GradCAM on EfficientNetB3...'}
                                                        </p>
                                                        <div className="mt-4 space-y-2 text-xs text-foreground-subtle">
                                                            <p>✓ Image preprocessing</p>
                                                            <p>⟳ Running neural network inference...</p>
                                                            <p>○ Generating GradCAM heatmap</p>
                                                            {isBrainScan(selectedScan) && <p>○ Running Alzheimer's model...</p>}
                                                        </div>
                                                    </div>

                                                ) : aiAnalysis ? (
                                                    isBrainScan(selectedScan)
                                                        ? renderBrainResults()
                                                        : renderRetinalResults()

                                                ) : (
                                                    <div className="bg-surface-secondary/60 rounded-xl p-8 text-center border-2 border-dashed border-white/[0.06]">
                                                        <FaRobot className="text-5xl text-foreground-subtle mx-auto mb-4" />
                                                        <h3 className="text-lg font-bold text-foreground-muted mb-2">Ready for AI Analysis</h3>
                                                        <p className="text-foreground-subtle text-sm mb-4">
                                                            {isBrainScan(selectedScan)
                                                                ? 'Click "Run Brain AI Analysis" to detect tumor & Alzheimer\'s.'
                                                                : 'Click "Run AI Analysis" to process this retinal scan.'}
                                                        </p>
                                                        <Button onClick={runAIAnalysis} className="mx-auto">
                                                            <FaRobot className="mr-2" /> Start Analysis
                                                        </Button>
                                                    </div>
                                                )}

                                            {/* Doctor Report Form */}
                                            {
                                                aiAnalysis && !reportSubmitted && (
                                                    <form onSubmit={handleCreateReport} className="bg-surface-secondary rounded-xl p-6 border border-white/5">
                                                        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                                            <FaFileAlt className="text-accent" /> Doctor's Final Report
                                                        </h3>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <label className="block text-sm font-medium text-foreground-muted mb-2">Diagnosis</label>
                                                                <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Enter final diagnosis..." required />
                                                            </div>
                                                            <div>
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <label className="block text-sm font-medium text-foreground-muted">Patient-Friendly Summary</label>
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (!aiAnalysis) return;
                                                                            if (isBrainScan(selectedScan)) {
                                                                                const t = aiAnalysis.tumor?.is_detected ? "A growth or mass has been identified in the brain tissue that needs further investigation." : "The scan shows no signs of abnormal growths or tumors.";
                                                                                const a = aiAnalysis.alzheimer?.prediction === 'NonDemented' ? "Brain volume and structures appear normal for your age." : `The analysis shows some changes in brain structure consistent with ${aiAnalysis.alzheimer?.prediction?.replace(/([A-Z])/g, ' $1').trim()}.`;
                                                                                setPatientFriendlySummary(`${t} ${a} Please consult with your specialist for a detailed management plan.`);
                                                                            } else {
                                                                                const cond = aiAnalysis.prediction?.class_name?.replace(/_/g, ' ') || 'normal';
                                                                                if (cond === 'normal') setPatientFriendlySummary("Your retinal scan looks healthy. No signs of disease were detected.");
                                                                                else setPatientFriendlySummary(`The analysis identified patterns consistent with ${cond}. This suggests some changes in the eye that require professional review.`);
                                                                            }
                                                                        }}
                                                                        className="text-xs font-bold text-accent hover:text-accent flex items-center gap-1"
                                                                    >
                                                                        <FaRobot /> Suggest Summary
                                                                    </button>
                                                                </div>
                                                                <textarea rows={3}
                                                                    className="w-full px-4 py-3 rounded-xl bg-accent-subtle/30 border border-accent/20 focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all resize-none text-sm text-foreground"
                                                                    value={patientFriendlySummary} onChange={(e) => setPatientFriendlySummary(e.target.value)}
                                                                    placeholder="Write a simplified summary for the patient to understand..." required />
                                                            </div>

                                                            <div>
                                                                <label className="block text-sm font-medium text-foreground-muted mb-2">Detailed Physician Notes (Technical)</label>
                                                                <textarea rows={3}
                                                                    className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-white/[0.06] focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all resize-none text-sm"
                                                                    value={doctorNotes} onChange={(e) => setDoctorNotes(e.target.value)}
                                                                    placeholder="Add technical clinical notes..." required />
                                                            </div>

                                                            <div>
                                                                <label className="block text-sm font-medium text-foreground-muted mb-2">Recommendations & Follow-up</label>
                                                                <textarea rows={2}
                                                                    className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-white/[0.06] focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all resize-none text-sm"
                                                                    value={recommendations} onChange={(e) => setRecommendations(e.target.value)}
                                                                    placeholder="e.g. Schedule MRI in 6 months, Consult Neurology..." required />
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <Button type="submit" size="lg" className="flex-1 shadow-card">
                                                                    <FaCheckCircle className="mr-2" /> Finalize & Notify Patient
                                                                </Button>
                                                                <Button type="button" onClick={handleDownloadPDF} disabled={isGeneratingPdf} size="lg" className="bg-error hover:bg-red-600 text-white shadow-card">
                                                                    {isGeneratingPdf ? <FaSpinner className="animate-spin" /> : <FaFilePdf />}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </form>
                                                )
                                            }

                                            {/* Report Submitted */}
                                            {
                                                reportSubmitted && (
                                                    <div className="bg-success/10 rounded-xl p-6 border border-success/20 text-center">
                                                        <FaCheckCircle className="text-4xl text-success mx-auto mb-3" />
                                                        <h3 className="font-bold text-foreground mb-1">Report Finalized!</h3>
                                                        <p className="text-sm text-success mb-4">Patient has been notified.</p>
                                                        <Button
                                                            onClick={() => {
                                                                const pdfPath = finalizedReport?.final_report;
                                                                if (pdfPath) {
                                                                    const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
                                                                    window.open(`${base}${pdfPath}`, '_blank');
                                                                } else {
                                                                    handleDownloadPDF();
                                                                }
                                                            }}
                                                            disabled={isGeneratingPdf}
                                                            className="bg-error hover:bg-red-600 text-white mx-auto"
                                                        >
                                                            {isGeneratingPdf ? <><FaSpinner className="animate-spin mr-2" /> Generating...</> : <><FaFilePdf className="mr-2" /> Download PDF Report</>}
                                                        </Button>
                                                    </div>
                                                )
                                            }
                                        </div >
                                    </div >
                                </div >
                                        </div >
                                    </div >
                                </div >
                            </div >
                        </motion.div >
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex items-center justify-center">
                            <GlassCard className="p-12 text-center max-w-md">
                                <div className="w-24 h-24 bg-gradient-to-br from-accent-subtle to-accent-subtle rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FaMicroscope className="text-4xl text-accent" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">Select a Scan</h3>
                                <p className="text-foreground-muted">Choose a pending scan from the sidebar to view details, run AI analysis, and create a diagnostic report.</p>
                            </GlassCard>
                        </motion.div>
                    )}
                </AnimatePresence >
            </div >
            {/* Feedback Modal */}
            <AnimatePresence>
                {showFeedbackModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setShowFeedbackModal(false); setCorrectedDiagnosis(''); setFeedbackNotes(''); setFeedbackReason(''); }}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-md bg-surface-secondary rounded-xl shadow-card overflow-hidden"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-warning to-warning p-5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-surface-secondary/20 rounded-xl">
                                        <FaExclamationTriangle className="text-white text-lg" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Flag AI Prediction as Incorrect</h3>
                                        <p className="text-orange-100 text-xs mt-0.5">Your correction helps retrain and improve the model</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* AI Said */}
                                <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 text-sm">
                                    <span className="text-warning font-semibold">AI Predicted: </span>
                                    <span className="text-foreground-muted capitalize">
                                        {isBrainScan(selectedScan)
                                            ? `Tumor: ${aiAnalysis?.tumor?.prediction?.replace(/_/g, ' ') || '—'}  |  Alzheimer's: ${aiAnalysis?.alzheimer?.prediction?.replace(/_/g, ' ') || '—'}`
                                            : aiAnalysis?.prediction?.class_name?.replace(/_/g, ' ') || '—'
                                        }
                                    </span>
                                </div>

                                {/* Corrected Diagnosis */}
                                <div>
                                    <label className="block text-sm font-semibold text-foreground-muted mb-1.5">
                                        Corrected Diagnosis <span className="text-error">*</span>
                                    </label>
                                    <select
                                        value={correctedDiagnosis}
                                        onChange={(e) => setCorrectedDiagnosis(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-white/[0.06] focus:border-accent focus:ring-2 focus:ring-orange-100 outline-none transition-all bg-surface-secondary text-foreground text-sm"
                                    >
                                        <option value="">Select correct diagnosis...</option>
                                        {getDiagnosisOptions().map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Reason */}
                                <div>
                                    <label className="block text-sm font-semibold text-foreground-muted mb-1.5">
                                        Reason <span className="text-error">*</span>
                                    </label>
                                    <select
                                        value={feedbackReason}
                                        onChange={(e) => setFeedbackReason(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-white/[0.06] focus:border-accent focus:ring-2 focus:ring-orange-100 outline-none transition-all bg-surface-secondary text-foreground text-sm"
                                    >
                                        <option value="">Select reason...</option>
                                        <option value="wrong_class">Wrong class predicted</option>
                                        <option value="low_confidence">Low confidence / uncertain result</option>
                                        <option value="image_quality">Poor image quality affected result</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                {/* Additional Notes */}
                                <div>
                                    <label className="block text-sm font-semibold text-foreground-muted mb-1.5">
                                        Additional Notes <span className="text-foreground-subtle font-normal">(optional)</span>
                                    </label>
                                    <textarea
                                        value={feedbackNotes}
                                        onChange={(e) => setFeedbackNotes(e.target.value)}
                                        placeholder="Add any clinical observations or context..."
                                        className="w-full px-4 py-3 rounded-xl border border-white/[0.06] focus:border-accent focus:ring-2 focus:ring-orange-100 outline-none transition-all resize-none text-sm"
                                        rows={3}
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-1">
                                    <Button
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={() => { setShowFeedbackModal(false); setCorrectedDiagnosis(''); setFeedbackNotes(''); setFeedbackReason(''); }}
                                        disabled={submittingFeedback}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="flex-1 bg-gradient-to-r from-warning to-warning hover:from-orange-600 hover:to-amber-600 text-white shadow-card"
                                        onClick={handleSubmitFeedback}
                                        disabled={submittingFeedback}
                                    >
                                        {submittingFeedback
                                            ? <><FaSpinner className="animate-spin mr-2" /> Submitting...</>
                                            : <><FaCheckCircle className="mr-2" /> Submit Feedback</>
                                        }
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default Diagnostics;