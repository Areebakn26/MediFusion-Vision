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

const Diagnostics = () => {
    const [scans, setScans] = useState([]);
    const [selectedScan, setSelectedScan] = useState(null);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [diagnosis, setDiagnosis] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [activeTab, setActiveTab] = useState('findings');
    const [reportSubmitted, setReportSubmitted] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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
        setAiAnalysis(null);
        setDiagnosis('');
        setNotes('');
        setShowHeatmap(false);
        setReportSubmitted(false);
    };

    // ── Real Flask API call ──
    const runAIAnalysis = async () => {
        if (!selectedScan) return;
        setIsAnalyzing(true);
        try {
            const { data } = await api.post(`/scans/${selectedScan.id || selectedScan._id}/analyze`);
            setAiAnalysis(data);
            // Pre-fill diagnosis from AI prediction
            if (data.prediction?.class_name) {
                setDiagnosis(data.prediction.class_name.replace(/_/g, ' ')
                    .replace(/\b\w/g, c => c.toUpperCase()));
            }
            toast.success('AI Analysis complete!');
        } catch (error) {
            console.error("AI Analysis Error:", error);
            toast.error(error.response?.data?.message || 'AI Analysis failed');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // ── Submit report + notify patient ──
    const handleCreateReport = async (e) => {
        e.preventDefault();
        if (!selectedScan) return;
        try {
            await api.post(`/scans/${selectedScan.id || selectedScan._id}/report`, {
                diagnosis,
                notes,
                aiFindings: aiAnalysis
            });
            toast.success('Report finalized! Patient notified.');
            setReportSubmitted(true);
            fetchScans();
        } catch (error) {
            console.error("Error creating report", error);
            toast.error('Failed to create report');
        }
    };

    // ── PDF Generation ──
    const handleDownloadPDF = async () => {
        if (!selectedScan || !aiAnalysis) return;
        setIsGeneratingPdf(true);
        try {
            const response = await api.post(
                `/scans/${selectedScan.id || selectedScan._id}/report/pdf`,
                { diagnosis, notes, aiFindings: aiAnalysis },
                { responseType: 'blob' }
            );
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download',
                `MediFusion_Report_${selectedScan.patient?.name || 'Patient'}_${new Date().toISOString().slice(0,10)}.pdf`
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
            mri_brain: <FaBrain className="text-purple-500" />,
            retinal:   <FaEye className="text-blue-500" />,
            xray:      <FaLungs className="text-teal-500" />,
            ct_scan:   <FaXRay className="text-indigo-500" />
        };
        return icons[type] || <FaMicroscope className="text-gray-500" />;
    };

    const getStatusBadge = (status) => {
        const variants = { analyzed: 'success', verified: 'success', pending: 'warning', flagged: 'danger' };
        return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
    };

    const getConfidenceColor = (conf) => {
        if (conf >= 80) return 'text-green-600';
        if (conf >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    // ── Helper: get heatmap image src ──
    const getHeatmapSrc = () => {
        if (!aiAnalysis?.images) return null;
        const b64 = showHeatmap ? aiAnalysis.images.overlay : null;
        return b64 ? `data:image/jpeg;base64,${b64}` : null;
    };

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col md:flex-row gap-6">

            {/* ── Scans Sidebar ── */}
            <div className="w-full md:w-80 flex flex-col">
                <GlassCard className="h-full flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500 rounded-lg text-white"><FaRobot /></div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">AI Diagnostics</h2>
                                <p className="text-sm text-gray-500">
                                    {scans.filter(s => s.status === 'pending').length} pending review
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {loading ? (
                            <div className="text-center py-8 text-gray-500">
                                <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />Loading scans...
                            </div>
                        ) : scans.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
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
                                    className={`p-4 rounded-xl cursor-pointer border-2 transition-all ${
                                        (selectedScan?.id || selectedScan?._id) === (scan.id || scan._id)
                                            ? 'bg-blue-50 border-blue-300 shadow-md'
                                            : 'bg-white/50 border-transparent hover:bg-white hover:border-gray-200 hover:shadow-sm'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-gray-100 rounded-lg text-xl">
                                            {getScanIcon(scan.scanType || scan.scan_type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-semibold text-gray-800 capitalize">
                                                    {(scan.scanType || scan.scan_type || 'Unknown').replace('_', ' ')}
                                                </span>
                                                {getStatusBadge(scan.status)}
                                            </div>
                                            <p className="text-sm text-gray-600 truncate">
                                                {scan.patient?.name || 'Unknown Patient'}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
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
                            className="h-full flex flex-col"
                        >
                            <GlassCard className="h-full flex flex-col overflow-hidden">

                                {/* Header */}
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white/60">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white text-2xl">
                                            {getScanIcon(selectedScan.scanType || selectedScan.scan_type)}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-800 capitalize">
                                                {(selectedScan.scanType || selectedScan.scan_type || 'Medical').replace('_', ' ')} Analysis
                                            </h2>
                                            <p className="text-gray-500">
                                                Patient: <span className="font-medium">{selectedScan.patient?.name || 'Unknown'}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-wrap justify-end">
                                        <Button
                                            variant="outline"
                                            onClick={() => window.open(`http://localhost:5000${selectedScan.filePath || selectedScan.file_url}`, '_blank')}
                                        >
                                            <FaDownload className="mr-2" /> Full Image
                                        </Button>
                                        {!aiAnalysis && (
                                            <Button
                                                onClick={runAIAnalysis}
                                                disabled={isAnalyzing}
                                                className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg"
                                            >
                                                {isAnalyzing
                                                    ? <><FaSpinner className="animate-spin mr-2" /> Analyzing...</>
                                                    : <><FaRobot className="mr-2" /> Run AI Analysis</>
                                                }
                                            </Button>
                                        )}
                                        {/* PDF Download Button — shows after AI analysis */}
                                        {aiAnalysis && (
                                            <Button
                                                onClick={handleDownloadPDF}
                                                disabled={isGeneratingPdf}
                                                className="bg-gradient-to-r from-red-500 to-pink-600 shadow-lg text-white"
                                            >
                                                {isGeneratingPdf
                                                    ? <><FaSpinner className="animate-spin mr-2" /> Generating...</>
                                                    : <><FaFilePdf className="mr-2" /> Download PDF</>
                                                }
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                        {/* ── Image Preview ── */}
                                        <div className="space-y-4">
                                            <div className="relative bg-gray-900 rounded-2xl p-4 overflow-hidden">
                                                <div className="absolute top-4 left-4 z-10 flex gap-2">
                                                    <button
                                                        onClick={() => setShowHeatmap(false)}
                                                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                                                            !showHeatmap ? 'bg-white text-gray-900' : 'bg-white/20 text-white hover:bg-white/30'
                                                        }`}
                                                    >
                                                        Original
                                                    </button>
                                                    {aiAnalysis?.images && (
                                                        <button
                                                            onClick={() => setShowHeatmap(true)}
                                                            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                                                                showHeatmap ? 'bg-white text-gray-900' : 'bg-white/20 text-white hover:bg-white/30'
                                                            }`}
                                                        >
                                                            🔥 GradCAM
                                                        </button>
                                                    )}
                                                </div>

                                                <img
                                                    src={
                                                        showHeatmap && aiAnalysis?.images?.overlay
                                                            ? `data:image/jpeg;base64,${aiAnalysis.images.overlay}`
                                                            : showHeatmap && aiAnalysis?.images?.heatmap
                                                            ? `data:image/jpeg;base64,${aiAnalysis.images.heatmap}`
                                                            : aiAnalysis?.images?.original
                                                            ? `data:image/jpeg;base64,${aiAnalysis.images.original}`
                                                            : `http://localhost:5000${selectedScan.filePath || selectedScan.file_url}`
                                                    }
                                                    alt="Scan"
                                                    className="max-h-[400px] w-full object-contain rounded-lg mt-8"
                                                    onError={(e) => {
                                                        e.target.src = 'https://via.placeholder.com/400x400?text=Scan+Preview';
                                                    }}
                                                />

                                                {showHeatmap && (
                                                    <div className="mt-3 flex items-center justify-center gap-2 text-white text-sm">
                                                        <span className="w-3 h-3 rounded bg-red-500"></span><span>High Attention</span>
                                                        <span className="w-3 h-3 rounded bg-yellow-500 ml-2"></span><span>Medium</span>
                                                        <span className="w-3 h-3 rounded bg-blue-500 ml-2"></span><span>Low</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Scan Metadata */}
                                            <div className="bg-gray-50 rounded-xl p-4">
                                                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                    <FaFileAlt /> Scan Information
                                                </h4>
                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <div><span className="text-gray-500">Patient:</span>
                                                        <span className="ml-2 font-medium">{selectedScan.patient?.name || 'N/A'}</span></div>
                                                    <div><span className="text-gray-500">Type:</span>
                                                        <span className="ml-2 font-medium capitalize">
                                                            {(selectedScan.scanType || selectedScan.scan_type || 'N/A').replace('_', ' ')}
                                                        </span></div>
                                                    <div><span className="text-gray-500">Source:</span>
                                                        <span className="ml-2 font-medium capitalize">{selectedScan.scan_source || 'External'}</span></div>
                                                    <div><span className="text-gray-500">Uploaded:</span>
                                                        <span className="ml-2 font-medium">{new Date(selectedScan.createdAt).toLocaleDateString()}</span></div>
                                                    {aiAnalysis?.analysis_meta && (
                                                        <>
                                                            <div><span className="text-gray-500">Eye Side:</span>
                                                                <span className="ml-2 font-medium capitalize">
                                                                    {aiAnalysis.analysis_meta.eye_side} ({aiAnalysis.analysis_meta.eye_confidence})
                                                                </span></div>
                                                            <div><span className="text-gray-500">Threshold:</span>
                                                                <span className="ml-2 font-medium">{aiAnalysis.analysis_meta.otsu_threshold}</span></div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── AI Analysis Results ── */}
                                        <div className="space-y-4">
                                            {isAnalyzing ? (
                                                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 text-center border border-blue-100">
                                                    <div className="relative w-20 h-20 mx-auto mb-4">
                                                        <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                                                        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <FaBrain className="text-2xl text-blue-600" />
                                                        </div>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-800 mb-2">AI Analysis in Progress</h3>
                                                    <p className="text-gray-500 text-sm">Running GradCAM on EfficientNetB3...</p>
                                                    <div className="mt-4 space-y-2 text-xs text-gray-400">
                                                        <p>✓ Image preprocessing</p>
                                                        <p>⟳ Running neural network inference...</p>
                                                        <p>○ Generating GradCAM heatmap</p>
                                                        <p>○ Analyzing retinal regions</p>
                                                    </div>
                                                </div>

                                            ) : aiAnalysis ? (
                                                <>
                                                    {/* Primary Prediction */}
                                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-blue-600 rounded-lg text-white"><FaRobot /></div>
                                                                <div>
                                                                    <h3 className="font-bold text-gray-800">AI Prediction</h3>
                                                                    <p className="text-xs text-gray-500">EfficientNetB3 — GradCAM</p>
                                                                </div>
                                                            </div>
                                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                                getConfidenceColor(aiAnalysis.prediction?.confidence)
                                                            } bg-white border`}>
                                                                {aiAnalysis.explanation?.confidence_text}
                                                            </span>
                                                        </div>

                                                        <div className="text-center py-4 bg-white/60 rounded-xl mb-4">
                                                            <p className="text-2xl font-bold text-gray-800 capitalize">
                                                                {aiAnalysis.prediction?.class_name?.replace(/_/g, ' ')}
                                                            </p>
                                                            <p className={`text-lg font-semibold ${getConfidenceColor(aiAnalysis.prediction?.confidence)}`}>
                                                                {aiAnalysis.prediction?.confidence?.toFixed(1)}% Confidence
                                                            </p>
                                                        </div>

                                                        {/* Confidence bar */}
                                                        <div className="mb-4">
                                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                                <span>Confidence</span>
                                                                <span>{aiAnalysis.prediction?.confidence?.toFixed(0)}%</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${aiAnalysis.prediction?.confidence}%` }}
                                                                    transition={{ duration: 1, ease: 'easeOut' }}
                                                                    className={`h-full rounded-full ${
                                                                        aiAnalysis.prediction?.confidence >= 80 ? 'bg-green-500' :
                                                                        aiAnalysis.prediction?.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                                    }`}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Clinical note */}
                                                        {aiAnalysis.explanation?.clinical_note && (
                                                            <div className="text-sm text-blue-700 bg-blue-100 rounded-lg p-3">
                                                                <strong>Clinical Note:</strong> {aiAnalysis.explanation.clinical_note}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Tabs */}
                                                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                                        <div className="flex border-b border-gray-100">
                                                            {['findings', 'regions', 'probabilities'].map((tab) => (
                                                                <button
                                                                    key={tab}
                                                                    onClick={() => setActiveTab(tab)}
                                                                    className={`flex-1 py-3 text-sm font-medium transition-all capitalize ${
                                                                        activeTab === tab
                                                                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                                                    }`}
                                                                >
                                                                    {tab}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <div className="p-4">
                                                            <AnimatePresence mode="wait">
                                                                {/* Findings tab */}
                                                                {activeTab === 'findings' && (
                                                                    <motion.div key="findings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                                                        <div className="space-y-3 text-sm text-gray-700">
                                                                            {aiAnalysis.explanation?.what_model_sees && (
                                                                                <div className="p-3 bg-blue-50 rounded-lg">
                                                                                    <strong>What model sees:</strong>
                                                                                    <p className="mt-1">{aiAnalysis.explanation.what_model_sees}</p>
                                                                                </div>
                                                                            )}
                                                                            {aiAnalysis.explanation?.why_prediction && (
                                                                                <div className="p-3 bg-green-50 rounded-lg">
                                                                                    <strong>Why this prediction:</strong>
                                                                                    <p className="mt-1">{aiAnalysis.explanation.why_prediction}</p>
                                                                                </div>
                                                                            )}
                                                                            {aiAnalysis.explanation?.validity_check && (
                                                                                <div className="p-3 bg-yellow-50 rounded-lg">
                                                                                    <strong>Validity:</strong>
                                                                                    <p className="mt-1">{aiAnalysis.explanation.validity_check}</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                                                                            <div className="flex items-start gap-2">
                                                                                <FaExclamationTriangle className="text-yellow-600 mt-0.5" />
                                                                                <p className="text-xs text-yellow-700">
                                                                                    AI analysis is for assistance only. Final diagnosis by qualified professional required.
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                )}

                                                                {/* Regions tab */}
                                                                {activeTab === 'regions' && (
                                                                    <motion.div key="regions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-2">
                                                                        {aiAnalysis.regions?.map((region, idx) => (
                                                                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className={`w-2 h-2 rounded-full ${region.is_expected ? 'bg-red-500' : 'bg-gray-300'}`}></span>
                                                                                    <span className="text-sm font-medium text-gray-700">{region.label}</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                                                                        <div className={`h-2 rounded-full ${region.is_expected ? 'bg-red-400' : 'bg-blue-400'}`}
                                                                                            style={{ width: `${Math.min(region.score * 100 * 3, 100)}%` }}></div>
                                                                                    </div>
                                                                                    <span className="text-xs text-gray-500 w-16 text-right">
                                                                                        {(region.coverage_pct).toFixed(0)}% active
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </motion.div>
                                                                )}

                                                                {/* Probabilities tab */}
                                                                {activeTab === 'probabilities' && (
                                                                    <motion.div key="probabilities" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                                                                        {aiAnalysis.prediction?.all_probs && Object.entries(aiAnalysis.prediction.all_probs)
                                                                            .sort((a, b) => b[1] - a[1])
                                                                            .map(([cls, prob], idx) => (
                                                                                <div key={idx} className="flex items-center justify-between">
                                                                                    <span className="text-sm text-gray-700 capitalize w-40">{cls.replace(/_/g, ' ')}</span>
                                                                                    <div className="flex items-center gap-2 flex-1">
                                                                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                                                            <motion.div
                                                                                                initial={{ width: 0 }}
                                                                                                animate={{ width: `${prob}%` }}
                                                                                                transition={{ duration: 0.8, delay: idx * 0.1 }}
                                                                                                className="bg-blue-500 h-2 rounded-full"
                                                                                            />
                                                                                        </div>
                                                                                        <span className="text-xs text-gray-500 w-12 text-right">{prob.toFixed(1)}%</span>
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

                                            ) : (
                                                <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-200">
                                                    <FaRobot className="text-5xl text-gray-300 mx-auto mb-4" />
                                                    <h3 className="text-lg font-bold text-gray-600 mb-2">Ready for AI Analysis</h3>
                                                    <p className="text-gray-400 text-sm mb-4">
                                                        Click "Run AI Analysis" to process this retinal scan.
                                                    </p>
                                                    <Button onClick={runAIAnalysis} className="mx-auto">
                                                        <FaRobot className="mr-2" /> Start Analysis
                                                    </Button>
                                                </div>
                                            )}

                                            {/* ── Doctor Report Form ── */}
                                            {aiAnalysis && !reportSubmitted && (
                                                <form onSubmit={handleCreateReport} className="bg-white rounded-xl p-6 border border-gray-100">
                                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                        <FaFileAlt className="text-blue-500" /> Doctor's Final Report
                                                    </h3>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis</label>
                                                            <Input
                                                                value={diagnosis}
                                                                onChange={(e) => setDiagnosis(e.target.value)}
                                                                placeholder="Enter final diagnosis..."
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Clinical Notes & Recommendations
                                                            </label>
                                                            <textarea
                                                                rows={4}
                                                                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                                                                value={notes}
                                                                onChange={(e) => setNotes(e.target.value)}
                                                                placeholder="Add clinical notes, recommendations, follow-up instructions..."
                                                                required
                                                            />
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <Button type="submit" size="lg" className="flex-1 shadow-lg">
                                                                <FaCheckCircle className="mr-2" /> Finalize & Notify Patient
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                onClick={handleDownloadPDF}
                                                                disabled={isGeneratingPdf}
                                                                size="lg"
                                                                className="bg-red-500 hover:bg-red-600 text-white shadow-lg"
                                                            >
                                                                {isGeneratingPdf
                                                                    ? <FaSpinner className="animate-spin" />
                                                                    : <FaFilePdf />
                                                                }
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </form>
                                            )}

                                            {/* ── Report Submitted ── */}
                                            {reportSubmitted && (
                                                <div className="bg-green-50 rounded-xl p-6 border border-green-100 text-center">
                                                    <FaCheckCircle className="text-4xl text-green-500 mx-auto mb-3" />
                                                    <h3 className="font-bold text-green-800 mb-1">Report Finalized!</h3>
                                                    <p className="text-sm text-green-600 mb-4">Patient has been notified.</p>
                                                    <Button
                                                        onClick={handleDownloadPDF}
                                                        disabled={isGeneratingPdf}
                                                        className="bg-red-500 hover:bg-red-600 text-white mx-auto"
                                                    >
                                                        {isGeneratingPdf
                                                            ? <><FaSpinner className="animate-spin mr-2" /> Generating...</>
                                                            : <><FaFilePdf className="mr-2" /> Download PDF Report</>
                                                        }
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex items-center justify-center">
                            <GlassCard className="p-12 text-center max-w-md">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FaMicroscope className="text-4xl text-blue-500" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Select a Scan</h3>
                                <p className="text-gray-500">
                                    Choose a pending scan from the sidebar to view details, run AI analysis, and create a diagnostic report.
                                </p>
                            </GlassCard>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Diagnostics;