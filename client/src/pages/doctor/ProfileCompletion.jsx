import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getMe, updateProfile } from '../../services/api';
import { GlassCard, Button } from '../../components/ui';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { FaCheckCircle, FaUserMd, FaBriefcaseMedical, FaClock } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const ProfileCompletion = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [verificationStatus, setVerificationStatus] = useState('pending');

    const [formData, setFormData] = useState({
        phone: '',
        pmdcNumber: '',
        specialization: '',
        experience: '',
        consultationFee: '',
        bio: '',
        medicalCollege: '',
        passingYear: '',
        workingHours: {
            Monday: { physical: { start: '', end: '' }, virtual: { start: '', end: '' } },
            Tuesday: { physical: { start: '', end: '' }, virtual: { start: '', end: '' } },
            Wednesday: { physical: { start: '', end: '' }, virtual: { start: '', end: '' } },
            Thursday: { physical: { start: '', end: '' }, virtual: { start: '', end: '' } },
            Friday: { physical: { start: '', end: '' }, virtual: { start: '', end: '' } },
            Saturday: { physical: { start: '', end: '' }, virtual: { start: '', end: '' } },
            Sunday: { physical: { start: '', end: '' }, virtual: { start: '', end: '' } }
        }
    });

    const specializations = [
        'Cardiologist', 'Neurologist', 'Ophthalmologist', 'Dermatologist',
        'Orthopedic', 'Pediatrician', 'Psychiatrist', 'Radiologist',
        'General Physician', 'ENT Specialist', 'Oncologist', 'Pulmonologist',
        'Gastroenterologist', 'Nephrologist', 'Endocrinologist', 'Other'
    ];

    const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const { data } = await getMe();
            if (data.profile) {
                const profile = data.profile;
                setFormData({
                    phone: data.phone || '',
                    pmdcNumber: profile.pmdc_number || '',
                    specialization: profile.specialization || '',
                    experience: profile.experience_years || '',
                    consultationFee: profile.consultation_fee || '',
                    bio: profile.bio || '',
                    medicalCollege: profile.medical_college || '',
                    passingYear: profile.passing_year || '',
                    workingHours: profile.working_hours || {
                        Monday: { physical: { start: '', end: '' }, virtual: { start: '', end: '' } },
                        Tuesday: { physical: { start: '', end: '' }, virtual: { start: '', end: '' } },
                        Wednesday: { physical: { start: '', end: '' }, virtual: { start: '', end: '' } },
                        Thursday: { physical: { start: '', end: '' }, virtual: { start: '', end: '' } },
                        Friday: { physical: { start: '', end: '' }, virtual: { start: '', end: '' } },
                        Saturday: { physical: { start: '', end: '' }, virtual: { start: '', end: '' } },
                        Sunday: { physical: { start: '', end: '' }, virtual: { start: '', end: '' } }
                    }
                });
                const status = profile.verification_status || 'pending';
                setVerificationStatus(status);

                // Update user context with verification status
                if (updateUser) {
                    updateUser({
                        profileComplete: true,
                        verificationStatus: status
                    });
                }
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleWorkingHoursChange = (day, type, field, value) => {
        setFormData(prev => ({
            ...prev,
            workingHours: {
                ...prev.workingHours,
                [day]: {
                    ...prev.workingHours[day],
                    [type]: {
                        ...prev.workingHours[day][type],
                        [field]: value
                    }
                }
            }
        }));
    };

    const applyMondayToWeekdays = () => {
        const mondaySchedule = formData.workingHours.Monday;
        setFormData(prev => {
            const newHours = { ...prev.workingHours };
            ['Tuesday', 'Wednesday', 'Thursday', 'Friday'].forEach(day => {
                newHours[day] = {
                    physical: { ...mondaySchedule.physical },
                    virtual: { ...mondaySchedule.virtual }
                };
            });
            return { ...prev, workingHours: newHours };
        });
        toast?.success?.("Monday's schedule applied to all weekdays!");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        try {
            const profileData = {
                phone: formData.phone,
                pmdcNumber: formData.pmdcNumber,
                specialization: formData.specialization,
                experience: parseInt(formData.experience) || 0,
                consultationFee: parseFloat(formData.consultationFee) || 0,
                bio: formData.bio,
                medicalCollege: formData.medicalCollege,
                passingYear: parseInt(formData.passingYear) || null,
                workingHours: formData.workingHours
            };

            const response = await updateProfile(profileData);
            const newStatus = response.data?.profile?.verification_status || response.data?.verificationStatus || 'pending';

            if (newStatus === 'approved') {
                setSuccess('🎉 Profile completed and verified! You can now start taking appointments. An email confirmation has been sent.');
                setVerificationStatus('approved');
            } else {
                setSuccess('✅ Profile completed successfully! Your verification is now pending. You will receive an email notification once verified.');
                setVerificationStatus('pending');
            }

            if (updateUser) {
                updateUser({
                    profileComplete: true,
                    verificationStatus: newStatus
                });
            }

            // Refresh profile data to get updated status
            await fetchProfile();

            // Force a refresh of user context to update profileComplete status
            // This ensures guards don't redirect after navigation
            try {
                const { data: userData } = await getMe();
                if (userData && updateUser) {
                    updateUser({
                        ...userData,
                        profileComplete: true,
                        verificationStatus: newStatus
                    });
                }
            } catch (err) {
                console.error('Error refreshing user data:', err);
            }

            // Redirect to dashboard after 5 seconds
            setTimeout(() => {
                navigate('/doctor/dashboard');
            }, 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-foreground-muted">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface p-6">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    {verificationStatus === 'approved' ? (
                        <>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="px-4 py-2 bg-success/10 text-foreground rounded-full font-semibold flex items-center gap-2">
                                    <FaCheckCircle className="text-success" />
                                    Verification Complete
                                </div>
                            </div>
                            <h1 className="text-3xl font-bold text-foreground mb-2">Edit Your Professional Profile</h1>
                            <p className="text-foreground-muted">Your profile is verified. You can update your information below.</p>
                        </>
                    ) : (
                        <>
                            <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Professional Profile</h1>
                            <p className="text-foreground-muted">Fill in your details to get verified and start taking appointments</p>
                        </>
                    )}
                </motion.div>

                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-6 p-6 rounded-xl border-2 ${verificationStatus === 'approved'
                            ? 'bg-success/10 border-success'
                            : 'bg-warning/10 border-warning'
                            }`}
                    >
                        <div className="flex items-start gap-4">
                            <FaCheckCircle className={`text-3xl ${verificationStatus === 'approved' ? 'text-success' : 'text-warning'
                                }`} />
                            <div className="flex-1">
                                <h3 className={`font-bold text-lg mb-2 ${verificationStatus === 'approved' ? 'text-foreground' : 'text-foreground'
                                    }`}>
                                    {verificationStatus === 'approved'
                                        ? '🎉 Profile Verified!'
                                        : '✅ Profile Submitted for Verification'}
                                </h3>
                                <p className={`text-sm leading-relaxed ${verificationStatus === 'approved' ? 'text-success' : 'text-warning'
                                    }`}>
                                    {success}
                                </p>
                                {verificationStatus === 'pending' && (
                                    <div className="mt-4 p-3 bg-warning/10 rounded-xl">
                                        <p className="text-xs text-foreground font-medium">
                                            ⏳ Your profile is now under review. You will be redirected to the dashboard shortly...
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-error/10 border border-error/20 text-foreground rounded-xl"
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <GlassCard className="p-6">
                            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                <FaUserMd className="text-accent" /> Basic Information
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground-muted">Full Name</label>
                                    <input
                                        type="text"
                                        value={user?.name || ''}
                                        disabled
                                        className="w-full px-4 py-3 rounded-xl bg-surface-tertiary border border-white/[0.06] text-foreground-muted"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground-muted">Email</label>
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="w-full px-4 py-3 rounded-xl bg-surface-tertiary border border-white/[0.06] text-foreground-muted"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground-muted">
                                        Phone Number <span className="text-error">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="03001234567"
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-white/[0.06] focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground-muted">Bio / About</label>
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        placeholder="Tell patients about your expertise..."
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-white/[0.06] focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none resize-none"
                                    />
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard className="p-6">
                            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                <FaBriefcaseMedical className="text-accent" /> Professional Information
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground-muted">
                                        PMDC Number <span className="text-error">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="pmdcNumber"
                                        value={formData.pmdcNumber}
                                        onChange={handleChange}
                                        placeholder="12345-P"
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-white/[0.06] focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground-muted">
                                        Specialization <span className="text-error">*</span>
                                    </label>
                                    <select
                                        name="specialization"
                                        value={formData.specialization}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-white/[0.06] focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
                                    >
                                        <option value="">Select Specialization</option>
                                        {specializations.map(spec => (
                                            <option key={spec} value={spec}>{spec}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-foreground-muted">
                                            Experience (Years) <span className="text-error">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="experience"
                                            value={formData.experience}
                                            onChange={handleChange}
                                            placeholder="10"
                                            min="0"
                                            required
                                            className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-white/[0.06] focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-foreground-muted">
                                            Consultation Fee (PKR) <span className="text-error">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="consultationFee"
                                            value={formData.consultationFee}
                                            onChange={handleChange}
                                            placeholder="2000"
                                            min="500"
                                            required
                                            className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-white/[0.06] focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground-muted">
                                        Medical College <span className="text-error">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="medicalCollege"
                                        value={formData.medicalCollege}
                                        onChange={handleChange}
                                        placeholder="King Edward Medical University"
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-white/[0.06] focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground-muted">Passing Year</label>
                                    <input
                                        type="number"
                                        name="passingYear"
                                        value={formData.passingYear}
                                        onChange={handleChange}
                                        placeholder="2015"
                                        min="1970"
                                        max={new Date().getFullYear()}
                                        className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-white/[0.06] focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
                                    />
                                </div>
                            </div>
                        </GlassCard>

                        {/* Working Hours Configuration */}
                        <GlassCard className="p-6 lg:col-span-2">
                            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                <FaClock className="text-accent" /> Availability & Schedule
                            </h2>
                            <div className="flex justify-between items-start mb-6">
                                <p className="text-sm text-foreground-muted">
                                    Set your availability for physical and virtual consultations separately. Leave time blank if you are not available for that type on a given day.
                                </p>
                                <button
                                    type="button"
                                    onClick={applyMondayToWeekdays}
                                    className="text-xs font-semibold bg-accent-subtle text-accent px-3 py-2 rounded hover:bg-accent-subtle transition-colors shrink-0 ml-4"
                                >
                                    Copy Monday to all Weekdays
                                </button>
                            </div>

                            <div className="space-y-6">
                                {DAYS_OF_WEEK.map((day) => (
                                    <div key={day} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center bg-surface-secondary/60 p-4 rounded-xl border border-white/[0.06]">
                                        <div className="font-semibold text-foreground-muted md:col-span-1">{day}</div>

                                        {/* Physical Hours */}
                                        <div className="md:col-span-2 space-y-2 border-l-2 md:border-l-0 md:pl-0 pl-3 border-accent/20">
                                            <label className="block text-xs font-medium text-accent uppercase">Physical Appointments</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="time"
                                                    value={formData.workingHours[day].physical.start || ''}
                                                    onChange={e => handleWorkingHoursChange(day, 'physical', 'start', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-white/[0.06] focus:border-blue-500 text-sm"
                                                />
                                                <span className="text-foreground-subtle">to</span>
                                                <input
                                                    type="time"
                                                    value={formData.workingHours[day].physical.end || ''}
                                                    onChange={e => handleWorkingHoursChange(day, 'physical', 'end', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-white/[0.06] focus:border-blue-500 text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Virtual Hours */}
                                        <div className="md:col-span-2 space-y-2 border-l-2 md:border-l-0 md:pl-0 pl-3 border-accent/20">
                                            <label className="block text-xs font-medium text-accent uppercase">Virtual Appointments</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="time"
                                                    value={formData.workingHours[day].virtual.start || ''}
                                                    onChange={e => handleWorkingHoursChange(day, 'virtual', 'start', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-white/[0.06] focus:border-accent text-sm"
                                                />
                                                <span className="text-foreground-subtle">to</span>
                                                <input
                                                    type="time"
                                                    value={formData.workingHours[day].virtual.end || ''}
                                                    onChange={e => handleWorkingHoursChange(day, 'virtual', 'end', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-white/[0.06] focus:border-accent text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>

                        {/* Preferences Card */}
                        <GlassCard className="p-6 lg:col-span-2 mt-2">
                            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                <span>⚙️</span> Preferences
                            </h2>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-foreground-muted font-medium">Application Language</span>
                                <LanguageSwitcher />
                            </div>
                        </GlassCard>
                    </div>

                    <div className="mt-6 flex justify-end gap-4">
                        {verificationStatus === 'approved' && (
                            <Button
                                type="button"
                                onClick={() => navigate('/doctor/dashboard')}
                                className="px-6 py-3 rounded-xl font-semibold bg-surface-secondary hover:bg-surface-tertiary text-foreground-muted transition-all"
                            >
                                Back to Dashboard
                            </Button>
                        )}
                        <Button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-4 rounded-xl font-bold text-lg bg-accent hover:bg-accent-hover text-white transition-all shadow-card"
                        >
                            {saving
                                ? 'Saving...'
                                : verificationStatus === 'approved'
                                    ? 'Update Profile'
                                    : 'Submit for Verification'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileCompletion;

