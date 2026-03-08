import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import VerificationBanner from './VerificationBanner';

const DoctorVerificationGuard = ({ children }) => {
    const { user } = useAuth();
    const location = useLocation();
    const [verificationStatus, setVerificationStatus] = useState('pending');
    const [profileComplete, setProfileComplete] = useState(null); // null = checking, true/false = result
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'doctor') {
            setLoading(false);
            return;
        }
        
        // Fetch verification status
        const fetchStatus = async () => {
            try {
                const { data } = await api.get('/auth/me');
                const profile = data.profile;
                if (profile) {
                    const status = profile.verification_status || 'pending';
                    setVerificationStatus(status);
                    const isComplete = profile.pmdc_number && profile.specialization && profile.consultation_fee;
                    console.log('DoctorVerificationGuard - Profile check:', {
                        hasProfile: !!profile,
                        pmdc: !!profile.pmdc_number,
                        specialization: !!profile.specialization,
                        fee: !!profile.consultation_fee,
                        isComplete,
                        status
                    });
                    setProfileComplete(isComplete);
                } else {
                    console.log('DoctorVerificationGuard - No profile found');
                    setProfileComplete(false);
                    setVerificationStatus('pending');
                }
            } catch (err) {
                console.error('Error checking verification:', err);
                // On error, don't assume incomplete - might be network issue
                // Only set to false if we're sure there's no profile
                if (err.response?.status === 404) {
                    setProfileComplete(false);
                }
                setVerificationStatus('pending');
            } finally {
                setLoading(false);
            }
        };
        
        fetchStatus();
    }, [user, location.pathname]); // Re-check when pathname changes

    // Profile page is always accessible
    const isProfilePage = location.pathname.includes('/profile');
    
    // Dashboard is always accessible
    const isDashboard = location.pathname.includes('/dashboard');
    
    // Show loading only if we're still checking AND not on allowed pages
    if (loading && profileComplete === null && !isProfilePage && !isDashboard) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-500 text-sm">Loading...</p>
                </div>
            </div>
        );
    }
    
    // ONLY redirect if profile is definitely incomplete (false) AND not on profile/dashboard
    // If profileComplete is null (still checking) or true, don't redirect
    // This prevents redirects during the initial check
    if (profileComplete === false && !isProfilePage && !isDashboard) {
        console.log('DoctorVerificationGuard - Redirecting to profile (incomplete)', {
            profileComplete,
            isProfilePage,
            isDashboard,
            pathname: location.pathname
        });
        return <Navigate to="/doctor/profile" replace />;
    }
    
    // If profile is complete (true) or still checking (null), allow access
    // Profile page and dashboard are always accessible

    // Show verification banner on ALL pages if not approved
    const showBanner = !loading && verificationStatus !== 'approved';

    // If verified, allow full access to all pages
    // If not verified but profile complete, allow access but show banner
    // If profile not complete, redirect to profile page (except profile/dashboard)
    
    // Always render children - never block
    return (
        <>
            {showBanner && <VerificationBanner status={verificationStatus} role="doctor" />}
            {children}
        </>
    );
};

export default DoctorVerificationGuard;
