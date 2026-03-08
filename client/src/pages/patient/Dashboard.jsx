import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GlassCard, Button, Badge, Modal } from '../../components/ui';
import api, { rescheduleAppointment, cancelAppointment } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
    FaCalendarAlt,
    FaFileUpload,
    FaNotesMedical,
    FaClock,
    FaVideo,
    FaUserMd
} from 'react-icons/fa';

const PatientDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [newDate, setNewDate] = useState('');
    const [newTimeSlot, setNewTimeSlot] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [availableSlots, setAvailableSlots] = useState([]);
    const [checkingSlot, setCheckingSlot] = useState(false);
    const [slotError, setSlotError] = useState('');

    // Update current time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    // Helper to parse time string to minutes (for filtering)
    const parseTimeToMinutes = (timeStr) => {
        if (!timeStr) return 0;
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (hours === 12 && modifier === 'AM') hours = 0;
        if (hours !== 12 && modifier === 'PM') hours += 12;
        return hours * 60 + minutes;
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

    // Check if appointment is upcoming
    const isUpcoming = (apt) => {
        const appointmentTime = parseTimeSlot(apt.date, apt.timeSlot || apt.time_slot);
        if (!appointmentTime) return new Date(apt.date) >= new Date().setHours(0, 0, 0, 0);
        return appointmentTime > currentTime;
    };

    // Fetch available time slots based on selected date and doctor (for reschedule)
    useEffect(() => {
        const fetchSlots = async () => {
            if (!newDate || !selectedAppointment) {
                setAvailableSlots([]);
                setNewTimeSlot(''); // Clear time slot when date changes
                return;
            }

            const doctorId = selectedAppointment.Doctor?.id || selectedAppointment.doctor_id;
            if (!doctorId) {
                setAvailableSlots([]);
                return;
            }

            try {
                const { getAvailableSlots } = await import('../../services/api');
                const response = await getAvailableSlots(doctorId, newDate);
                const fetchedSlots = response.data.availableSlots || [];
                setAvailableSlots(fetchedSlots);

                // Clear selected time if it's no longer valid
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

    // Check if appointment is joinable (within 15 mins before and up to 30 mins after)
    const isJoinable = (apt) => {
        if (apt.status !== 'confirmed' && apt.status !== 'pending') return false;
        if (apt.type !== 'virtual') return false;

        const appointmentTime = parseTimeSlot(apt.date, apt.time_slot || apt.timeSlot);
        if (!appointmentTime) return false;

        const now = currentTime;
        const fifteenMinsBefore = new Date(appointmentTime.getTime() - 15 * 60 * 1000);
        const thirtyMinsAfter = new Date(appointmentTime.getTime() + 30 * 60 * 1000);

        return now >= fifteenMinsBefore && now <= thirtyMinsAfter;
    };

    const handleJoinCall = (apt) => {
        const appointmentId = apt.id || apt._id;
        if (appointmentId) {
            navigate(`/patient/consultation/${appointmentId}`);
        } else {
            toast.error('Invalid appointment. Please try again.');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [appointmentsRes, scansRes] = await Promise.all([
                api.get('/appointments'),
                api.get('/scans'),
            ]);
            setAppointments(appointmentsRes.data || []);
            setScans(scansRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Reschedule appointment
    const handleReschedule = async () => {
        setSlotError('');
        setCheckingSlot(true);

        // 1. Validate form fields
        if (!newDate || !newTimeSlot) {
            setSlotError('Please select both date and time.');
            setCheckingSlot(false);
            return;
        }

        if (!selectedAppointment) {
            setSlotError('No appointment selected.');
            setCheckingSlot(false);
            return;
        }

        const appointmentId = selectedAppointment.id || selectedAppointment._id;
        if (!appointmentId) {
            setSlotError('Invalid appointment ID.');
            setCheckingSlot(false);
            return;
        }

        // 2. Validate Date
        const selectedDate = new Date(newDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
            setSlotError('Please select a future date.');
            setCheckingSlot(false);
            return;
        }

        // 3. Validate Time (if today)
        if (selectedDate.toDateString() === new Date().toDateString()) {
            const now = new Date();
            const slotMinutes = parseTimeToMinutes(newTimeSlot);
            const currentMinutes = now.getHours() * 60 + now.getMinutes() + 30;

            if (slotMinutes <= currentMinutes) {
                setSlotError('This time slot has already passed. Please select a later time.');
                setCheckingSlot(false);
                return;
            }
        }

        // 4. Get doctor ID for availability check
        const doctorId = selectedAppointment.Doctor?.id || selectedAppointment.doctor_id;
        if (!doctorId) {
            setSlotError('Doctor information not found.');
            setCheckingSlot(false);
            return;
        }

        try {
            // 5. Check Availability with backend
            const { checkAvailability } = await import('../../services/api');
            const availabilityResponse = await checkAvailability(doctorId, newDate, newTimeSlot);

            if (!availabilityResponse.data.available) {
                setSlotError(availabilityResponse.data.message || 'Slot not available');
                setCheckingSlot(false);
                return;
            }

            // 6. Proceed with reschedule
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
            fetchData();
        } catch (error) {
            console.error('Reschedule error:', error);
            setSlotError(error.response?.data?.message || 'Error rescheduling appointment. Please try again.');
        } finally {
            setCheckingSlot(false);
        }
    };

    const [actionModal, setActionModal] = useState({ isOpen: false, type: '', appointment: null, reason: '' });

    const handleCancel = async (id, reason) => {
        try {
            const { data } = await cancelAppointment(id, reason || 'Patient requested cancellation from dashboard');
            toast.success(
                `Appointment cancelled successfully!\n\nRefund: ${data.refundPercentage || 0}% (PKR ${data.refundAmount || 0})`,
                { duration: 6000 }
            );
            setActionModal({ isOpen: false, type: '', appointment: null, reason: '' });
            fetchData();
        } catch (error) {
            console.error('Cancel error:', error);
            toast.error(error.response?.data?.message || 'Error cancelling appointment');
        }
    };

    // Calculate refund tier
    const getRefundInfo = (apt) => {
        const appointmentTime = parseTimeSlot(apt.date, apt.timeSlot || apt.time_slot);
        if (!appointmentTime) return { percentage: 0, label: 'No refund (unknown time)', color: 'red' };
        const hoursUntil = (appointmentTime - new Date()) / (1000 * 60 * 60);
        if (hoursUntil > 24) return { percentage: 100, hours: hoursUntil, label: '100% Full Refund', color: 'green' };
        if (hoursUntil > 12) return { percentage: 50, hours: hoursUntil, label: '50% Partial Refund', color: 'yellow' };
        return { percentage: 0, hours: hoursUntil, label: 'No Refund (less than 12h)', color: 'red' };
    };

    const confirmAction = (e, type, apt) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const appointmentTime = parseTimeSlot(apt.date, apt.timeSlot || apt.time_slot);
        const hoursUntil = appointmentTime ? (appointmentTime - new Date()) / (1000 * 60 * 60) : Infinity;

        if (type === 'reschedule' && hoursUntil <= 24 && hoursUntil > 0) {
            // <24h reschedule = must cancel + rebook
            setActionModal({ isOpen: true, type: 'reschedule-late', appointment: apt, reason: '' });
        } else if (type === 'reschedule') {
            openRescheduleModal(apt);
        } else {
            setActionModal({ isOpen: true, type, appointment: apt, reason: '' });
        }
    };

    const openRescheduleModal = (appointment) => {
        setSelectedAppointment(appointment);
        setShowRescheduleModal(true);
    };

    const stats = [
        {
            label: 'Total Appointments',
            value: appointments.length,
            icon: <FaCalendarAlt />,
            color: 'from-blue-500 to-blue-600'
        },
        {
            label: 'Pending Reports',
            value: scans.filter(s => s.validation_status === 'pending').length,
            icon: <FaNotesMedical />,
            color: 'from-teal-500 to-teal-600'
        },
        {
            label: 'Total Scans',
            value: scans.length,
            icon: <FaFileUpload />,
            color: 'from-purple-500 to-purple-600'
        },
    ];

    const upcomingAppointments = appointments
        .filter(apt => apt.status !== 'cancelled' && apt.status !== 'completed' && isUpcoming(apt))
        .slice(0, 3);

    return (
        <div className="min-h-screen bg-gradient-to-br from-off-white to-pastel-blue/20 p-6">
            {/* Welcome Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary-blue to-primary-teal bg-clip-text text-transparent">
                    Welcome back, {user?.name}! 👋
                </h1>
                <p className="text-gray-600">Here's your health overview</p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <GlassCard className="p-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-4 rounded-xl text-white bg-gradient-to-r ${stat.color} shadow-lg`}>
                                    <span className="text-2xl">{stat.icon}</span>
                                </div>
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                                    <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upcoming Appointments */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-800">Upcoming Appointments</h2>
                        <Link to="/patient/appointments" className="text-primary-blue hover:underline text-sm font-medium">
                            View All →
                        </Link>
                    </div>

                    {loading ? (
                        <GlassCard className="p-8 text-center">
                            <div className="animate-pulse">Loading...</div>
                        </GlassCard>
                    ) : upcomingAppointments.length === 0 ? (
                        <GlassCard className="p-8 text-center">
                            <p className="text-gray-500">No upcoming appointments</p>
                            <Link to="/patient/book-appointment">
                                <Button className="mt-4" size="sm">Book Appointment</Button>
                            </Link>
                        </GlassCard>
                    ) : (
                        <div className="space-y-4">
                            {upcomingAppointments.map((apt, index) => {
                                const appointmentId = apt.id || apt._id;
                                return (
                                    <motion.div
                                        key={appointmentId}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <GlassCard className="p-5">
                                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-12 h-12 bg-gradient-to-r from-primary-blue to-primary-teal rounded-full flex items-center justify-center text-white">
                                                        <FaUserMd className="text-xl" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-800">
                                                            {apt.Doctor?.User?.name || 'Doctor'}
                                                        </h3>
                                                        <p className="text-sm text-primary-teal font-medium">
                                                            {apt.Doctor?.specialization || 'Specialist'}
                                                        </p>
                                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                            <span className="flex items-center gap-1">
                                                                <FaCalendarAlt /> {apt.date}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <FaClock /> {apt.time_slot}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge
                                                        variant={apt.status === 'confirmed' ? 'success' : 'warning'}
                                                        className="pointer-events-none select-none"
                                                    >
                                                        {apt.status}
                                                    </Badge>
                                                    <Badge
                                                        variant={apt.type === 'virtual' ? 'primary' : 'info'}
                                                        className="pointer-events-none select-none"
                                                    >
                                                        {apt.type}
                                                    </Badge>

                                                    {/* Join Call button for virtual appointments */}
                                                    {apt.type === 'virtual' && (
                                                        <>
                                                            {isJoinable(apt) ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        handleJoinCall(apt);
                                                                    }}
                                                                    className="px-4 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 active:bg-green-800 transition-all text-sm flex items-center gap-2 shadow-lg shadow-green-200 border-2 border-green-500 cursor-pointer"
                                                                >
                                                                    <FaVideo className="text-base" /> Join Call Now
                                                                </button>
                                                            ) : apt.status === 'confirmed' ? (
                                                                <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium border border-gray-200">
                                                                    Join available at appointment time
                                                                </span>
                                                            ) : null}
                                                        </>
                                                    )}

                                                    {/* Reschedule button - only for upcoming appointments */}
                                                    {apt.status !== 'cancelled' && apt.status !== 'completed' && isUpcoming(apt) && (
                                                        <button
                                                            onClick={(e) => confirmAction(e, 'reschedule', apt)}
                                                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-semibold hover:bg-blue-100 transition-colors text-sm border border-blue-200"
                                                        >
                                                            Reschedule
                                                        </button>
                                                    )}

                                                    {/* Cancel button */}
                                                    {apt.status !== 'cancelled' && apt.status !== 'completed' && isUpcoming(apt) && (
                                                        <button
                                                            onClick={(e) => confirmAction(e, 'cancel', apt)}
                                                            className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors text-sm border border-red-200"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </GlassCard>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Quick Actions Sidebar */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800">Quick Actions</h2>
                    <GlassCard className="p-6 space-y-4">
                        <Link to="/patient/book-appointment">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl cursor-pointer group"
                            >
                                <div className="p-3 bg-blue-500 text-white rounded-lg mr-4 shadow-md group-hover:scale-110 transition-transform">
                                    <FaCalendarAlt />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">Book Appointment</h3>
                                    <p className="text-xs text-gray-600">Schedule a visit</p>
                                </div>
                            </motion.div>
                        </Link>

                        <Link to="/patient/upload-scan">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center p-4 bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl cursor-pointer group"
                            >
                                <div className="p-3 bg-teal-500 text-white rounded-lg mr-4 shadow-md group-hover:scale-110 transition-transform">
                                    <FaFileUpload />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">Upload Scan</h3>
                                    <p className="text-xs text-gray-600">MRI or Retinal scans</p>
                                </div>
                            </motion.div>
                        </Link>

                        <Link to="/patient/scans">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl cursor-pointer group"
                            >
                                <div className="p-3 bg-purple-500 text-white rounded-lg mr-4 shadow-md group-hover:scale-110 transition-transform">
                                    <FaNotesMedical />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">View Reports</h3>
                                    <p className="text-xs text-gray-600">Diagnostic history</p>
                                </div>
                            </motion.div>
                        </Link>
                    </GlassCard>

                    {/* Recent Scans */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Scans</h3>
                        <GlassCard className="p-4">
                            {scans.slice(0, 3).map((scan, index) => (
                                <motion.div
                                    key={scan.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">
                                            {scan.scan_type === 'mri_brain' ? '🧠' :
                                                scan.scan_type === 'retinal' ? '👁️' : '🔬'}
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold">{scan.scan_type}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(scan.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge
                                        variant={scan.validation_status === 'validated' ? 'success' : 'warning'}
                                    >
                                        {scan.validation_status}
                                    </Badge>
                                </motion.div>
                            ))}
                        </GlassCard>
                    </div>
                </div>
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
                title="Reschedule Appointment"
            >
                <div className="space-y-4">
                    {selectedAppointment && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-4">
                            <p className="text-sm text-gray-600 mb-1">Current Appointment:</p>
                            <p className="font-semibold text-gray-800">
                                {new Date(selectedAppointment.date).toLocaleDateString()} at {selectedAppointment.time_slot || selectedAppointment.timeSlot}
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">New Date</label>
                        <input
                            type="date"
                            value={newDate}
                            onChange={(e) => {
                                setNewDate(e.target.value);
                                setNewTimeSlot(''); // Clear time when date changes
                                setSlotError('');
                            }}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">New Time Slot</label>
                        <select
                            value={newTimeSlot}
                            onChange={(e) => {
                                setNewTimeSlot(e.target.value);
                                setSlotError('');
                            }}
                            disabled={!newDate || availableSlots.length === 0}
                            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${!newDate || availableSlots.length === 0
                                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-white border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200'
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
                        {newDate && availableSlots.length === 0 && (
                            <p className="text-sm text-orange-600 mt-2">
                                ⚠️ No more slots available for today. Please select another date.
                            </p>
                        )}
                        {slotError && (
                            <p className="text-sm text-red-600 mt-2">❌ {slotError}</p>
                        )}
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={handleReschedule}
                            disabled={checkingSlot || !newDate || !newTimeSlot}
                            className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all ${checkingSlot || !newDate || !newTimeSlot
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-200'
                                }`}
                        >
                            {checkingSlot ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Checking...
                                </span>
                            ) : (
                                'Confirm Reschedule'
                            )}
                        </button>
                        <button
                            onClick={() => {
                                setShowRescheduleModal(false);
                                setSelectedAppointment(null);
                                setNewDate('');
                                setNewTimeSlot('');
                                setSlotError('');
                            }}
                            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Action Confirmation Modal - Cancel */}
            <Modal isOpen={actionModal.isOpen && actionModal.type === 'cancel' && !!actionModal.appointment} onClose={() => setActionModal({ isOpen: false, type: '', appointment: null, reason: '' })}>
                {actionModal.appointment && (
                    <div className="p-2">
                        <h3 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                            <span>❌</span> Cancel Appointment?
                        </h3>
                        <p className="text-gray-500 text-sm mb-5">This action cannot be undone.</p>

                        <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-1 text-sm">
                            <p className="text-gray-500">Doctor: <span className="font-semibold text-gray-800">Dr. {actionModal.appointment.Doctor?.User?.name || actionModal.appointment.Doctor?.name || 'your doctor'}</span></p>
                            <p className="text-gray-500">Date: <span className="font-semibold text-gray-800">{new Date(actionModal.appointment.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span></p>
                            <p className="text-gray-500">Time: <span className="font-semibold text-gray-800">{actionModal.appointment.timeSlot || actionModal.appointment.time_slot}</span></p>
                        </div>

                        <div className={`rounded-xl p-4 mb-6 border-2 ${getRefundInfo(actionModal.appointment || {}).color === 'green' ? 'bg-green-50 border-green-300' :
                            getRefundInfo(actionModal.appointment || {}).color === 'yellow' ? 'bg-yellow-50 border-yellow-300' :
                                'bg-red-50 border-red-300'
                            }`}>
                            <p className="font-bold text-gray-800 mb-1">Refund Policy:</p>
                            <p className={`text-lg font-extrabold ${getRefundInfo(actionModal.appointment || {}).color === 'green' ? 'text-green-700' :
                                getRefundInfo(actionModal.appointment || {}).color === 'yellow' ? 'text-yellow-700' :
                                    'text-red-700'
                                }`}>
                                {getRefundInfo(actionModal.appointment || {}).color === 'green' ? '✅' : getRefundInfo(actionModal.appointment || {}).color === 'yellow' ? '⚠️' : '❌'} {getRefundInfo(actionModal.appointment || {}).label}
                            </p>
                            {getRefundInfo(actionModal.appointment || {}).percentage > 0
                                ? <p className="text-sm text-gray-600 mt-1">Refund will be returned to your original payment method within 5–7 business days.</p>
                                : <p className="text-sm text-gray-600 mt-1">No refund will be issued due to the short notice period.</p>
                            }
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2 text-gray-700">Reason for Cancellation (Optional)</label>
                            <textarea
                                value={actionModal.reason || ''}
                                onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
                                maxLength={200}
                                rows={2}
                                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all resize-none"
                                placeholder="Briefly explain why you need to cancel..."
                            />
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setActionModal({ isOpen: false, type: '', appointment: null, reason: '' })}
                                className="flex-1 py-3 px-4 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                                Go Back
                            </button>
                            <button
                                onClick={() => handleCancel(actionModal.appointment.id || actionModal.appointment._id, actionModal.reason)}
                                className="flex-1 py-3 px-4 rounded-xl font-bold text-white shadow-lg bg-red-600 hover:bg-red-700 shadow-red-200 transition-colors"
                            >
                                Confirm Cancellation
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Action Confirmation Modal - Reschedule Late (<24h = cancel + rebook) */}
            <Modal isOpen={actionModal.isOpen && actionModal.type === 'reschedule-late' && !!actionModal.appointment} onClose={() => setActionModal({ isOpen: false, type: '', appointment: null, reason: '' })}>
                {actionModal.appointment && (
                    <div className="p-2">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span>⚠️</span> Late Reschedule Warning
                        </h3>
                        <div className="bg-orange-50 border border-orange-300 rounded-xl p-4 mb-4 text-sm text-orange-900">
                            <p className="font-bold mb-2">Your appointment is within 24 hours.</p>
                            <p>Rescheduling this close to the appointment is treated as a <strong>cancellation + new booking</strong>.</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>This appointment will be <strong>cancelled</strong></li>
                                <li>Refund: <strong>{getRefundInfo(actionModal.appointment || {}).label}</strong></li>
                                <li>You will then need to <strong>book a new appointment</strong></li>
                            </ul>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setActionModal({ isOpen: false, type: '', appointment: null, reason: '' })}
                                className="flex-1 py-3 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                                Go Back
                            </button>
                            <button
                                onClick={() => {
                                    handleCancel(actionModal.appointment.id || actionModal.appointment._id, actionModal.reason);
                                }}
                                className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200"
                            >
                                Cancel & Rebook
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PatientDashboard;
