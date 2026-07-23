import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    FaUser, FaCalendarAlt, FaFileMedical, FaHistory, 
    FaHeartbeat, FaEnvelope, FaPhone, FaArrowLeft,
    FaClipboardCheck, FaImage, FaPlus, FaUserMd, FaNotesMedical,
    FaRobot, FaCheckCircle, FaIdCard
} from 'react-icons/fa';
import { GlassCard, Button, Badge, TabGroup } from '../../components/ui';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';

const getHeatmapSrc = (url) => {
    if (!url) return null;
    if (url.startsWith('data:') || url.startsWith('http')) return url;
    if (url.startsWith('/')) return `${import.meta.env.VITE_API_URL}${url}`;
    return `data:image/png;base64,${url}`;
};

const getAIPredictionLabel = (pred) => {
    if (!pred) return null;
    if (typeof pred === 'string') return pred;
    if (pred.scan_type === 'brain_mri') {
        return `Tumor: ${pred.tumor?.prediction || 'N/A'} | Alzheimer: ${pred.alzheimer?.prediction || 'N/A'}`;
    }
    return pred.class_name || pred.prediction || pred.label || null;
};

const getAIConfidence = (pred) => {
    if (!pred || typeof pred === 'string') return null;
    if (pred.scan_type === 'brain_mri') return Math.max(pred.tumor?.confidence || 0, pred.alzheimer?.confidence || 0);
    return pred.confidence || null;
};

