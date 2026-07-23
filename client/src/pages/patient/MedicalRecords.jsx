import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaCalendarAlt, FaBrain, FaEye, FaSearch,
    FaNotesMedical, FaUserMd, FaChevronDown, FaChevronUp, FaDownload
} from 'react-icons/fa';
import { SurfaceCard, Button, Badge } from '../../components/ui';
import { getAppointments, getConsultationNotes, getScans } from '../../services/api';
import Loading from '../../components/Loading';
import toast from 'react-hot-toast';
import api from '../../services/api';

const STATUS_COLORS = {
    pending: 'bg-warning/15 text-warning',
    confirmed: 'bg-accent/15 text-accent',
    completed: 'bg-medical/15 text-medical',
    cancelled: 'bg-error/15 text-error',
    no_show: 'bg-surface-tertiary/50 text-foreground-muted',
};

const SCAN_TYPE_LABELS = {
    mri_brain: 'Brain MRI',
    retinal: 'Retinal Scan',
    xray: 'X-Ray',
    ct_scan: 'CT Scan',
    ultrasound: 'Ultrasound',
    other: 'Other',
};

const getAIDiagnosis = (scan) => {
    const pred = scan.ai_prediction || scan.aiAnalysis;
    if (!pred) return null;
    if (typeof pred === 'string') return pred;
    if (pred.scan_type === 'brain_mri') {
        const t = pred.tumor?.prediction || '';
        const a = pred.alzheimer?.prediction || '';
        return [t, a].filter(Boolean).join(' · ') || null;
    }
    return pred.class_name || pred.prediction || pred.label || null;
};

