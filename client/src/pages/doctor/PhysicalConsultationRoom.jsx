import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { uploadConsultationAudio, finalizeConsultationNotes } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
    FaMicrophone, FaHistory, FaClipboardCheck, FaImage,
    FaArrowLeft, FaPlus, FaTimes, FaUserMd, FaNotesMedical, FaRobot
} from 'react-icons/fa';
import { GlassCard, Button } from '../../components/ui';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import clsx from 'clsx';

const PhysicalConsultationRoom = () => {
    const { appointmentId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [patientContext, setPatientContext] = useState(null);
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    
    const [sessionPhase, setSessionPhase] = useState('idle'); // 'idle' | 'active' | 'ending'
    const [elapsedTime, setElapsedTime] = useState(0);
    const timerRef = useRef(null);

    const [isRecording, setIsRecording] = useState(false);
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [showNoteReviewModal, setShowNoteReviewModal] = useState(false);
    const [aiTranscript, setAiTranscript] = useState('');
    const [editedNotes, setEditedNotes] = useState({
        chiefComplaint: '', historyOfPresentIllness: '', symptoms: [],
        medicalHistoryMentioned: [], assessment: '', plan: '',
        followUpInstructions: '', patientSummary: ''
    });
    const [doctorFinalNotes, setDoctorFinalNotes] = useState('');
    
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const notesEndRef = useRef(null);

    // Modals for details
    const [selectedScan, setSelectedScan] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [selectedVisit, setSelectedVisit] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Check appointment status first — redirect if already completed
                const apptRes = await api.get(`/appointments/${appointmentId}`);
                if (apptRes.data?.status === 'completed') {
                    const patientId = apptRes.data?.patient?.id;
                    navigate(patientId ? `/doctor/patients/${patientId}` : '/doctor/appointments', { replace: true });
                    return;
                }

                const [contextRes, notesRes] = await Promise.all([
                    api.get(`/consultation/${appointmentId}/patient-context`),
                    api.get(`/consultation/${appointmentId}/notes`)
                ]);
                setPatientContext(contextRes.data);
                setNotes(notesRes.data);
            } catch (err) {
                console.error("Error loading consultation data:", err);
                toast.error("Failed to load patient record");
            }
        };

        fetchData();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [appointmentId]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartConsultation = async () => {
        setSessionPhase('active');
        timerRef.current = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);

        try {
            const perm = await navigator.permissions?.query({ name: 'microphone' });
            if (perm?.state === 'denied') {
                toast.error('Microphone is blocked. Click the lock icon in the address bar → allow microphone → refresh page.', { duration: 8000 });
            } else if (perm?.state === 'granted') {
                toast.success('Session active — microphone ready');
            } else {
                toast.success('Session active — click "ACTIVATE VOICE SCRIBE" to allow microphone');
            }
        } catch {
            toast.success('Consultation session active');
        }
    };

    const endSession = async () => {
        if (timerRef.current) clearInterval(timerRef.current);

        // Stop active recording first so onstop fires and modal gets AI notes
        if (isRecording && mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }

        if (newNote.trim()) {
            try {
                const { data } = await api.post(`/consultation/${appointmentId}/notes`, { content: newNote, noteType: 'clinical' });
                setNotes(prev => [...prev, data]);
            } catch (_) {}
            setNewNote('');
        }

        setSessionPhase('ending');
        // If recording was active, onstop's finally block opens the modal after AI finishes.
        // If not recording, open it now so the doctor can type notes manually.
        if (!isRecording) {
            setShowNoteReviewModal(true);
        }
    };

    const startRecording = async () => {
        console.log('[PCR] startRecording called');
        audioChunksRef.current = [];

        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            console.log('[PCR] mic granted:', stream.getAudioTracks().map(t => t.label));
        } catch (err) {
            console.error('[PCR] getUserMedia failed:', err.name, err.message);
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
                console.log('[PCR] audio chunk:', e.data.size, 'bytes, total chunks:', audioChunksRef.current.length);
            }
        };

        recorder.onstop = async () => {
            stream.getTracks().forEach(t => t.stop());
            console.log('[PCR] recording stopped. total chunks:', audioChunksRef.current.length);
            setIsProcessingAI(true);
            try {
                if (audioChunksRef.current.length === 0) {
                    toast.error('No audio captured. Check Windows Sound Settings → Recording → Set as Default Device.', { duration: 10000 });
                    return;
                }
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                console.log('[PCR] blob size:', blob.size, 'bytes');
                console.log('[PCR] uploading for appointment:', appointmentId);

                const { data } = await uploadConsultationAudio(appointmentId, blob);
                console.log('[PCR] AI response:', data);

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
                console.error('[PCR] upload/AI error:', err);
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

    const isBrainScan = (scan) => {
        const t = scan?.scan_type || scan?.scanType || '';
        return t === 'mri_brain';
    };

    const handleRunAI = async (scanId) => {
        if (!scanId) return;
        
        // Find the scan in our local context
        const scan = patientContext?.scans?.find(s => s.id === scanId);
        if (!scan) return;

        setIsProcessingAI(true);
        try {
            const endpoint = isBrainScan(scan)
                ? `/scans/${scanId}/analyze-brain`
                : `/scans/${scanId}/analyze`;

            const { data } = await api.post(endpoint);
            
            // Build correct heatmap data URL for both scan types
            const heatmapB64 =
                data.images?.tumor_heatmap ||
                data.images?.alz_heatmap ||
                data.images?.overlay ||
                null;
            const heatmapSrc = heatmapB64 ? `data:image/png;base64,${heatmapB64}` : null;

            // ai_prediction: retinal uses data.prediction; brain uses the nested result object
            const aiPrediction = data.prediction || {
                scan_type: data.scan_type,
                tumor: data.tumor,
                alzheimer: data.alzheimer,
                clinical_summary: data.clinical_summary,
            };

            // Update local state to reflect analyzed status
            setPatientContext(prev => ({
                ...prev,
                scans: prev.scans.map(s => s.id === scanId ? {
                    ...s,
                    status: 'analyzed',
                    ai_prediction: aiPrediction,
                    ai_heatmap_url: heatmapSrc
                } : s)
            }));

            // Always update selectedScan if it's this scan (stale closure safe via functional update)
            setSelectedScan(prev =>
                prev?.id === scanId
                    ? { ...prev, status: 'analyzed', ai_prediction: aiPrediction, ai_heatmap_url: heatmapSrc }
                    : prev
            );

            toast.success('AI Analysis Complete!');
            return { ai_prediction: aiPrediction, ai_heatmap_url: heatmapSrc };
        } catch (err) {
            console.error("AI Analysis Error:", err);
            toast.error(err.response?.data?.message || 'AI Analysis failed');
            return null;
        } finally {
            setIsProcessingAI(false);
        }
    };

    const handleCloseNoteModal = () => {
        console.log('[PCR] handleCloseNoteModal called');
        setShowNoteReviewModal(false);
        setSessionPhase('idle');
        setIsProcessingAI(false);
        setIsRecording(false);
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

            if (sessionPhase === 'ending') {
                setSessionPhase('idle');
                try { await api.put(`/appointments/${appointmentId}/status`, { status: 'completed' }); } catch (_) {}
                toast.success('Session complete');
                navigate('/doctor/dashboard');
            } else {
                toast.success('Notes saved');
                handleCloseNoteModal();
                const { data } = await api.get(`/consultation/${appointmentId}/notes`);
                setNotes(data);
            }
        } catch {
            toast.error('Failed to save clinical notes');
        }
    };

    const skipAndComplete = async () => {
        setSessionPhase('idle');
        setShowNoteReviewModal(false);
        try { await api.put(`/appointments/${appointmentId}/status`, { status: 'completed' }); } catch (_) {}
        toast.success('Session complete');
        navigate('/doctor/dashboard');
    };

    const saveNoteHandler = async () => {
        if (!newNote.trim()) return;
        try {
            const { data } = await api.post(`/consultation/${appointmentId}/notes`, {
                content: newNote,
                noteType: 'clinical'
            });
            setNotes([...notes, data]);
            setNewNote('');
        } catch {
            toast.error('Failed to save note');
        }
    };

    // Auto-scroll to latest note
    useEffect(() => {
        notesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [notes]);

    const getHeatmapSrc = (url) => {
        if (!url) return null;
        if (url.startsWith('data:') || url.startsWith('http')) return url;
        if (url.startsWith('/')) return `${import.meta.env.VITE_API_URL}${url}`;
        return `data:image/png;base64,${url}`;
    };

    const getBrainDiagnosis = (pred) => {
        if (!pred) return 'UNDETERMINED ANALYSIS';
        if (pred.scan_type === 'brain_mri') {
            const t = pred.tumor?.prediction || 'N/A';
            const a = pred.alzheimer?.prediction || 'N/A';
            return `Tumor: ${t}  |  Alzheimer: ${a}`;
        }
        return pred.class_name || pred.prediction || 'UNDETERMINED ANALYSIS';
    };

    const getBrainConfidence = (pred) => {
        if (!pred) return null;
        if (pred.scan_type === 'brain_mri') {
            return Math.max(pred.tumor?.confidence || 0, pred.alzheimer?.confidence || 0);
        }
        return pred.confidence || null;
    };

    if (!patientContext) return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
            <div className="w-16 h-16 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium tracking-widest">LOADING CLINICAL CONTEXT...</p>
        </div>
    );

    const { patient, pastConsultations, scans } = patientContext;

    return (
        <div className="fixed inset-0 bg-[#F8FAFC] flex flex-col overflow-hidden z-50">
            {/* Top Navigation Bar - Solid & High Contrast */}
            <header className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center shrink-0 z-20 shadow-sm">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate('/doctor/appointments')}
                        className="p-2.5 hover:bg-gray-100 rounded-2xl transition-all text-gray-600 active:scale-95"
                    >
                        <FaArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Consultation Room</h1>
                            {sessionPhase === 'active' && !isRecording && (
                                <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Session Active</span>
                                </div>
                            )}
                            {isRecording && (
                                <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                                    <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                                    <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Mic Recording</span>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 font-bold mt-1">
                            {sessionPhase !== 'idle' ? `ELAPSED TIME: ${formatTime(elapsedTime)}` : 'AWAITING SESSION START'}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <Button
                        onClick={async () => {
                            if (!patient) return;
                            const unanalyzed = scans.find(s => s.status !== 'analyzed');
                            if (unanalyzed) {
                                // Open modal first, then run AI and update modal with results
                                setSelectedScan(unanalyzed);
                                const result = await handleRunAI(unanalyzed.id);
                                if (result) {
                                    setSelectedScan({ ...unanalyzed, status: 'analyzed', ...result });
                                }
                            } else {
                                toast('All scans are already analyzed.');
                            }
                        }}
                        disabled={isProcessingAI}
                        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white shadow-lg border-none flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all"
                    >
                        {isProcessingAI
                            ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> ANALYZING...</>
                            : <><FaRobot size={14} /> RUN INSTANT AI</>}
                    </Button>
                    {sessionPhase === 'idle' && (
                        <Button onClick={handleStartConsultation} className="bg-primary-blue hover:bg-blue-700 shadow-xl border-none px-10 py-2.5 rounded-xl font-black tracking-widest transition-all">
                            START SESSION
                        </Button>
                    )}
                    {sessionPhase === 'active' && (
                        <Button onClick={endSession} variant="danger" className="shadow-lg border-none px-10 py-2.5 rounded-xl font-black tracking-widest transition-all">
                            END SESSION
                        </Button>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
                
                {/* Left Panel: Profile & Visits (3/12) */}
                <aside className="col-span-3 border-r border-slate-200 bg-white overflow-y-auto custom-scrollbar flex flex-col z-10 shadow-sm">
                    {/* Patient Banner */}
                    <div className="p-8 border-b border-slate-100">
                        <div className="flex items-center gap-5 mb-8">
                            <div className="w-20 h-20 rounded-[2rem] bg-slate-900 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-slate-200">
                                {patient.User?.name?.charAt(0) || 'P'}
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 leading-tight">{patient.User?.name}</h3>
                                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">{patient.gender} • {patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 'N/A'} YRS</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Blood</p>
                                    <p className="text-base font-black text-slate-800">{patient.blood_group || '—'}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Weight</p>
                                    <p className="text-base font-black text-slate-800">{patient.weight || '—'} KG</p>
                                </div>
                            </div>
                            <div className="bg-primary-blue/5 p-4 rounded-3xl border border-primary-blue/10">
                                <p className="text-[9px] font-black text-primary-blue uppercase mb-1 flex items-center gap-1 tracking-widest">
                                    Medical Context
                                </p>
                                <p className="text-sm font-bold text-slate-700 leading-relaxed">{patient.medical_history_summary || 'No historical data flagged for this patient.'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Historical Visits Scroll */}
                    <div className="p-8 flex-1 flex flex-col min-h-0">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-[0.2em] flex items-center justify-between">
                            Patient History
                            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full">{pastConsultations?.length || 0}</span>
                        </h4>
                        <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {!pastConsultations?.length ? (
                                <div className="text-center py-16 opacity-30">
                                    <FaHistory className="mx-auto mb-4" size={40} />
                                    <p className="text-xs font-black uppercase tracking-widest">No Past Data</p>
                                </div>
                            ) : (
                                pastConsultations.map(visit => (
                                    <div 
                                        key={visit.id}
                                        onClick={() => setSelectedVisit(visit)}
                                        className="group p-5 bg-white border border-slate-100 rounded-[2rem] hover:border-primary-blue hover:shadow-xl hover:shadow-blue-900/5 transition-all cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary-blue opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-xs font-black text-slate-900">{new Date(visit.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            <Badge variant="default" className="text-[8px] uppercase tracking-widest border-none font-black">{visit.type}</Badge>
                                        </div>
                                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium italic">
                                            {visit.reason || 'Clinical follow-up and diagnostic review.'}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </aside>

                {/* Center Panel: Active Scribe & Timeline (6/12) */}
                <section className="col-span-6 bg-[#F8FAFC] flex flex-col overflow-hidden">
                    {/* Clinical Timeline Area */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-10 space-y-8" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {notes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-slate-300 pointer-events-none select-none h-full min-h-[200px]">
                                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl shadow-slate-200 mb-8 border border-slate-50">
                                    <FaMicrophone className="text-5xl text-slate-200" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-400 uppercase tracking-tighter">AI Clinical Scribe</h3>
                                <p className="text-sm font-bold text-slate-400 mt-2 max-w-xs text-center italic leading-relaxed">
                                    Awaiting session activation. The scribe will automatically transcribe and summarize clinical dialogue.
                                </p>
                            </div>
                        ) : (
                            notes.map((note, idx) => (
                                <div
                                    key={idx}
                                    className={clsx(
                                        "max-w-[90%] p-6 rounded-[2.5rem] shadow-sm border transition-all animate-in zoom-in-95 duration-500",
                                        note.note_type === 'transcript'
                                            ? "mr-auto bg-white border-slate-100 text-slate-600 italic text-sm"
                                            : "ml-auto bg-slate-900 border-slate-800 text-white font-medium"
                                    )}
                                >
                                    <div className="flex justify-between items-center mb-3 opacity-50">
                                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">{note.note_type}</span>
                                        <span className="text-[9px] font-bold">{new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-[15px] leading-relaxed tracking-tight">{note.content}</p>
                                </div>
                            ))
                        )}
                        <div ref={notesEndRef} className="h-4"></div>
                    </div>

                    {/* Bottom Control Deck - static, never overlaps notes */}
                    <div className="shrink-0 p-6 pt-0">
                        <div className="bg-white border-2 border-slate-100 p-8 rounded-[3.5rem] shadow-[0_20px_80px_rgba(0,0,0,0.1)] flex flex-col gap-6">
                            {sessionPhase === 'active' ? (
                                <>
                                    <div className="flex gap-5">
                                        {!isRecording ? (
                                            <Button 
                                                onClick={startRecording}
                                                disabled={isProcessingAI}
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-10 rounded-3xl flex flex-col items-center gap-2 shadow-2xl shadow-red-200 border-none transition-all active:scale-95 group overflow-hidden relative"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                                                <div className={clsx("w-4 h-4 bg-white rounded-full mb-1", isProcessingAI && "animate-ping")}></div>
                                                <span className="text-sm uppercase tracking-[0.4em] font-black">{isProcessingAI ? 'AI PROCESSING DIALOGUE...' : 'ACTIVATE VOICE SCRIBE'}</span>
                                            </Button>
                                        ) : (
                                            <Button 
                                                onClick={stopRecording}
                                                className="flex-1 bg-slate-900 text-white py-10 rounded-3xl flex flex-col items-center gap-2 shadow-2xl transition-all active:scale-95 animate-pulse border-none relative overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-t from-black to-slate-800"></div>
                                                <FaTimes className="text-xl relative z-10" />
                                                <span className="text-sm uppercase tracking-[0.4em] font-black relative z-10">STOP RECORDING & GET NOTES</span>
                                            </Button>
                                        )}
                                    </div>
                                    
                                    <div className="relative group">
                                        <textarea 
                                            className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl text-sm focus:bg-white focus:ring-8 focus:ring-blue-100 focus:border-primary-blue outline-none transition-all pr-24 resize-none shadow-inner font-medium text-slate-800"
                                            rows="2"
                                            placeholder="Manually inject clinical note or observation..."
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), saveNoteHandler())}
                                        />
                                        <button 
                                            onClick={saveNoteHandler}
                                            disabled={!newNote.trim()}
                                            className="absolute right-6 bottom-6 bg-primary-blue text-white p-3 rounded-2xl hover:bg-blue-700 disabled:opacity-20 transition-all shadow-xl shadow-blue-200"
                                        >
                                            <FaPlus size={20} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <Button onClick={handleStartConsultation} className="bg-primary-blue hover:bg-blue-700 shadow-2xl px-16 py-8 rounded-3xl text-xl font-black tracking-widest border-none transition-all hover:scale-[1.02] active:scale-95">
                                        INITIATE CLINICAL SESSION
                                    </Button>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-6">Secure Session Connection Required</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Right Panel: Scans & Intelligence (3/12) */}
                <aside className="col-span-3 bg-white border-l border-slate-200 overflow-y-auto custom-scrollbar flex flex-col z-10 shadow-sm">
                    <div className="p-8 border-b border-slate-100">
                        <h3 className="text-sm font-black text-slate-900 flex items-center gap-3 uppercase tracking-widest">
                            <FaImage className="text-primary-blue" /> Imaging Inventory
                        </h3>
                    </div>

                    <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                        {!scans?.length ? (
                            <div className="text-center py-20 opacity-10">
                                <FaImage className="mx-auto mb-6" size={64} />
                                <p className="text-xs font-black uppercase tracking-widest italic">Awaiting Imaging Data</p>
                            </div>
                        ) : (
                            scans.map(scan => (
                                <div 
                                    key={scan.id}
                                    onClick={() => setSelectedScan(scan)}
                                    className="group bg-white rounded-[2.5rem] overflow-hidden border-2 border-slate-50 hover:border-primary-blue hover:shadow-[0_20px_50px_rgba(37,99,235,0.1)] transition-all cursor-pointer relative"
                                >
                                    <div className="h-40 w-full relative">
                                        <img 
                                            src={`${import.meta.env.VITE_API_URL}${scan.file_url}`}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                            alt="Clinical Scan"
                                            onError={(e) => { e.target.src = 'https://placehold.co/600x400/F8FAFC/CBD5E1?text=IMAGE+PENDING'; }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                                        <div className="absolute bottom-4 left-4 flex gap-2">
                                            <Badge className="bg-white/20 backdrop-blur-xl text-white border-none text-[9px] uppercase font-black px-3 py-1 tracking-widest">
                                                {scan.scan_type?.replace('_', ' ')}
                                            </Badge>
                                            {scan.status === 'analyzed' && (
                                                <Badge className="bg-green-500 text-white border-none text-[9px] font-black px-3 py-1 tracking-widest">AI VERIFIED</Badge>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="p-6">
                                        <div className="flex justify-between items-center mb-3">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(scan.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        
                                        {scan.ai_prediction && (
                                            <div className="mb-4">
                                                <p className="text-[9px] font-black text-purple-700 uppercase tracking-widest mb-1">AI Diagnostic Result</p>
                                                <p className="text-sm font-black text-slate-800 line-clamp-1 italic">
                                                    {getBrainDiagnosis(scan.ai_prediction)}
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex gap-2 mt-2" onClick={e => e.stopPropagation()}>
                                            <Button
                                                size="sm"
                                                disabled={isProcessingAI}
                                                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-[9px] font-black tracking-widest rounded-2xl py-2 border-none"
                                                onClick={() => handleRunAI(scan.id)}
                                            >
                                                {isProcessingAI ? '...' : scan.status === 'analyzed' ? 'RE-RUN AI' : 'RUN AI'}
                                            </Button>
                                            {scan.status === 'analyzed' && scan.Report && (
                                                <Button
                                                    size="sm"
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black tracking-widest rounded-2xl py-2 border-none"
                                                    onClick={() => setSelectedReport(scan.Report)}
                                                >
                                                    REPORT
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </aside>
            </main>

            {/* Modals - Solid White Backgrounds with no transparency to prevent overlapping confusion */}
            
            {/* Scan Expansion Modal */}
            <Modal
                isOpen={!!selectedScan}
                onClose={() => setSelectedScan(null)}
                title={selectedScan ? `${selectedScan.scan_type?.replace('_', ' ').toUpperCase()} ANALYSIS` : "SCAN VIEW"}
                size="xl"
            >
                {selectedScan && (
                    <div className="bg-white p-4 space-y-10">
                        <div className="grid grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                    <div className="w-2 h-2 bg-primary-blue rounded-full"></div> INPUT SOURCE IMAGE
                                </h4>
                                <div className="rounded-[3rem] overflow-hidden shadow-2xl border-8 border-slate-50 ring-1 ring-slate-200 bg-black aspect-square flex items-center justify-center">
                                    <img 
                                        src={`${import.meta.env.VITE_API_URL}${selectedScan.file_url}`} 
                                        className="max-w-full max-h-full object-contain" 
                                        alt="Original" 
                                        onError={(e) => { e.target.src = 'https://placehold.co/800x800/1e293b/ffffff?text=SOURCE+IMAGE+LOAD+ERROR'; }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div> AI EXPLAINABILITY (GRAD-CAM)
                                </h4>
                                <div className="rounded-[3rem] overflow-hidden shadow-2xl border-8 border-purple-50 ring-1 ring-purple-100 bg-slate-900 aspect-square flex items-center justify-center">
                                    {selectedScan.ai_heatmap_url ? (
                                        <img
                                            src={getHeatmapSrc(selectedScan.ai_heatmap_url)}
                                            className="max-w-full max-h-full object-contain"
                                            alt="GradCAM Heatmap"
                                        />
                                    ) : selectedScan.status === 'analyzed' ? (
                                        <div className="text-center px-12 opacity-50">
                                            <p className="text-sm font-black text-white uppercase tracking-widest italic mb-2">Heatmap Pending</p>
                                            <p className="text-[10px] text-slate-400">Explainability visuals are being generated for this scan type.</p>
                                        </div>
                                    ) : (
                                        <div className="text-center px-12">
                                            <Button 
                                                onClick={() => handleRunAI(selectedScan.id)}
                                                className="bg-purple-600 hover:bg-purple-700 text-white font-black px-8 py-4 rounded-3xl"
                                            >
                                                START AI ANALYSIS
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {selectedScan.status === 'analyzed' && (
                            <div className="bg-slate-900 p-10 rounded-[4rem] border border-slate-800 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <FaUserMd size={100} className="text-white" />
                                </div>
                                <h5 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.5em] mb-6">AI INTELLIGENCE DIAGNOSTIC REPORT</h5>
                                <p className="text-2xl font-black text-white leading-tight tracking-tighter uppercase italic">
                                    {getBrainDiagnosis(selectedScan.ai_prediction)}
                                </p>
                                {getBrainConfidence(selectedScan.ai_prediction) != null && (
                                    <div className="mt-8 flex items-center gap-6">
                                        <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                            <div className="h-full bg-gradient-to-r from-purple-600 to-primary-blue" style={{ width: `${getBrainConfidence(selectedScan.ai_prediction)}%` }}></div>
                                        </div>
                                        <span className="text-sm font-black text-white tracking-widest">{getBrainConfidence(selectedScan.ai_prediction).toFixed(1)}% CONFIDENCE</span>
                                    </div>
                                )}
                                {selectedScan.ai_prediction?.scan_type === 'brain_mri' && selectedScan.ai_prediction?.tumor && (
                                    <div className="mt-6 grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 rounded-2xl p-4">
                                            <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">Tumor Analysis</p>
                                            <p className="text-sm font-black text-white">{selectedScan.ai_prediction.tumor.prediction}</p>
                                            <p className="text-xs text-slate-400">{(selectedScan.ai_prediction.tumor.confidence || 0).toFixed(1)}% confidence</p>
                                        </div>
                                        <div className="bg-white/5 rounded-2xl p-4">
                                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Alzheimer Stage</p>
                                            <p className="text-sm font-black text-white">{selectedScan.ai_prediction.alzheimer?.prediction}</p>
                                            <p className="text-xs text-slate-400">{(selectedScan.ai_prediction.alzheimer?.confidence || 0).toFixed(1)}% confidence</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Diagnostic Report Modal */}
            <Modal
                isOpen={!!selectedReport}
                onClose={() => setSelectedReport(null)}
                title="VERIFIED CLINICAL DOCUMENTATION"
            >
                {selectedReport && (
                    <div className="bg-white p-4 space-y-10">
                        <div className="flex justify-between items-center p-6 bg-slate-900 rounded-[2rem] text-white">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Authorization Date</p>
                                <p className="text-base font-black italic">{new Date(selectedReport.createdAt).toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
                            </div>
                            <Badge variant="success" className="px-6 py-2 font-black uppercase tracking-[0.3em] text-[10px] bg-green-500 border-none shadow-xl shadow-green-500/20 text-white">FINALIZED</Badge>
                        </div>

                        <div className="space-y-10 px-4">
                            <section>
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                                    <div className="w-2 h-6 bg-primary-blue rounded-full"></div> CLINICAL DIAGNOSIS
                                </h5>
                                <p className="text-3xl font-black text-slate-900 leading-none tracking-tighter uppercase italic">{selectedReport.diagnosis}</p>
                            </section>

                            <section>
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                                    <div className="w-2 h-6 bg-slate-200 rounded-full"></div> DETAILED FINDINGS
                                </h5>
                                <p className="text-lg text-slate-700 leading-relaxed font-bold italic border-l-4 border-slate-100 pl-6">{selectedReport.findings}</p>
                            </section>

                            {selectedReport.recommendations && (
                                <section className="p-8 bg-blue-50 rounded-[3rem] border border-blue-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                        <FaNotesMedical size={64} className="text-blue-900" />
                                    </div>
                                    <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4">MANAGEMENT RECOMMENDATIONS</h5>
                                    <p className="text-base text-blue-900 italic leading-relaxed font-black">"{selectedReport.recommendations}"</p>
                                </section>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Visit Details Modal */}
            <Modal
                isOpen={!!selectedVisit}
                onClose={() => setSelectedVisit(null)}
                title={selectedVisit ? `HISTORICAL RECORD: ${new Date(selectedVisit.date).toLocaleDateString()}` : "VISIT RECORD"}
                size="lg"
            >
                {selectedVisit && (
                    <div className="bg-white p-4 space-y-12">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="p-8 bg-slate-900 rounded-[3rem] text-white">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">APPOINTMENT TYPE</p>
                                <p className="text-2xl font-black italic capitalize tracking-tighter">{selectedVisit.type} Session</p>
                            </div>
                            <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">CHIEF COMPLAINT</p>
                                <p className="text-2xl font-black text-slate-900 tracking-tighter italic">{selectedVisit.reason || 'General Follow-up'}</p>
                            </div>
                        </div>

                        {selectedVisit.consultation_summary && (
                            <div className="space-y-8">
                                <h4 className="text-[10px] font-black text-primary-blue uppercase tracking-[0.4em] border-b border-blue-50 pb-4">AI SCRIBE RECAP</h4>
                                {(() => {
                                    let summary = {};
                                    try {
                                        summary = typeof selectedVisit.consultation_summary === 'string' 
                                            ? JSON.parse(selectedVisit.consultation_summary) 
                                            : selectedVisit.consultation_summary;
                                    } catch (e) { summary = { assessment: selectedVisit.consultation_summary }; }
                                    
                                    return (
                                        <div className="grid grid-cols-2 gap-12 px-2">
                                            <div className="space-y-8">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Medical Assessment</p>
                                                    <p className="text-sm text-slate-800 leading-relaxed font-bold italic">{summary.assessment || 'Information pending.'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Management Protocol</p>
                                                    <p className="text-sm text-slate-800 leading-relaxed font-bold italic">{summary.plan || 'No formal plan recorded.'}</p>
                                                </div>
                                            </div>
                                            <div className="p-8 bg-purple-50 rounded-[4rem] border border-purple-100 shadow-inner relative">
                                                <div className="flex items-center gap-3 mb-5">
                                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                                                    <p className="text-[10px] font-black text-purple-700 uppercase tracking-[0.3em]">Patient Circular Summary</p>
                                                </div>
                                                <p className="text-sm text-purple-900 italic leading-loose font-black tracking-tight">
                                                    {summary.patientSummary || 'No patient-friendly circular was generated for this session.'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {selectedVisit.ConsultationNotes?.length > 0 && (
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-primary-blue uppercase tracking-[0.4em] border-b border-blue-50 pb-4">SESSION TIMELINE LOG</h4>
                                <div className="space-y-4 max-h-72 overflow-y-auto pr-4 custom-scrollbar">
                                    {selectedVisit.ConsultationNotes.map((note, idx) => (
                                        <div key={idx} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex gap-6 group hover:bg-white transition-all">
                                            <div className="shrink-0 flex flex-col items-center">
                                                <div className="w-3 h-3 rounded-full bg-slate-900 mt-1"></div>
                                                <div className="w-0.5 flex-1 bg-slate-100 my-2"></div>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-4 mb-2">
                                                    <span className="text-[9px] font-black text-primary-blue uppercase tracking-widest">{note.note_type}</span>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-sm text-slate-700 leading-relaxed font-bold italic">{note.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* AI Review Modal - Solid High-Impact UI */}
            <Modal
                isOpen={showNoteReviewModal}
                onClose={handleCloseNoteModal}
                title={sessionPhase === 'ending' ? "FINALIZE SESSION — REVIEW AI NOTES" : "CLINICAL NOTE REVIEW"}
                size="xl"
            >
                <div className="bg-white p-4 space-y-6 max-h-[75vh] overflow-y-auto pr-6 custom-scrollbar">

                    {/* Edit banner */}
                    <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3">
                        <FaNotesMedical className="text-primary-blue shrink-0" />
                        <p className="text-xs font-bold text-blue-800">All fields below are editable — click any field to correct the AI-generated notes before saving.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        {/* Left column */}
                        <div className="space-y-5">
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase block mb-2 tracking-[0.3em]">Chief Complaint</label>
                                <input
                                    className="w-full p-4 bg-white rounded-2xl border-2 border-slate-300 text-sm font-semibold text-slate-900 outline-none focus:border-primary-blue focus:ring-4 focus:ring-blue-100 transition-all"
                                    value={editedNotes.chiefComplaint || ''}
                                    onChange={(e) => setEditedNotes({...editedNotes, chiefComplaint: e.target.value})}
                                    placeholder="Main reason patient came in..."
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase block mb-2 tracking-[0.3em]">Clinical Assessment</label>
                                <textarea rows={4}
                                    className="w-full p-4 bg-white rounded-2xl border-2 border-slate-300 text-sm font-semibold text-slate-900 outline-none focus:border-primary-blue focus:ring-4 focus:ring-blue-100 transition-all resize-none"
                                    value={editedNotes.assessment || ''}
                                    onChange={(e) => setEditedNotes({...editedNotes, assessment: e.target.value})}
                                    placeholder="Doctor's diagnosis or findings..."
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase block mb-2 tracking-[0.3em]">Treatment & Management Plan</label>
                                <textarea rows={4}
                                    className="w-full p-4 bg-white rounded-2xl border-2 border-slate-300 text-sm font-semibold text-slate-900 outline-none focus:border-primary-blue focus:ring-4 focus:ring-blue-100 transition-all resize-none"
                                    value={editedNotes.plan || ''}
                                    onChange={(e) => setEditedNotes({...editedNotes, plan: e.target.value})}
                                    placeholder="Medications, tests, follow-up steps..."
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase block mb-2 tracking-[0.3em]">Follow-Up Instructions</label>
                                <textarea rows={3}
                                    className="w-full p-4 bg-white rounded-2xl border-2 border-slate-300 text-sm font-semibold text-slate-900 outline-none focus:border-primary-blue focus:ring-4 focus:ring-blue-100 transition-all resize-none"
                                    value={editedNotes.followUpInstructions || ''}
                                    onChange={(e) => setEditedNotes({...editedNotes, followUpInstructions: e.target.value})}
                                    placeholder="What should the patient do next..."
                                />
                            </div>
                        </div>

                        {/* Right column */}
                        <div className="space-y-5">
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase block mb-2 tracking-[0.3em]">Symptoms Detected</label>
                                <div className="p-4 bg-slate-900 rounded-2xl min-h-[60px] flex flex-wrap gap-2">
                                    {editedNotes.symptoms?.length > 0
                                        ? editedNotes.symptoms.map((s, i) => (
                                            <span key={i} className="bg-white/10 text-white text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border border-white/10">{s}</span>
                                        ))
                                        : <span className="text-slate-500 text-xs italic">No symptoms extracted</span>}
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-purple-600 uppercase block mb-2 tracking-[0.3em]">Patient-Facing Summary <span className="text-purple-400 normal-case font-medium">(sent to patient portal)</span></label>
                                <textarea rows={7}
                                    className="w-full p-4 bg-purple-50 rounded-2xl border-2 border-purple-200 text-sm font-semibold text-purple-900 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all resize-none"
                                    value={editedNotes.patientSummary || ''}
                                    onChange={(e) => setEditedNotes({...editedNotes, patientSummary: e.target.value})}
                                    placeholder="Explain results to the patient in plain language..."
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-amber-600 uppercase block mb-2 tracking-[0.3em]">Private Doctor Notes <span className="text-amber-400 normal-case font-medium">(not visible to patient)</span></label>
                                <textarea rows={4}
                                    className="w-full p-4 bg-amber-50 rounded-2xl border-2 border-amber-200 text-sm font-semibold text-amber-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all resize-none"
                                    value={doctorFinalNotes || ''}
                                    onChange={(e) => setDoctorFinalNotes(e.target.value)}
                                    placeholder="Internal clinical observations..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
                
                <footer className="flex gap-6 mt-10 p-2">
                    {sessionPhase === 'ending' ? (
                        <>
                            <Button variant="outline" className="flex-1 py-6 rounded-[2rem] font-black border-2 border-slate-200 text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all" onClick={skipAndComplete}>SKIP & COMPLETE</Button>
                            <Button className="flex-[2.5] bg-green-700 hover:bg-green-800 text-white shadow-2xl py-6 rounded-[2rem] font-black tracking-[0.3em] uppercase transition-all hover:scale-[1.02] active:scale-95 border-none" onClick={handleFinalizeNotes}>FINALIZE & COMPLETE SESSION</Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" className="flex-1 py-6 rounded-[2rem] font-black border-2 border-slate-100 text-slate-300 uppercase tracking-widest hover:bg-slate-50 transition-all" onClick={handleCloseNoteModal}>DISCARD DRAFT</Button>
                            <Button className="flex-[2.5] bg-slate-900 hover:bg-black text-white shadow-2xl py-6 rounded-[2rem] font-black tracking-[0.3em] uppercase transition-all hover:scale-[1.02] active:scale-95 border-none" onClick={handleFinalizeNotes}>SAVE NOTES</Button>
                        </>
                    )}
                </footer>
            </Modal>
        </div>
    );
};

export default PhysicalConsultationRoom;