const PatientDetails = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedScan, setSelectedScan] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [expandedNoteId, setExpandedNoteId] = useState(null);
    const [isProcessingAI, setIsProcessingAI] = useState(false);

    const isBrainScan = (scan) => {
        const t = scan?.scan_type || scan?.scanType || '';
        return t === 'brain_mri' || t === 'mri_brain';
    };

    const handleRunAI = async (scanId) => {
        if (!scanId) return;
        const scan = data?.scans?.find(s => s.id === scanId);
        if (!scan) return;
        setIsProcessingAI(true);
        try {
            const endpoint = isBrainScan(scan) ? `/scans/${scanId}/analyze-brain` : `/scans/${scanId}/analyze`;
            const { data: res } = await api.post(endpoint);
            const heatmapB64 = res.images?.tumor_heatmap || res.images?.alz_heatmap || res.images?.overlay || null;
            const heatmapSrc = heatmapB64 ? `data:image/png;base64,${heatmapB64}` : null;
            const aiPrediction = res.prediction || { scan_type: res.scan_type, tumor: res.tumor, alzheimer: res.alzheimer };
            const updated = { status: 'analyzed', ai_prediction: aiPrediction, ai_heatmap_url: heatmapSrc };
            setData(prev => ({ ...prev, scans: prev.scans.map(s => s.id === scanId ? { ...s, ...updated } : s) }));
            setSelectedScan(prev => prev?.id === scanId ? { ...prev, ...updated } : prev);
            toast.success('AI Analysis Complete!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'AI Analysis failed');
        } finally {
            setIsProcessingAI(false);
        }
    };

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const { data } = await api.get(`/doctors/patients/${patientId}/history`);
                setData(data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching patient history", error);
                toast.error("Failed to load patient history");
                setLoading(false);
            }
        };
        fetchHistory();
    }, [patientId]);

    if (loading) return <div className="h-screen flex items-center justify-center bg-surface"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-accent"></div></div>;
    if (!data) return <div className="p-10 text-center">Patient not found</div>;

    const { profile, appointments, scans } = data;

    const tabs = [
        { id: 'timeline', label: 'Clinical Timeline', icon: <FaHistory /> },
        { id: 'scans', label: 'Diagnostic Imaging', icon: <FaImage /> },
        { id: 'profile', label: 'Patient Profile', icon: <FaUser /> }
    ];

    return (
        <div className="space-y-10 p-4 md:p-8 bg-surface min-h-screen font-sans">
            {/* Minimalist Navigation */}
            <div className="flex items-center justify-between">
                <Button 
                    variant="outline" 
                    onClick={() => navigate('/doctor/patients')} 
                    className="flex items-center gap-3 border-2 border-white/[0.06] text-foreground-muted font-black text-xs tracking-widest rounded-xl px-6 py-3 hover:bg-surface-secondary transition-all"
                >
                    <FaArrowLeft /> BACK TO ROSTER
                </Button>
                <div className="flex gap-4">
                    <Button onClick={() => navigate('/doctor/appointments')} className="bg-accent hover:bg-accent-hover text-white font-black text-xs tracking-widest rounded-xl px-8 py-3 shadow-card">
                        SCHEDULE SESSION
                    </Button>
                </div>
            </div>

            {/* Patient Hero Card - High Aesthetic */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-accent rounded-[3rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                <GlassCard className="relative p-10 bg-surface-secondary border-none shadow-card rounded-xl overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                        <FaIdCard size={180} />
                    </div>
                    <div className="flex flex-col md:flex-row gap-12 items-center">
                        <div className="relative">
                            <img 
                                src={`https://ui-avatars.com/api/?name=${profile.User?.name}&size=160&background=0066FF&color=fff&bold=true`} 
                                alt={profile.User?.name}
                                className="w-40 h-40 rounded-xl shadow-card border-8 border-surface-secondary object-cover"
                            />
                            <div className="absolute -bottom-2 -right-2 bg-success w-10 h-10 rounded-xl border-4 border-surface-secondary flex items-center justify-center shadow-card">
                                <div className="w-2.5 h-2.5 bg-surface-secondary rounded-full animate-pulse"></div>
                            </div>
                        </div>
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <h1 className="text-5xl font-black text-foreground tracking-tighter uppercase italic leading-none">
                                {profile.User?.name}
                            </h1>
                            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-[11px] font-black uppercase tracking-widest text-foreground-muted">
                                <span className="flex items-center gap-2 bg-surface-secondary/60 px-4 py-2 rounded-xl border border-white/5">
                                    <FaUser className="text-accent" /> {profile.gender} • {profile.date_of_birth ? (new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear()) : 'N/A'} YRS
                                </span>
                                <span className="flex items-center gap-2 bg-surface-secondary/60 px-4 py-2 rounded-xl border border-white/5">
                                    <FaEnvelope className="text-accent" /> {profile.User?.email}
                                </span>
                                <span className="flex items-center gap-2 bg-surface-secondary/60 px-4 py-2 rounded-xl border border-white/5">
                                    <FaPhone className="text-accent" /> {profile.User?.phone || 'NO PHONE'}
                                </span>
                            </div>
                        </div>
                        <div className="bg-surface-secondary p-8 rounded-xl border border-white/[0.06] shadow-card min-w-[240px] text-center">
                            <p className="text-[10px] text-foreground-muted font-black uppercase tracking-[0.4em] mb-3">Hematology Group</p>
                            <p className="text-5xl font-black text-foreground italic tracking-tighter">{profile.blood_group || 'O+'}</p>
                        </div>
                    </div>
                </GlassCard>
            </div>

            <TabGroup tabs={tabs} defaultValue="timeline">
                {(activeTab) => (
                    <div className="mt-12">
                        {activeTab === 'timeline' && (
                            <div className="space-y-8 max-w-4xl mx-auto">
                                {appointments.length === 0 ? (
                                    <div className="py-20 text-center flex flex-col items-center border-4 border-dashed border-white/5 rounded-[4rem]">
                                        <FaHistory className="text-foreground-subtle text-8xl mb-6" />
                                        <p className="text-xs font-black text-foreground-subtle uppercase tracking-widest italic">No clinical history with this facility</p>
                                    </div>
                                ) : (
                                    appointments.map((apt, idx) => (
                                        <motion.div 
                                            key={apt.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                        >
                                            <GlassCard className="p-10 border-none shadow-card hover:shadow-card-hover transition-all relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                                    <FaClipboardCheck size={80} />
                                                </div>
                                                {/* Header row — always visible */}
                                                <div
                                                    className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 cursor-pointer group"
                                                    onClick={() => setExpandedNoteId(expandedNoteId === apt.id ? null : apt.id)}
                                                >
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent shadow-inner">
                                                                <FaCalendarAlt size={20} />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-black text-2xl text-foreground tracking-tighter uppercase italic">
                                                                    {new Date(apt.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                                </h3>
                                                                <p className="text-[10px] font-black text-foreground-muted uppercase tracking-[0.2em] mt-1">
                                                                    {apt.time_slot} • {apt.type} SESSION
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="pl-16">
                                                            <p className="text-base text-foreground-muted font-bold italic leading-relaxed">
                                                                "{apt.reason || 'Routine medical follow-up.'}"
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-3">
                                                        <Badge variant={apt.status === 'completed' ? 'success' : 'primary'} className="px-6 py-2 font-black uppercase tracking-[0.2em] text-[9px]">
                                                            {apt.status}
                                                        </Badge>
                                                        <span className="text-[9px] font-black text-accent uppercase tracking-widest flex items-center gap-2 cursor-pointer">
                                                            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
                                                            {expandedNoteId === apt.id ? 'HIDE DETAILS ▲' : 'VIEW DETAILS ▼'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Expandable note body */}
                                                {expandedNoteId === apt.id && (
                                                    <div className="mt-8 pt-8 border-t border-white/5 space-y-8">

                                                        {/* AI-Generated Clinical Summary */}
                                                        {apt.consultation_summary && (() => {
                                                            let summary = apt.consultation_summary;
                                                            try { summary = typeof summary === 'string' ? JSON.parse(summary) : summary; } catch { summary = null; }
                                                            if (summary && typeof summary === 'object') {
                                                                return (
                                                                    <div>
                                                                        <h4 className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                                                            <div className="w-2 h-2 bg-accent rounded-full"></div> AI SCRIBE — SESSION SUMMARY
                                                                        </h4>
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                            {[
                                                                                { label: 'Chief Complaint', key: 'chiefComplaint', color: 'bg-error/10 border-error/20' },
                                                                                { label: 'Clinical Assessment', key: 'assessment', color: 'bg-surface-secondary/60 border-white/5' },
                                                                                { label: 'Treatment Plan', key: 'plan', color: 'bg-accent-subtle border-accent/20' },
                                                                                { label: 'History of Present Illness', key: 'historyOfPresentIllness', color: 'bg-surface-secondary/60 border-white/5' },
                                                                                { label: 'Follow-Up Instructions', key: 'followUpInstructions', color: 'bg-success/10 border-success/20' },
                                                                            ].filter(f => summary[f.key]).map(f => (
                                                                                <div key={f.key} className={`${f.color} rounded-xl p-5 border`}>
                                                                                    <p className="text-[9px] font-black text-foreground-subtle uppercase tracking-widest mb-2">{f.label}</p>
                                                                                    <p className="text-sm font-bold text-foreground italic leading-relaxed">{summary[f.key]}</p>
                                                                                </div>
                                                                            ))}
                                                                            {summary.symptoms?.length > 0 && (
                                                                                <div className="bg-warning/10 rounded-xl p-5 border border-warning/20">
                                                                                    <p className="text-[9px] font-black text-foreground-subtle uppercase tracking-widest mb-3">Identified Symptoms</p>
                                                                                    <div className="flex flex-wrap gap-2">
                                                                                        {summary.symptoms.map((s, i) => (
                                                                                            <span key={i} className="bg-warning/20 text-warning text-[10px] font-black px-3 py-1 rounded-xl uppercase">{s}</span>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        {summary.patientSummary && (
                                                                            <div className="mt-4 p-6 bg-accent-subtle rounded-xl border border-accent/20">
                                                                                <p className="text-[9px] font-black text-accent uppercase tracking-widest mb-2">Patient-Facing Summary</p>
                                                                                <p className="text-sm text-foreground font-bold italic leading-relaxed">"{summary.patientSummary}"</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            }
                                                            return (
<div className="bg-surface-secondary/60 rounded-xl p-6 border border-white/5">
                                                                        <p className="text-[9px] font-black text-foreground-subtle uppercase tracking-widest mb-2">Consultation Summary</p>
                                                                        <p className="text-sm text-foreground-muted leading-relaxed italic">{apt.consultation_summary}</p>
                                                                </div>
                                                            );
                                                        })()}

                                                        {/* Consultation Notes Timeline */}
                                                        {apt.ConsultationNotes?.length > 0 && (
                                                            <div>
                                                                <h4 className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                                                    <div className="w-2 h-2 bg-accent rounded-full"></div> SESSION NOTES ({apt.ConsultationNotes.length})
                                                                </h4>
                                                                <div className="space-y-3 max-h-80 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                                                                    {apt.ConsultationNotes.map((note) => (
                                                                        <div key={note.id} className={`rounded-xl p-5 border ${note.is_private ? 'bg-warning/10 border-warning/20' : 'bg-accent-subtle border-accent/20'}`}>
                                                                            <div className="flex justify-between items-center mb-2">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${note.is_private ? 'text-warning' : 'text-accent'}`}>
                                                                                        {note.note_type || 'clinical'} {note.is_private ? '• PRIVATE' : ''}
                                                                                    </span>
                                                                                    <span className="text-[9px] text-foreground-subtle">— {note.author?.name || 'Doctor'}</span>
                                                                                </div>
                                                                                <span className="text-[9px] text-foreground-subtle">{new Date(note.createdAt).toLocaleString()}</span>
                                                                            </div>
                                                                            <p className="text-sm text-foreground-muted leading-relaxed">{note.content}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {!apt.consultation_summary && !apt.ConsultationNotes?.length && (
                                                            <p className="text-center text-sm text-foreground-subtle italic py-4">No notes recorded for this session.</p>
                                                        )}
                                                    </div>
                                                )}
                                            </GlassCard>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'scans' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {scans.length === 0 ? (
                                    <div className="col-span-full py-20 text-center flex flex-col items-center border-4 border-dashed border-white/5 rounded-[4rem]">
                                        <FaImage className="text-foreground-subtle text-8xl mb-6" />
                                        <p className="text-xs font-black text-foreground-subtle uppercase tracking-widest italic">No diagnostic imaging found</p>
                                    </div>
                                ) : (
                                    scans.map((scan, idx) => (
                                        <motion.div
                                            key={scan.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.1 }}
                                        >
                                            <GlassCard 
                                                className="group rounded-[3rem] border-none shadow-card overflow-hidden hover:shadow-card transition-all duration-500 cursor-pointer"
                                                onClick={() => setSelectedScan(scan)}
                                            >
                                                <div className="relative aspect-square bg-surface overflow-hidden">
                                                    <img 
                                                        src={`${import.meta.env.VITE_API_URL}${scan.file_url}`} 
                                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                                                        alt="Scan"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>
                                                    <div className="absolute bottom-6 left-6 space-y-2">
                                                        <Badge className="bg-surface-secondary/10 backdrop-blur-xl text-white border-white/20 text-[9px] uppercase font-black px-4 py-1.5 tracking-[0.2em]">
                                                            {scan.scan_type?.replace('_', ' ')}
                                                        </Badge>
                                                        {scan.status === 'analyzed' && (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 bg-success/100 rounded-full"></div>
                                                                <span className="text-[9px] font-black text-white uppercase tracking-widest">AI VERIFIED</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="p-8 bg-surface-secondary space-y-6">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-[10px] font-black text-foreground-subtle uppercase tracking-widest">{new Date(scan.createdAt).toLocaleDateString()}</p>
                                                        <FaRobot className={scan.status === 'analyzed' ? 'text-accent' : 'text-foreground-subtle'} size={18} />
                                                    </div>
                                                    
                                                    {scan.status === 'analyzed' ? (
                                                        <div className="space-y-4">
                                                            <div className="p-4 bg-accent-subtle rounded-xl border border-accent/20">
                                                                <p className="text-[9px] font-black text-accent uppercase tracking-widest mb-1">AI Classification</p>
                                                                <p className="text-sm font-black text-foreground italic uppercase">
                                                                    {getAIPredictionLabel(scan.ai_prediction) || '—'}
                                                                </p>
                                                            </div>
                                                            {scan.Report && (
                                                                <div 
                                                                    className="p-4 bg-accent-subtle rounded-xl border border-accent/20 hover:bg-accent/20 transition-colors"
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedReport(scan.Report); }}
                                                                >
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="text-[9px] font-black text-foreground uppercase tracking-widest">Final Clinical Report</span>
                                                                        <FaPlus size={10} className="text-accent" />
                                                                    </div>
                                                                    <p className="text-xs font-bold text-foreground line-clamp-1 italic">{scan.Report.diagnosis}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <Button 
                                                            variant="outline" 
                                                            className="w-full py-4 rounded-xl text-[10px] font-black tracking-widest border-2 border-white/5 text-foreground-subtle hover:bg-surface-secondary/60"
                                                            onClick={(e) => { e.stopPropagation(); navigate('/doctor/diagnostic'); }}
                                                        >
                                                            PENDING ANALYSIS
                                                        </Button>
                                                    )}
                                                </div>
                                            </GlassCard>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'profile' && !!profile && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto">
                                <GlassCard className="p-10 rounded-[3rem] border-none shadow-card space-y-8">
                                    <h3 className="text-xl font-black text-foreground tracking-tighter uppercase italic border-b border-white/5 pb-6 flex items-center gap-4">
                                        <FaUser className="text-accent" /> BIOMETRIC PROFILE
                                    </h3>
                                    <div className="space-y-6">
                                        {[
                                            { label: 'Hematology Group', value: profile?.blood_group || 'O+' },
                                            { label: 'Biological Gender', value: profile?.gender || 'N/A' },
                                            { label: 'Date of Birth', value: profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A' },
                                            { label: 'Physical Address', value: profile?.address || 'Confidential' },
                                            { label: 'Emergency Contact', value: profile?.emergency_contact != null && typeof profile.emergency_contact === 'object' ? `${profile.emergency_contact.name || ''} (${profile.emergency_contact.relation || ''}) — ${profile.emergency_contact.phone || ''}` : profile?.emergency_contact || 'None Recorded' }
                                        ].map((item, i) => (
                                            <div key={i} className="flex justify-between items-center p-4 bg-surface-secondary/60 rounded-xl border border-white/5">
                                                <span className="text-[10px] font-black text-foreground-subtle uppercase tracking-widest">{item.label}</span>
                                                <span className="text-sm font-black text-foreground italic">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </GlassCard>

                                <GlassCard className="p-10 rounded-[3rem] border-none shadow-card space-y-8">
                                    <h3 className="text-xl font-black text-foreground tracking-tighter uppercase italic border-b border-white/5 pb-6 flex items-center gap-4">
                                        <FaNotesMedical className="text-error" /> CHRONIC CONDITIONS
                                    </h3>
                                    <div className="space-y-4">
                                        {profile?.MedicalHistories?.length > 0 ? (
                                            profile.MedicalHistories.map((h, i) => (
                                                <div key={i} className="p-6 bg-error/10 rounded-[2rem] border border-error/20 relative group overflow-hidden transition-all hover:bg-error/10">
                                                    <div className="absolute top-0 right-0 p-6 opacity-5">
                                                        <FaHeartbeat size={48} className="text-error" />
                                                    </div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="text-base font-black text-foreground uppercase tracking-tight">{h.condition}</h4>
                                                        <Badge variant="danger" className="text-[8px] px-3 py-1 font-black">{h.status}</Badge>
                                                    </div>
                                                    <p className="text-xs text-error/70 font-bold italic">{h.notes || 'No specific contraindications recorded.'}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                                                <p className="text-[10px] font-black text-foreground-subtle uppercase tracking-widest italic">No clinical history recorded</p>
                                            </div>
                                        )}
                                    </div>
                                </GlassCard>
                            </div>
                        )}
                    </div>
                )}
            </TabGroup>

            {/* Cinema Scan Modal */}
            <Modal
                isOpen={!!selectedScan}
                onClose={() => setSelectedScan(null)}
                title={selectedScan ? `${selectedScan.scan_type?.replace('_', ' ').toUpperCase()} ANALYSIS` : "SCAN VIEW"}
                size="xl"
            >
                {selectedScan && (
                    <div className="bg-surface-secondary p-4 space-y-10">
                        <div className="grid grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-foreground-subtle uppercase tracking-[0.3em] flex items-center gap-3">
                                    <div className="w-2 h-2 bg-primary-blue rounded-full"></div> INPUT SOURCE IMAGE
                                </h4>
                                <div className="rounded-[3rem] overflow-hidden shadow-card border-8 border-white/5 ring-1 ring-white/5 bg-surface aspect-square flex items-center justify-center">
                                    <img 
                                        src={`${import.meta.env.VITE_API_URL}${selectedScan.file_url}`} 
                                        className="max-w-full max-h-full object-contain" 
                                        alt="Original" 
                                        onError={(e) => { e.target.src = 'https://placehold.co/800x800/1e293b/ffffff?text=SOURCE+IMAGE+LOAD+ERROR'; }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-accent uppercase tracking-[0.3em] flex items-center gap-3">
                                    <div className="w-2 h-2 bg-accent-subtle0 rounded-full"></div> AI EXPLAINABILITY (GRAD-CAM)
                                </h4>
                                <div className="rounded-[3rem] overflow-hidden shadow-card border-8 border-accent/20 ring-1 ring-accent/20 bg-surface-secondary aspect-square flex items-center justify-center">
                                    {selectedScan.ai_heatmap_url ? (
                                        <img
                                            src={getHeatmapSrc(selectedScan.ai_heatmap_url)}
                                            className="max-w-full max-h-full object-contain"
                                            alt="GradCAM Heatmap"
                                        />
                                    ) : selectedScan.status === 'analyzed' ? (
                                        <div className="text-center px-12">
                                            <Button
                                                onClick={() => handleRunAI(selectedScan.id)}
                                                disabled={isProcessingAI}
                                                className="bg-accent hover:bg-accent-hover text-white font-black px-8 py-4 rounded-xl"
                                            >
                                                {isProcessingAI ? 'ANALYZING...' : 'RE-RUN AI'}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="text-center px-12">
                                            <Button
                                                onClick={() => handleRunAI(selectedScan.id)}
                                                disabled={isProcessingAI}
                                                className="bg-accent hover:bg-accent-hover text-white font-black px-8 py-4 rounded-xl"
                                            >
                                                {isProcessingAI ? 'ANALYZING...' : 'RUN AI ANALYSIS'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {selectedScan.status === 'analyzed' && (
                            <div className="bg-surface-secondary p-10 rounded-[4rem] border border-white/[0.06] shadow-card relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <FaUserMd size={100} className="text-white" />
                                </div>
                                <h5 className="text-[10px] font-black text-accent uppercase tracking-[0.5em] mb-6">AI INTELLIGENCE DIAGNOSTIC REPORT</h5>
                                <p className="text-3xl font-black text-white leading-tight tracking-tighter uppercase italic">
                                    {getAIPredictionLabel(selectedScan.ai_prediction) || 'UNDETERMINED ANALYSIS'}
                                </p>
                                {getAIConfidence(selectedScan.ai_prediction) != null && (
                                    <div className="mt-8 flex items-center gap-6">
                                        <div className="flex-1 h-3 bg-surface rounded-full overflow-hidden border border-white/[0.06]">
                                            <div className="h-full bg-gradient-to-r from-accent to-accent" style={{ width: `${getAIConfidence(selectedScan.ai_prediction)}%` }}></div>
                                        </div>
                                        <span className="text-sm font-black text-white tracking-widest">{getAIConfidence(selectedScan.ai_prediction).toFixed(1)}% CONFIDENCE SCORE</span>
                                    </div>
                                )}
                                {selectedScan.ai_prediction?.scan_type === 'brain_mri' && (
                                    <div className="mt-6 grid grid-cols-2 gap-3">
                                        <div className="bg-surface-secondary/5 rounded-xl p-4">
                                            <p className="text-[9px] font-black text-accent uppercase tracking-widest mb-1">Tumor</p>
                                            <p className="text-sm font-black text-white">{selectedScan.ai_prediction.tumor?.prediction || 'N/A'}</p>
                                            <p className="text-xs text-foreground-subtle">{(selectedScan.ai_prediction.tumor?.confidence || 0).toFixed(1)}%</p>
                                        </div>
                                        <div className="bg-surface-secondary/5 rounded-xl p-4">
                                            <p className="text-[9px] font-black text-accent uppercase tracking-widest mb-1">Alzheimer</p>
                                            <p className="text-sm font-black text-white">{selectedScan.ai_prediction.alzheimer?.prediction || 'N/A'}</p>
                                            <p className="text-xs text-foreground-subtle">{(selectedScan.ai_prediction.alzheimer?.confidence || 0).toFixed(1)}%</p>
                                        </div>
                                    </div>
                                )}
                                <div className="mt-6">
                                    <Button
                                        onClick={() => handleRunAI(selectedScan.id)}
                                        disabled={isProcessingAI}
                                        className="w-full bg-accent/20 hover:bg-accent/40 text-accent font-black py-3 rounded-xl border border-accent/30"
                                    >
                                        {isProcessingAI ? 'ANALYZING...' : 'RE-RUN AI ANALYSIS'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Report Modal */}
            <Modal
                isOpen={!!selectedReport}
                onClose={() => setSelectedReport(null)}
                title="CLINICAL VERIFICATION"
            >
                {selectedReport && (
                    <div className="bg-surface-secondary p-4 space-y-10">
                        <div className="flex justify-between items-center p-6 bg-surface-secondary rounded-[2rem] text-white">
                            <div>
                                <p className="text-[9px] font-black text-foreground-subtle uppercase tracking-widest mb-1">Verification Date</p>
                                <p className="text-base font-black italic">{new Date(selectedReport.createdAt).toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
                            </div>
                            <Badge variant="success" className="px-6 py-2 font-black uppercase tracking-[0.3em] text-[10px] bg-success/100 border-none shadow-card  text-white">VERIFIED</Badge>
                        </div>
                        <div className="space-y-10 px-4">
                            <section>
                                <h5 className="text-[10px] font-black text-foreground-subtle uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                                    <div className="w-2 h-6 bg-primary-blue rounded-full"></div> PRIMARY DIAGNOSIS
                                </h5>
                                <p className="text-3xl font-black text-foreground leading-none tracking-tighter uppercase italic">{selectedReport.diagnosis}</p>
                            </section>
                            {selectedReport.recommendations && (
                                <section className="p-8 bg-accent-subtle rounded-[3rem] border border-accent/20 relative">
                                    <h5 className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mb-4">RECOMMENDATIONS</h5>
                                    <p className="text-base text-foreground italic leading-relaxed font-black">"{selectedReport.recommendations}"</p>
                                </section>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PatientDetails;
