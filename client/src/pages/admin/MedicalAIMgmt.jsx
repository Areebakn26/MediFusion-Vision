import { FaBrain, FaFileMedicalAlt, FaDatabase, FaChartBar } from 'react-icons/fa';

const MedicalAIMgmt = () => {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Medical & AI Management</h1>
                <p className="text-gray-500 text-sm">Oversee medical data integrity and AI model performance</p>
            </div>

            {/* AI Model Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-soft border-l-4 border-teal-500">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-800">MRI Analysis Model</h3>
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">Active</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Version 2.4.1 • Updated 2 days ago</p>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Accuracy</span>
                        <span className="font-bold text-gray-800">98.5%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                        <div className="bg-teal-500 h-2 rounded-full" style={{ width: '98.5%' }}></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-soft border-l-4 border-blue-500">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-800">Retinal Scan Model</h3>
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">Active</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Version 1.8.0 • Updated 1 week ago</p>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Accuracy</span>
                        <span className="font-bold text-gray-800">96.2%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '96.2%' }}></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-soft border-l-4 border-purple-500">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-800">Symptom Checker</h3>
                        <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-bold">Training</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Version 3.0.0-beta • Training in progress</p>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-bold text-gray-800">45%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                </div>
            </div>

            {/* Data Management */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-soft">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                        <FaDatabase className="mr-2 text-gray-400" /> Data Statistics
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                            <span className="text-gray-600">Total Scans Processed</span>
                            <span className="font-bold text-gray-800">15,420</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                            <span className="text-gray-600">Reports Generated</span>
                            <span className="font-bold text-gray-800">12,850</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                            <span className="text-gray-600">Anomalies Detected</span>
                            <span className="font-bold text-gray-800">3,240</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-soft">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                        <FaBrain className="mr-2 text-gray-400" /> Model Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="p-4 border border-gray-200 rounded-xl hover:bg-teal-50 hover:border-teal-200 transition-all text-center">
                            <span className="block font-bold text-teal-700">Retrain Models</span>
                            <span className="text-xs text-gray-500">Update with new data</span>
                        </button>
                        <button className="p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all text-center">
                            <span className="block font-bold text-blue-700">View Logs</span>
                            <span className="text-xs text-gray-500">Check inference history</span>
                        </button>
                        <button className="p-4 border border-gray-200 rounded-xl hover:bg-purple-50 hover:border-purple-200 transition-all text-center">
                            <span className="block font-bold text-purple-700">Manage Datasets</span>
                            <span className="text-xs text-gray-500">Upload/Clean data</span>
                        </button>
                        <button className="p-4 border border-gray-200 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all text-center">
                            <span className="block font-bold text-red-700">Emergency Stop</span>
                            <span className="text-xs text-gray-500">Halt AI processing</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MedicalAIMgmt;
