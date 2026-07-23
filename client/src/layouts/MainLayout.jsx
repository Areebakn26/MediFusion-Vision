import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AnimatedLogo } from '../components/brand';
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
    FaChartLine
} from 'react-icons/fa';
import { useState, useEffect } from 'react';
import NotificationBell from '../components/NotificationBell';

const MainLayout = () => {
    const { user, logout } = useAuth();
    const { t, language, toggleLanguage } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const { scrollY } = useScroll();
    const navOpacity = useTransform(scrollY, [0, 100], [0, 1]);
    const navBlur = useTransform(scrollY, [0, 100], ['0px', '12px']);
    const navBgOpacity = useTransform(scrollY, [0, 100], [0, 0.9]);

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

        if (window.innerWidth >= 768) {
            setIsSidebarOpen(false);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isSidebarOpen]);

    useEffect(() => {
        if (window.innerWidth >= 768) {
            setIsSidebarOpen(false);
        }

        const removeOverlays = () => {
            document.querySelectorAll('.fixed.inset-0').forEach(el => {
                const style = window.getComputedStyle(el);
                if (style.backgroundColor.includes('rgba(0, 0, 0') &&
                    !el.closest('[data-modal-open="true"]')) {
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

    useEffect(() => {
        const removeBlockers = () => {
            document.querySelectorAll('*').forEach(el => {
                const style = window.getComputedStyle(el);
                if (style.position === 'fixed' || style.position === 'absolute') {
                    const zIndex = parseInt(style.zIndex) || 0;
                    const rect = el.getBoundingClientRect();

                    if ((rect.width > window.innerWidth * 0.5 || rect.height > window.innerHeight * 0.5) &&
                        zIndex > 20 && zIndex < 10000) {
                        const bg = style.backgroundColor;
                        const isTransparent = !bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)';
                        const hasBackdrop = style.backdropFilter || style.webkitBackdropFilter;

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

            document.body.style.pointerEvents = 'auto';
            document.documentElement.style.pointerEvents = 'auto';
        };

        removeBlockers();
    }, []);

    return (
        <div className="flex h-screen bg-surface text-foreground font-sans relative overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && window.innerWidth < 768 && (
                <div
                    className="fixed inset-0 bg-surface/80 backdrop-blur-sm z-20 md:hidden"
                    onClick={toggleSidebar}
                    aria-hidden="true"
                    style={{ pointerEvents: 'auto' }}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-surface-secondary border-r border-white/[0.06] transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
                <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                    <div className="flex items-center space-x-2">
                        <AnimatedLogo size={32} />
                        <span className="text-lg font-light text-foreground tracking-wide">MediFusion <span className="text-accent font-normal">Vision</span></span>
                    </div>
                    <button className="md:hidden text-foreground-muted hover:text-foreground transition-colors" onClick={toggleSidebar}>
                        <FaTimes />
                    </button>
                </div>

                <nav className="p-4 space-y-1 mt-2">
                    {links.map((link) => {
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                                    isActive
                                        ? 'bg-accent-subtle text-accent font-medium'
                                        : link.highlight
                                            ? 'text-accent bg-accent-subtle/50 hover:bg-accent-subtle font-medium'
                                            : 'text-foreground-muted hover:bg-surface-tertiary hover:text-foreground'
                                }`}
                            >
                                <span className={`text-lg ${isActive ? 'text-accent' : link.highlight ? 'text-accent' : 'text-foreground-muted'}`}>
                                    {link.icon}
                                </span>
                                <span>{link.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-white/[0.06] bg-surface">
                    <div className="flex items-center space-x-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-accent-subtle flex items-center justify-center text-accent font-bold">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                            <p className="text-xs text-foreground-muted capitalize">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center w-full space-x-2 bg-surface-secondary border border-white/[0.06] text-foreground-muted px-4 py-2.5 rounded-xl hover:bg-error/10 hover:text-error hover:border-error/20 transition-all duration-200"
                    >
                        <FaSignOutAlt />
                        <span>{t('logout')}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header
                  style={{
                    backgroundColor: `rgba(15, 23, 42, ${navBgOpacity})`,
                    backdropFilter: `blur(${navBlur})`,
                    borderBottomColor: `rgba(255, 255, 255, ${0.06})`,
                  }}
                  className="border-b border-white/[0.06] p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-50"
                >
                    <div className="flex items-center max-w-7xl mx-auto">
                        <button onClick={toggleSidebar} className="md:hidden text-foreground-muted hover:text-foreground p-2 rounded-lg hover:bg-surface-tertiary mr-3 transition-colors">
                            <FaBars className="text-xl" />
                        </button>
                        <h2 className="text-xl font-light text-foreground hidden md:block">{t('welcome')}</h2>
                    </div>

                    <div className="flex items-center space-x-3">
                        {/* Language Toggle */}
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-surface-tertiary hover:bg-surface-elevated text-foreground-muted hover:text-foreground transition-colors"
                        >
                            <FaGlobe />
                            <span className="text-sm font-medium">{language === 'en' ? 'English' : 'اردو'}</span>
                        </button>

                        {/* Notifications */}
                        <NotificationBell />
                    </div>
                </header>

                {/* Page Content */}
                <main
                    className="flex-1 overflow-y-auto p-4 md:p-8 bg-surface pt-20"
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
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          >
                            <Outlet />
                          </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
