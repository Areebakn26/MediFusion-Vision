import { Link } from 'react-router-dom';
import { FaLock, FaArrowLeft } from 'react-icons/fa';

const AccessDenied = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
            <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
                <FaLock className="text-4xl" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">403</h1>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Access Denied</h2>
            <p className="text-gray-500 max-w-md mb-8">
                You do not have permission to view this page. Please contact your administrator if you believe this is an error.
            </p>
            <Link
                to="/"
                className="flex items-center bg-gray-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-900 transition-all shadow-lg"
            >
                <FaArrowLeft className="mr-2" /> Go Back
            </Link>
        </div>
    );
};

export default AccessDenied;
