import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  SurfaceCard,
  Button,
  Modal,
} from '../../components/ui';
import api, { rescheduleAppointment, cancelAppointment, getConsultationPatientSummary } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  FaCalendarAlt,
  FaFileUpload,
  FaNotesMedical,
  FaClock,
  FaVideo,
  FaUserMd,
} from 'react-icons/fa';
import { Calendar, Upload, FileText } from 'lucide-react';

const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiSummaryModal, setAiSummaryModal] = useState({ isOpen: false, summary: null, loading: false });
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTimeSlot, setNewTimeSlot] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [checkingSlot, setCheckingSlot] = useState(false);
  const [slotError, setSlotError] = useState('');
  const reduce = useReducedMotion();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (hours === 12 && modifier === 'AM') hours = 0;
    if (hours !== 12 && modifier === 'PM') hours += 12;
    return hours * 60 + minutes;
  };

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

  const isUpcoming = (apt) => {
    const appointmentTime = parseTimeSlot(apt.date, apt.timeSlot || apt.time_slot);
    if (!appointmentTime) return new Date(apt.date) >= new Date().setHours(0, 0, 0, 0);
    return appointmentTime > currentTime;
  };

  useEffect(() => {
    const fetchSlots = async () => {
      if (!newDate || !selectedAppointment) {
        setAvailableSlots([]);
        setNewTimeSlot('');
        return;
      }
      const doctorId = selectedAppointment.Doctor?.id || selectedAppointment.doctor_id;
      if (!doctorId) { setAvailableSlots([]); return; }
      try {
        const { getAvailableSlots } = await import('../../services/api');
        const response = await getAvailableSlots(doctorId, newDate);
        const fetchedSlots = response.data.availableSlots || [];
        setAvailableSlots(fetchedSlots);
        if (newTimeSlot && !fetchedSlots.includes(newTimeSlot)) setNewTimeSlot('');
      } catch (err) {
        console.error('Error fetching available slots:', err);
        setAvailableSlots([]);
        setNewTimeSlot('');
      }
    };
    fetchSlots();
  }, [newDate, selectedAppointment]);

  const isJoinable = (apt) => {
    if (apt.status !== 'confirmed' && apt.status !== 'pending') return false;
    if (apt.type !== 'virtual') return false;
    const aptDateStr = new Date(apt.date).toLocaleDateString('en-CA');
    const todayStr = currentTime.toLocaleDateString('en-CA');
    if (aptDateStr === todayStr) return true;
    const appointmentTime = parseTimeSlot(apt.date, apt.time_slot || apt.timeSlot);
    if (!appointmentTime) return false;
    const fifteenMinsBefore = new Date(appointmentTime.getTime() - 15 * 60 * 1000);
    return currentTime >= fifteenMinsBefore;
  };

  const handleJoinCall = (apt) => {
    const appointmentId = apt.id || apt._id;
    if (appointmentId) navigate(`/patient/consultation/${appointmentId}`);
    else toast.error('Invalid appointment. Please try again.');
  };

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

  const handleReschedule = async () => {
    setSlotError('');
    setCheckingSlot(true);
    if (!newDate || !newTimeSlot) { setSlotError('Please select both date and time.'); setCheckingSlot(false); return; }
    if (!selectedAppointment) { setSlotError('No appointment selected.'); setCheckingSlot(false); return; }
    const appointmentId = selectedAppointment.id || selectedAppointment._id;
    if (!appointmentId) { setSlotError('Invalid appointment ID.'); setCheckingSlot(false); return; }
    const selectedDate = new Date(newDate);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (selectedDate < today) { setSlotError('Please select a future date.'); setCheckingSlot(false); return; }
    if (selectedDate.toDateString() === new Date().toDateString()) {
      const now = new Date();
      const slotMinutes = parseTimeToMinutes(newTimeSlot);
      const currentMinutes = now.getHours() * 60 + now.getMinutes() + 30;
      if (slotMinutes <= currentMinutes) { setSlotError('This time slot has already passed. Please select a later time.'); setCheckingSlot(false); return; }
    }
    const doctorId = selectedAppointment.Doctor?.id || selectedAppointment.doctor_id;
    if (!doctorId) { setSlotError('Doctor information not found.'); setCheckingSlot(false); return; }
    try {
      const { checkAvailability } = await import('../../services/api');
      const availabilityResponse = await checkAvailability(doctorId, newDate, newTimeSlot);
      if (!availabilityResponse.data.available) { setSlotError(availabilityResponse.data.message || 'Slot not available'); setCheckingSlot(false); return; }
      await rescheduleAppointment(appointmentId, { newDate, newTimeSlot });
      toast.success('Appointment rescheduled successfully!');
      setShowRescheduleModal(false);
      setSelectedAppointment(null);
      setNewDate(''); setNewTimeSlot(''); setSlotError('');
      fetchData();
    } catch (error) {
      console.error('Reschedule error:', error);
      setSlotError(error.response?.data?.message || 'Error rescheduling appointment. Please try again.');
    } finally { setCheckingSlot(false); }
  };

  const [actionModal, setActionModal] = useState({ isOpen: false, type: '', appointment: null, reason: '' });

  const handleCancel = async (id, reason) => {
    try {
      const { data } = await cancelAppointment(id, reason || 'Patient requested cancellation from dashboard');
      toast.success(`Appointment cancelled successfully!\n\nRefund: ${data.refundPercentage || 0}%`, { duration: 6000 });
      setActionModal({ isOpen: false, type: '', appointment: null, reason: '' });
      fetchData();
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error(error.response?.data?.message || 'Error cancelling appointment');
    }
  };

  const getRefundInfo = (apt) => {
    const appointmentTime = parseTimeSlot(apt.date, apt.timeSlot || apt.time_slot);
    if (!appointmentTime) return { percentage: 0, label: 'No refund', color: 'red' };
    const hoursUntil = (appointmentTime - new Date()) / (1000 * 60 * 60);
    if (hoursUntil > 24) return { percentage: 100, hours: hoursUntil, label: '100% Full Refund', color: 'green' };
    if (hoursUntil > 12) return { percentage: 50, hours: hoursUntil, label: '50% Partial Refund', color: 'yellow' };
    return { percentage: 0, hours: hoursUntil, label: 'No Refund', color: 'red' };
  };

  const confirmAction = (e, type, apt) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const appointmentTime = parseTimeSlot(apt.date, apt.timeSlot || apt.time_slot);
    const hoursUntil = appointmentTime ? (appointmentTime - new Date()) / (1000 * 60 * 60) : Infinity;
    if (type === 'reschedule' && hoursUntil <= 24 && hoursUntil > 0) {
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

  const handleViewAISummary = async (apt) => {
    setAiSummaryModal({ isOpen: true, summary: null, loading: true });
    try {
      const { data } = await getConsultationPatientSummary(apt.id || apt._id);
      setAiSummaryModal({ isOpen: true, summary: data.patientSummary, loading: false });
    } catch {
      toast.error('Could not load consultation summary');
      setAiSummaryModal({ isOpen: false, summary: null, loading: false });
    }
  };

  const stats = [
    {
      label: 'Total Appointments',
      value: appointments.length,
      icon: <FaCalendarAlt size={24} />,
      accentColor: 'accent',
    },
    {
      label: 'Pending Reports',
      value: scans.filter(s => s.validation_status === 'pending').length,
      icon: <FaNotesMedical size={24} />,
      accentColor: 'medical',
    },
    {
      label: 'Total Scans',
      value: scans.length,
      icon: <FaFileUpload size={24} />,
      accentColor: 'info',
    },
  ];

  const upcomingAppointments = appointments
    .filter(apt => apt.status !== 'cancelled' && apt.status !== 'completed' && isUpcoming(apt))
    .slice(0, 3);

  const completedAppointments = appointments
    .filter(apt => apt.status === 'completed')
    .slice(0, 3);

  const quickActions = [
    {
      label: 'Book Appointment',
      desc: 'Schedule a visit',
      icon: <Calendar size={20} />,
      href: '/patient/book-appointment',
    },
    {
      label: 'Upload Scan',
      desc: 'MRI or Retinal scans',
      icon: <Upload size={20} />,
      href: '/patient/upload-scan',
    },
    {
      label: 'View Reports',
      desc: 'Diagnostic history',
      icon: <FileText size={20} />,
      href: '/patient/scans',
    },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <main id="main-content" className="p-4 md:p-6" role="main">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {user?.name || 'Patient'}
            </h1>
            <p className="text-foreground-muted text-sm mt-1">Here's your health overview</p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-surface-secondary rounded-xl border border-white/[0.06] p-5 hover:shadow-card-hover transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-lg ${
                    stat.accentColor === 'accent' ? 'bg-accent/15 text-accent' :
                    stat.accentColor === 'medical' ? 'bg-medical/15 text-medical' :
                    'bg-info/15 text-info'
                  }`}>
                    {stat.icon}
                  </div>
                  <span className="text-foreground-muted text-xs font-medium uppercase tracking-wider">{stat.label}</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Appointments */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-foreground">Upcoming Appointments</h2>
                <Link to="/patient/appointments" className="text-accent hover:underline text-sm">
                  View All →
                </Link>
              </div>

              {loading ? (
                <SurfaceCard className="p-8 text-center">
                  <div className="animate-pulse text-foreground-muted">Loading...</div>
                </SurfaceCard>
              ) : upcomingAppointments.length === 0 ? (
                <SurfaceCard className="p-8 text-center">
                  <p className="text-foreground-muted mb-4">No upcoming appointments</p>
                  <Link to="/patient/book-appointment">
                    <Button size="sm">Book Appointment</Button>
                  </Link>
                </SurfaceCard>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((apt, index) => {
                    const appointmentId = apt.id || apt._id;
                    return (
                      <motion.div
                        key={appointmentId}
                        initial={reduce ? false : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-surface-secondary rounded-xl border border-white/[0.06] p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-accent/15 rounded-full flex items-center justify-center text-accent shrink-0">
                              <FaUserMd size={18} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">
                                {apt.Doctor?.User?.name || 'Doctor'}
                              </h3>
                              <p className="text-sm text-accent">
                                {apt.Doctor?.specialization || 'Specialist'}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-foreground-muted mt-1">
                                <span className="flex items-center gap-1"><FaCalendarAlt size={11} /> {apt.date}</span>
                                <span className="flex items-center gap-1"><FaClock size={11} /> {apt.time_slot}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                apt.status === 'confirmed' ? 'bg-medical/15 text-medical' :
                                apt.status === 'pending' ? 'bg-warning/15 text-warning' :
                                'bg-surface text-foreground-muted'
                              }`}>
                                {apt.status}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                apt.type === 'virtual' ? 'bg-accent/15 text-accent' : 'bg-info/15 text-info'
                              }`}>
                                {apt.type}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              {apt.type === 'virtual' && isJoinable(apt) && (
                                <button
                                  onClick={(e) => { e.preventDefault(); handleJoinCall(apt); }}
                                  className="px-4 py-1.5 bg-medical text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                                >
                                  <FaVideo className="inline mr-1" size={12} /> Join
                                </button>
                              )}
                              {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                                <>
                                  <button
                                    onClick={(e) => confirmAction(e, 'reschedule', apt)}
                                    className="px-3 py-1.5 text-accent bg-accent/10 rounded-lg text-xs font-semibold hover:bg-accent/20 transition-colors"
                                  >
                                    Reschedule
                                  </button>
                                  <button
                                    onClick={(e) => confirmAction(e, 'cancel', apt)}
                                    className="px-3 py-1.5 text-error bg-error/10 rounded-lg text-xs font-semibold hover:bg-error/20 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {completedAppointments.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-4">Past Consultations</h2>
                  <div className="space-y-3">
                    {completedAppointments.map((apt) => {
                      const appointmentId = apt.id || apt._id;
                      return (
                        <SurfaceCard key={appointmentId} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-medical/15 rounded-full flex items-center justify-center text-medical">
                                <FaUserMd size={16} />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground text-sm">
                                  {apt.Doctor?.User?.name || 'Doctor'}
                                </p>
                                <p className="text-xs text-foreground-muted">{apt.date} · {apt.type}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleViewAISummary(apt)}
                              className="px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-xs font-semibold hover:bg-accent/20 transition-colors"
                            >
                              View AI Summary
                            </button>
                          </div>
                        </SurfaceCard>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Quick Actions & Recent Scans */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
                <SurfaceCard className="p-4">
                  <div className="space-y-2">
                    {quickActions.map((action) => (
                      <Link key={action.label} to={action.href}>
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/5 transition-colors group">
                          <div className="p-2 rounded-lg bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
                            {action.icon}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground">{action.label}</p>
                            <p className="text-xs text-foreground-muted">{action.desc}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </SurfaceCard>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Recent Scans</h3>
                <SurfaceCard className="p-4">
                  {scans.length === 0 ? (
                    <p className="text-center text-foreground-muted text-sm py-4">No scans uploaded yet</p>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {scans.slice(0, 3).map((scan) => (
                        <div key={scan.id} className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">
                              {scan.scan_type === 'mri_brain' ? '🧠' : scan.scan_type === 'retinal' ? '👁️' : '🔬'}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{scan.scan_type}</p>
                              <p className="text-xs text-foreground-muted">
                                {new Date(scan.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            scan.validation_status === 'validated' ? 'bg-medical/15 text-medical' : 'bg-warning/15 text-warning'
                          }`}>
                            {scan.validation_status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </SurfaceCard>
              </div>
            </div>
          </div>
        </div>

        <Modal
          isOpen={showRescheduleModal}
          onClose={() => {
            setShowRescheduleModal(false);
            setSelectedAppointment(null);
            setNewDate(''); setNewTimeSlot(''); setSlotError('');
          }}
          title="Reschedule Appointment"
        >
          <div className="space-y-4">
            {selectedAppointment && (
              <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl mb-4">
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
                onChange={(e) => { setNewDate(e.target.value); setNewTimeSlot(''); setSlotError(''); }}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-white/[0.06] focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground-muted">New Time Slot</label>
              <select
                value={newTimeSlot}
                onChange={(e) => { setNewTimeSlot(e.target.value); setSlotError(''); }}
                disabled={!newDate || availableSlots.length === 0}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${!newDate || availableSlots.length === 0
                  ? 'bg-surface-tertiary border-white/[0.06] text-foreground-subtle cursor-not-allowed'
                  : 'bg-surface-secondary border-white/[0.06] focus:border-accent focus:ring-2 focus:ring-accent/20'}`}
              >
                <option value="">
                  {!newDate ? 'Select date first' : availableSlots.length === 0 ? 'No slots available' : 'Select Time'}
                </option>
                {availableSlots.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
              {slotError && <p className="text-sm text-error mt-2">{slotError}</p>}
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleReschedule} disabled={checkingSlot || !newDate || !newTimeSlot} className="flex-1">
                {checkingSlot ? 'Checking...' : 'Confirm Reschedule'}
              </Button>
              <Button variant="secondary" onClick={() => {
                setShowRescheduleModal(false);
                setSelectedAppointment(null);
                setNewDate(''); setNewTimeSlot(''); setSlotError('');
              }} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={actionModal.isOpen && actionModal.type === 'cancel'} onClose={() => setActionModal({ isOpen: false, type: '', appointment: null, reason: '' })}>
          {actionModal.appointment && (
            <div className="p-2">
              <h3 className="text-xl font-bold text-foreground mb-4">Cancel Appointment?</h3>
              <p className="text-foreground-muted text-sm mb-5">This action cannot be undone.</p>
              <div className="bg-surface-secondary/60 rounded-xl p-4 mb-4 space-y-1 text-sm">
                <p className="text-foreground-muted">Doctor: <span className="font-semibold text-foreground">Dr. {actionModal.appointment.Doctor?.User?.name || 'your doctor'}</span></p>
                <p className="text-foreground-muted">Date: <span className="font-semibold text-foreground">{new Date(actionModal.appointment.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span></p>
                <p className="text-foreground-muted">Time: <span className="font-semibold text-foreground">{actionModal.appointment.timeSlot || actionModal.appointment.time_slot}</span></p>
              </div>
              <div className={`rounded-xl p-4 mb-4 border-2 ${getRefundInfo(actionModal.appointment).color === 'green' ? 'bg-medical/10 border-medical/20' : getRefundInfo(actionModal.appointment).color === 'yellow' ? 'bg-warning/10 border-warning/20' : 'bg-error/10 border-error/20'}`}>
                <p className="font-semibold text-foreground mb-1">Refund Policy:</p>
                <p className="text-lg font-extrabold" style={{ color: getRefundInfo(actionModal.appointment).color === 'green' ? '#10B981' : getRefundInfo(actionModal.appointment).color === 'yellow' ? '#F59E0B' : '#EF4444' }}>
                  {getRefundInfo(actionModal.appointment).label}
                </p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-foreground-muted">Reason (Optional)</label>
                <textarea
                  value={actionModal.reason || ''}
                  onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
                  maxLength={200}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-white/[0.06] focus:border-error focus:ring-2 focus:ring-error/20 outline-none transition-all resize-none"
                  placeholder="Briefly explain why..."
                />
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setActionModal({ isOpen: false, type: '', appointment: null, reason: '' })} className="flex-1">Go Back</Button>
                <Button variant="danger" onClick={() => handleCancel(actionModal.appointment.id || actionModal.appointment._id, actionModal.reason)} className="flex-1">Confirm Cancellation</Button>
              </div>
            </div>
          )}
        </Modal>

        <Modal isOpen={actionModal.isOpen && actionModal.type === 'reschedule-late'} onClose={() => setActionModal({ isOpen: false, type: '', appointment: null, reason: '' })}>
          {actionModal.appointment && (
            <div className="p-2">
              <h3 className="text-xl font-bold text-foreground mb-4">Late Reschedule</h3>
              <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-4 text-sm text-warning">
                <p className="font-bold mb-2">Your appointment is within 24 hours.</p>
                <p>Rescheduling will cancel this appointment. You'll need to book a new one.</p>
                <p className="mt-2"><strong>Refund:</strong> {getRefundInfo(actionModal.appointment).label}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setActionModal({ isOpen: false, type: '', appointment: null, reason: '' })} className="flex-1">Go Back</Button>
                <Button variant="danger" onClick={() => { handleCancel(actionModal.appointment.id || actionModal.appointment._id, actionModal.reason); }} className="flex-1">Cancel & Rebook</Button>
              </div>
            </div>
          )}
        </Modal>

        <Modal isOpen={aiSummaryModal.isOpen} onClose={() => setAiSummaryModal({ isOpen: false, summary: null, loading: false })} title="Your Consultation Summary" size="md">
          {aiSummaryModal.loading ? (
            <p className="text-center text-foreground-muted animate-pulse py-4">Loading summary...</p>
          ) : aiSummaryModal.summary ? (
            <p className="text-foreground-muted leading-relaxed">{aiSummaryModal.summary}</p>
          ) : (
            <p className="text-center text-foreground-muted italic py-4">No AI summary available for this consultation yet.</p>
          )}
        </Modal>
      </main>
    </div>
  );
};

export default PatientDashboard;
