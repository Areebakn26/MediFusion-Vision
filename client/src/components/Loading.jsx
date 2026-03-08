import { FaSpinner } from 'react-icons/fa';

const Loading = ({ fullScreen = true, text = "Loading..." }) => {
    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                <FaSpinner className="text-5xl text-teal-600 animate-spin mb-4" />
                <p className="text-gray-600 font-medium animate-pulse">{text}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-8">
            <FaSpinner className="text-3xl text-teal-600 animate-spin mb-2" />
            <p className="text-sm text-gray-500">{text}</p>
        </div>
    );
};

export default Loading;
