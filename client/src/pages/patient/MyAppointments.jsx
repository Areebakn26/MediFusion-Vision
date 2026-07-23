import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaClock, FaUserMd, FaVideo, FaTimesCircle, FaRedo, FaBell } from 'react-icons/fa';
import { getAppointments, cancelAppointment, rescheduleAppointment } from '../../services/api';
import { Modal } from '../../components/ui';
import Loading from '../../components/Loading';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const MyAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('upcoming');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [actionModal, setActionModal] = useState({ isOpen: false, type: '', appointment: null });

    // Reschedule States
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [newDate, setNewDate] = useState('');
    const [newTimeSlot, setNewTimeSlot] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [checkingSlot, setCheckingSlot] = useState(false);
    const [slotError, setSlotError] = useState('');

    const navigate = useNavigate();

    // Fetch available time slots based on selected date and doctor (for reschedule)
    useEffect(() => {
        const fetchSlots = async () => {
            if (!newDate || !selectedAppointment) {
                setAvailableSlots([]);
                setNewTimeSlot('');
                return;
            }

            const doctorId = selectedAppointment.Doctor?.id || selectedAppointment.doctor_id || selectedAppointment.doctor?.user_id || selectedAppointment.doctor?.id;
            if (!doctorId) {
                setAvailableSlots([]);
                return;
            }

            try {
                const { getAvailableSlots } = await import('../../services/api');
                const response = await getAvailableSlots(doctorId, newDate);
                const fetchedSlots = response.data.availableSlots || [];
                setAvailableSlots(fetchedSlots);

                if (newTimeSlot && !fetchedSlots.includes(newTimeSlot)) {
                    setNewTimeSlot('');
                }
            } catch (err) {
                console.error("Error fetching available slots:", err);
                setAvailableSlots([]);
                setNewTimeSlot('');
            }
        };

        fetchSlots();
    }, [newDate, selectedAppointment]);

    // Update current time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const { data } = await getAppointments();
                setAppointments(data);
            } catch (error) {
                console.error("Failed to fetch appointments:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, []);

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

    // Allow joining any confirmed virtual appointment on today's date
    const isJoinable = (apt) => {
        if (apt.status !== 'confirmed' && apt.status !== 'pending') return false;
        if (apt.type !== 'virtual') return false;

        const aptDateStr = new Date(apt.date).toLocaleDateString('en-CA');
        const todayStr = currentTime.toLocaleDateString('en-CA');
        if (aptDateStr === todayStr) return true;

        const appointmentTime = parseTimeSlot(apt.date, apt.timeSlot || apt.time_slot);
        if (!appointmentTime) return false;
        const fifteenMinsBefore = new Date(appointmentTime.getTime() - 15 * 60 * 1000);
        return currentTime >= fifteenMinsBefore;
    };

    // Check if appointment is upcoming (can still cancel/reschedule)
    const isUpcoming = (apt) => {
        const appointmentTime = parseTimeSlot(apt.date, apt.timeSlot || apt.time_slot);
        if (!appointmentTime) {
            // Fallback to just date comparison
            return new Date(apt.date) >= new Date().setHours(0, 0, 0, 0);
        }
        return appointmentTime > currentTime;
    };

    // Get time until appointment
    const getTimeUntil = (apt) => {
        const appointmentTime = parseTimeSlot(apt.date, apt.timeSlot || apt.time_slot);
        if (!appointmentTime) return null;

        const diff = appointmentTime - currentTime;
        if (diff < 0) return 'Started';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days} day${days > 1 ? 's' : ''} away`;
        }
        if (hours > 0) return `${hours}h ${mins}m away`;
        if (mins > 0) return `${mins} min away`;
        return 'Starting now!';
    };

    // Calculate refund tier based on hours until appointment
    const getRefundInfo = (apt) => {
        const appointmentTime = parseTimeSlot(apt.date, apt.timeSlot || apt.time_slot);
        if (!appointmentTime) return { percentage: 0, label: 'No refund (unknown time)', color: 'red' };
        const hoursUntil = (appointmentTime - new Date()) / (1000 * 60 * 60);
        if (hoursUntil > 24) return { percentage: 100, hours: hoursUntil, label: '100% Full Refund', color: 'green' };
        if (hoursUntil > 12) return { percentage: 50, hours: hoursUntil, label: '50% Partial Refund', color: 'yellow' };
        return { percentage: 0, hours: hoursUntil, label: 'No Refund (less than 12h)', color: 'red' };
    };

    const handleCancel = async (id) => {
        try {
            const { data } = await cancelAppointment(id, 'Patient requested cancellation');
            setAppointments(prev => prev.map(apt =>
                (apt._id === id || apt.id === id) ? { ...apt, status: 'cancelled' } : apt
            ));
            const refundMsg = data?.refundPercentage > 0
                ? `Refund: ${data.refundPercentage}% (PKR ${data.refundAmount}) will be sent within 5-7 business days.`
                : 'No refund will be issued per our cancellation policy.';
            toast.success(`Appointment cancelled!\n${refundMsg}`, { duration: 8000 });
            setActionModal({ isOpen: false, type: '', appointment: null });
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel appointment.');
        }
    };

    const confirmAction = (e, type, apt) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        console.log('MyAppointments - confirmAction triggered:', { type, apt });
        const appointmentTime = parseTimeSlot(apt.date, apt.timeSlot || apt.time_slot);
        const hoursUntil = appointmentTime ? (appointmentTime - new Date()) / (1000 * 60 * 60) : Infinity;

        if (type === 'reschedule' && hoursUntil <= 24 && hoursUntil > 0) {
            // <24h reschedule = must cancel + rebook
            setActionModal({ isOpen: true, type: 'reschedule-late', appointment: apt });
        } else {
            setActionModal({ isOpen: true, type, appointment: apt });
        }
    };

    const handleReschedule = (apt) => {
        setActionModal({ isOpen: false, type: '', appointment: null });
        setSelectedAppointment(apt);
        setShowRescheduleModal(true);
    };

    const submitReschedule = async () => {
        setSlotError('');
        setCheckingSlot(true);

        if (!newDate || !newTimeSlot) {
            setSlotError('Please select both date and time.');
            setCheckingSlot(false);
            return;
        }

        const appointmentId = selectedAppointment.id || selectedAppointment._id;

        try {
            await rescheduleAppointment(appointmentId, {
                newDate,
                newTimeSlot
            });

            toast.success('Appointment rescheduled successfully!');
            setShowRescheduleModal(false);
            setSelectedAppointment(null);
            setNewDate('');
            setNewTimeSlot('');
            setSlotError('');

            // Refetch or update local state
            const { data } = await getAppointments();
            setAppointments(data);
        } catch (error) {
            console.error('Reschedule error:', error);
            setSlotError(error.response?.data?.message || 'Error rescheduling appointment.');
        } finally {
            setCheckingSlot(false);
        }
    };

    const handleJoinCall = (apt) => {
        const appointmentId = apt._id || apt.id;
        navigate(`/patient/consultation/${appointmentId}`);
    };

    const filteredAppointments = appointments.filter(apt => {
        const upcoming = isUpcoming(apt);
        if (filter === 'upcoming') return upcoming && apt.status !== 'cancelled' && apt.status !== 'completed';
        if (filter === 'past') return !upcoming || apt.status === 'cancelled' || apt.status === 'completed';
        return true;
    });

    // Sort appointments by date/time
    const sortedAppointments = [...filteredAppointments].sort((a, b) => {
        const timeA = parseTimeSlot(a.date, a.timeSlot || a.time_slot) || new Date(a.date);
        const timeB = parseTimeSlot(b.date, b.timeSlot || b.time_slot) || new Date(b.date);
        return filter === 'upcoming' ? timeA - timeB : timeB - timeA;
    });

    if (loading) return <Loading text="Loading appointments..." fullScreen={false} />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">My Appointments</h1>
                    <p className="text-foreground-muted text-sm">Manage your scheduled visits</p>
                </div>
                <div className="flex bg-surface-secondary p-1 rounded-xl shadow-card border border-white/5">
                    <button
                        onClick={() => setFilter('upcoming')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'upcoming' ? 'bg-accent-subtle text-accent' : 'text-foreground-muted/80 hover:text-foreground-muted'}`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setFilter('past')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'past' ? 'bg-accent-subtle text-accent' : 'text-foreground-muted/80 hover:text-foreground-muted'}`}
                    >
                        Past
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sortedAppointments.length > 0 ? (
                    sortedAppointments.map((apt) => {
                        const joinable = isJoinable(apt);
                        const timeUntil = getTimeUntil(apt);
                        const appointmentId = apt._id || apt.id;

                        return (
                            <motion.div
                                key={appointmentId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`bg-surface-secondary p-6 rounded-xl shadow-card border-l-4 hover:shadow-card transition-all ${joinable ? 'border-green-500 ring-2 ring-success/10' : 'border-accent'
                                    }`}
                            >
                                {/* Joinable Alert */}
                                {joinable && (
                                    <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-xl flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                                            <FaBell className="text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-success">Ready to Join!</p>
                                            <p className="text-sm text-success">Your doctor is waiting for you</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-accent-subtle rounded-full flex items-center justify-center text-accent font-bold text-xl">
                                            <FaUserMd />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-foreground text-lg">
                                                {apt.doctor ? `Dr. ${apt.doctor.name}` : 'Dr. Unknown'}
                                            </h3>
                                            <p className="text-accent text-sm font-medium">
                                                {apt.type === 'virtual' ? '📹 Virtual Consultation' : '🏥 In-Person Visit'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${apt.status === 'confirmed' ? 'bg-success/10 text-success' :
                                            apt.status === 'cancelled' ? 'bg-error/10 text-error' :
                                                apt.status === 'completed' ? 'bg-accent-subtle text-accent' :
                                                    'bg-warning/10 text-warning'
                                            }`}>
                                            {apt.status?.charAt(0).toUpperCase() + apt.status?.slice(1) || 'Pending'}
                                        </span>
                                        {timeUntil && apt.status !== 'cancelled' && apt.status !== 'completed' && (
                                            <p className={`text-xs mt-1 font-medium ${timeUntil === 'Starting now!' ? 'text-success' : 'text-foreground-muted'
                                                }`}>
                                                {timeUntil}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="flex items-center text-foreground-muted">
                                        <FaCalendarAlt className="mr-2 text-accent" />
                                        <span className="text-sm">
                                            {new Date(apt.date).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-foreground-muted">
                                        <FaClock className="mr-2 text-accent" />
                                        <span className="text-sm">{apt.timeSlot || apt.time_slot || apt.time}</span>
                                    </div>
                                </div>

                                {apt.reason && (
                                    <div className="mb-4 p-3 bg-surface-secondary/60 rounded-lg">
                                        <p className="text-xs text-foreground-muted">Reason for visit:</p>
                                        <p className="text-sm text-foreground-muted">{apt.reason}</p>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-3 pt-4 border-t border-white/5">
                                    {/* Join Button - Only for virtual appointments at the right time */}
                                    {joinable && apt.type === 'virtual' && (
                                        <button
                                            onClick={() => handleJoinCall(apt)}
                                            className="flex-1 bg-medical text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 animate-pulse"
                                        >
                                            <FaVideo /> Join Call Now
                                        </button>
                                    )}

                                    {/* Upcoming appointment actions */}
                                    {apt.status !== 'cancelled' && apt.status !== 'completed' && isUpcoming(apt) && !joinable && (
                                        <>
                                            {apt.type === 'virtual' && (
                                                <div className="flex-1 bg-surface-secondary/80 text-foreground-muted py-3 rounded-xl font-medium text-center text-sm">
                                                    Join available {timeUntil === 'Started' ? 'now' : 'at appointment time'}
                                                </div>
                                            )}
                                            <button
                                                onClick={(e) => confirmAction(e, 'cancel', apt)}
                                                className="px-4 bg-error/10 text-error py-3 rounded-xl font-bold hover:bg-error/20 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <FaTimesCircle /> Cancel
                                            </button>
                                            <button
                                                onClick={(e) => confirmAction(e, 'reschedule', apt)}
                                                className="px-4 bg-warning/10 text-warning py-3 rounded-xl font-bold hover:bg-warning/20 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <FaRedo /> Reschedule
                                            </button>
                                        </>
                                    )}

                                    {/* Cancelled appointment - show reschedule */}
                                    {apt.status === 'cancelled' && (
                                        <button
                                            onClick={() => handleReschedule(apt)}
                                            className="flex-1 bg-accent text-white py-3 rounded-xl font-bold hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
                                        >
                                            <FaRedo /> Book Again
                                        </button>
                                    )}

                                    {/* Completed appointment */}
                                    {apt.status === 'completed' && (
                                        <div className="flex-1 bg-accent-subtle text-accent py-3 rounded-xl font-medium text-center">
                                            ✓ Consultation Completed
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="col-span-full text-center py-12 bg-surface-secondary rounded-xl shadow-card">
                        <div className="w-16 h-16 bg-surface-secondary/80 text-foreground-subtle rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaCalendarAlt className="text-2xl" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">No {filter === 'upcoming' ? 'Upcoming' : 'Past'} Appointments</h3>
                        <p className="text-foreground-muted mb-4">
                            {filter === 'upcoming'
                                ? "You don't have any scheduled appointments."
                                : "Your past appointments will appear here."}
                        </p>
                        {filter === 'upcoming' && (
                            <button
                                onClick={() => navigate('/patient/find-doctors')}
                                className="px-6 py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent-hover transition-colors"
                            >
                                Book an Appointment
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Reschedule Modal */}
            <Modal
                isOpen={showRescheduleModal}
                onClose={() => {
                    setShowRescheduleModal(false);
                    setSelectedAppointment(null);
                    setNewDate('');
                    setNewTimeSlot('');
                    setSlotError('');
                }}
                title="Choose New Time Slot"
            >
                <div className="space-y-4">
                    {selectedAppointment && (
                        <div className="p-4 bg-accent-subtle border border-accent/20 rounded-xl mb-4">
                            <p className="text-sm text-foreground-muted mb-1">Current Appointment:</p>
                            <p className="font-semibold text-foreground">
                                {new Date(selectedAppointment.date).toLocaleDateString()} at {selectedAppointment.time_slot || selectedAppointment.timeSlot}
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-2 text-foreground-muted">New Date</label>
                        <input
                            type="date"
                            value={newDate}
                            onChange={(e) => {
                                setNewDate(e.target.value);
                                setNewTimeSlot('');
                                setSlotError('');
                            }}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-white/[0.06] focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-foreground-muted">New Time Slot</label>
                        <select
                            value={newTimeSlot}
                            onChange={(e) => {
                                setNewTimeSlot(e.target.value);
                                setSlotError('');
                            }}
                            disabled={!newDate || availableSlots.length === 0}
                            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${!newDate || availableSlots.length === 0
                                ? 'bg-surface-tertiary border border-white/[0.06] text-foreground-subtle cursor-not-allowed'
                                : 'bg-surface-secondary border border-white/[0.06] focus:border-accent focus:ring-2 focus:ring-accent/20'
                                }`}
                        >
                            <option value="">
                                {!newDate
                                    ? 'Select date first'
                                    : availableSlots.length === 0
                                        ? 'No slots available for this date'
                                        : 'Select Time'}
                            </option>
                            {availableSlots.map(slot => (
                                <option key={slot} value={slot}>{slot}</option>
                            ))}
                        </select>
                        {slotError && (
                            <p className="text-sm text-error mt-2">❌ {slotError}</p>
                        )}
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={submitReschedule}
                            disabled={checkingSlot || !newDate || !newTimeSlot}
                            className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all ${checkingSlot || !newDate || !newTimeSlot
                                ? 'bg-surface-tertiary text-foreground-subtle cursor-not-allowed'
                                : 'bg-accent text-white hover:bg-accent-hover shadow-card'
                                }`}
                        >
                            {checkingSlot ? 'Checking...' : 'Confirm Reschedule'}
                        </button>
                        <button
                            onClick={() => {
                                setShowRescheduleModal(false);
                                setSelectedAppointment(null);
                                setNewDate('');
                                setNewTimeSlot('');
                                setSlotError('');
                            }}
                            className="flex-1 px-6 py-3 bg-surface-secondary text-foreground-muted rounded-xl font-bold hover:bg-surface-tertiary transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Action Confirmation Modal - Cancel */}
            <Modal isOpen={actionModal.isOpen && actionModal.type === 'cancel' && !!actionModal.appointment} onClose={() => setActionModal({ isOpen: false, type: '', appointment: null })}>
                {actionModal.appointment && (() => {
                    const apt = actionModal.appointment;
                    const refundInfo = getRefundInfo(apt) || { percentage: 0, label: 'No refund (unknown time)', color: 'red' };

                    return (
                        <div className="p-2">
                            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                <span>❌</span> Cancel Appointment?
                            </h3>
                            <p className="text-foreground-muted mb-6">Are you sure you want to cancel this appointment?</p>

                            <div className={`rounded-xl p-4 mb-6 border-2 ${refundInfo.color === 'green' ? 'bg-success/10 border-success/20' :
                                refundInfo.color === 'yellow' ? 'bg-warning/10 border-warning/20' :
                                    'bg-error/10 border-error/20'
                                }`}>
                                <p className="font-bold text-foreground mb-1">Refund Policy:</p>
                                <p className={`text-lg font-extrabold ${refundInfo.color === 'green' ? 'text-success' :
                                    refundInfo.color === 'yellow' ? 'text-warning' :
                                        'text-error'
                                    }`}>
                                    {refundInfo.label}
                                </p>
                                {refundInfo.percentage > 0
                                ? <p className="text-sm text-foreground-muted mt-1">Refund will be returned to your original payment method within 5–7 business days.</p>
                                : <p className="text-sm text-foreground-muted mt-1">No refund will be issued due to the short notice period.</p>
                                }
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setActionModal({ isOpen: false, type: '', appointment: null })}
                                    className="flex-1 py-3 rounded-xl font-bold bg-surface-secondary/80 text-foreground-muted hover:bg-surface-tertiary"
                                >
                                    No, Keep It
                                </button>
                                <button
                                    onClick={() => handleCancel(apt._id || apt.id)}
                                    className="flex-1 py-3 rounded-xl font-bold text-white bg-error hover:bg-red-700 shadow-card"
                                >
                                    Yes, Cancel
                                </button>
                            </div>
                        </div>
                    );
                })()}
            </Modal>

            {/* Action Confirmation Modal - Reschedule (>24h = free) */}
            <Modal isOpen={actionModal.isOpen && actionModal.type === 'reschedule' && !!actionModal.appointment} onClose={() => setActionModal({ isOpen: false, type: '', appointment: null })}>
                {actionModal.appointment && (
                    <div className="p-2">
                        <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <span>🔄</span> Free Reschedule
                        </h3>
                        <div className="bg-success/10 border border-success/20 rounded-xl p-4 mb-6 text-sm text-success">
                            <p className="font-bold mb-1">✅ You qualify for a free reschedule!</p>
                            <p>Your appointment is more than 24 hours away. You can change your time slot at no extra cost.</p>
                        </div>
                        <div className="flex gap-3">
                                <button
                                    onClick={() => setActionModal({ isOpen: false, type: '', appointment: null })}
                                    className="flex-1 py-3 rounded-xl font-bold bg-surface-secondary/80 text-foreground-muted hover:bg-surface-tertiary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleReschedule(actionModal.appointment)}
                                    className="flex-1 py-3 rounded-xl font-bold text-white bg-yellow-600 hover:bg-yellow-700"
                            >
                                Choose New Time
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Action Confirmation Modal - Reschedule Late (<24h = cancel + rebook) */}
            <Modal isOpen={actionModal.isOpen && actionModal.type === 'reschedule-late' && !!actionModal.appointment} onClose={() => setActionModal({ isOpen: false, type: '', appointment: null })}>
                {actionModal.appointment && (() => {
                    const apt = actionModal.appointment;
                    const refundInfo = getRefundInfo(apt) || { percentage: 0, label: 'No refund (unknown time)', color: 'red' };

                    return (
                        <div className="p-2">
                            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                <span>⚠️</span> Late Reschedule Warning
                            </h3>
                            <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-4 text-sm text-warning">
                                <p className="font-bold mb-2">Your appointment is within 24 hours.</p>
                                <p>Rescheduling this close to the appointment is treated as a <strong>cancellation + new booking</strong>.</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>This appointment will be <strong>cancelled</strong></li>
                                    <li>Refund: <strong>{refundInfo.label}</strong></li>
                                    <li>You will then need to <strong>book a new appointment</strong></li>
                                </ul>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setActionModal({ isOpen: false, type: '', appointment: null })}
                                    className="flex-1 py-3 rounded-xl font-bold bg-surface-secondary/80 text-foreground-muted hover:bg-surface-tertiary"
                                >
                                    Go Back
                                </button>
                                <button
                                    onClick={() => {
                                        handleCancel(apt._id || apt.id);
                                        setTimeout(() => navigate('/patient/book-appointment'), 2000);
                                    }}
                                    className="flex-1 py-3 rounded-xl font-bold text-white bg-error hover:bg-red-700 shadow-card"
                                >
                                    Cancel & Rebook
                                </button>
                            </div>
                        </div>
                    );
                })()}
            </Modal>
        </div>
    );
};

export default MyAppointments;
