import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { getMe, updateProfile } from '../../services/api';
import { GlassCard } from '../../components/ui';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const ProfileSettings = () => {
    const { t } = useTranslation();
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isProfileComplete, setIsProfileComplete] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [justCompleted, setJustCompleted] = useState(false);

    const [formData, setFormData] = useState({
        phone: '',
        cnic: '',
        dateOfBirth: '',
        gender: 'male',
        bloodGroup: '',
        height: '',
        weight: '',
        address: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        allergies: '',
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const { data } = await getMe();
            console.log('Profile data:', data);
            if (data.profile) {
                const profile = data.profile;
                setFormData({
                    phone: data.phone || '',
                    cnic: profile.cnic || '',
                    dateOfBirth: profile.date_of_birth || '',
                    gender: profile.gender || 'male',
                    bloodGroup: profile.blood_group || '',
                    height: profile.height || '',
                    weight: profile.weight || '',
                    address: profile.address || '',
                    emergencyContactName: profile.emergency_contact?.name || '',
                    emergencyContactPhone: profile.emergency_contact_phone || '',
                    allergies: profile.allergies?.join(', ') || '',
                });

                // Check if profile is complete
                const complete = profile.cnic && profile.date_of_birth && profile.address && profile.emergency_contact_phone;
                setIsProfileComplete(complete);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Failed to load profile. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        try {
            // Prepare profile data - keep required fields even if empty for validation
            const profileData = {
                phone: formData.phone?.trim() || '',
                cnic: formData.cnic?.trim() || '',
                dateOfBirth: formData.dateOfBirth?.trim() || '',
                gender: formData.gender || 'male',
                bloodGroup: formData.bloodGroup?.trim() || '',
                height: formData.height && formData.height.trim() ? parseInt(formData.height) : null,
                weight: formData.weight && formData.weight.trim() ? parseInt(formData.weight) : null,
                address: formData.address?.trim() || '',
                emergencyContactPhone: formData.emergencyContactPhone?.trim() || '',
                allergies: formData.allergies?.trim() ? formData.allergies.split(',').map(a => a.trim()).filter(a => a) : [],
            };

            console.log('Submitting profile data:', profileData);
            const response = await updateProfile(profileData);
            console.log('Profile update response:', response);

            // Check if this was first time completion
            const wasIncomplete = !isProfileComplete;

            setSuccess('Profile updated successfully!');
            setIsProfileComplete(true);

            // Update user context
            if (updateUser) {
                updateUser({ profileComplete: true });
            }

            // If first time completion, show success screen
            if (wasIncomplete) {
                setJustCompleted(true);
                setShowEditForm(false);
            } else {
                // Clear success message after 3 seconds for updates
                setTimeout(() => {
                    setSuccess('');
                }, 3000);
            }

        } catch (err) {
            console.error('Profile update error:', err);
            console.error('Error response:', err.response?.data);

            // Handle specific error cases
            if (err.response?.data?.error === 'DUPLICATE_CNIC') {
                setError('This CNIC is already registered. Please use a different CNIC or contact support if this is an error.');
            } else if (err.response?.data?.missingFields) {
                setError(`Please fill in all required fields: ${err.response.data.missingFields.join(', ')}`);
            } else if (err.response?.data?.errors) {
                // Handle validation errors
                const validationErrors = err.response.data.errors.map(e => e.message).join(', ');
                setError(`Validation error: ${validationErrors}`);
            } else {
                setError(err.response?.data?.message || err.message || 'Failed to update profile. Please check all fields and try again.');
            }
        } finally {
            setSaving(false);
        }
    };

    const requiredFields = ['cnic', 'dateOfBirth', 'address', 'emergencyContactPhone', 'phone'];
    const filledRequired = requiredFields.filter(f => formData[f]).length;
    const completionPercentage = Math.round((filledRequired / requiredFields.length) * 100);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                    <p className="text-foreground-muted">Loading profile...</p>
                </div>
            </div>
        );
    }

    // Show completion success screen
    if (justCompleted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-lg w-full"
                >
                    <GlassCard className="p-8 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6"
                        >
                            <span className="text-5xl">✅</span>
                        </motion.div>

                        <h1 className="text-3xl font-bold text-foreground mb-3">Profile Complete!</h1>
                        <p className="text-foreground-muted mb-8">
                            Your medical profile has been successfully saved. You can now book appointments with our verified doctors.
                        </p>

                        <div className="space-y-4">
                            <Link
                                to="/patient/find-doctors"
                                className="block w-full py-4 px-6 bg-accent hover:bg-accent-hover text-white font-bold rounded-xl transition-colors"
                            >
                                Find Doctors & Book Appointment
                            </Link>

                            <button
                                onClick={() => {
                                    setJustCompleted(false);
                                    setShowEditForm(false);
                                }}
                                className="block w-full py-4 px-6 bg-surface-secondary/80 hover:bg-surface-tertiary text-foreground-muted font-bold rounded-xl transition-colors"
                            >
                                View My Profile
                            </button>
                        </div>
                    </GlassCard>
                </motion.div>
            </div>
        );
    }

    // Show profile view mode when complete and not editing
    if (isProfileComplete && !showEditForm) {
        return (
            <div className="min-h-screen bg-surface p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 flex items-center justify-between"
                    >
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-2">{t('profile', 'My Profile')}</h1>
                            <p className="text-foreground-muted">{t('profile_subtitle', 'Your personal and medical information')}</p>
                        </div>
                        <button
                            onClick={() => setShowEditForm(true)}
                            className="px-6 py-3 bg-accent hover:bg-accent-hover text-white font-bold rounded-xl transition-colors"
                        >
                            ✏️ {t('editProfile_btn', 'Edit Profile')}
                        </button>
                    </motion.div>

                    {/* Success Message */}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 rounded-xl bg-success/10 border border-success/20 text-success"
                        >
                            ✅ {success}
                        </motion.div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Personal Info Card */}
                        <GlassCard className="p-6">
                            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                <span>👤</span> {t('personalInfo_title', 'Personal Information')}
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-foreground-muted">{t('name_label', 'Name')}</span>
                                    <span className="font-medium text-foreground">{user?.name}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-foreground-muted">{t('email_label', 'Email')}</span>
                                    <span className="font-medium text-foreground">{user?.email}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-foreground-muted">{t('phone_label', 'Phone')}</span>
                                    <span className="font-medium text-foreground">{formData.phone || 'Not set'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-foreground-muted">{t('cnic_label', 'CNIC')}</span>
                                    <span className="font-medium text-foreground">{formData.cnic || 'Not set'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-foreground-muted">{t('dob_label', 'Date of Birth')}</span>
                                    <span className="font-medium text-foreground">{formData.dateOfBirth || 'Not set'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-foreground-muted">{t('gender_label', 'Gender')}</span>
                                    <span className="font-medium text-foreground capitalize">{formData.gender || 'Not set'}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-foreground-muted">{t('address_label', 'Address')}</span>
                                    <span className="font-medium text-foreground text-right max-w-[200px]">{formData.address || 'Not set'}</span>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Medical Info Card */}
                        <GlassCard className="p-6">
                            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                <span>🏥</span> {t('medicalInfo_title', 'Medical Information')}
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-foreground-muted">{t('bloodGroup_label', 'Blood Group')}</span>
                                    <span className="font-medium text-foreground">{formData.bloodGroup || 'Not set'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-foreground-muted">{t('height_label', 'Height')}</span>
                                    <span className="font-medium text-foreground">{formData.height ? `${formData.height} cm` : 'Not set'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-foreground-muted">{t('weight_label', 'Weight')}</span>
                                    <span className="font-medium text-foreground">{formData.weight ? `${formData.weight} kg` : 'Not set'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-foreground-muted">{t('allergies_label', 'Allergies')}</span>
                                    <span className="font-medium text-foreground">{formData.allergies || 'None'}</span>
                                </div>
                                <div className="pt-4 border-t border-white/[0.06] mt-4">
                                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                        <span>🆘</span> {t('emergencyContact_title', 'Emergency Contact')}
                                    </h3>
                                    <div className="flex justify-between py-2">
                                        <span className="text-foreground-muted">{t('emergencyPhone_label', 'Phone')}</span>
                                        <span className="font-medium text-foreground">{formData.emergencyContactPhone || 'Not set'}</span>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Preferences Card */}
                    <div className="mt-6">
                        <GlassCard className="p-6">
                            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                <span>⚙️</span> {t('preferences_title', 'Preferences')}
                            </h2>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-foreground-muted font-medium">{t('appLanguage_label', 'Application Language')}</span>
                                <LanguageSwitcher />
                            </div>
                        </GlassCard>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-8 flex flex-wrap gap-4">
                        <Link
                            to="/patient/find-doctors"
                            className="px-6 py-3 bg-accent hover:bg-accent-hover text-white font-bold rounded-xl transition-colors"
                        >
                            Find Doctors
                        </Link>
                        <Link
                            to="/patient/appointments"
                            className="px-6 py-3 bg-accent hover:bg-accent-hover text-white font-bold rounded-xl transition-colors"
                        >
                            My Appointments
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Show edit form
    return (
        <div className="min-h-screen bg-surface p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 flex items-center justify-between"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            {isProfileComplete ? t('editProfile_btn', 'Edit Profile') : 'Complete Your Profile'}
                        </h1>
                        <p className="text-foreground-muted">
                            {isProfileComplete
                                ? t('profile_subtitle', 'Update your personal and medical information')
                                : 'Please complete your profile to start booking appointments'}
                        </p>
                    </div>
                    {isProfileComplete && (
                        <button
                            onClick={() => setShowEditForm(false)}
                            className="px-6 py-3 bg-surface-secondary hover:bg-surface-tertiary text-foreground-muted font-bold rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                </motion.div>

                {/* Profile Completion Banner */}
                {!isProfileComplete && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                    >
                        <GlassCard className="p-6 border-l-4 border-l-warning bg-warning/10">
                            <div className="flex items-start gap-4">
                                <div className="text-3xl">⚠️</div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-warning mb-1">Profile Incomplete</h3>
                                    <p className="text-warning text-sm mb-3">
                                        Complete your medical profile to book appointments with doctors.
                                    </p>
                                    <div className="w-full bg-warning/20 rounded-full h-2">
                                        <div
                                            className="bg-warning h-2 rounded-full transition-all"
                                            style={{ width: `${completionPercentage}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-warning mt-1">{completionPercentage}% complete</p>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}

                {/* Success/Error Messages */}
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 rounded-xl bg-success/10 border border-success/20 text-success"
                    >
                        ✅ {success}
                    </motion.div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error"
                    >
                        ❌ {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Personal Information */}
                        <GlassCard className="p-6">
                            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                <span>👤</span> {t('personalInfo_title', 'Personal Information')}
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground-muted">
                                        {t('name_label', 'Full Name')}
                                    </label>
                                    <input
                                        type="text"
                                        value={user?.name || ''}
                                        disabled
                                        className="w-full px-4 py-3 rounded-xl bg-surface-secondary/80 border border-white/[0.06] text-foreground-subtle"
                                    />
                                    <p className="text-xs text-foreground-subtle mt-1">Contact support to change name</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground-muted">
                                        {t('email_label', 'Email')}
                                    </label>
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="w-full px-4 py-3 rounded-xl bg-surface-secondary/80 border border-white/[0.06] text-foreground-subtle"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground-muted">
                                        {t('phone_label', 'Phone Number')} <span className="text-error">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="03001234567"
                                        required
                                        className="w-full border border-white/[0.14] rounded-xl px-4 py-2 focus:ring-2 focus:ring-accent focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground-muted">
                                        {t('cnic_label', 'CNIC')} <span className="text-error">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="cnic"
                                        value={formData.cnic}
                                        onChange={handleChange}
                                        placeholder="12345-1234567-1"
                                        required
                                        className="w-full border border-white/[0.14] rounded-xl px-4 py-2 focus:ring-2 focus:ring-accent focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground-muted">
                                        {t('dob_label', 'Date of Birth')} <span className="text-error">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-white/[0.14] rounded-xl px-4 py-2 focus:ring-2 focus:ring-accent focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground-muted">
                                        {t('gender_label', 'Gender')}
                                    </label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="w-full border border-white/[0.14] rounded-xl px-4 py-2 focus:ring-2 focus:ring-accent focus:border-transparent"
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground-muted">
                                        {t('address_label', 'Address')} <span className="text-error">*</span>
                                    </label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="House #, Street, City"
                                        required
                                        rows={2}
                                        className="w-full border border-white/[0.14] rounded-xl px-4 py-2 focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
                                    />
                                </div>
                            </div>
                        </GlassCard>

                        {/* Medical Information */}
                        <GlassCard className="p-6">
                            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                <span>🏥</span> {t('medicalInfo_title', 'Medical Information')}
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground-muted">
                                        {t('bloodGroup_label', 'Blood Group')}
                                    </label>
                                    <select
                                        name="bloodGroup"
                                        value={formData.bloodGroup}
                                        onChange={handleChange}
                                        className="w-full border border-white/[0.14] rounded-xl px-4 py-2 focus:ring-2 focus:ring-accent focus:border-transparent"
                                    >
                                        <option value="">Select Blood Group</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-foreground-muted">
                                            {t('height_label', 'Height')} (cm)
                                        </label>
                                        <input
                                            type="number"
                                            name="height"
                                            value={formData.height}
                                            onChange={handleChange}
                                            placeholder="175"
                                            className="w-full border border-white/[0.14] rounded-xl px-4 py-2 focus:ring-2 focus:ring-accent focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-foreground-muted">
                                            {t('weight_label', 'Weight')} (kg)
                                        </label>
                                        <input
                                            type="number"
                                            name="weight"
                                            value={formData.weight}
                                            onChange={handleChange}
                                            placeholder="70"
                                            className="w-full border border-white/[0.14] rounded-xl px-4 py-2 focus:ring-2 focus:ring-accent focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground-muted">
                                        {t('allergies_label', 'Allergies')}
                                    </label>
                                    <input
                                        type="text"
                                        name="allergies"
                                        value={formData.allergies}
                                        onChange={handleChange}
                                        placeholder="Peanuts, Penicillin (comma separated)"
                                        className="w-full border border-white/[0.14] rounded-xl px-4 py-2 focus:ring-2 focus:ring-accent focus:border-transparent"
                                    />
                                </div>

                                <div className="pt-4 border-t border-white/5">
                                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                        <span>🆘</span> {t('emergencyContact_title', 'Emergency Contact')}
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-foreground-muted">
                                                {t('emergencyName_label', 'Contact Name')}
                                            </label>
                                            <input
                                                type="text"
                                                name="emergencyContactName"
                                                value={formData.emergencyContactName}
                                                onChange={handleChange}
                                                placeholder="Family member name"
                                                className="w-full border border-white/[0.14] rounded-xl px-4 py-2 focus:ring-2 focus:ring-accent focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-foreground-muted">
                                                {t('emergencyPhone_label', 'Contact Phone')} <span className="text-error">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                name="emergencyContactPhone"
                                                value={formData.emergencyContactPhone}
                                                onChange={handleChange}
                                                placeholder="03001234567"
                                                required
                                                className="w-full border border-white/[0.14] rounded-xl px-4 py-2 focus:ring-2 focus:ring-accent focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Submit Button */}
                    <div className="mt-6 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className={`px-8 py-4 rounded-xl font-bold text-lg bg-accent hover:bg-accent-hover text-white transition-all ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {saving ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Saving...
                                </span>
                            ) : (
                                isProfileComplete ? t('updateProfile_btn', 'Update Profile') : 'Complete Profile'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileSettings;
