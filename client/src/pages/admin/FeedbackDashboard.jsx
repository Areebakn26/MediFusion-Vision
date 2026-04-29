import { useEffect, useState, useCallback } from 'react';
import { getFeedbackStats, getFeedback, triggerRetrain, getRetrainJobs } from '../../services/api';
import { toast } from 'react-hot-toast';

const STATUS_COLORS = {
    pending:            'bg-yellow-100 text-yellow-700',
    validated:          'bg-green-100 text-green-700',
    used_in_training:   'bg-blue-100 text-blue-700',
    rejected:           'bg-red-100 text-red-700',
};

const JOB_STATUS_COLORS = {
    pending:    'bg-yellow-100 text-yellow-700',
    running:    'bg-blue-100 text-blue-700',
    completed:  'bg-green-100 text-green-700',
    failed:     'bg-red-100 text-red-700',
};

const StatCard = ({ label, value, color, sub }) => (
    <div className={`bg-white rounded-2xl shadow p-6 border-l-4 ${color}`}>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
);

const FeedbackDashboard = () => {
    const [stats, setStats]             = useState(null);
    const [feedback, setFeedback]       = useState([]);
    const [jobs, setJobs]               = useState([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingFeedback, setLoadingFeedback] = useState(true);
    const [triggering, setTriggering]   = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [modelFilter, setModelFilter] = useState('');
    const [page, setPage]               = useState(0);
    const PAGE_SIZE = 10;

    const loadStats = useCallback(async () => {
        try {
            const { data } = await getFeedbackStats();
            setStats(data);
        } catch {
            toast.error('Failed to load feedback stats');
        } finally {
            setLoadingStats(false);
        }
    }, []);

    const loadFeedback = useCallback(async () => {
        setLoadingFeedback(true);
        try {
            const { data } = await getFeedback({
                status: statusFilter || undefined,
                model_type: modelFilter || undefined,
                limit: PAGE_SIZE,
                offset: page * PAGE_SIZE,
            });
            setFeedback(data.data || []);
        } catch {
            toast.error('Failed to load feedback entries');
        } finally {
            setLoadingFeedback(false);
        }
    }, [statusFilter, modelFilter, page]);

    const loadJobs = useCallback(async () => {
        try {
            const { data } = await getRetrainJobs();
            setJobs(data);
        } catch { /* silent */ }
    }, []);

    useEffect(() => { loadStats(); loadJobs(); }, [loadStats, loadJobs]);
    useEffect(() => { loadFeedback(); }, [loadFeedback]);

    const handleTrigger = async () => {
        if (!window.confirm('Trigger AI model retraining now?')) return;
        setTriggering(true);
        try {
            const { data } = await triggerRetrain({ triggered_by: 'manual' });
            toast.success(data.message || 'Retraining job started');
            await loadStats();
            await loadJobs();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to trigger retrain');
        } finally {
            setTriggering(false);
        }
    };

    const fmt = (iso) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">AI Feedback Loop</h1>
                <p className="text-gray-500 text-sm">Doctor corrections, model accuracy tracking, and retraining management</p>
            </div>

            {/* Stats Cards */}
            {loadingStats ? (
                <div className="text-gray-400 text-sm">Loading stats…</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Total Feedback"     value={stats?.total_feedback}     color="border-blue-500"   />
                    <StatCard label="Pending Review"     value={stats?.pending}            color="border-yellow-500" />
                    <StatCard label="Validated"          value={stats?.validated}          color="border-green-500"  />
                    <StatCard label="Used in Training"   value={stats?.used_in_training}   color="border-purple-500" />
                </div>
            )}

            {/* Retraining Status */}
            <div className="bg-white rounded-2xl shadow p-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 mb-3">Retraining Status</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-2 text-sm">
                            <div>
                                <span className="text-gray-500">Days since last retrain</span>
                                <p className="font-bold text-gray-800">{stats?.days_since_last_retrain ?? '—'} days</p>
                            </div>
                            <div>
                                <span className="text-gray-500">Active model accuracy</span>
                                <p className="font-bold text-gray-800">
                                    {stats?.accuracy_estimate != null
                                        ? `${(stats.accuracy_estimate * 100).toFixed(1)}%`
                                        : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-500">Retrain recommended</span>
                                <p className={`font-bold ${stats?.should_retrain ? 'text-red-600' : 'text-green-600'}`}>
                                    {stats?.should_retrain ? 'Yes' : 'No'}
                                </p>
                            </div>
                        </div>
                        {stats?.retrain_reasons?.length > 0 && (
                            <div className="mt-3">
                                <p className="text-xs text-gray-500 mb-1">Reasons:</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                    {stats.retrain_reasons.map((r, i) => (
                                        <li key={i} className="text-xs text-red-600">{r}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleTrigger}
                        disabled={triggering}
                        className="px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all shadow"
                    >
                        {triggering ? 'Starting…' : 'Trigger Retraining'}
                    </button>
                </div>
            </div>

            {/* Recent Retrain Jobs */}
            {jobs.length > 0 && (
                <div className="bg-white rounded-2xl shadow p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Retraining Job History</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b">
                                    <th className="pb-2 pr-4">Triggered</th>
                                    <th className="pb-2 pr-4">By</th>
                                    <th className="pb-2 pr-4">Reason</th>
                                    <th className="pb-2 pr-4">Status</th>
                                    <th className="pb-2 pr-4">Old → New Version</th>
                                    <th className="pb-2">Feedback Used</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {jobs.slice(0, 5).map(job => (
                                    <tr key={job.job_id} className="hover:bg-gray-50">
                                        <td className="py-2 pr-4 text-gray-600">{fmt(job.createdAt)}</td>
                                        <td className="py-2 pr-4 text-gray-600 capitalize">{job.triggered_by}</td>
                                        <td className="py-2 pr-4 text-gray-600 max-w-xs truncate">{job.trigger_reason || '—'}</td>
                                        <td className="py-2 pr-4">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${JOB_STATUS_COLORS[job.status] || 'bg-gray-100 text-gray-600'}`}>
                                                {job.status}
                                            </span>
                                        </td>
                                        <td className="py-2 pr-4 text-gray-600">
                                            {job.old_model_version && job.new_model_version
                                                ? `${job.old_model_version} → ${job.new_model_version}`
                                                : '—'}
                                        </td>
                                        <td className="py-2 text-gray-600">{job.feedback_count_used ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Feedback Table */}
            <div className="bg-white rounded-2xl shadow p-6">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Doctor Corrections</h2>
                    <div className="flex gap-3 flex-wrap">
                        <select
                            value={statusFilter}
                            onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="validated">Validated</option>
                            <option value="used_in_training">Used in Training</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <select
                            value={modelFilter}
                            onChange={e => { setModelFilter(e.target.value); setPage(0); }}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            <option value="">All Models</option>
                            <option value="retinal">Retinal</option>
                            <option value="mri_brain">Brain MRI</option>
                        </select>
                    </div>
                </div>

                {loadingFeedback ? (
                    <div className="text-gray-400 text-sm py-8 text-center">Loading…</div>
                ) : feedback.length === 0 ? (
                    <div className="text-gray-400 text-sm py-8 text-center">No feedback entries found.</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 border-b">
                                        <th className="pb-2 pr-4">Date</th>
                                        <th className="pb-2 pr-4">Doctor</th>
                                        <th className="pb-2 pr-4">Scan Type</th>
                                        <th className="pb-2 pr-4">AI Said</th>
                                        <th className="pb-2 pr-4">Doctor Says</th>
                                        <th className="pb-2 pr-4">Reason</th>
                                        <th className="pb-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {feedback.map(fb => (
                                        <tr key={fb.feedback_id} className="hover:bg-gray-50">
                                            <td className="py-2.5 pr-4 text-gray-600">{fmt(fb.createdAt)}</td>
                                            <td className="py-2.5 pr-4 text-gray-800 font-medium">
                                                {fb.Doctor?.User?.name || fb.doctor_id?.slice(0, 8) || '—'}
                                            </td>
                                            <td className="py-2.5 pr-4 text-gray-600 capitalize">
                                                {fb.Scan?.scan_type?.replace('_', ' ') || '—'}
                                            </td>
                                            <td className="py-2.5 pr-4 text-red-600 font-medium capitalize">
                                                {fb.ai_prediction?.replace(/_/g, ' ') || '—'}
                                            </td>
                                            <td className="py-2.5 pr-4 text-green-700 font-medium capitalize">
                                                {fb.corrected_diagnosis?.replace(/_/g, ' ') || '—'}
                                            </td>
                                            <td className="py-2.5 pr-4 text-gray-500 capitalize">
                                                {fb.feedback_reason?.replace(/_/g, ' ') || '—'}
                                            </td>
                                            <td className="py-2.5">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[fb.validation_status] || 'bg-gray-100 text-gray-600'}`}>
                                                    {fb.validation_status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                            <span>Page {page + 1}</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={feedback.length < PAGE_SIZE}
                                    className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FeedbackDashboard;
