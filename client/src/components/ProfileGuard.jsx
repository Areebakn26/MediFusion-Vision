import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ProfileGuard = ({ children }) => {
    const { user } = useAuth();
    const location = useLocation();
    const [profileComplete, setProfileComplete] = useState(null); // null = checking, true/false = result
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        // Check profile completion
        const checkProfile = async () => {
            try {
                const { data } = await api.get('/auth/me');
                
                if (user.role === 'patient') {
                    const profile = data.profile;
                    const isComplete = profile && profile.cnic && profile.date_of_birth && profile.address && profile.emergency_contact_phone;
                    setProfileComplete(isComplete);
                } else if (user.role === 'doctor') {
                    const profile = data.profile;
                    // Doctor profile is complete if has required fields
                    const isComplete = profile && profile.pmdc_number && profile.specialization && profile.consultation_fee;
                    console.log('ProfileGuard - Doctor profile check:', { 
                        hasProfile: !!profile, 
                        pmdc: !!profile?.pmdc_number, 
                        specialization: !!profile?.specialization, 
                        fee: !!profile?.consultation_fee,
                        isComplete 
                    });
                    setProfileComplete(isComplete);
                } else {
                    setProfileComplete(true); // Admin doesn't need profile
                }
            } catch (err) {
                console.error('Error checking profile:', err);
                // On error, assume incomplete to be safe
                setProfileComplete(false);
            } finally {
                setLoading(false);
            }
        };
        
        checkProfile();
    }, [user, location.pathname]); // Re-check when pathname changes

    // Profile settings page is always accessible
    const isProfilePage = location.pathname.includes('/profile') || location.pathname.includes('/settings');
    
    // Show loading while checking (only briefly)
    if (loading && profileComplete === null) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-500 text-sm">Loading...</p>
                </div>
            </div>
        );
    }
    
    // If profile not complete and not on profile page, redirect
    if (profileComplete === false && !isProfilePage) {
        console.log('ProfileGuard - Redirecting to profile page');
        return <Navigate to={user?.role === 'patient' ? '/patient/profile' : '/doctor/profile'} replace />;
    }

    // Profile complete or on profile page - allow access
    return children;
};

export default ProfileGuard;
