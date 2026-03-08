import { Link } from 'react-router-dom';
import { FaExclamationTriangle, FaHome } from 'react-icons/fa';

const NotFound = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
            <div className="w-24 h-24 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-6">
                <FaExclamationTriangle className="text-5xl" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Page Not Found</h2>
            <p className="text-gray-500 max-w-md mb-8">
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <Link
                to="/"
                className="flex items-center bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-200"
            >
                <FaHome className="mr-2" /> Go to Home
            </Link>
        </div>
    );
};

export default NotFound;
