import { useState } from 'react';
import { FaCogs, FaEnvelope, FaBell, FaDatabase, FaSave, FaServer } from 'react-icons/fa';

const SystemContent = () => {
    const [activeTab, setActiveTab] = useState('general');

    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">System & Content Management</h1>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Tabs */}
                <div className="w-full md:w-64 space-y-2">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'general' ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        <FaCogs className="inline mr-2" /> General Settings
                    </button>
                    <button
                        onClick={() => setActiveTab('emails')}
                        className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'emails' ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        <FaEnvelope className="inline mr-2" /> Email Templates
                    </button>
                    <button
                        onClick={() => setActiveTab('backups')}
                        className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'backups' ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        <FaDatabase className="inline mr-2" /> Backups & Data
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white rounded-2xl shadow-soft p-8">
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-800">Platform Configuration</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Platform Name</label>
                                    <input type="text" defaultValue="MediFusion Vision" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
                                    <input type="email" defaultValue="support@medifusion.com" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Mode</label>
                                    <div className="flex items-center space-x-3">
                                        <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                            <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                                            <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                                        </div>
                                        <span className="text-sm text-gray-500">Enable to prevent user access</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700 transition-colors flex items-center">
                                    <FaSave className="mr-2" /> Save Configuration
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'emails' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-800">Email Templates</h3>
                            <div className="space-y-4">
                                {['Welcome Email', 'Password Reset', 'Appointment Confirmation', 'Invoice Receipt'].map((template) => (
                                    <div key={template} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <span className="font-medium text-gray-700">{template}</span>
                                        <button className="text-teal-600 font-bold text-sm hover:underline">Edit Template</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'backups' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-800">System Backups</h3>
                            <div className="bg-blue-50 p-4 rounded-xl flex items-start space-x-3">
                                <FaServer className="text-blue-500 text-xl mt-1" />
                                <div>
                                    <p className="text-blue-800 font-bold">Last Backup: 2 hours ago</p>
                                    <p className="text-blue-600 text-sm">Size: 1.2 GB • Status: Healthy</p>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button className="bg-gray-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-900 transition-colors flex items-center">
                                    <FaDatabase className="mr-2" /> Trigger Manual Backup
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SystemContent;
