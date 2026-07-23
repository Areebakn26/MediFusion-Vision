import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaFilter, FaUserMd, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import api from '../../utils/api';
import { GlassCard, Button, Badge, Input } from '../../components/ui';
import { Link } from 'react-router-dom';

const Doctors = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/doctors');
            setDoctors(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching doctors", error);
            setLoading(false);
        }
    };

    const filteredDoctors = doctors.filter(doc => {
        const matchesSearch = doc.User?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (doc.specialization || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (doc.pmdc_number || '').toLowerCase().includes(searchTerm.toLowerCase());
        const docStatus = doc.verificationStatus || doc.verification_status || 'pending';
        const matchesStatus = statusFilter === 'all' || docStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status) => {
        const variants = {
            approved: 'success',
            pending: 'warning',
            rejected: 'danger'
        };
        return <Badge variant={variants[status] || 'default'}>{status.toUpperCase()}</Badge>;
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-accent">
                    Doctor Management
                </h1>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-72">
                        <Input
                            placeholder="Search doctors..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-subtle" />
                    </div>
                    <select
                        className="px-4 py-2 rounded-xl border border-white/[0.06] focus:border-accent outline-none bg-surface-secondary/50"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            <GlassCard className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-surface-secondary/50 border-b border-white/5">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">Doctor</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">Specialization</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">PMDC #</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-foreground-muted uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-foreground-muted">Loading doctors...</td>
                                </tr>
                            ) : filteredDoctors.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-foreground-muted">No doctors found.</td>
                                </tr>
                            ) : (
                                filteredDoctors.map((doc, index) => (
                                    <motion.tr
                                        key={doc._id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-accent-subtle/30 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-accent-subtle flex items-center justify-center text-accent font-bold shadow-card">
                                                    {doc.User?.name?.charAt(0) || '?'}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-foreground">Dr. {doc.User?.name || 'Unknown'}</div>
                                                    <div className="text-sm text-foreground-muted">{doc.User?.email || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-foreground">{doc.specialization || 'Not set'}</div>
                                            <div className="text-xs text-foreground-muted">{doc.experience_years || 0} Years Exp.</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-foreground-muted">
                                            {doc.pmdc_number || doc.pmdcNumber || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(doc.verification_status || doc.verificationStatus || 'pending')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {doc.verification_status === 'pending' ? (
                                                <Link to="/admin/verification">
                                                    <Button size="sm" className="bg-accent text-white hover:bg-accent-hover">
                                                        Verify Now
                                                    </Button>
                                                </Link>
                                            ) : (
                                                <Button size="sm" className="bg-surface-secondary text-foreground-muted hover:bg-surface-tertiary">
                                                    View Details
                                                </Button>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
};

export default Doctors;
