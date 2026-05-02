import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    FaUserMd, FaPlus, FaChevronRight, FaImage, FaRobot,
    FaRegClock, FaNotesMedical, FaTimes, FaStop, FaPaperPlane,
    FaComments, FaBrain, FaHistory
} from 'react-icons/fa';
import api from '../../services/api';
import { uploadConsultationAudio, finalizeConsultationNotes } from '../../services/api';
import { toast } from 'react-hot-toast';
import { Button, Badge } from '../../components/ui';
import Modal from '../../components/ui/Modal';

const ConsultationRoom = () => {
    const { appointmentId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const jitsiContainerRef = useRef(null);
    const jitsiApiRef = useRef(null);
    const chatEndRef = useRef(null);

    // Data state
    const [patientContext, setPatientContext] = useState(null);
    const [notes, setNotes] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [newChatMsg, setNewChatMsg] = useState('');
    const [elapsedTime, setElapsedTime] = useState(0);
    const timerRef = useRef(null);

    // AI scribe
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [showNoteReviewModal, setShowNoteReviewModal] = useState(false);
    const [isEndingSession, setIsEndingSession] = useState(false);
    const [aiTranscript, setAiTranscript] = useState('');
    const [editedNotes, setEditedNotes] = useState({
        chiefComplaint: '', historyOfPresentIllness: '', symptoms: [],
        medicalHistoryMentioned: [], assessment: '', plan: '',
        followUpInstructions: '', patientSummary: ''
    });
    const [doctorFinalNotes, setDoctorFinalNotes] = useState('');
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // UI
    const [selectedScan, setSelectedScan] = useState(null);
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [rightTab, setRightTab] = useState(user?.role === 'doctor' ? 'scans' : 'chat'); // 'scans' | 'chat'
    const [jitsiReady, setJitsiReady] = useState(false);

    /* ── 1. FETCH DATA ──────────────────────────────────────────────────── */
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                if (user?.role === 'doctor') {
                    const [notesRes, contextRes] = await Promise.all([
                        api.get(`/consultation/${appointmentId}/notes`),
                        api.get(`/consultation/${appointmentId}/patient-context`)
                    ]);
                    if (cancelled) return;
                    setNotes(notesRes.data || []);
                    setPatientContext(contextRes.data);
                    setElapsedTime(0);
                    timerRef.current = setInterval(() => setElapsedTime(p => p + 1), 1000);
                } else {
                    // Patient — skip all doctor-only API calls
                    if (!cancelled) setPatientContext({ patient: null, scans: [], pastConsultations: [], medicalHistory: [] });
                }
            } catch (err) {
                console.error('Consultation load error:', err);
                if (!cancelled) setPatientContext({ patient: null, scans: [], pastConsultations: [], medicalHistory: [] });
            }
            // Load chat for both roles
            try {
                const chatRes = await api.get(`/consultation/${appointmentId}/chat`);
                if (!cancelled) setChatMessages(chatRes.data || []);
            } catch (_) {}
            if (!cancelled) setJitsiReady(true);
        };
        load();
        return () => { cancelled = true; if (timerRef.current) clearInterval(timerRef.current); };
    }, [appointmentId, user?.role]);

    /* ── 2. INIT JITSI after DOM is ready ──────────────────────────────── */
    useEffect(() => {
        if (!jitsiReady) return;

        const init = () => {
            if (!jitsiContainerRef.current) return;
            if (jitsiApiRef.current) return; // already initialized
            jitsiContainerRef.current.innerHTML = '';
            const api = new window.JitsiMeetExternalAPI('meet.jit.si', {
                roomName: `MediFusionVision-${appointmentId}`,
                width: '100%',
                height: '100%',
                parentNode: jitsiContainerRef.current,
                userInfo: { displayName: user?.name || 'User' },
                configOverwrite: { startWithAudioMuted: false, startWithVideoMuted: false },
                interfaceConfigOverwrite: {
                    TOOLBAR_BUTTONS: ['microphone', 'camera', 'desktop', 'fullscreen', 'hangup', 'tileview', 'videoquality', 'filmstrip', 'stats']
                }
            });
            jitsiApiRef.current = api;
        };

        if (window.JitsiMeetExternalAPI) {
            init();
        } else {
            const existing = document.querySelector('script[src*="meet.jit.si/external_api"]');
            if (existing) { existing.addEventListener('load', init); return; }
            const script = document.createElement('script');
            script.src = 'https://meet.jit.si/external_api.js';
            script.async = true;
            script.onload = init;
            document.body.appendChild(script);
        }

        return () => {
            if (jitsiApiRef.current) {
                try { jitsiApiRef.current.dispose(); } catch (_) {}
                jitsiApiRef.current = null;
            }
        };
    }, [jitsiReady, appointmentId, user?.name]);

    /* ── 3. CHAT POLLING ────────────────────────────────────────────────── */
    useEffect(() => {
        if (!jitsiReady) return;
        const poll = setInterval(async () => {
            try {
                const { data } = await api.get(`/consultation/${appointmentId}/chat`);
                setChatMessages(data || []);
            } catch (_) {}
        }, 5000);
        return () => clearInterval(poll);
    }, [jitsiReady, appointmentId]);

    /* ── 4. AUTO-SCROLL CHAT ────────────────────────────────────────────── */
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    /* ── HELPERS ────────────────────────────────────────────────────────── */
    const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const isBrainScan = (scan) => (scan?.scan_type || scan?.scanType || '') === 'mri_brain';

    const getHeatmapSrc = (url) => {
        if (!url) return null;
        if (url.startsWith('data:') || url.startsWith('http')) return url;
        if (url.startsWith('/')) return `${import.meta.env.VITE_API_URL}${url}`;
        return `data:image/png;base64,${url}`;
    };

    const getBrainDiagnosis = (pred) => {
        if (!pred) return 'UNDETERMINED ANALYSIS';
        if (pred.scan_type === 'brain_mri') return `Tumor: ${pred.tumor?.prediction || 'N/A'}  |  Alzheimer: ${pred.alzheimer?.prediction || 'N/A'}`;
        return pred.class_name || pred.prediction || 'UNDETERMINED ANALYSIS';
    };

    const getBrainConfidence = (pred) => {
        if (!pred) return null;
        if (pred.scan_type === 'brain_mri') return Math.max(pred.tumor?.confidence || 0, pred.alzheimer?.confidence || 0);
        return pred.confidence || null;
    };

    /* ── AI ANALYSIS ────────────────────────────────────────────────────── */
    const handleRunAI = useCallback(async (scanId) => {
        if (!scanId) return null;
        const scan = patientContext?.scans?.find(s => s.id === scanId);
        if (!scan) return null;
        setIsProcessingAI(true);
        try {
            const endpoint = isBrainScan(scan) ? `/scans/${scanId}/analyze-brain` : `/scans/${scanId}/analyze`;
            const { data } = await api.post(endpoint);
            const heatmapB64 = data.images?.tumor_heatmap || data.images?.alz_heatmap || data.images?.overlay || null;
            const heatmapSrc = heatmapB64 ? `data:image/png;base64,${heatmapB64}` : (data.ai_heatmap_url || null);
            const aiPrediction = data.prediction || { scan_type: data.scan_type, tumor: data.tumor, alzheimer: data.alzheimer };
            const updated = { status: 'analyzed', ai_prediction: aiPrediction, ai_heatmap_url: heatmapSrc };
            setPatientContext(prev => ({ ...prev, scans: prev.scans.map(s => s.id === scanId ? { ...s, ...updated } : s) }));
            setSelectedScan(prev => prev?.id === scanId ? { ...prev, ...updated } : prev);
            toast.success('AI Analysis Complete!');
            return updated;
        } catch (err) {
            toast.error(err.response?.data?.message || 'AI Analysis failed');
            return null;
        } finally {
            setIsProcessingAI(false);
        }
    }, [patientContext]);

    /* ── AI SCRIBE ──────────────────────────────────────────────────────── */
    const startRecording = async () => {
        console.log('[CR] startRecording called');
        audioChunksRef.current = [];

        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            console.log('[CR] mic granted:', stream.getAudioTracks().map(t => t.label));
        } catch (err) {
            console.error('[CR] getUserMedia failed:', err.name, err.message);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                toast.error('Microphone blocked. Click the lock icon in the address bar → Allow → refresh.', { duration: 7000 });
            } else if (err.name === 'NotFoundError') {
                toast.error('No microphone found. Plug in a microphone and try again.');
            } else {
                toast.error('Microphone error: ' + err.message);
            }
            return;
        }

        const recorder = new MediaRecorder(stream);

        recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
                audioChunksRef.current.push(e.data);
                console.log('[CR] audio chunk:', e.data.size, 'bytes, total chunks:', audioChunksRef.current.length);
            }
        };

        recorder.onstop = async () => {
            stream.getTracks().forEach(t => t.stop());
            console.log('[CR] recording stopped. total chunks:', audioChunksRef.current.length);
            setIsProcessingAI(true);
            try {
                if (audioChunksRef.current.length === 0) {
                    toast.error('No audio captured. Check Windows Sound Settings → Recording → Set as Default Device.', { duration: 10000 });
                    return;
                }
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                console.log('[CR] blob size:', blob.size, 'bytes');
                console.log('[CR] uploading for appointment:', appointmentId);

                const { data } = await uploadConsultationAudio(appointmentId, blob);
                console.log('[CR] AI response:', data);

                setAiTranscript(data.transcript || '');
                const n = data.notes || {};
                setEditedNotes({
                    chiefComplaint: n.chiefComplaint || '',
                    historyOfPresentIllness: n.historyOfPresentIllness || '',
                    symptoms: Array.isArray(n.symptoms) ? n.symptoms : [],
                    medicalHistoryMentioned: Array.isArray(n.medicalHistoryMentioned) ? n.medicalHistoryMentioned : [],
                    assessment: n.assessment || '',
                    plan: n.plan || '',
                    followUpInstructions: n.followUpInstructions || '',
                    patientSummary: n.patientSummary || ''
                });
            } catch (err) {
                console.error('[CR] upload/AI error:', err);
                toast.error('AI note generation failed. Enter notes manually.');
            } finally {
                setIsProcessingAI(false);
                setShowNoteReviewModal(true); // always open modal — success or failure
            }
        };

        mediaRecorderRef.current = recorder;
        recorder.start(1000); // chunk every second
        setIsRecording(true);
        toast.success('Recording: ' + (stream.getAudioTracks()[0]?.label || 'microphone'));
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleCloseNoteModal = () => {
        setShowNoteReviewModal(false);
        setIsEndingSession(false);
        setIsProcessingAI(false);
        setAiTranscript('');
        setEditedNotes({
            chiefComplaint: '', historyOfPresentIllness: '', symptoms: [],
            medicalHistoryMentioned: [], assessment: '', plan: '',
            followUpInstructions: '', patientSummary: ''
        });
    };

    const handleFinalizeNotes = async () => {
        try {
            await finalizeConsultationNotes(appointmentId, {
                transcript: aiTranscript,
                consultationSummary: editedNotes,
                doctorNotes: doctorFinalNotes
            });
            if (isEndingSession) {
                try { await api.put(`/appointments/${appointmentId}/status`, { status: 'completed' }); } catch (_) {}
                toast.success('Session complete — viewing patient record');
                const patientId = patientContext?.patient?.id;
                navigate(patientId ? `/doctor/patients/${patientId}` : '/doctor/appointments');
            } else {
                toast.success('Notes saved');
                handleCloseNoteModal();
                const { data } = await api.get(`/consultation/${appointmentId}/notes`);
                setNotes(data);
            }
        } catch (err) {
            toast.error('Failed to finalize record');
        }
    };

    /* ── END SESSION ────────────────────────────────────────────────────── */
    const endVirtualSession = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsEndingSession(true);
        setShowNoteReviewModal(true);
    };

    const skipAndComplete = async () => {
        setShowNoteReviewModal(false);
        setIsEndingSession(false);
        try { await api.put(`/appointments/${appointmentId}/status`, { status: 'completed' }); } catch (_) {}
        toast.success('Session complete');
        const patientId = patientContext?.patient?.id;
        navigate(patientId ? `/doctor/patients/${patientId}` : '/doctor/appointments');
    };

    /* ── CHAT ───────────────────────────────────────────────────────────── */
    const sendChatMessage = async (e) => {
        e.preventDefault();
        if (!newChatMsg.trim()) return;
        const msgText = newChatMsg.trim();
        setNewChatMsg('');
        try {
            const { data } = await api.post(`/consultation/${appointmentId}/chat`, { message: msgText });
            setChatMessages(prev => [...prev, data]);
        } catch (err) {
            toast.error('Failed to send message');
            setNewChatMsg(msgText);
        }
    };

    /* ── LOADING ────────────────────────────────────────────────────────── */
    if (!patientContext) return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary-blue mx-auto mb-4"></div>
                <p className="text-sm text-slate-500 font-medium tracking-widest uppercase">Connecting to session...</p>
            </div>
        </div>
    );

    const { patient } = patientContext;
    const isDoctor = user?.role === 'doctor';

    /* ── CHAT PANEL ─────────────────────────────────────────────────────── */
    const ChatPanel = () => (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" style={{ maxHeight: 'calc(100% - 70px)' }}>
                {chatMessages.length === 0 ? (
                    <div className="text-center py-12 opacity-40">
                        <FaComments className="mx-auto mb-3 text-4xl text-slate-300" />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">No messages yet</p>
                    </div>
                ) : chatMessages.map((msg, idx) => {
                    const isMe = msg.sender?._id === user?.id || msg.sender?.id === user?.id;
                    return (
                        <div key={idx} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2">
                                {msg.sender?.name || 'Unknown'} · {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm font-medium leading-relaxed ${
                                isMe ? 'bg-primary-blue text-white rounded-tr-sm' : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                            }`}>
                                {msg.message}
                            </div>
                        </div>
                    );
                })}
                <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendChatMessage} className="p-3 border-t border-slate-100 flex gap-2">
                <input
                    type="text"
                    value={newChatMsg}
                    onChange={(e) => setNewChatMsg(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary-blue"
                />
                <button type="submit" disabled={!newChatMsg.trim()} className="p-2.5 bg-primary-blue text-white rounded-xl hover:bg-blue-700 disabled:opacity-30 transition-all">
                    <FaPaperPlane size={14} />
                </button>
            </form>
        </div>
    );

    /* ── RENDER ─────────────────────────────────────────────────────────── */
    return (
        <div className="h-screen flex flex-col bg-slate-100 overflow-hidden font-sans">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between shadow-sm z-50">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-blue flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <FaUserMd size={20} />
                        </div>
                        <div>
                            <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase italic">Virtual Session Room</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{appointmentId?.slice(0, 16)}...</p>
                        </div>
                    </div>
                    {isDoctor && (
                        <div className="bg-slate-900 text-white px-5 py-2 rounded-xl flex items-center gap-3 shadow-xl">
                            <FaRegClock className="text-blue-400 animate-pulse" />
                            <span className="text-sm font-black tabular-nums">{formatTime(elapsedTime)}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {isDoctor && (
                        <Button
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={isProcessingAI}
                            className={`px-6 py-2.5 rounded-xl font-black text-[11px] tracking-[0.2em] transition-all border-none flex items-center gap-2 shadow-xl ${
                                isProcessingAI ? 'bg-orange-500 cursor-not-allowed' :
                                isRecording ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-purple-600 hover:bg-purple-700'
                            }`}
                        >
                            {isProcessingAI
                                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> AI PROCESSING...</>
                                : isRecording ? <><FaStop /> STOP & GENERATE NOTES</> : <><FaRobot /> START AI SCRIBE</>}
                        </Button>
                    )}
                    {isDoctor ? (
                        <Button onClick={endVirtualSession} className="rounded-xl font-black text-[11px] tracking-widest bg-red-600 hover:bg-red-700 text-white border-none px-8 py-2.5 shadow-lg">
                            END SESSION
                        </Button>
                    ) : (
                        <Button variant="outline" onClick={() => navigate(-1)} className="rounded-xl font-black text-[11px] tracking-widest border-2 border-slate-100 text-slate-400 hover:bg-slate-50">
                            EXIT ROOM
                        </Button>
                    )}
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* LEFT: Patient Info (doctor only) */}
                {isDoctor && patient && (
                    <aside className="w-[280px] bg-white border-r border-slate-100 flex flex-col shadow-2xl z-20 shrink-0">
                        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                            <div className="flex flex-col items-center text-center">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(patient.User?.name || 'P')}&size=96&background=0066FF&color=fff&bold=true`}
                                    className="w-20 h-20 rounded-[1.5rem] shadow-2xl border-4 border-white mb-4"
                                    alt="Patient"
                                />
                                <h2 className="text-lg font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-1">{patient.User?.name}</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                                    {patient.gender} • {patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 'N/A'} YRS
                                </p>
                                <div className="flex gap-2 w-full">
                                    <div className="flex-1 p-2.5 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
                                        <p className="text-[9px] font-black text-slate-300 uppercase mb-0.5">Blood</p>
                                        <p className="text-sm font-black text-slate-800">{patient.blood_group || '—'}</p>
                                    </div>
                                    <div className="flex-1 p-2.5 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
                                        <p className="text-[9px] font-black text-slate-300 uppercase mb-0.5">Allergies</p>
                                        <p className="text-xs font-black text-red-600 truncate">{patient.allergies || 'None'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                                <FaHistory size={8} /> PAST VISITS
                            </h3>
                            <div className="space-y-3">
                                {patientContext.pastConsultations?.length > 0 ? (
                                    patientContext.pastConsultations.map((visit, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedVisit(visit)}
                                            className="p-4 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-2xl border border-slate-100 transition-all cursor-pointer group"
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[9px] font-black text-primary-blue group-hover:text-blue-400 uppercase tracking-widest">
                                                    {new Date(visit.date).toLocaleDateString()}
                                                </span>
                                                <FaChevronRight size={8} className="text-slate-300 group-hover:text-white" />
                                            </div>
                                            <p className="text-xs font-bold truncate italic">"{visit.reason || 'Consultation'}"</p>
                                            {visit.ConsultationNotes?.length > 0 && (
                                                <span className="text-[9px] text-slate-400 group-hover:text-slate-300">{visit.ConsultationNotes.length} note(s)</span>
                                            )}
                                        </div>
                                    ))
                                ) : <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic text-center py-4">No history</p>}
                            </div>

                            {patientContext.medicalHistory?.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-red-500 rounded-full inline-block"></span> CONDITIONS
                                    </h3>
                                    <div className="space-y-2">
                                        {patientContext.medicalHistory.map((h, i) => (
                                            <div key={i} className="p-3 bg-red-50/50 rounded-xl border border-red-100/50">
                                                <p className="text-xs font-black text-red-900 uppercase">{h.condition}</p>
                                                <p className="text-[9px] text-red-700/70 font-bold uppercase tracking-widest">{h.status}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>
                )}

                {/* CENTER: Video */}
                <section className="flex-1 relative flex flex-col bg-slate-900 overflow-hidden">
                    <div ref={jitsiContainerRef} className="flex-1 bg-black min-h-0">
                        <div className="h-full flex flex-col items-center justify-center text-white space-y-4">
                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black tracking-[0.4em] uppercase">Initializing encrypted stream...</p>
                        </div>
                    </div>
                    {/* Recording overlay */}
                    {isDoctor && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
                            <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full ${isProcessingAI ? 'bg-orange-600' : isRecording ? 'bg-red-600' : 'bg-slate-800/80 backdrop-blur-xl'}`}>
                                {isProcessingAI
                                    ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    : <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-white animate-pulse' : 'bg-slate-500'}`} />}
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                    {isProcessingAI ? 'AI Generating Notes...' : isRecording ? 'Recording Audio' : 'AI Scribe Inactive'}
                                </span>
                            </div>
                        </div>
                    )}
                </section>

                {/* RIGHT: Scans + Chat (doctor) / Chat only (patient) */}
                <aside className="w-[380px] bg-slate-50 border-l border-slate-200 flex flex-col shadow-2xl z-20 shrink-0">
                    {/* Tab headers */}
                    <div className="flex border-b border-slate-200 bg-white shrink-0">
                        {isDoctor && (
                            <button
                                onClick={() => setRightTab('scans')}
                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${rightTab === 'scans' ? 'text-primary-blue border-b-2 border-primary-blue' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <FaImage size={10} /> SCANS
                            </button>
                        )}
                        <button
                            onClick={() => setRightTab('chat')}
                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${rightTab === 'chat' ? 'text-primary-blue border-b-2 border-primary-blue' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <FaComments size={10} /> CHAT
                            {chatMessages.length > 0 && <span className="bg-primary-blue text-white text-[8px] rounded-full px-1.5 py-0.5">{chatMessages.length}</span>}
                        </button>
                    </div>

                    {/* Tab content */}
                    {rightTab === 'chat' && <ChatPanel />}

                    {rightTab === 'scans' && isDoctor && (
                        <>
                            <div className="p-5 border-b border-slate-100 bg-white shrink-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">SCAN GALLERY</h3>
                                    <Badge className="bg-purple-600 text-white border-none font-black text-[9px] uppercase tracking-widest">
                                        {patientContext.scans?.length || 0} TOTAL
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
                                {!patientContext.scans?.length ? (
                                    <div className="py-16 text-center flex flex-col items-center opacity-30">
                                        <FaImage size={40} className="mb-4 text-slate-300" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No imaging available</p>
                                    </div>
                                ) : patientContext.scans.map((scan) => (
                                    <div
                                        key={scan.id}
                                        className="group bg-white rounded-[2rem] border-2 border-slate-100 overflow-hidden hover:border-primary-blue transition-all duration-500 shadow-sm hover:shadow-xl cursor-pointer"
                                        onClick={() => setSelectedScan(scan)}
                                    >
                                        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                                            <img
                                                src={`${import.meta.env.VITE_API_URL}${scan.file_url}`}
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                                                alt="Scan"
                                                onError={(e) => { e.target.src = 'https://placehold.co/400x250/1e293b/fff?text=SCAN'; }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                                            <div className="absolute bottom-3 left-3 flex gap-1.5">
                                                <Badge className="bg-white/20 backdrop-blur-xl text-white border-none text-[8px] uppercase font-black px-2 py-0.5 tracking-widest">
                                                    {scan.scan_type?.replace('_', ' ')}
                                                </Badge>
                                                {scan.status === 'analyzed' && (
                                                    <Badge className="bg-green-500 text-white border-none text-[8px] font-black px-2 py-0.5 tracking-widest">AI VERIFIED</Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{new Date(scan.createdAt).toLocaleDateString()}</p>
                                            {scan.ai_prediction && (
                                                <div className="mb-3">
                                                    <p className="text-[8px] font-black text-purple-700 uppercase tracking-widest mb-0.5">AI Result</p>
                                                    <p className="text-xs font-black text-slate-800 line-clamp-1 italic">
                                                        {typeof scan.ai_prediction === 'object'
                                                            ? (scan.ai_prediction.scan_type === 'brain_mri'
                                                                ? `${scan.ai_prediction.tumor?.prediction || 'N/A'} / ${scan.ai_prediction.alzheimer?.prediction || 'N/A'}`
                                                                : (scan.ai_prediction.prediction || scan.ai_prediction.class_name || scan.ai_prediction.label || '—'))
                                                            : scan.ai_prediction}
                                                    </p>
                                                </div>
                                            )}
                                            <div className="flex gap-2 mt-2" onClick={e => e.stopPropagation()}>
                                                <Button
                                                    size="sm"
                                                    disabled={isProcessingAI}
                                                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-[9px] font-black tracking-widest rounded-xl py-2 border-none"
                                                    onClick={() => handleRunAI(scan.id)}
                                                >
                                                    {isProcessingAI ? '...' : scan.status === 'analyzed' ? 'RE-RUN AI' : 'RUN AI'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="flex-1 bg-slate-700 hover:bg-slate-800 text-white text-[9px] font-black tracking-widest rounded-xl py-2 border-none"
                                                    onClick={() => setSelectedScan(scan)}
                                                >
                                                    VIEW
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </aside>
            </main>

            {/* ── SCAN MODAL ── */}
            <Modal isOpen={!!selectedScan} onClose={() => setSelectedScan(null)}
                title={selectedScan ? `${selectedScan.scan_type?.replace('_', ' ').toUpperCase()} ANALYSIS` : 'SCAN VIEW'} size="xl">
                {selectedScan && (
                    <div className="bg-white p-4 space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <div className="w-2 h-2 bg-primary-blue rounded-full" /> INPUT IMAGE
                                </h4>
                                <div className="rounded-[2rem] overflow-hidden shadow-2xl border-8 border-slate-50 bg-black aspect-square flex items-center justify-center">
                                    <img src={`${import.meta.env.VITE_API_URL}${selectedScan.file_url}`} className="max-w-full max-h-full object-contain" alt="Original"
                                        onError={(e) => { e.target.src = 'https://placehold.co/800x800/1e293b/fff?text=IMAGE+ERROR'; }} />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full" /> AI GRAD-CAM
                                </h4>
                                <div className="rounded-[2rem] overflow-hidden shadow-2xl border-8 border-purple-50 bg-slate-900 aspect-square flex items-center justify-center">
                                    {selectedScan.ai_heatmap_url ? (
                                        <img src={getHeatmapSrc(selectedScan.ai_heatmap_url)} className="max-w-full max-h-full object-contain" alt="GradCAM" />
                                    ) : (
                                        <Button onClick={() => handleRunAI(selectedScan.id)} disabled={isProcessingAI}
                                            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black px-8 py-4 rounded-3xl border-none">
                                            {isProcessingAI ? 'ANALYZING...' : 'RUN AI ANALYSIS'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {selectedScan.status === 'analyzed' && (
                            <div className="bg-slate-900 p-8 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-5"><FaBrain size={80} className="text-white" /></div>
                                <h5 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.5em] mb-4">AI DIAGNOSTIC REPORT</h5>
                                <p className="text-2xl font-black text-white leading-tight tracking-tighter uppercase italic">
                                    {getBrainDiagnosis(selectedScan.ai_prediction)}
                                </p>
                                {getBrainConfidence(selectedScan.ai_prediction) != null && (
                                    <div className="mt-6 flex items-center gap-4">
                                        <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-purple-600 to-primary-blue rounded-full"
                                                style={{ width: `${getBrainConfidence(selectedScan.ai_prediction)}%` }} />
                                        </div>
                                        <span className="text-sm font-black text-white tracking-widest whitespace-nowrap">
                                            {getBrainConfidence(selectedScan.ai_prediction).toFixed(1)}% CONFIDENCE
                                        </span>
                                    </div>
                                )}
                                {selectedScan.ai_prediction?.scan_type === 'brain_mri' && (
                                    <div className="mt-5 grid grid-cols-2 gap-3">
                                        <div className="bg-white/5 rounded-2xl p-4">
                                            <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">Tumor</p>
                                            <p className="text-sm font-black text-white">{selectedScan.ai_prediction.tumor?.prediction || 'N/A'}</p>
                                            <p className="text-xs text-slate-400">{(selectedScan.ai_prediction.tumor?.confidence || 0).toFixed(1)}%</p>
                                        </div>
                                        <div className="bg-white/5 rounded-2xl p-4">
                                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Alzheimer</p>
                                            <p className="text-sm font-black text-white">{selectedScan.ai_prediction.alzheimer?.prediction || 'N/A'}</p>
                                            <p className="text-xs text-slate-400">{(selectedScan.ai_prediction.alzheimer?.confidence || 0).toFixed(1)}%</p>
                                        </div>
                                    </div>
                                )}
                                {/* Re-run button */}
                                <Button onClick={() => handleRunAI(selectedScan.id)} disabled={isProcessingAI}
                                    className="mt-5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white text-[10px] font-black px-6 py-2 rounded-xl border-none tracking-widest">
                                    {isProcessingAI ? 'ANALYZING...' : 'RE-RUN ANALYSIS'}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* ── PAST VISIT MODAL ── */}
            <Modal isOpen={!!selectedVisit} onClose={() => setSelectedVisit(null)}
                title={selectedVisit ? `VISIT: ${new Date(selectedVisit.date).toLocaleDateString()}` : 'VISIT'} size="lg">
                {selectedVisit && (
                    <div className="bg-white p-4 space-y-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">TYPE</p>
                                <p className="text-xl font-black italic capitalize">{selectedVisit.type} Session</p>
                            </div>
                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">REASON</p>
                                <p className="text-lg font-black text-slate-900 italic">{selectedVisit.reason || 'Follow-up'}</p>
                            </div>
                        </div>

                        {selectedVisit.consultation_summary && (() => {
                            let s = {};
                            try { s = typeof selectedVisit.consultation_summary === 'string' ? JSON.parse(selectedVisit.consultation_summary) : selectedVisit.consultation_summary; } catch (_) {}
                            return (
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-primary-blue uppercase tracking-[0.4em] border-b border-blue-50 pb-3">AI SCRIBE RECAP</h4>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            {s.chiefComplaint && <div><p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">Chief Complaint</p><p className="text-sm text-slate-700 italic font-bold">{s.chiefComplaint}</p></div>}
                                            {s.assessment && <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Assessment</p><p className="text-sm text-slate-700 italic font-bold">{s.assessment}</p></div>}
                                            {s.plan && <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Plan</p><p className="text-sm text-slate-700 italic font-bold">{s.plan}</p></div>}
                                        </div>
                                        {s.patientSummary && (
                                            <div className="p-6 bg-purple-50 rounded-[2rem] border border-purple-100">
                                                <p className="text-[9px] font-black text-purple-700 uppercase tracking-[0.3em] mb-3">Patient Summary</p>
                                                <p className="text-sm text-purple-900 italic leading-relaxed font-bold">{s.patientSummary}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        {selectedVisit.ConsultationNotes?.length > 0 && (
                            <div>
                                <h4 className="text-[10px] font-black text-primary-blue uppercase tracking-[0.4em] border-b border-blue-50 pb-3 mb-4">SESSION NOTES ({selectedVisit.ConsultationNotes.length})</h4>
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {selectedVisit.ConsultationNotes.map((note, idx) => (
                                        <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4">
                                            <div className="shrink-0">
                                                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 mt-1" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1.5">
                                                    <span className="text-[9px] font-black text-primary-blue uppercase tracking-widest">{note.note_type}</span>
                                                    <span className="text-[9px] text-slate-400 font-bold">{note.author?.name || 'Unknown'}</span>
                                                    <span className="text-[9px] text-slate-400 font-bold">{new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-sm text-slate-700 leading-relaxed font-bold italic">{note.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!selectedVisit.consultation_summary && !selectedVisit.ConsultationNotes?.length && (
                            <p className="text-center text-slate-400 italic text-sm py-4">No detailed notes recorded for this visit.</p>
                        )}
                    </div>
                )}
            </Modal>

            {/* ── AI REVIEW MODAL ── */}
            <Modal isOpen={showNoteReviewModal} onClose={handleCloseNoteModal} title={isEndingSession ? "FINALIZE SESSION — REVIEW AI NOTES" : "CLINICAL NOTE REVIEW"} size="xl">
                <div className="bg-white p-4 space-y-8 max-h-[75vh] overflow-y-auto pr-4 custom-scrollbar">
                    <div className="grid grid-cols-2 gap-10">
                        <div className="space-y-6">
                            {[
                                { label: 'Chief Complaint', key: 'chiefComplaint', type: 'input' },
                                { label: 'Assessment', key: 'assessment', type: 'textarea' },
                                { label: 'Plan', key: 'plan', type: 'textarea' },
                                { label: 'Follow-up Instructions', key: 'followUpInstructions', type: 'textarea' }
                            ].map(({ label, key, type }) => (
                                <div key={key}>
                                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-2 tracking-[0.3em]">{label}</label>
                                    {type === 'input'
                                        ? <input className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-black text-slate-900 italic outline-none focus:border-primary-blue"
                                            value={editedNotes[key] || ''} onChange={(e) => setEditedNotes({ ...editedNotes, [key]: e.target.value })} />
                                        : <textarea rows={3} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold text-slate-800 italic outline-none focus:border-primary-blue resize-none"
                                            value={editedNotes[key] || ''} onChange={(e) => setEditedNotes({ ...editedNotes, [key]: e.target.value })} />}
                                </div>
                            ))}
                        </div>
                        <div className="space-y-6">
                            <div className="p-8 bg-purple-50 rounded-[3rem] border-2 border-purple-100">
                                <label className="text-[9px] font-black text-purple-700 uppercase block mb-3 tracking-[0.4em]">Patient Summary</label>
                                <textarea rows={8} className="w-full bg-transparent border-none p-0 text-base text-purple-900 italic leading-relaxed font-black outline-none resize-none"
                                    value={editedNotes.patientSummary || ''} onChange={(e) => setEditedNotes({ ...editedNotes, patientSummary: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase block mb-2 tracking-[0.3em]">Doctor Notes (private)</label>
                                <textarea rows={4} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold text-slate-800 outline-none focus:border-primary-blue resize-none"
                                    value={doctorFinalNotes} onChange={(e) => setDoctorFinalNotes(e.target.value)} placeholder="Private clinical observations..." />
                            </div>
                            {aiTranscript && (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">TRANSCRIPT PREVIEW</p>
                                    <p className="text-xs text-slate-600 italic line-clamp-4 leading-relaxed">{aiTranscript}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <footer className="flex gap-4 mt-6 p-2">
                    {isEndingSession ? (
                        <>
                            <Button variant="outline" className="flex-1 py-5 rounded-[2rem] font-black" onClick={skipAndComplete}>SKIP & COMPLETE</Button>
                            <Button className="flex-[2.5] bg-green-700 hover:bg-green-800 text-white py-5 rounded-[2rem] font-black tracking-[0.3em] border-none" onClick={handleFinalizeNotes}>FINALIZE & COMPLETE SESSION</Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" className="flex-1 py-5 rounded-[2rem] font-black" onClick={handleCloseNoteModal}>DISCARD DRAFT</Button>
                            <Button className="flex-[2.5] bg-slate-900 hover:bg-black text-white py-5 rounded-[2rem] font-black tracking-[0.3em] border-none" onClick={handleFinalizeNotes}>SAVE NOTES</Button>
                        </>
                    )}
                </footer>
            </Modal>
        </div>
    );
};

export default ConsultationRoom;
