import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { bookAppointment, getDoctorById, createPaymentIntent, confirmPayment, checkAvailability, getAvailableSlots } from '../../services/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../../components/CheckoutForm';
import { GlassCard, Badge } from '../../components/ui';
import { toast } from 'react-hot-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const BookAppointment = () => {
    const [searchParams] = useSearchParams();
    const doctorId = searchParams.get('doctorId');
    const navigate = useNavigate();

    const [step, setStep] = useState(1); // 1: Schedule, 2: Payment, 3: Success
    const [doctor, setDoctor] = useState(null);
    const [clientSecret, setClientSecret] = useState('');
    const [paymentAmount, setPaymentAmount] = useState(0); // Store PKR amount
    const [availableSlots, setAvailableSlots] = useState([]);
    const [checkingSlot, setCheckingSlot] = useState(false);
    const [slotError, setSlotError] = useState('');
    const [formData, setFormData] = useState({
        date: '',
        timeSlot: '',
        type: 'physical',
        reason: '',
        paymentMethod: 'card'
    });

    // Fetch available time slots based on selected date
    useEffect(() => {
        const fetchSlots = async () => {
            if (!formData.date || !doctor || !doctor.id) {
                setAvailableSlots([]);
                return;
            }

            try {
                setCheckingSlot(true);
                const { data } = await getAvailableSlots(doctor.id, formData.date, formData.type);
                setAvailableSlots(data.availableSlots || []);
            } catch (error) {
                console.error("Error fetching available slots:", error);
                setAvailableSlots([]);
                toast.error("Failed to load available slots for this date.");
            } finally {
                setCheckingSlot(false);
            }
        };

        fetchSlots();
    }, [formData.date, formData.type, doctor]);

    useEffect(() => {
        const fetchDoctor = async () => {
            if (doctorId) {
                try {
                    const { data } = await getDoctorById(doctorId);
                    if (!data) return;

                    setDoctor({
                        id: data.id, // DoctorProfile ID
                        userId: data.user_id, // User ID (needed for booking)
                        name: data.User ? data.User.name : 'Unknown Doctor',
                        specialization: data.specialization,
                        fee: data.consultation_fee || 2000,
                        image: data.profile_image || 'https://randomuser.me/api/portraits/women/68.jpg'
                    });
                } catch (error) {
                    console.error("Error fetching doctor:", error);
                    toast.error("Failed to load doctor details. Please try again.");
                }
            }
        };
        fetchDoctor();
    }, [doctorId]);

    const handleScheduleContinue = async () => {
        setSlotError('');
        setCheckingSlot(true);

        // 1. Validate form fields
        if (!formData.date || !formData.timeSlot) {
            setSlotError('Please select both date and time.');
            setCheckingSlot(false);
            return;
        }

        // 2. Validate Date
        const selectedDate = new Date(formData.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
            setSlotError('Please select a future date.');
            setCheckingSlot(false);
            return;
        }

        // 3. Simple time check if today (backend already filtered past slots, this is just extra safety)
        const selectedDateStr = selectedDate.toISOString().split('T')[0];
        const todayStr = new Date().toISOString().split('T')[0];

        if (selectedDateStr === todayStr) {
            // We trust the backend's availableSlots list
        }

        try {
            // 4. Check Availability with backend
            const availabilityResponse = await checkAvailability(doctor.id, formData.date, formData.timeSlot, formData.type);

            if (!availabilityResponse.data.available) {
                setSlotError(availabilityResponse.data.message || 'Slot not available');
                setCheckingSlot(false);
                return;
            }

            // 5. Create Payment Intent
            const { data } = await createPaymentIntent({
                doctorId: doctor.id,
                date: formData.date,
                timeSlot: formData.timeSlot
            });

            setClientSecret(data.clientSecret);
            setPaymentAmount(data.amount); // Store PKR amount
            setStep(2);
        } catch (error) {
            console.error("Error:", error);
            const errorMessage = error.response?.data?.message || error.message || 'Could not proceed. Please try again.';
            const missingFields = error.response?.data?.missingFields;

            if (missingFields && missingFields.length > 0) {
                setSlotError(`Please complete your profile first. Missing: ${missingFields.join(', ')}`);
                setTimeout(() => {
                    navigate('/patient/profile');
                }, 3000);
            } else {
                setSlotError(errorMessage);
            }
        } finally {
            setCheckingSlot(false);
        }
    };

    const handlePaymentSuccess = async (paymentIntent) => {
        try {
            // 1. Book Appointment
            const { data: appointment } = await bookAppointment({
                doctorId: doctor.userId,
                date: formData.date,
                timeSlot: formData.timeSlot,
                type: formData.type,
                notes: formData.reason
            });

            // 2. Record Payment (pass PKR amount for storage)
            await confirmPayment({
                paymentIntentId: paymentIntent.id,
                appointmentId: appointment.id,
                method: 'card',
                amountPKR: paymentAmount // Pass PKR amount for correct storage
            });

            setStep(3);
            setTimeout(() => {
                navigate('/patient/appointments');
            }, 3000);
        } catch (error) {
            console.error("Booking failed:", error);
            const errorMessage = error.response?.data?.message || error.message || 'Booking failed after payment. Please contact support.';
            const missingFields = error.response?.data?.missingFields;

            if (missingFields && missingFields.length > 0) {
                toast.error(`Please complete your profile first. Missing fields: ${missingFields.join(', ')}\n\nGo to your profile to complete these fields.`, { duration: 6000 });
                navigate('/patient/profile');
            } else {
                toast.error(`Booking failed: ${errorMessage}`);
            }
        }
    };

    // If no doctor selected, show helpful message with link to find doctors
    if (!doctorId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-teal-50/30 p-6">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">👨‍⚕️</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">Select a Doctor First</h2>
                    <p className="text-gray-600 mb-6">
                        Please search and select a doctor from our verified doctors list to book an appointment.
                    </p>
                    <button
                        onClick={() => navigate('/patient/find-doctors')}
                        className="w-full py-4 px-6 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-teal-200"
                    >
                        Find Doctors
                    </button>
                </div>
            </div>
        );
    }

    if (!doctor) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading doctor details...</p>
            </div>
        </div>
    );

    const appearance = { theme: 'stripe' };
    const options = { clientSecret, appearance };

    return (
        <div className="min-h-screen bg-gradient-to-br from-off-white to-pastel-blue/20 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Progress Steps */}
                <div className="mb-8 flex justify-center items-center space-x-4">
                    {[
                        { num: 1, label: 'Schedule' },
                        { num: 2, label: 'Payment' },
                        { num: 3, label: 'Done' }
                    ].map((s, idx) => (
                        <div key={s.num} className="flex items-center">
                            <div className={`flex items-center ${step >= s.num ? 'text-primary-blue' : 'text-gray-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= s.num ? 'border-primary-blue bg-blue-50' : 'border-gray-300'}`}>
                                    {s.num}
                                </div>
                                <span className="ml-2 font-medium">{s.label}</span>
                            </div>
                            {idx < 2 && <div className="w-16 h-px bg-gray-300 mx-4"></div>}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Doctor Summary Card */}
                    <div className="md:col-span-1">
                        <GlassCard className="p-6 sticky top-6">
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="relative mb-4">
                                    <img
                                        src={doctor.image}
                                        alt={doctor.name}
                                        className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-lg"
                                    />
                                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800">{doctor.name}</h3>
                                <Badge variant="primary" className="mt-2">{doctor.specialization}</Badge>
                            </div>

                            <div className="space-y-4 border-t border-gray-100 pt-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Consultation Fee</span>
                                    <span className="font-bold text-lg text-primary-blue">Rs. {doctor.fee}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Duration</span>
                                    <span className="font-medium text-gray-800">30 Mins</span>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
                                    <p>Includes platform fee & taxes</p>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Main Form Area */}
                    <div className="md:col-span-2">
                        <GlassCard className="p-8">
                            {step === 1 && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-6"
                                >
                                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Select Date & Time</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                                            <input
                                                type="date"
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full px-4 py-3 rounded-xl bg-white/50 border border-gray-200 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 outline-none transition-all"
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value, timeSlot: '' })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
                                            <select
                                                className="w-full px-4 py-3 rounded-xl bg-white/50 border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
                                                value={formData.timeSlot}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, timeSlot: e.target.value });
                                                    setSlotError('');
                                                }}
                                                disabled={!formData.date || availableSlots.length === 0}
                                            >
                                                {checkingSlot && !formData.timeSlot ? (
                                                    <option>Loading slots...</option>
                                                ) : (
                                                    <>
                                                        <option value="">
                                                            {!formData.date
                                                                ? 'Select date first'
                                                                : availableSlots.length === 0
                                                                    ? 'No slots available today'
                                                                    : 'Select Time'}
                                                        </option>
                                                        {availableSlots.map(slot => (
                                                            <option key={slot} value={slot}>{slot}</option>
                                                        ))}
                                                    </>
                                                )}
                                            </select>
                                            {formData.date && availableSlots.length === 0 && !checkingSlot && (
                                                <p className="text-sm text-orange-600 mt-2">
                                                    ⚠️ No more slots available for this date. Please select another date.
                                                </p>
                                            )}
                                            {slotError && (
                                                <p className="text-sm text-red-600 mt-2">❌ {slotError}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">Consultation Type</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <label className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.type === 'physical' ? 'border-primary-blue bg-blue-50/50' : 'border-gray-100 hover:border-gray-200'}`}>
                                                <input type="radio" name="type" value="physical" className="hidden" checked={formData.type === 'physical'} onChange={() => setFormData({ ...formData, type: 'physical' })} />
                                                <span className="font-semibold text-gray-800">🏥 Physical Visit</span>
                                                <span className="text-sm text-gray-500 mt-1">Visit the clinic in person</span>
                                            </label>

                                            <label className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.type === 'virtual' ? 'border-primary-blue bg-blue-50/50' : 'border-gray-100 hover:border-gray-200'}`}>
                                                <input type="radio" name="type" value="virtual" className="hidden" checked={formData.type === 'virtual'} onChange={() => setFormData({ ...formData, type: 'virtual' })} />
                                                <span className="font-semibold text-gray-800">📹 Virtual Call</span>
                                                <span className="text-sm text-gray-500 mt-1">Video consultation via app</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Visit</label>
                                        <textarea
                                            rows="3"
                                            className="w-full px-4 py-3 rounded-xl bg-white/50 border border-gray-200 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 outline-none transition-all resize-none"
                                            placeholder="Briefly describe your symptoms..."
                                            value={formData.reason}
                                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        ></textarea>
                                    </div>

                                    {/* Policies & Guidelines */}
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                                        <h4 className="font-bold flex items-center gap-2 mb-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            Booking & Cancellation Policies
                                        </h4>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li><strong>Reschedule:</strong> Free up to 24 hours before the appointment. Later reschedules require a new booking.</li>
                                            <li><strong>Cancellation ({'>'}24 hrs):</strong> 100% Full Refund.</li>
                                            <li><strong>Cancellation (12-24 hrs):</strong> 50% Partial Refund.</li>
                                            <li><strong>Cancellation ({'<'}12 hrs):</strong> No Refund (0%).</li>
                                        </ul>
                                    </div>

                                    <button
                                        onClick={handleScheduleContinue}
                                        disabled={!formData.date || !formData.timeSlot || checkingSlot}
                                        className="w-full py-4 text-lg font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg shadow-teal-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {checkingSlot ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Checking Availability...
                                            </span>
                                        ) : (
                                            'Accept Policies & Continue to Payment'
                                        )}
                                    </button>
                                </motion.div>
                            )}

                            {step === 2 && clientSecret && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-gray-800">Payment Details</h2>
                                        <Badge variant="success">Secure SSL</Badge>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-xl mb-6">
                                        <Elements options={options} stripe={stripePromise}>
                                            <CheckoutForm
                                                amount={(doctor.fee || 2000) + 50}
                                                onSuccess={handlePaymentSuccess}
                                            />
                                        </Elements>
                                    </div>

                                    <button
                                        onClick={() => setStep(1)}
                                        className="w-full text-gray-500 hover:text-gray-700 font-medium transition-colors"
                                    >
                                        ← Back to Schedule
                                    </button>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-12"
                                >
                                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-100">
                                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-800 mb-3">Booking Confirmed!</h2>
                                    <p className="text-gray-600 mb-8 text-lg">Your appointment with Dr. {doctor.name} has been scheduled successfully.</p>
                                    <div className="animate-pulse text-primary-blue font-medium">
                                        Redirecting to your appointments...
                                    </div>
                                </motion.div>
                            )}
                        </GlassCard>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookAppointment;
