import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAppointments, updateAppointmentStatus, getMe, updateProfile } from '../../services/api';
import { GlassCard, Button, Badge } from '../../components/ui';
import { FaVideo, FaBell, FaUserInjured, FaCalendarCheck, FaHistory } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const Schedule = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('appointments');
    const [filterStatus, setFilterStatus] = useState('upcoming');
    const [currentTime, setCurrentTime] = useState(new Date());
    const navigate = useNavigate();

    const [availability, setAvailability] = useState({
        Monday: { start: '09:00 AM', end: '05:00 PM', active: true },
        Tuesday: { start: '09:00 AM', end: '05:00 PM', active: true },
        Wednesday: { start: '09:00 AM', end: '05:00 PM', active: true },
        Thursday: { start: '09:00 AM', end: '05:00 PM', active: true },
        Friday: { start: '09:00 AM', end: '05:00 PM', active: true },
        Saturday: { start: '10:00 AM', end: '02:00 PM', active: false },
        Sunday: { start: '', end: '', active: false },
    });

    // Update current time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetchAppointments();
        loadAvailability();
    }, []);

    const loadAvailability = async () => {
        try {
            const { data } = await getMe();
            const wh = data?.profile?.working_hours;
            if (wh) {
                setAvailability(prev => {
                    const merged = { ...prev };
                    Object.keys(merged).forEach(day => {
                        if (wh[day]) {
                            const dayData = wh[day].physical || wh[day];
                            merged[day] = {
                                start: dayData.start || '',
                                end: dayData.end || '',
                                active: !!dayData.start
                            };
                        }
                    });
                    return merged;
                });
            }
        } catch (error) {
            console.error('Error loading availability', error);
        }
    };

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const { data } = await getAppointments();
            setAppointments(data);
        } catch (error) {
            console.error("Error fetching appointments", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to parse time string to Date object
    const parseTimeSlot = (dateStr, timeSlot) => {
        if (!timeSlot) return null;
        const [time, modifier] = timeSlot.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (hours === 12 && modifier === 'AM') hours = 0;
        if (hours !== 12 && modifier === 'PM') hours += 12;

        const date = new Date(dateStr);
        date.setHours(hours, minutes, 0, 0);
        return date;
    };

    // Check if appointment is joinable/startable
    // Rules: status must be 'confirmed', within 15 min before → 60 min after appointment time
    const isJoinable = (app) => {
        if (app.status !== 'confirmed') return false; // only confirmed appointments are startable

        const appointmentTime = parseTimeSlot(app.date, app.timeSlot || app.time_slot);
        if (!appointmentTime) return false;

        const now = currentTime;
        const fifteenMinsBefore = new Date(appointmentTime.getTime() - 15 * 60 * 1000);
        const sixtyMinsAfter = new Date(appointmentTime.getTime() + 60 * 60 * 1000);

        return now >= fifteenMinsBefore && now <= sixtyMinsAfter;
    };

    // Check if appointment is upcoming
    const isUpcoming = (app) => {
        const appointmentTime = parseTimeSlot(app.date, app.timeSlot || app.time_slot);
        if (!appointmentTime) {
            return new Date(app.date) >= new Date().setHours(0, 0, 0, 0);
        }
        return appointmentTime > currentTime;
    };

    // Get time until appointment
    const getTimeUntil = (app) => {
        const appointmentTime = parseTimeSlot(app.date, app.timeSlot || app.time_slot);
        if (!appointmentTime) return null;

        const diff = appointmentTime - currentTime;
        if (diff < 0) return 'In Progress';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `in ${days} day${days > 1 ? 's' : ''}`;
        }
        if (hours > 0) return `in ${hours}h ${mins}m`;
        if (mins > 0) return `in ${mins} min`;
        return 'Starting now!';
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await updateAppointmentStatus(id, { status });
            setAppointments(appointments.map(app =>
                (app._id === id || app.id === id) ? { ...app, status } : app
            ));
            toast.success(`Appointment ${status}`);
        } catch (error) {
            console.error("Error updating status", error);
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleJoinCall = (app) => {
        const appointmentId = app._id || app.id;
        if (app.status === 'completed') {
            const patientId = app.patient?.id;
            navigate(patientId ? `/doctor/patients/${patientId}` : '/doctor/appointments');
            return;
        }
        if (app.type === 'physical') {
            navigate(`/doctor/physical-consultation/${appointmentId}`);
        } else {
            navigate(`/doctor/consultation/${appointmentId}`);
        }
    };

    const handleAvailabilityChange = (day, field, value) => {
        setAvailability(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value }
        }));
    };

    const saveAvailability = async () => {
        try {
            const workingHours = {};
            Object.entries(availability).forEach(([day, schedule]) => {
                if (schedule.active) {
                    workingHours[day] = { start: schedule.start, end: schedule.end };
                }
            });
            await updateProfile({ workingHours });
            toast.success('Availability saved successfully!');
        } catch (error) {
            console.error("Error saving availability", error);
            toast.error('Failed to save availability');
        }
    };

    const filteredAppointments = appointments.filter(app => {
        const upcoming = isUpcoming(app);
        if (filterStatus === 'upcoming') return (app.status === 'confirmed' || app.status === 'pending' || app.status === 'in_progress') && upcoming;
        if (filterStatus === 'pending') return app.status === 'pending';
        if (filterStatus === 'history') return ['completed', 'cancelled'].includes(app.status) || !upcoming;
        return true;
    });

    // Sort by date/time
    const sortedAppointments = [...filteredAppointments].sort((a, b) => {
        const timeA = parseTimeSlot(a.date, a.timeSlot || a.time_slot) || new Date(a.date);
        const timeB = parseTimeSlot(b.date, b.timeSlot || b.time_slot) || new Date(b.date);
        return filterStatus === 'history' ? timeB - timeA : timeA - timeB;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-accent">
                    Schedule Management
                </h1>
                <div className="flex bg-surface-secondary/50 backdrop-blur-sm p-1 rounded-xl border border-white/20">
                    {['appointments', 'availability'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab
                                ? 'bg-surface-secondary text-accent shadow-card'
                                : 'text-foreground-muted hover:text-foreground-muted'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'appointments' && (
                    <motion.div
                        key="appointments"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* Filters */}
                        <div className="flex space-x-2">
                            {[
                                { key: 'upcoming', label: 'Upcoming', icon: <FaCalendarCheck /> },
                                { key: 'pending', label: 'Pending', icon: <FaUserInjured /> },
                                { key: 'history', label: 'History', icon: <FaHistory /> }
                            ].map((filter) => (
                                <button
                                    key={filter.key}
                                    onClick={() => setFilterStatus(filter.key)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all border flex items-center gap-2 ${filterStatus === filter.key
                                        ? 'bg-accent text-white border-accent'
                                        : 'bg-surface-secondary text-foreground-muted border-white/[0.06] hover:bg-surface-tertiary'
                                        }`}
                                >
                                    {filter.icon} {filter.label}
                                </button>
                            ))}
                        </div>

                        {/* List */}
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent mx-auto mb-4"></div>
                                <p className="text-foreground-muted">Loading schedule...</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {sortedAppointments.length === 0 ? (
                                    <GlassCard className="p-12 text-center">
                                        <div className="text-4xl mb-4">📅</div>
                                        <p className="text-foreground-muted">No {filterStatus} appointments found.</p>
                                    </GlassCard>
                                ) : (
                                    sortedAppointments.map((app, index) => {
                                        const joinable = isJoinable(app);
                                        const timeUntil = getTimeUntil(app);
                                        const appointmentId = app._id || app.id;

                                        return (
                                            <motion.div
                                                key={appointmentId}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <GlassCard className={`p-6 transition-all ${joinable ? 'border-2 border-success/40 ring-2 ring-success/10' : 'hover:border-accent/20'
                                                    }`}>
                                                    {/* Joinable Alert */}
                                                    {joinable && (
                                                        <div className={`mb-4 p-3 border rounded-xl flex items-center justify-between ${app.type === 'physical' ? 'bg-accent-subtle border-accent/20' : 'bg-success/10 border-success/20'}`}>
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center animate-pulse ${app.type === 'physical' ? 'bg-accent' : 'bg-success'}`}>
                                                                    <FaBell className="text-white" />
                                                                </div>
                                                                <div>
                                                                    <p className={`font-bold ${app.type === 'physical' ? 'text-accent' : 'text-success'}`}>
                                                                        {app.type === 'physical' ? 'Physical Visit Starting Soon!' : 'Patient is Waiting!'}
                                                                    </p>
                                                                    <p className={`text-sm ${app.type === 'physical' ? 'text-accent' : 'text-success'}`}>
                                                                        {app.type === 'physical' ? 'In-person consultation ready to start' : 'Virtual consultation ready to start'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleJoinCall(app)}
                                                                className={`px-6 py-3 text-white rounded-xl font-bold transition-colors flex items-center gap-2 ${app.type === 'physical' ? 'bg-accent hover:bg-accent-hover' : 'bg-success hover:bg-emerald-700'}`}
                                                            >
                                                                {app.type === 'physical' ? (
                                                                    <>Start Session</>
                                                                ) : (
                                                                    <><FaVideo /> Join Now</>
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}

                                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                        <div className="flex items-start space-x-4">
                                                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold shadow-card ${app.type === 'physical' ? 'bg-accent-subtle text-accent' : 'bg-accent-subtle text-accent'
                                                                }`}>
                                                                {app.patient?.name?.charAt(0) || 'P'}
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-lg text-foreground">
                                                                    {app.patient?.name || 'Patient'}
                                                                </h3>
<div className="text-sm text-foreground-muted flex items-center flex-wrap gap-2 mt-1">
                                    {app.patient?.gender && app.patient?.date_of_birth && (
                                        <span className="bg-surface-tertiary px-2 py-0.5 rounded text-foreground-muted">
                                                                            {app.patient.gender},{' '}
                                                                            {Math.floor((Date.now() - new Date(app.patient.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))} yrs
                                                                        </span>
                                                                    )}
                                                                    <span className="flex items-center gap-1">
                                                                        {app.type === 'physical' ? '🏥' : '📹'}
                                                                        <span className="capitalize">{app.type} Visit</span>
                                                                    </span>
                                                                </div>
<div className="mt-2 text-sm font-medium text-foreground flex items-center gap-2">
                                    <span className="text-accent">🕒 {app.timeSlot || app.time_slot}</span>
                                    <span className="text-foreground-subtle">|</span>
                                                                    <span>📅 {new Date(app.date).toLocaleDateString('en-US', {
                                                                        weekday: 'short', month: 'short', day: 'numeric'
                                                                    })}</span>
                                                                    {timeUntil && app.status === 'confirmed' && (
                                                                        <>
<span className="text-foreground-subtle">|</span>
                                            <span className={`${timeUntil === 'Starting now!' || timeUntil === 'In Progress' ? 'text-success font-bold' : 'text-foreground-muted'}`}>
                                                                                {timeUntil}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
{app.reason && (
                                    <div className="mt-2 text-sm text-foreground-muted bg-surface-secondary/60 px-3 py-1 rounded-xl inline-block border border-white/5">
                                                                        Reason: {app.reason}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                                                            {app.status === 'pending' && (
                                                                <>
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={() => handleStatusUpdate(appointmentId, 'cancelled')}
                                                                        className="text-error border-error/20 hover:bg-error/10"
                                                                    >
                                                                        Reject
                                                                    </Button>
                                                                    <Button onClick={() => handleStatusUpdate(appointmentId, 'confirmed')}>
                                                                        Accept
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {['confirmed', 'in_progress'].includes(app.status) && !joinable && (
                                                                <>
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={() => handleStatusUpdate(appointmentId, 'cancelled')}
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                    <Button
                                                                        variant="success"
                                                                        onClick={() => handleStatusUpdate(appointmentId, 'completed')}
                                                                    >
                                                                        Mark Complete
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {['completed', 'cancelled'].includes(app.status) && (
                                                                <div className="flex items-center gap-3">
                                                                    <Badge variant={app.status === 'completed' ? 'success' : 'danger'} size="lg">
                                                                        {app.status.toUpperCase()}
                                                                    </Badge>
                                                                    {app.status === 'completed' && (
                                                                        <Button 
                                                                            variant="outline" 
                                                                            size="sm"
                                                                            onClick={() => handleJoinCall(app)}
                                                                        >
                                                                            View Notes
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {/* Add button for "In Progress" appointments in History tab */}
                                                            {filterStatus === 'history' && !['completed', 'cancelled'].includes(app.status) && (
                                                                <Button 
                                                                    size="sm"
                                                                    className="bg-accent"
                                                                    onClick={() => handleJoinCall(app)}
                                                                >
                                                                    Go to Consultation
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </GlassCard>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'availability' && (
                    <motion.div
                        key="availability"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <GlassCard className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-foreground">Weekly Availability</h2>
                                <Button onClick={saveAvailability}>Save Changes</Button>
                            </div>
                            <p className="text-foreground-muted text-sm mb-6">
                                Set your working hours. Patients will only be able to book appointments during these times.
                            </p>
                            <div className="space-y-4">
                                {Object.entries(availability).map(([day, schedule]) => (
                                    <div key={day} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${schedule.active ? 'bg-surface-secondary border-white/[0.06] hover:border-accent/20' : 'bg-surface-secondary/60 border-white/5'
                                        }`}>
                                        <div className="flex items-center space-x-4">
                                            <div className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={schedule.active}
                                                    onChange={(e) => handleAvailabilityChange(day, 'active', e.target.checked)}
                                                />
                                                <div className="w-11 h-6 bg-surface-tertiary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/5 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                                            </div>
                                            <span className={`font-medium w-24 ${schedule.active ? 'text-foreground' : 'text-foreground-subtle'}`}>{day}</span>
                                        </div>

                                        <div className={`flex items-center space-x-4 transition-opacity ${schedule.active ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                            <select
                                                value={schedule.start}
                                                onChange={(e) => handleAvailabilityChange(day, 'start', e.target.value)}
                                                className="px-3 py-2 border border-white/[0.14] rounded-xl focus:ring-2 focus:ring-accent outline-none bg-surface-secondary text-foreground"
                                            >
                                                {['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM'].map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                            <span className="text-foreground-subtle">to</span>
                                            <select
                                                value={schedule.end}
                                                onChange={(e) => handleAvailabilityChange(day, 'end', e.target.value)}
                                                className="px-3 py-2 border border-white/[0.14] rounded-xl focus:ring-2 focus:ring-accent outline-none bg-surface-secondary text-foreground"
                                            >
                                                {['12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'].map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Schedule;
