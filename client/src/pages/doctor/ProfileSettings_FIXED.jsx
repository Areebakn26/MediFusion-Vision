import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getMe, updateProfile } from '../../services/api';
import { GlassCard } from '../../components/ui';

const DoctorProfileSettings = () => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [verificationStatus, setVerificationStatus] = useState('pending');
    const [isProfileComplete, setIsProfileComplete] = useState(false);

    const [formData, setFormData] = useState({
        phone: '',
        pmdcNumber: '',
        specialization: '',
        experience: '',
        consultationFee: '',
        bio: '',
        medicalCollege: '',
        passingYear: '',
        workingHours: '',
    });

    const specializations = [
        'Cardiologist', 'Neurologist', 'Ophthalmologist', 'Dermatologist',
        'Orthopedic', 'Pediatrician', 'Psychiatrist', 'Radiologist',
        'General Physician', 'ENT Specialist', 'Oncologist', 'Pulmonologist',
        'Gastroenterologist', 'Nephrologist', 'Endocrinologist', 'Other'
    ];

    // Fetch profile on mount
    useEffect(() => {
        fetchProfile();
    }, []);

    // Continuous blocker removal - runs every 2 seconds
    useEffect(() => {
        const removeBlockers = () => {
            // Remove any invisible overlays
            document.querySelectorAll('*').forEach(el => {
                const style = window.getComputedStyle(el);
                if (style.position === 'fixed' || style.position === 'absolute') {
                    const zIndex = parseInt(style.zIndex) || 0;
                    const rect = el.getBoundingClientRect();
                    
                    // If it covers most of screen and has z-index > 20
                    if ((rect.width > window.innerWidth * 0.5 || rect.height > window.innerHeight * 0.5) && 
                        zIndex > 20 && zIndex < 10000) {
                        const bg = style.backgroundColor;
                        const isTransparent = !bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)';
                        const hasBackdrop = style.backdropFilter || style.webkitBackdropFilter;
                        
                        // Don't remove sidebar, accessibility tools, or active modals
                        const isSidebar = el.closest('aside');
                        const isAccessibility = el.closest('[class*="Accessibility"]');
                        const isActiveModal = el.closest('[role="dialog"]') && 
                            window.getComputedStyle(el.closest('[role="dialog"]')).display !== 'none';
                        
                        if ((isTransparent || hasBackdrop) && !isSidebar && !isAccessibility && !isActiveModal) {
                            el.remove();
                        }
                    }
                }
                
                // Force enable pointer events
                if (style.pointerEvents === 'none') {
                    el.style.pointerEvents = 'auto';
                }
            });
            
            // Force enable body and html
            document.body.style.pointerEvents = 'auto';
            document.documentElement.style.pointerEvents = 'auto';
        };
        
        // Run immediately and then every 2 seconds
        removeBlockers();
        const interval = setInterval(removeBlockers, 2000);
        
        return () => clearInterval(interval);
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        setError('');
        
        const timeoutId = setTimeout(() => {
            setLoading(false);
            setError('Loading timed out. Please refresh the page.');
        }, 10000);
        
        try {
            const { data } = await getMe();
            clearTimeout(timeoutId);
            console.log('Doctor profile data:', data);
            
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
                    workingHours: profile.working_hours ? JSON.stringify(profile.working_hours) : '',
                });
                setVerificationStatus(profile.verification_status || 'pending');
                
                const complete = profile.pmdc_number && profile.specialization && profile.consultation_fee && profile.medical_college;
                setIsProfileComplete(complete);
            } else {
                setIsProfileComplete(false);
            }
        } catch (err) {
            clearTimeout(timeoutId);
            console.error('Error fetching profile:', err);
            setError('Failed to load profile. You can still edit your profile.');
            setIsProfileComplete(false);
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
            const profileData = {
                phone: formData.phone,
                pmdcNumber: formData.pmdcNumber,
                specialization: formData.specialization,
                experience: parseInt(formData.experience) || 0,
                consultationFee: parseFloat(formData.consultationFee) || 0,
                bio: formData.bio,
                medicalCollege: formData.medicalCollege,
                passingYear: parseInt(formData.passingYear) || null,
            };
            
            const response = await updateProfile(profileData);
            setSuccess('Profile updated successfully!');
            setIsProfileComplete(true);
            
            if (updateUser) {
                updateUser({ profileComplete: true });
            }
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Profile update error:', err);
            setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const getVerificationBadge = () => {
        switch (verificationStatus) {
            case 'approved':
                return (
                    <div className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-full">
                        <span className="text-lg">✅</span>
                        <span className="font-semibold">Verified Doctor</span>
                    </div>
                );
            case 'rejected':
                return (
                    <div className="flex items-center gap-2 px-4 py-2 bg-error/10 text-error rounded-full">
                        <span className="text-lg">❌</span>
                        <span className="font-semibold">Verification Rejected</span>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center gap-2 px-4 py-2 bg-warning/10 text-warning rounded-full">
                        <span className="text-lg">⏳</span>
                        <span className="font-semibold">Pending Verification</span>
                    </div>
                );
        }
    };

    const requiredFields = ['pmdcNumber', 'specialization', 'consultationFee', 'medicalCollege', 'experience'];
    const filledRequired = requiredFields.filter(f => formData[f]).length;
    const completionPercentage = Math.round((filledRequired / requiredFields.length) * 100);

    return (
        <div 
            className="min-h-screen bg-surface p-6" 
            style={{ 
                pointerEvents: 'auto', 
                position: 'relative', 
                zIndex: 100  // HIGH z-index to stay above blockers
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div 
                className="max-w-4xl mx-auto" 
                style={{ 
                    pointerEvents: 'auto',
                    position: 'relative',
                    zIndex: 101  // Even higher
                }}
            >
                {/* Rest of your JSX here - same as your code */}
                {/* Header, Verification Status, Form, etc. */}
            </div>
        </div>
    );
};

export default DoctorProfileSettings;

