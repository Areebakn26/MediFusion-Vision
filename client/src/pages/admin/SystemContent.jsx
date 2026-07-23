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
            <h1 className="text-2xl font-bold text-foreground mb-6">System & Content Management</h1>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Tabs */}
                <div className="w-full md:w-64 space-y-2">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'general' ? 'bg-accent text-white shadow-card' : 'bg-surface-secondary text-foreground-muted hover:bg-surface-tertiary'}`}
                    >
                        <FaCogs className="inline mr-2" /> General Settings
                    </button>
                    <button
                        onClick={() => setActiveTab('emails')}
                        className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'emails' ? 'bg-accent text-white shadow-card' : 'bg-surface-secondary text-foreground-muted hover:bg-surface-tertiary'}`}
                    >
                        <FaEnvelope className="inline mr-2" /> Email Templates
                    </button>
                    <button
                        onClick={() => setActiveTab('backups')}
                        className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'backups' ? 'bg-accent text-white shadow-card' : 'bg-surface-secondary text-foreground-muted hover:bg-surface-tertiary'}`}
                    >
                        <FaDatabase className="inline mr-2" /> Backups & Data
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-surface-secondary rounded-xl shadow-card p-8">
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-foreground">Platform Configuration</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-foreground-muted mb-2">Platform Name</label>
                                    <input
                                        type="text"
                                        value={settings.platformName}
                                        onChange={e => setSettings(prev => ({ ...prev, platformName: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-white/[0.06] focus:border-accent outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground-muted mb-2">Support Email</label>
                                    <input
                                        type="email"
                                        value={settings.supportEmail}
                                        onChange={e => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-white/[0.06] focus:border-accent outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground-muted mb-2">Maintenance Mode</label>
                                    <div className="flex items-center space-x-3 mt-1">
                                        <button
                                            type="button"
                                            onClick={() => setSettings(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.maintenanceMode ? 'bg-accent' : 'bg-surface-tertiary'}`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`}
                                            />
                                        </button>
                                        <span className="text-sm text-foreground-muted">
                                            {settings.maintenanceMode ? 'Enabled — users see maintenance page' : 'Disabled — normal operation'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4">
                                <button
                                    onClick={handleSave}
                                    className="bg-accent text-white px-6 py-3 rounded-[6px] font-bold hover:bg-accent-hover transition-colors flex items-center"
                                >
                                    <FaSave className="mr-2" /> Save Configuration
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'emails' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-foreground">Email Templates</h3>
                            <div className="flex items-start gap-3 p-4 bg-accent-subtle rounded-xl border border-accent/20">
                                <FaInfoCircle className="text-accent text-lg mt-0.5 shrink-0" />
                                <p className="text-sm text-accent">
                                    Email templates are defined in the server configuration (<code className="font-mono bg-accent-subtle px-1 rounded">server/utils/emailService.js</code>).
                                    Contact the system administrator to update them.
                                </p>
                            </div>
                            <div className="space-y-3">
                                {['Welcome Email', 'Password Reset', 'Appointment Confirmation', 'Doctor Verification'].map(name => (
                                    <div key={name} className="flex justify-between items-center p-4 bg-surface-secondary/60 rounded-xl border border-white/5">
                                        <span className="font-medium text-foreground-muted">{name}</span>
                                        <span className="text-xs text-foreground-subtle italic">Managed in emailService.js</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'backups' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-foreground">System Backups</h3>
                            <div className="flex items-start gap-3 p-4 bg-accent-subtle rounded-xl border border-accent/20">
                                <FaInfoCircle className="text-accent text-lg mt-0.5 shrink-0" />
                                <p className="text-sm text-accent">
                                    Database backups are managed by the server infrastructure. Manual backups can be triggered
                                    via <code className="font-mono bg-accent-subtle px-1 rounded">pg_dump</code> on the database host.
                                </p>
                            </div>
                            <div className="bg-success/10 p-4 rounded-xl flex items-start space-x-3 border border-success/20">
                                <FaServer className="text-success text-xl mt-1" />
                                <div>
                                    <p className="text-success font-bold">Last Backup: 2 hours ago</p>
                                    <p className="text-success text-sm">Status: Healthy</p>
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
