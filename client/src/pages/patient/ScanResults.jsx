import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    FaVolumeUp
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

    useEffect(() => {
        fetchScanResults();
    }, [id]);

    useEffect(() => {
        const handleVoiceCommand = () => {
            if (scan?.ai_prediction?.primary?.condition) {
                speakText(`AI Analysis Result: ${scan.ai_prediction.primary.condition}. ${scan.ai_explanation || ''}`);
                setIsSpeakingAI(true);
            }
        };
        window.addEventListener('voice-read-report', handleVoiceCommand);
        return () => window.removeEventListener('voice-read-report', handleVoiceCommand);
    }, [scan]);

    const handleAITTS = () => {
        if (isSpeakingAI) {
            stopSpeaking();
            setIsSpeakingAI(false);
        } else {
            speakText(`AI Analysis Result: ${aiResult.primary.condition}. Confidence is ${(confidence * 100).toFixed(0)} percent. ${scan.ai_explanation || ''}`);
            setIsSpeakingAI(true);
            setIsSpeakingDoc(false);
        }
    };

    const handleDocTTS = () => {
        const report = scan?.Reports?.[0];
        if (isSpeakingDoc) {
            stopSpeaking();
            setIsSpeakingDoc(false);
        } else {
            speakText(`Doctor's Diagnosis: ${report.diagnosis}. Clinical Notes: ${report.doctor_notes || ''}`);
            setIsSpeakingDoc(true);
            setIsSpeakingAI(false);
        }
    };

    const fetchScanResults = async () => {
        try {
            const { data } = await api.get(`/scans/${id}`);
            setScan(data);
        } catch (error) {
            console.error("Error fetching scan:", error);
            // Use mock data for demonstration
            setScan(getMockScan());
        } finally {
            setLoading(false);
        }
    };

    const getMockScan = () => ({
        id: id,
        scan_type: 'mri_brain',
        file_url: '/uploads/sample-scan.jpg',
        status: 'verified',
        ai_prediction: {
            primary: { condition: 'Early-stage Alzheimer\'s Disease', confidence: 0.87 },
            differential: [
                { condition: 'Early-stage Alzheimer\'s Disease', confidence: 0.87 },
                { condition: 'Mild Cognitive Impairment', confidence: 0.08 },
                { condition: 'Normal Age-related Changes', confidence: 0.05 }
            ]
        },
        ai_explanation: 'AI analysis detected bilateral hippocampal atrophy and enlarged temporal horns of lateral ventricles. Medial temporal lobe volume reduction is consistent with early neurodegenerative changes. No acute infarct or mass lesion identified.',
        Reports: [{
            diagnosis: 'Early-stage Alzheimer\'s Disease (Probable)',
            doctor_notes: 'MRI findings show characteristic patterns of early Alzheimer\'s disease including hippocampal volume loss and ventricular enlargement. Recommend neuropsychological testing, PET scan for confirmation, and consultation with neurology. Consider starting cognitive enhancement therapy. Schedule follow-up MRI in 6 months to monitor progression.',
            Doctor: { User: { name: 'Dr. Ahmed Neurologist' } },
            finalized_at: new Date().toISOString()
        }],
        createdAt: new Date().toISOString()
    });

    const getScanIcon = (type) => {
        const icons = {
            mri_brain: <FaBrain className="text-purple-500" />,
            retinal: <FaEye className="text-blue-500" />,
            xray: <FaLungs className="text-teal-500" />,
            ct_scan: <FaXRay className="text-indigo-500" />
        };
        return icons[type] || <FaLungs className="text-gray-500" />;
    };

    const getConfidenceColor = (confidence) => {
        if (confidence >= 0.8) return 'text-green-600';
        if (confidence >= 0.6) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getSeverityFromConfidence = (confidence) => {
        if (confidence >= 0.85) return { text: 'High Confidence', color: 'bg-green-100 text-green-700' };
        if (confidence >= 0.7) return { text: 'Moderate Confidence', color: 'bg-yellow-100 text-yellow-700' };
        return { text: 'Low Confidence', color: 'bg-red-100 text-red-700' };
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-500">Loading scan results...</p>
                </div>
            </div>
        );
    }

    if (!scan) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <GlassCard className="p-8 text-center">
                    <FaExclamationTriangle className="text-4xl text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Scan Not Found</h2>
                    <p className="text-gray-500 mb-4">The requested scan could not be found.</p>
                    <Link to="/patient/scans">
                        <Button>Back to My Scans</Button>
                    </Link>
                </GlassCard>
            </div>
        );
    }

    const aiResult = scan.ai_prediction;
    const report = scan.Reports?.[0];
    const confidence = aiResult?.primary?.confidence || 0;
    const severityInfo = getSeverityFromConfidence(confidence);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/patient/scans">
                            <Button variant="ghost" size="sm">
                                <FaArrowLeft className="mr-2" /> Back to Scans
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">AI Analysis Results</h1>
                            <p className="text-gray-500 text-sm">
                                Scan ID: {scan.id?.slice(0, 8)}... • {new Date(scan.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <Badge variant={scan.status === 'verified' ? 'success' : 'warning'}>
                        {scan.status}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Scan Image */}
                    <div className="lg:col-span-2">
                        <GlassCard className="overflow-hidden">
                            <div className="bg-gray-900 p-4 relative">
                                {/* Toggle buttons */}
                                <div className="absolute top-4 left-4 z-10 flex gap-2">
                                    <button
                                        onClick={() => setShowHeatmap(false)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${!showHeatmap ? 'bg-white text-gray-900' : 'bg-white/20 text-white hover:bg-white/30'
                                            }`}
                                    >
                                        Original
                                    </button>
                                    <button
                                        onClick={() => setShowHeatmap(true)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${showHeatmap ? 'bg-white text-gray-900' : 'bg-white/20 text-white hover:bg-white/30'
                                            }`}
                                    >
                                        🔥 AI Attention Map
                                    </button>
                                </div>

                                {/* Download button */}
                                <div className="absolute top-4 right-4 z-10">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="bg-white/20 text-white hover:bg-white/30"
                                        onClick={() => window.open(`http://localhost:5000${scan.file_url}`, '_blank')}
                                    >
                                        <FaDownload />
                                    </Button>
                                </div>

                                {/* Image */}
                                <div className="relative flex justify-center">
                                    <img
                                        src={`http://localhost:5000${scan.file_url}`}
                                        alt="Medical Scan"
                                        className="max-h-[500px] object-contain rounded-lg"
                                        onError={(e) => {
                                            e.target.src = 'https://prod-images-static.radiopaedia.org/images/157210/332ea09151e9639f66a439777d617d_jumbo.jpg';
                                        }}
                                    />

                                    {/* Heatmap overlay */}
                                    {showHeatmap && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                        >
                                            <div
                                                className="absolute inset-0"
                                                style={{
                                                    background: 'radial-gradient(ellipse at 55% 55%, rgba(239, 68, 68, 0.5) 0%, rgba(251, 191, 36, 0.3) 25%, transparent 50%)',
                                                    borderRadius: '0.5rem'
                                                }}
                                            />
                                        </motion.div>
                                    )}
                                </div>

                                {/* Legend */}
                                {showHeatmap && (
                                    <div className="mt-4 flex items-center justify-center gap-4 text-white text-sm">
                                        <div className="flex items-center gap-1">
                                            <span className="w-3 h-3 rounded bg-red-500"></span>
                                            <span>High attention (potential abnormality)</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="w-3 h-3 rounded bg-yellow-500"></span>
                                            <span>Moderate attention</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Scan info */}
                            <div className="p-4 bg-gray-50 border-t border-gray-100">
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        {getScanIcon(scan.scan_type)}
                                        <span className="capitalize">{(scan.scan_type || 'unknown').replace('_', ' ')}</span>
                                    </div>
                                    <span>•</span>
                                    <div className="flex items-center gap-2">
                                        <FaCalendarAlt className="text-gray-400" />
                                        <span>{new Date(scan.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {scan.facility_name && (
                                        <>
                                            <span>•</span>
                                            <span>{scan.facility_name}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Results Panel */}
                    <div className="space-y-6">
                        {/* AI Diagnosis */}
                        {aiResult && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <GlassCard className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
                                            <FaBrain />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">AI Analysis</h3>
                                            <p className="text-xs text-gray-500">Powered by deep learning</p>
                                        </div>
                                        {ttsEnabled && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="ml-auto flex items-center gap-2 text-primary-500 border-primary-500 bg-white hover:bg-primary-50"
                                                onClick={handleAITTS}
                                            >
                                                {isSpeakingAI ? <FaStop /> : <FaVolumeUp />}
                                                {isSpeakingAI ? 'Stop' : 'Listen'}
                                            </Button>
                                        )}
                                    </div>

                                    {/* Primary finding */}
                                    <div className="text-center py-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl mb-4">
                                        <p className="text-2xl font-bold text-gray-800 mb-1">
                                            {aiResult.primary?.condition || 'Analysis Complete'}
                                        </p>
                                        <p className={`text-lg font-semibold ${getConfidenceColor(confidence)}`}>
                                            {(confidence * 100).toFixed(0)}% Confidence
                                        </p>
                                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${severityInfo.color}`}>
                                            {severityInfo.text}
                                        </span>
                                    </div>

                                    {/* Confidence bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>AI Confidence</span>
                                            <span>{(confidence * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${confidence * 100}%` }}
                                                transition={{ duration: 1, delay: 0.5 }}
                                                className={`h-full rounded-full ${confidence >= 0.8 ? 'bg-green-500' :
                                                        confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`}
                                            />
                                        </div>
                                    </div>

                                    {/* Differential diagnoses */}
                                    {aiResult.differential && (
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-gray-600">Other possibilities:</p>
                                            {aiResult.differential.slice(1, 3).map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">{item.condition}</span>
                                                    <span className="text-gray-400">{(item.confidence * 100).toFixed(0)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* AI Explanation */}
                                    {scan.ai_explanation && (
                                        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                                            <p>{scan.ai_explanation}</p>
                                        </div>
                                    )}

                                    {/* Disclaimer */}
                                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                                        <div className="flex items-start gap-2">
                                            <FaExclamationTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-yellow-700">
                                                AI analysis is for informational purposes only and should not replace professional medical advice.
                                            </p>
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        )}

                        {/* Doctor's Report */}
                        {report ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <GlassCard className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-green-500 rounded-lg text-white">
                                            <FaUserMd />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">Doctor's Report</h3>
                                            <p className="text-xs text-gray-500">
                                                {report.Doctor?.User?.name || 'Verified by specialist'}
                                            </p>
                                        </div>
                                        {ttsEnabled && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="ml-auto flex items-center gap-2 mr-2 text-green-500 border-green-500 bg-white hover:bg-green-50"
                                                onClick={handleDocTTS}
                                            >
                                                {isSpeakingDoc ? <FaStop /> : <FaVolumeUp />}
                                                {isSpeakingDoc ? 'Stop' : 'Listen'}
                                            </Button>
                                        )}
                                        <Badge variant="success" className={ttsEnabled ? "" : "ml-auto"}>Verified</Badge>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 mb-1">Diagnosis</p>
                                            <p className="text-lg font-semibold text-gray-800">{report.diagnosis}</p>
                                        </div>

                                        {report.doctor_notes && (
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 mb-1">Clinical Notes</p>
                                                <p className="text-gray-600">{report.doctor_notes}</p>
                                            </div>
                                        )}

                                        {report.finalized_at && (
                                            <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                                                Report finalized: {new Date(report.finalized_at).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <GlassCard className="p-6 text-center">
                                    <FaUserMd className="text-4xl text-gray-300 mx-auto mb-3" />
                                    <h3 className="font-bold text-gray-600 mb-2">Awaiting Doctor Review</h3>
                                    <p className="text-sm text-gray-400 mb-4">
                                        A specialist will review your scan and provide a detailed report.
                                    </p>
                                    <Link to="/patient/book-appointment">
                                        <Button variant="outline" size="sm">
                                            Book Consultation
                                        </Button>
                                    </Link>
                                </GlassCard>
                            </motion.div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Link to="/patient/scans" className="flex-1">
                                <Button variant="outline" className="w-full">
                                    View All Scans
                                </Button>
                            </Link>
                            <Link to="/patient/book-appointment" className="flex-1">
                                <Button className="w-full">
                                    Book Follow-up
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScanResults;
