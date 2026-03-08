import { Link } from 'react-router-dom';


import { FaBrain, FaEye, FaUserMd, FaArrowRight, FaCheckCircle } from 'react-icons/fa';

const Home = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 overflow-hidden">
            {/* Navbar Placeholder (if not using MainLayout) */}
            <nav className="absolute top-0 left-0 w-full p-6 z-50">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                            M
                        </div>
                        <span className="text-2xl font-bold text-gray-800 tracking-tight">MediFusion<span className="text-teal-600">Vision</span></span>
                    </div>
                    <div className="hidden md:flex space-x-8">
                        <Link to="/login" className="text-gray-600 font-medium hover:text-teal-600 transition-colors">Login</Link>
                        <Link to="/register" className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-200">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="animate-slide-up">
                            <div className="inline-flex items-center px-4 py-2 rounded-full bg-teal-50 border border-teal-100 text-teal-700 font-semibold text-sm mb-6">
                                <span className="w-2 h-2 bg-teal-500 rounded-full mr-2 animate-pulse"></span>
                                AI-Powered Diagnostics v2.0 Live
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 leading-tight mb-6">
                                Future of <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">Medical AI</span>
                            </h1>
                            <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-lg">
                                Experience the next generation of healthcare with our advanced AI models for early detection of neurological and retinal conditions.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link to="/register" className="flex items-center justify-center px-8 py-4 bg-teal-600 text-white rounded-2xl font-bold text-lg hover:bg-teal-700 transition-all shadow-xl shadow-teal-200 hover:scale-105 transform">
                                    Start Free Trial <FaArrowRight className="ml-2" />
                                </Link>
                                <Link to="/login" className="flex items-center justify-center px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all hover:border-gray-300">
                                    Doctor Login
                                </Link>
                            </div>

                            <div className="mt-12 flex items-center space-x-8 text-gray-500 text-sm font-medium">
                                <div className="flex items-center"><FaCheckCircle className="text-teal-500 mr-2" /> HIPAA Compliant</div>
                                <div className="flex items-center"><FaCheckCircle className="text-teal-500 mr-2" /> 99.8% Accuracy</div>
                                <div className="flex items-center"><FaCheckCircle className="text-teal-500 mr-2" /> Instant Results</div>
                            </div>
                        </div>

                        <div className="relative lg:h-[600px] animate-fade-in delay-200 hidden lg:block">
                            {/* Abstract decorative elements */}
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
                            <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow delay-300"></div>

                            {/* Glass Cards */}
                            <div className="absolute top-10 right-10 bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/50 w-72 transform rotate-6 hover:rotate-0 transition-all duration-500">
                                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 text-2xl mb-4">
                                    <FaBrain />
                                </div>
                                <h3 className="font-bold text-gray-800 text-lg">MRI Analysis</h3>
                                <p className="text-gray-500 text-sm mt-2">Tumor detection with 99% precision using deep learning.</p>
                            </div>

                            <div className="absolute bottom-20 left-10 bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/50 w-72 transform -rotate-3 hover:rotate-0 transition-all duration-500 z-20">
                                <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center text-teal-600 text-2xl mb-4">
                                    <FaEye />
                                </div>
                                <h3 className="font-bold text-gray-800 text-lg">Retinal Scan</h3>
                                <p className="text-gray-500 text-sm mt-2">Early diabetic retinopathy detection in seconds.</p>
                            </div>

                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-2xl shadow-xl z-10">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                        <FaUserMd />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Active Doctors</p>
                                        <p className="font-bold text-gray-800">2,500+</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
