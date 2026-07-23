import { useEffect, useState } from 'react';
import { getScanRepository } from '../../services/api';
import { toast } from 'react-hot-toast';

const SCAN_TYPE_LABEL = {
    mri_brain: 'Brain MRI',
    retinal:   'Retinal',
    xray:      'X-Ray',
    ct_scan:   'CT Scan',
    other:     'Other',
};

const STATUS_COLORS = {
    'all validated': 'bg-success/10 text-success',
    'all rejected':  'bg-error/10 text-error',
    'some pending':  'bg-warning/10 text-warning',
};

const ScanRepository = () => {
    const [scans, setScans]     = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getScanRepository()
            .then(({ data }) => setScans(data.data || []))
            .catch(() => toast.error('Failed to load scan repository'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p className="text-foreground-muted p-6">Loading...</p>;

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">Scan Repository</h1>
                <p className="text-sm text-foreground-muted mt-1">
                    {scans.length} unique scan{scans.length !== 1 ? 's' : ''} with doctor feedback
                </p>
            </div>

            <div className="bg-surface-secondary rounded-xl shadow-card overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-surface-secondary/50 border-b text-foreground-muted uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3 text-left">Scan ID</th>
                            <th className="px-4 py-3 text-left">Patient</th>
                            <th className="px-4 py-3 text-left">Type</th>
                            <th className="px-4 py-3 text-center">Total Flags</th>
                            <th className="px-4 py-3 text-left">Majority Diagnosis</th>
                            <th className="px-4 py-3 text-left">Latest Flag</th>
                            <th className="px-4 py-3 text-left">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {scans.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-foreground-subtle">
                                    No flagged scans yet.
                                </td>
                            </tr>
                        )}
                        {scans.map((s) => (
                            <tr key={s.scan_id} className="hover:bg-surface-tertiary/50 transition-colors">
                                <td className="px-4 py-3 font-mono text-foreground-muted">
                                    {s.scan_id.slice(0, 8)}
                                </td>
                                <td className="px-4 py-3 text-foreground">{s.patient_name}</td>
                                <td className="px-4 py-3 text-foreground-muted">
                                    {SCAN_TYPE_LABEL[s.scan_type] || s.scan_type}
                                </td>
                                <td className="px-4 py-3 text-center font-semibold text-foreground">
                                    {s.total_flags}
                                </td>
                                <td className="px-4 py-3 text-foreground capitalize">
                                    {s.majority_diagnosis || '—'}
                                </td>
                                <td className="px-4 py-3 text-foreground-muted">
                                    {s.latest_flag_date
                                        ? new Date(s.latest_flag_date).toLocaleDateString()
                                        : '—'}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[s.status] || 'bg-surface-tertiary text-foreground-muted'}`}>
                                        {s.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ScanRepository;
