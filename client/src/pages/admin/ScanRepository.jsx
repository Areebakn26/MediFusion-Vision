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
    'all validated': 'bg-green-100 text-green-700',
    'all rejected':  'bg-red-100 text-red-700',
    'some pending':  'bg-yellow-100 text-yellow-700',
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

    if (loading) return <p className="text-gray-500 p-6">Loading...</p>;

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Scan Repository</h1>
                <p className="text-sm text-gray-500 mt-1">
                    {scans.length} unique scan{scans.length !== 1 ? 's' : ''} with doctor feedback
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-b text-gray-600 uppercase text-xs">
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
                    <tbody className="divide-y divide-gray-100">
                        {scans.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                    No flagged scans yet.
                                </td>
                            </tr>
                        )}
                        {scans.map((s) => (
                            <tr key={s.scan_id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 font-mono text-gray-700">
                                    {s.scan_id.slice(0, 8)}
                                </td>
                                <td className="px-4 py-3 text-gray-800">{s.patient_name}</td>
                                <td className="px-4 py-3 text-gray-600">
                                    {SCAN_TYPE_LABEL[s.scan_type] || s.scan_type}
                                </td>
                                <td className="px-4 py-3 text-center font-semibold text-gray-800">
                                    {s.total_flags}
                                </td>
                                <td className="px-4 py-3 text-gray-800 capitalize">
                                    {s.majority_diagnosis || '—'}
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                    {s.latest_flag_date
                                        ? new Date(s.latest_flag_date).toLocaleDateString()
                                        : '—'}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-600'}`}>
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
