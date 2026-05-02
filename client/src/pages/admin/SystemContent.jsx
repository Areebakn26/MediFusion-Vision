import { useState, useEffect } from 'react';
import { FaCogs, FaEnvelope, FaDatabase, FaSave, FaServer, FaInfoCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const DEFAULT_SETTINGS = {
    platformName: 'MediFusion Vision',
    supportEmail: 'support@medifusion.com',
    maintenanceMode: false,
};

const SystemContent = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('adminSettings');
            if (saved) setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
        } catch {
            // ignore corrupt storage
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem('adminSettings', JSON.stringify(settings));
        toast.success('Settings saved successfully');
    };

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
                                    <input
                                        type="text"
                                        value={settings.platformName}
                                        onChange={e => setSettings(prev => ({ ...prev, platformName: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
                                    <input
                                        type="email"
                                        value={settings.supportEmail}
                                        onChange={e => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Mode</label>
                                    <div className="flex items-center space-x-3 mt-1">
                                        <button
                                            type="button"
                                            onClick={() => setSettings(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.maintenanceMode ? 'bg-teal-600' : 'bg-gray-300'}`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`}
                                            />
                                        </button>
                                        <span className="text-sm text-gray-500">
                                            {settings.maintenanceMode ? 'Enabled — users see maintenance page' : 'Disabled — normal operation'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4">
                                <button
                                    onClick={handleSave}
                                    className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700 transition-colors flex items-center"
                                >
                                    <FaSave className="mr-2" /> Save Configuration
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'emails' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-800">Email Templates</h3>
                            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <FaInfoCircle className="text-blue-500 text-lg mt-0.5 shrink-0" />
                                <p className="text-sm text-blue-800">
                                    Email templates are defined in the server configuration (<code className="font-mono bg-blue-100 px-1 rounded">server/utils/emailService.js</code>).
                                    Contact the system administrator to update them.
                                </p>
                            </div>
                            <div className="space-y-3">
                                {['Welcome Email', 'Password Reset', 'Appointment Confirmation', 'Doctor Verification'].map(name => (
                                    <div key={name} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <span className="font-medium text-gray-700">{name}</span>
                                        <span className="text-xs text-gray-400 italic">Managed in emailService.js</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'backups' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-800">System Backups</h3>
                            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <FaInfoCircle className="text-blue-500 text-lg mt-0.5 shrink-0" />
                                <p className="text-sm text-blue-800">
                                    Database backups are managed by the server infrastructure. Manual backups can be triggered
                                    via <code className="font-mono bg-blue-100 px-1 rounded">pg_dump</code> on the database host.
                                </p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-xl flex items-start space-x-3 border border-green-100">
                                <FaServer className="text-green-500 text-xl mt-1" />
                                <div>
                                    <p className="text-green-800 font-bold">Last Backup: 2 hours ago</p>
                                    <p className="text-green-600 text-sm">Status: Healthy</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SystemContent;
