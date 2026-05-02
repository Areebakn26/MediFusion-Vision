import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaCalendarAlt, FaFileMedical, FaBrain, FaEye, FaSearch,
    FaNotesMedical, FaUserMd, FaChevronDown, FaChevronUp, FaDownload
} from 'react-icons/fa';
import { GlassCard, Button, Badge } from '../../components/ui';
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '../../components/ui/Tabs';
import { getAppointments, getConsultationNotes, getScans } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import Loading from '../../components/Loading';
import toast from 'react-hot-toast';
import api from '../../services/api';

const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    no_show: 'bg-gray-100 text-gray-600',
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

// ─── Appointments Tab ────────────────────────────────────────────────────────

const AppointmentsTab = ({ appointments, loading }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    if (loading) return <div className="py-16 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" /></div>;

    if (!appointments.length) return (
        <div className="text-center py-16 text-gray-400">
            <FaCalendarAlt className="mx-auto text-4xl mb-3 opacity-30" />
            <p className="font-medium">{t('noAppointments', 'No appointments found')}</p>
        </div>
    );

    return (
        <div className="space-y-3">
            {appointments.map(app => {
                const doctorName = app.doctor?.name || app.Doctor?.User?.name || 'Doctor';
                const statusColor = STATUS_COLORS[app.status] || 'bg-gray-100 text-gray-600';
                return (
                    <GlassCard key={app.id || app._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                                <FaUserMd className="text-teal-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">Dr. {doctorName}</p>
                                <p className="text-sm text-gray-500">{app.date} · {app.time_slot || app.timeSlot}</p>
                                <p className="text-xs text-gray-400 capitalize">{app.type} consultation</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColor}`}>
                                {t(app.status, app.status)}
                            </span>
                            {app.status === 'completed' && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => navigate(`/patient/consultation/${app.id || app._id}`)}
                                    className="text-xs px-3 py-1"
                                >
                                    {t('viewNotes', 'View Notes')}
                                </Button>
                            )}
                        </div>
                    </GlassCard>
                );
            })}
        </div>
    );
};

// ─── Notes Tab ────────────────────────────────────────────────────────────────

const NotesTab = ({ appointments }) => {
    const { t } = useLanguage();
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

    if (loading) return <div className="py-16 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" /></div>;

    const entries = Object.entries(notesMap);
    if (!entries.length) return (
        <div className="text-center py-16 text-gray-400">
            <FaNotesMedical className="mx-auto text-4xl mb-3 opacity-30" />
            <p className="font-medium">{t('noNotes', 'No consultation notes found')}</p>
        </div>
    );

    return (
        <div className="space-y-4">
            {entries.map(([appId, { notes, app }]) => {
                const doctorName = app.doctor?.name || app.Doctor?.User?.name || 'Doctor';
                const isOpen = expandedId === appId;
                return (
                    <GlassCard key={appId} className="overflow-hidden">
                        <button
                            className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                            onClick={() => setExpandedId(isOpen ? null : appId)}
                        >
                            <div className="flex items-center gap-3">
                                <FaNotesMedical className="text-teal-500 shrink-0" />
                                <div>
                                    <p className="font-semibold text-gray-800">Dr. {doctorName}</p>
                                    <p className="text-sm text-gray-500">{app.date} · {notes.length} note{notes.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            {isOpen ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
                        </button>
                        {isOpen && (
                            <div className="border-t border-gray-100 p-4 space-y-3">
                                {notes.map(note => (
                                    <div key={note.id} className="bg-gray-50 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-semibold text-teal-600 uppercase tracking-wide">
                                                {note.note_type || 'Clinical'}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(note.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                );
            })}
        </div>
    );
};

// ─── Scans Tab ────────────────────────────────────────────────────────────────

const ScansTab = ({ scans, loading }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [downloading, setDownloading] = useState(null);

    const filtered = scans.filter(s =>
        (SCAN_TYPE_LABELS[s.scan_type] || s.scan_type || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleDownload = async (scan) => {
        if (!scan.Report?.status === 'finalized' && !scan.ai_prediction) {
            toast.error('Report not finalized yet.');
            return;
        }
        setDownloading(scan.id);
        try {
            const response = await api.post(`/scans/${scan.id}/report/pdf`, {}, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `MediFusion_Report_${scan.id.substring(0, 8)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch {
            toast.error('PDF not available yet. Ask your doctor to finalize the report.');
        } finally {
            setDownloading(null);
        }
    };

    if (loading) return <div className="py-16 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" /></div>;

    return (
        <div>
            <div className="relative mb-4">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                    type="text"
                    placeholder="Search by scan type..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                />
            </div>

            {!filtered.length ? (
                <div className="text-center py-16 text-gray-400">
                    <FaBrain className="mx-auto text-4xl mb-3 opacity-30" />
                    <p className="font-medium">{t('noScans', 'No scans found')}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(scan => {
                        const aiDx = getAIDiagnosis(scan);
                        const hasReport = scan.Report?.status === 'finalized';
                        const isRetinal = scan.scan_type === 'retinal';
                        return (
                            <GlassCard key={scan.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                        {isRetinal ? <FaEye className="text-blue-600" /> : <FaBrain className="text-blue-600" />}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            {SCAN_TYPE_LABELS[scan.scan_type] || scan.scan_type || 'Scan'}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(scan.createdAt).toLocaleDateString()}
                                        </p>
                                        {aiDx && (
                                            <p className="text-xs text-teal-600 font-medium mt-0.5">AI: {aiDx}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {hasReport && (
                                        <Badge variant="success" className="text-xs">Report Ready</Badge>
                                    )}
                                    {aiDx && !hasReport && (
                                        <Badge variant="info" className="text-xs">AI Analyzed</Badge>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => navigate(`/patient/scans/results/${scan.id}`)}
                                        className="text-xs px-3 py-1"
                                    >
                                        {t('viewResults', 'View Results')}
                                    </Button>
                                    {hasReport && (
                                        <Button
                                            size="sm"
                                            onClick={() => handleDownload(scan)}
                                            disabled={downloading === scan.id}
                                            className="text-xs px-3 py-1 flex items-center gap-1"
                                        >
                                            <FaDownload className="text-xs" />
                                            {downloading === scan.id ? '...' : 'PDF'}
                                        </Button>
                                    )}
                                </div>
                            </GlassCard>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const MedicalRecords = () => {
    const { t } = useLanguage();
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

    const tabs = [
        { id: 'appointments', label: t('appointmentHistory', 'Appointment History'), icon: <FaCalendarAlt /> },
        { id: 'notes', label: t('consultationNotes', 'Consultation Notes'), icon: <FaNotesMedical /> },
        { id: 'scans', label: t('myScans', 'My Scans'), icon: <FaBrain /> },
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{t('medicalRecords_title', 'Medical Records')}</h1>
                <p className="text-gray-500 text-sm mt-1">Your full health history in one place</p>
            </div>

            <TabGroup
                tabs={tabs}
                defaultValue="appointments"
                onChange={setActiveTab}
            >
                <TabPanels>
                    <TabPanel value="appointments">
                        <AppointmentsTab appointments={appointments} loading={loadingAppts} />
                    </TabPanel>
                    <TabPanel value="notes">
                        {!loadingAppts && <NotesTab appointments={appointments} />}
                    </TabPanel>
                    <TabPanel value="scans">
                        <ScansTab scans={scans} loading={loadingScans} />
                    </TabPanel>
                </TabPanels>
            </TabGroup>
        </div>
    );
};

export default MedicalRecords;
