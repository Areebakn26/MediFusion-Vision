import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
    FaHome,
    FaUserMd,
    FaCalendarAlt,
    FaFileUpload,
    FaSignOutAlt,
    FaBars,
    FaTimes,
    FaFileMedical,
    FaCreditCard,
    FaQuestionCircle,
    FaGlobe,
    FaUserCog,
    FaChartLine,
    FaTools
} from 'react-icons/fa';
import { useState, useEffect } from 'react';

const MainLayout = () => {
    const { user, logout } = useAuth();
    const { t, language, toggleLanguage } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const patientLinks = [
        { path: '/patient/dashboard', label: t('dashboard'), icon: <FaHome /> },
        { path: '/patient/profile', label: t('profile'), icon: <FaUserCog />, highlight: true },
        { path: '/patient/book-appointment', label: t('bookAppointment', 'Book Appointment'), icon: <FaCalendarAlt /> },
        { path: '/patient/appointments', label: t('appointments'), icon: <FaUserMd /> },
        { path: '/patient/find-doctors', label: t('findDoctors', 'Find Doctors'), icon: <FaUserMd /> },
        { path: '/patient/upload-scan', label: t('uploadScan', 'Upload Scan'), icon: <FaFileUpload /> },
        { path: '/patient/scans', label: t('scans'), icon: <FaFileMedical /> },
        { path: '/patient/records', label: t('medicalRecords_title', 'Medical Records'), icon: <FaFileMedical /> },
        { path: '/patient/billing', label: t('billing', 'Billing'), icon: <FaCreditCard /> },
        { path: '/patient/support', label: t('support', 'Support'), icon: <FaQuestionCircle /> },
    ];

    const doctorLinks = [
        { path: '/doctor/dashboard', label: t('dashboard'), icon: <FaHome /> },
        { path: '/doctor/profile', label: t('profile'), icon: <FaUserCog />, highlight: true },
        { path: '/doctor/appointments', label: t('appointments'), icon: <FaCalendarAlt /> },
        { path: '/doctor/patients', label: t('patients', 'Patients'), icon: <FaUserMd /> },
        { path: '/doctor/diagnostic', label: t('diagnostics', 'Diagnostics'), icon: <FaFileUpload /> },
        { path: '/doctor/analytics', label: t('analytics', 'Analytics'), icon: <FaChartLine /> },
        { path: '/doctor/tools', label: t('medicalTools', 'Medical Tools'), icon: <FaTools /> },
    ];

    const adminLinks = [
        { path: '/admin/dashboard', label: t('dashboard'), icon: <FaHome /> },
        { path: '/admin/verification', label: t('verificationQueue', 'Verification Queue'), icon: <FaUserCog /> },
        { path: '/admin/users', label: t('users', 'Users'), icon: <FaUserMd /> },
        { path: '/admin/doctors', label: t('doctors', 'Doctors'), icon: <FaUserMd /> },
    ];

    let links = [];
    if (user?.role === 'patient') links = patientLinks;
    else if (user?.role === 'doctor') links = doctorLinks;
    else if (user?.role === 'admin') links = adminLinks;

    // Close sidebar on desktop resize and ESC key
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768 && isSidebarOpen) {
                setIsSidebarOpen(false);
            }
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape' && isSidebarOpen) {
                setIsSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('keydown', handleEscape);

        // Close on mount if desktop
        if (window.innerWidth >= 768) {
            setIsSidebarOpen(false);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isSidebarOpen]);

    // Force close sidebar overlay on desktop and ensure it's not blocking
    useEffect(() => {
        if (window.innerWidth >= 768) {
            setIsSidebarOpen(false);
        }

        // Remove any stuck overlays
        const removeOverlays = () => {
            document.querySelectorAll('.fixed.inset-0').forEach(el => {
                const style = window.getComputedStyle(el);
                if (style.backgroundColor.includes('rgba(0, 0, 0') &&
                    !el.closest('[data-modal-open="true"]')) {
                    // Only remove if it's a backdrop without a modal
                    const hasModal = document.querySelector('[class*="modal"], [class*="Modal"]');
                    if (!hasModal || window.getComputedStyle(hasModal).display === 'none') {
                        el.style.display = 'none';
                    }
                }
            });
        };

        removeOverlays();
        setTimeout(removeOverlays, 500);
    }, []);

    // Remove any invisible blockers on mount
    useEffect(() => {
        const removeBlockers = () => {
            document.querySelectorAll('*').forEach(el => {
                const style = window.getComputedStyle(el);
                if (style.position === 'fixed' || style.position === 'absolute') {
                    const zIndex = parseInt(style.zIndex) || 0;
                    const rect = el.getBoundingClientRect();

                    // If it covers most of the screen and is transparent/backdrop
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
            });

            // Force enable pointer events
            document.body.style.pointerEvents = 'auto';
            document.documentElement.style.pointerEvents = 'auto';
        };

        // Run once on mount
        removeBlockers();
    }, []);

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 relative overflow-hidden" style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1 }}>
            {/* Mobile Sidebar Overlay - Only on mobile and when sidebar is open */}
            {isSidebarOpen && window.innerWidth < 768 && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={toggleSidebar}
                    aria-hidden="true"
                    style={{ pointerEvents: 'auto' }}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">M</div>
                        <span className="text-xl font-bold text-gray-800 tracking-tight">MediFusion</span>
                    </div>
                    <button className="md:hidden text-gray-500" onClick={toggleSidebar}>
                        <FaTimes />
                    </button>
                </div>

                <nav className="p-4 space-y-2 mt-4">
                    {links.map((link) => {
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-teal-50 text-teal-700 font-semibold shadow-sm'
                                    : link.highlight
                                        ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 font-medium'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <span className={`text-lg ${isActive ? 'text-teal-600' : link.highlight ? 'text-blue-500' : 'text-gray-400'}`}>{link.icon}</span>
                                <span>{link.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-gray-100 bg-gray-50">
                    <div className="flex items-center space-x-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-gray-800 truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center w-full space-x-2 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all duration-200 shadow-sm"
                    >
                        <FaSignOutAlt />
                        <span>{t('logout')}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white shadow-sm border-b border-gray-100 p-4 flex justify-between items-center">
                    <div className="flex items-center">
                        <button onClick={toggleSidebar} className="md:hidden text-gray-600 p-2 rounded-lg hover:bg-gray-100 mr-4">
                            <FaBars className="text-xl" />
                        </button>
                        <h2 className="text-xl font-semibold text-gray-800 hidden md:block">{t('welcome')}</h2>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Language Toggle */}
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                        >
                            <FaGlobe />
                            <span className="font-medium">{language === 'en' ? 'English' : 'اردو'}</span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main
                    className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50"
                    style={{
                        pointerEvents: 'auto',
                        position: 'relative',
                        zIndex: 100,
                        overflowY: 'auto',
                        overflowX: 'hidden'
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div
                        className="max-w-7xl mx-auto"
                        style={{
                            pointerEvents: 'auto',
                            position: 'relative',
                            zIndex: 101
                        }}
                    >
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
