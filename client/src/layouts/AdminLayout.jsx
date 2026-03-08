import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-gray-900 text-white flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-blue-400">MediFusion Admin</h1>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    <Link to="/admin/dashboard" className="block px-4 py-3 rounded hover:bg-gray-800 transition-colors">
                        Dashboard
                    </Link>
                    <Link to="/admin/verification" className="block px-4 py-3 rounded hover:bg-gray-800 transition-colors">
                        Doctor Verification
                    </Link>
                    <Link to="/admin/users" className="block px-4 py-3 rounded hover:bg-gray-800 transition-colors">
                        User Management
                    </Link>
                    <Link to="/admin/scans" className="block px-4 py-3 rounded hover:bg-gray-800 transition-colors">
                        Scan Repository
                    </Link>
                    <Link to="/admin/reports" className="block px-4 py-3 rounded hover:bg-gray-800 transition-colors">
                        Reports & Analytics
                    </Link>
                </nav>
                <div className="p-4 border-t border-gray-800">
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-400 hover:text-red-300">
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <header className="bg-white shadow-sm p-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">Admin Portal</h2>
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-600">Administrator</span>
                        <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
                    </div>
                </header>
                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
