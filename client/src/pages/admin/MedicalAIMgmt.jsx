import { useState, useEffect } from 'react';
import { FaBrain, FaDatabase } from 'react-icons/fa';
import { getAdminAIStats } from '../../services/api';
import { toast } from 'react-hot-toast';

const MedicalAIMgmt = () => {
    const [stats, setStats] = useState({
        totalScans: 0, analyzedScans: 0, flaggedScans: 0,
        pendingFeedback: 0, brainScans: 0, retinalScans: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAdminAIStats()
            .then(({ data }) => setStats(data))
            .catch(err => console.error('AI stats error:', err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Medical & AI Management</h1>
                <p className="text-foreground-muted text-sm">Oversee medical data integrity and AI model performance</p>
            </div>

            {/* AI Model Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface-secondary p-6 rounded-xl shadow-card border-l-4 border-accent">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-foreground">MRI Analysis Model</h3>
                        <span className="bg-success/10 text-success text-xs px-2 py-1 rounded-full font-bold">Active</span>
                    </div>
                    <p className="text-sm text-foreground-muted mb-4">
                        {loading ? '—' : `${stats.brainScans} scans processed`}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground-muted">Accuracy</span>
                        <span className="font-bold text-foreground">98.5%</span>
                    </div>
                    <div className="w-full bg-surface-secondary/80 rounded-full h-2 mt-2">
                        <div className="bg-accent h-2 rounded-full" style={{ width: '98.5%' }}></div>
                    </div>
                </div>

                <div className="bg-surface-secondary p-6 rounded-xl shadow-card border-l-4 border-accent">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-foreground">Retinal Scan Model</h3>
                        <span className="bg-success/10 text-success text-xs px-2 py-1 rounded-full font-bold">Active</span>
                    </div>
                    <p className="text-sm text-foreground-muted mb-4">
                        {loading ? '—' : `${stats.retinalScans} scans processed`}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground-muted">Accuracy</span>
                        <span className="font-bold text-foreground">91.5%</span>
                    </div>
                    <div className="w-full bg-surface-secondary/80 rounded-full h-2 mt-2">
                        <div className="bg-accent h-2 rounded-full" style={{ width: '91.5%' }}></div>
                    </div>
                </div>

                <div className="bg-surface-secondary p-6 rounded-xl shadow-card border-l-4 border-accent">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-foreground">AI Feedback Queue</h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${stats.pendingFeedback > 0 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                            {stats.pendingFeedback > 0 ? 'Pending' : 'Clear'}
                        </span>
                    </div>
                    <p className="text-sm text-foreground-muted mb-4">
                        {loading ? '—' : `${stats.pendingFeedback} items awaiting review`}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground-muted">Flagged</span>
                        <span className="font-bold text-foreground">{loading ? '—' : stats.flaggedScans}</span>
                    </div>
                    <div className="w-full bg-surface-secondary/80 rounded-full h-2 mt-2">
                        <div
                            className="bg-accent h-2 rounded-full"
                            style={{ width: stats.totalScans > 0 ? `${Math.min((stats.flaggedScans / stats.totalScans) * 100, 100)}%` : '0%' }}
                        />
                    </div>
                </div>
            </div>

            {/* Data Management */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-surface-secondary p-6 rounded-xl shadow-card">
                    <h3 className="font-bold text-foreground mb-4 flex items-center">
                        <FaDatabase className="mr-2 text-foreground-subtle" /> Data Statistics
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-surface-secondary/60 rounded-xl">
                            <span className="text-foreground-muted">Total Scans Processed</span>
                            <span className="font-bold text-foreground">{loading ? '…' : stats.totalScans.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-surface-secondary/60 rounded-xl">
                            <span className="text-foreground-muted">AI Analyzed</span>
                            <span className="font-bold text-foreground">{loading ? '…' : stats.analyzedScans.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-surface-secondary/60 rounded-xl">
                            <span className="text-foreground-muted">Anomalies Flagged</span>
                            <span className="font-bold text-foreground">{loading ? '…' : stats.flaggedScans.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-surface-secondary/60 rounded-xl">
                            <span className="text-foreground-muted">Pending Admin Review</span>
                            <span className="font-bold text-foreground">{loading ? '…' : stats.pendingFeedback.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-surface-secondary p-6 rounded-xl shadow-card">
                    <h3 className="font-bold text-foreground mb-4 flex items-center">
                        <FaBrain className="mr-2 text-foreground-subtle" /> Model Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => toast.info('Retraining requires access to the ML pipeline. Contact the AI team.')}
                            className="p-4 border border-white/[0.06] rounded-xl hover:bg-accent-subtle hover:border-accent/20 transition-all text-center"
                        >
                            <span className="block font-bold text-accent">Retrain Models</span>
                            <span className="text-xs text-foreground-muted">Update with new data</span>
                        </button>
                        <button
                            onClick={() => toast.info('Model logs are stored in the Flask service. Check /Brain_Model/ or /Retinal_Model/ directories.')}
                            className="p-4 border border-white/[0.06] rounded-xl hover:bg-accent-subtle hover:border-accent/20 transition-all text-center"
                        >
                            <span className="block font-bold text-accent">View Logs</span>
                            <span className="text-xs text-foreground-muted">Check inference history</span>
                        </button>
                        <button
                            onClick={() => toast.info('Dataset management is handled via the model training scripts.')}
                            className="p-4 border border-white/[0.06] rounded-xl hover:bg-accent-subtle hover:border-accent/20 transition-all text-center"
                        >
                            <span className="block font-bold text-accent">Manage Datasets</span>
                            <span className="text-xs text-foreground-muted">Upload/Clean data</span>
                        </button>
                        <button
                            onClick={() => toast.error('To stop AI services, shut down the Flask processes on ports 5002 and 5003.')}
                            className="p-4 border border-white/[0.06] rounded-xl hover:bg-error/10 hover:border-error/20 transition-all text-center"
                        >
                            <span className="block font-bold text-error">Emergency Stop</span>
                            <span className="text-xs text-foreground-muted">Halt AI processing</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MedicalAIMgmt;
