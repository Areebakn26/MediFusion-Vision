import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { AnimatedLogo } from '../components/brand';
import NotificationBell from '../components/NotificationBell';

const AdminLayout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const adminLinks = [
        { path: '/admin/dashboard', label: 'Dashboard' },
        { path: '/admin/verification', label: 'Doctor Verification' },
        { path: '/admin/users', label: 'User Management' },
        { path: '/admin/scan-repository', label: 'Scan Repository' },
        { path: '/admin/feedback', label: 'AI Feedback Loop' },
        { path: '/admin/doctors', label: 'Doctors' },
    ];

    return (
        <div className="flex h-screen bg-surface text-foreground font-sans">
            {/* Sidebar */}
            <div className="w-64 bg-surface-secondary border-r border-white/[0.06] flex flex-col shrink-0">
                <div className="p-6 border-b border-white/[0.06]">
                    <Link to="/admin/dashboard" className="flex items-center gap-3">
                        <AnimatedLogo size={32} animate={false} />
                        <span className="text-lg font-light tracking-wide">
                            MediFusion <span className="text-accent font-normal">Admin</span>
                        </span>
                    </Link>
                </div>
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {adminLinks.map((link) => {
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`block px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                                    isActive
                                        ? 'bg-accent-subtle text-accent font-medium'
                                        : 'text-foreground-muted hover:bg-surface-tertiary hover:text-foreground'
                                }`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-white/[0.06]">
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-foreground-muted hover:bg-error/10 hover:text-error transition-all duration-200"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-surface-secondary/80 backdrop-blur-[12px] border-b border-white/[0.06] p-4 flex justify-between items-center">
                    <h2 className="text-xl font-light text-foreground">Admin Portal</h2>
                    <div className="flex items-center space-x-4">
                        <NotificationBell />
                        <span className="text-sm text-foreground-muted">Administrator</span>
                        <div className="h-8 w-8 rounded-full bg-accent-subtle flex items-center justify-center text-accent text-sm font-medium">
                            A
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-surface">
                    <div className="max-w-7xl mx-auto">
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

export default AdminLayout;