const AppointmentsTab = ({ appointments, loading }) => {
    const navigate = useNavigate();

    if (loading) return <Loading />;

    if (!appointments.length) return (
        <div className="text-center py-16 text-foreground-muted">
            <FaCalendarAlt className="mx-auto text-4xl mb-3 opacity-30" />
            <p className="font-medium">No appointments found</p>
        </div>
    );

    return (
        <div className="space-y-3">
            {appointments.map(app => {
                const doctorName = app.doctor?.name || app.Doctor?.User?.name || 'Doctor';
                const statusColor = STATUS_COLORS[app.status] || 'bg-surface-tertiary/50 text-foreground-muted';
                return (
                    <SurfaceCard key={app.id || app._id} className="p-4" hover={false}>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                                    <FaUserMd className="text-accent" size={16} />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground text-sm">Dr. {doctorName}</p>
                                    <p className="text-sm text-foreground-muted">{app.date} · {app.time_slot || app.timeSlot}</p>
                                    <p className="text-xs text-foreground-subtle capitalize">{app.type} consultation</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColor}`}>
                                    {app.status}
                                </span>
                                {app.status === 'completed' && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => navigate(`/patient/consultation/${app.id || app._id}`)}
                                    >
                                        View Notes
                                    </Button>
                                )}
                            </div>
                        </div>
                    </SurfaceCard>
                );
            })}
        </div>
    );
};

const NotesTab = ({ appointments }) => {
    const [notesMap, setNotesMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        const completed = appointments.filter(a => a.status === 'completed');
        if (!completed.length) { setLoading(false); return; }

        Promise.allSettled(
            completed.map(app =>
                getConsultationNotes(app.id || app._id)
                    .then(({ data }) => ({ id: app.id || app._id, notes: data, app }))
                    .catch(() => ({ id: app.id || app._id, notes: [], app }))
            )
        ).then(results => {
            const map = {};
            results.forEach(r => {
                if (r.status === 'fulfilled') {
                    const { id, notes, app } = r.value;
                    const visible = (notes || []).filter(n => !n.is_private);
                    if (visible.length) map[id] = { notes: visible, app };
                }
            });
            setNotesMap(map);
            setLoading(false);
        });
    }, [appointments]);

    if (loading) return <Loading />;

    const entries = Object.entries(notesMap);
    if (!entries.length) return (
        <div className="text-center py-16 text-foreground-muted">
            <FaNotesMedical className="mx-auto text-4xl mb-3 opacity-30" />
            <p className="font-medium">No consultation notes found</p>
        </div>
    );

    return (
        <div className="space-y-3">
            {entries.map(([appId, { notes, app }]) => {
                const doctorName = app.doctor?.name || app.Doctor?.User?.name || 'Doctor';
                const isOpen = expandedId === appId;
                return (
                    <SurfaceCard key={appId} className="overflow-hidden" hover={false}>
                        <button
                            className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-tertiary/30 transition-colors"
                            onClick={() => setExpandedId(isOpen ? null : appId)}
                        >
                            <div className="flex items-center gap-3">
                                <FaNotesMedical className="text-accent shrink-0" size={16} />
                                <div>
                                    <p className="font-semibold text-foreground text-sm">Dr. {doctorName}</p>
                                    <p className="text-xs text-foreground-muted">{app.date} · {notes.length} note{notes.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            {isOpen ? <FaChevronUp className="text-foreground-muted" size={14} /> : <FaChevronDown className="text-foreground-muted" size={14} />}
                        </button>
                        {isOpen && (
                            <div className="border-t border-white/5 p-4 space-y-3">
                                {notes.map(note => (
                                    <div key={note.id} className="bg-surface-tertiary/30 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-semibold text-accent uppercase tracking-wide">
                                                {note.note_type || 'Clinical'}
                                            </span>
                                            <span className="text-xs text-foreground-muted">
                                                {new Date(note.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground-muted whitespace-pre-wrap">{note.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </SurfaceCard>
                );
            })}
        </div>
    );
};

const ScansTab = ({ scans, loading }) => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');

    const filtered = scans.filter(s =>
        (SCAN_TYPE_LABELS[s.scan_type] || s.scan_type || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleDownload = async (scan) => {
        const report = scan.Reports?.[0] || scan.Report;
        if (!report?.finalized) {
            toast.error('Report not finalized yet. Ask your doctor to finalize the report.');
            return;
        }
        const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        if (report.final_report) {
            window.open(`${base}${report.final_report}`, '_blank');
            return;
        }
        try {
            const response = await api.post(`/scans/${scan.id}/report/pdf`, {}, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `MediFusion_Report_${scan.id.slice(0, 8)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            toast.error('PDF generation failed. Please try again later.');
        }
    };

    if (loading) return <Loading />;

    return (
        <div>
            <div className="relative mb-4">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" size={14} />
                <input
                    type="text"
                    placeholder="Search by scan type..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-surface-secondary border border-white/[0.06] rounded-xl text-sm text-foreground placeholder-foreground-subtle focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
            </div>

            {!filtered.length ? (
                <div className="text-center py-16 text-foreground-muted">
                    <FaBrain className="mx-auto text-4xl mb-3 opacity-30" />
                    <p className="font-medium">No scans found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(scan => {
                        const aiDx = getAIDiagnosis(scan);
                        const hasReport = !!(scan.Reports?.[0]?.finalized || scan.Report?.finalized);
                        const isRetinal = scan.scan_type === 'retinal';
                        return (
                            <SurfaceCard key={scan.id} className="p-4" hover={false}>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                                            {isRetinal ? <FaEye className="text-accent" size={16} /> : <FaBrain className="text-accent" size={16} />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground text-sm">
                                                {SCAN_TYPE_LABELS[scan.scan_type] || scan.scan_type || 'Scan'}
                                            </p>
                                            <p className="text-xs text-foreground-muted">
                                                {new Date(scan.createdAt).toLocaleDateString()}
                                            </p>
                                            {aiDx && (
                                                <p className="text-xs text-accent font-medium mt-0.5">AI: {aiDx}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {hasReport && (
                                            <Badge variant="success" className="text-xs">Report Ready</Badge>
                                        )}
                                        {aiDx && !hasReport && (
                                            <Badge variant="accent" className="text-xs">AI Analyzed</Badge>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => navigate(`/patient/scans/results/${scan.id}`)}
                                        >
                                            View Results
                                        </Button>
                                        {hasReport && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleDownload(scan)}
                                                className="flex items-center gap-1"
                                            >
                                                <FaDownload size={11} />
                                                PDF
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </SurfaceCard>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const TAB_ITEMS = [
    { id: 'appointments', label: 'Appointment History', icon: FaCalendarAlt },
    { id: 'notes', label: 'Consultation Notes', icon: FaNotesMedical },
    { id: 'scans', label: 'My Scans', icon: FaBrain },
];

const MedicalRecords = () => {
    const [appointments, setAppointments] = useState([]);
    const [scans, setScans] = useState([]);
    const [loadingAppts, setLoadingAppts] = useState(true);
    const [loadingScans, setLoadingScans] = useState(true);
    const [activeTab, setActiveTab] = useState('appointments');

    useEffect(() => {
        getAppointments()
            .then(({ data }) => setAppointments(Array.isArray(data) ? data : []))
            .catch(() => toast.error('Could not load appointments'))
            .finally(() => setLoadingAppts(false));

        getScans()
            .then(({ data }) => setScans(Array.isArray(data) ? data : []))
            .catch(() => {})
            .finally(() => setLoadingScans(false));
    }, []);

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">Medical Records</h1>
                <p className="text-foreground-muted text-sm mt-1">Your full health history in one place</p>
            </div>

            <div className="flex gap-1 p-1 bg-surface-secondary rounded-xl border border-white/[0.06] mb-6">
                {TAB_ITEMS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                isActive
                                    ? 'bg-surface text-foreground shadow-sm'
                                    : 'text-foreground-muted hover:bg-surface-tertiary/50 hover:text-foreground'
                            }`}
                        >
                            <Icon size={14} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {activeTab === 'appointments' && <AppointmentsTab appointments={appointments} loading={loadingAppts} />}
            {activeTab === 'notes' && !loadingAppts && <NotesTab appointments={appointments} />}
            {activeTab === 'scans' && <ScansTab scans={scans} loading={loadingScans} />}
        </div>
    );
};

export default MedicalRecords;
