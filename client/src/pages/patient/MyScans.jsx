import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { GlassCard, Badge, Button } from '../../components/ui';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

const MyScans = () => {
    const { t } = useTranslation();
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        type: 'all',
        source: 'all',
        status: 'all'
    });

    useEffect(() => {
        fetchScans();
    }, []);

    const fetchScans = async () => {
        try {
            const { data } = await api.get('/scans');
            setScans(data || []);
        } catch (error) {
            console.error('Error fetching scans:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter scans based on selected filters
    const filteredScans = scans.filter(scan => {
        if (filters.type !== 'all' && scan.scan_type !== filters.type) return false;
        if (filters.source !== 'all' && scan.scan_source !== filters.source) return false;
        if (filters.status !== 'all' && scan.validation_status !== filters.status) return false;
        return true;
    });

    const getScanIcon = (scanType) => {
        const icons = {
            mri_brain: '🧠',
            retinal: '👁️',
            xray: '🦴',
            ct_scan: '🔬',
            ultrasound: '📡'
        };
        return icons[scanType] || '📷';
    };

    const getSourceBadge = (source) => {
        return source === 'external' ? (
            <Badge variant="success">🟢 External</Badge>
        ) : (
            <Badge variant="info">🔵 Internal</Badge>
        );
    };

    const getValidationBadge = (status) => {
        const variants = {
            validated: 'success',
            pending: 'warning',
            failed: 'danger'
        };
        return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-off-white to-pastel-blue/20 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-blue to-primary-teal bg-clip-text text-transparent">
                                {t('myScans_title', 'My Scans')}
                            </h1>
                            <p className="text-gray-600 mt-1">{t('myScans_subtitle', 'View and manage your medical scans')}</p>
                        </div>
                        <Link to="/patient/upload-scan">
                            <Button>{t('uploadNewScan_btn', '+ Upload New Scan')}</Button>
                        </Link>
                    </div>

                    {/* Filters */}
                    <GlassCard className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">
                                    {t('scanType_label', 'Scan Type')}
                                </label>
                                <select
                                    value={filters.type}
                                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl bg-white/50 border border-white/20 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 outline-none text-sm"
                                >
                                    <option value="all">{t('allTypes_opt', 'All Types')}</option>
                                    <option value="mri_brain">{t('mriBrain_opt', 'MRI Brain')}</option>
                                    <option value="retinal">{t('retinalScan_opt', 'Retinal Scan')}</option>
                                    <option value="xray">{t('xray_opt', 'X-Ray')}</option>
                                    <option value="ct_scan">{t('ctScan_opt', 'CT Scan')}</option>
                                    <option value="ultrasound">{t('ultrasound_opt', 'Ultrasound')}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">
                                    {t('source_label', 'Source')}
                                </label>
                                <select
                                    value={filters.source}
                                    onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl bg-white/50 border border-white/20 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 outline-none text-sm"
                                >
                                    <option value="all">{t('allSources_opt', 'All Sources')}</option>
                                    <option value="external">{t('external_opt', 'External')}</option>
                                    <option value="internal">{t('internal_opt', 'Internal')}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">
                                    {t('status_label', 'Status')}
                                </label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl bg-white/50 border border-white/20 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 outline-none text-sm"
                                >
                                    <option value="all">{t('allStatus_opt', 'All Status')}</option>
                                    <option value="validated">{t('validated_opt', 'Validated')}</option>
                                    <option value="pending">{t('pending_opt', 'Pending')}</option>
                                    <option value="failed">{t('failed_opt', 'Failed')}</option>
                                </select>
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Scans Grid */}
                {loading ? (
                    <GlassCard className="p-12 text-center">
                        <div className="animate-pulse text-gray-600">Loading scans...</div>
                    </GlassCard>
                ) : filteredScans.length === 0 ? (
                    <GlassCard className="p-12 text-center">
                        <p className="text-gray-500 mb-4">{t('noScansFound', 'No scans found')}</p>
                        <Link to="/patient/upload-scan">
                            <Button>{t('uploadYourFirstScan_btn', 'Upload Your First Scan')}</Button>
                        </Link>
                    </GlassCard>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredScans.map((scan, index) => (
                            <motion.div
                                key={scan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <GlassCard className="overflow-hidden group">
                                    {/* Scan Preview */}
                                    <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                                        {scan.file_path ? (
                                            <img
                                                src={`${import.meta.env.VITE_API_URL}${scan.file_path}`}
                                                alt={scan.scan_type}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                        ) : (
                                            <span className="text-6xl">{getScanIcon(scan.scan_type)}</span>
                                        )}

                                        {/* Source Badge Overlay */}
                                        <div className="absolute top-3 left-3">
                                            {getSourceBadge(scan.scan_source)}
                                        </div>

                                        {/* Validation Status Overlay */}
                                        <div className="absolute top-3 right-3">
                                            {getValidationBadge(scan.validation_status)}
                                        </div>
                                    </div>

                                    {/* Scan Details */}
                                    <div className="p-5 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-bold text-gray-800 capitalize">
                                                    {scan.scan_type?.replace('_', ' ')}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {scan.body_part || 'N/A'}
                                                </p>
                                            </div>
                                            <span className="text-3xl">{getScanIcon(scan.scan_type)}</span>
                                        </div>

                                        <div className="space-y-1 text-sm text-gray-600">
                                            <div className="flex justify-between">
                                                <span>Uploaded:</span>
                                                <span className="font-medium">
                                                    {new Date(scan.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {scan.facility_name && (
                                                <div className="flex justify-between">
                                                    <span>Facility:</span>
                                                    <span className="font-medium">{scan.facility_name}</span>
                                                </div>
                                            )}
                                            {scan.taken_date && (
                                                <div className="flex justify-between">
                                                    <span>Taken:</span>
                                                    <span className="font-medium">
                                                        {new Date(scan.taken_date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="pt-3 border-t border-gray-100 flex gap-2">
                                            <Link to={`/patient/scans/results/${scan.id}`} className="flex-1">
                                                <Button variant="primary" size="sm" className="w-full">
                                                    View Results
                                                </Button>
                                            </Link>
                                            {scan.file_path && (
                                                <a
                                                    href={`${import.meta.env.VITE_API_URL}${scan.file_path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Button variant="secondary" size="sm">
                                                        📥
                                                    </Button>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Results Summary */}
                {!loading && filteredScans.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-6 text-center text-sm text-gray-600"
                    >
                        Showing {filteredScans.length} of {scans.length} scans
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default MyScans;
