import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard, Chart } from '../../components/ui';
import { getAdminAnalytics } from '../../services/api';
import api from '../../services/api';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const buildChartArrays = (revenueRows, patientRows, doctorRows) => {
    const monthSet = new Set();
    [...revenueRows, ...patientRows, ...doctorRows].forEach(r => {
        if (r.month) monthSet.add(r.month.substring(0, 7));
    });
    const labels = Array.from(monthSet).sort().map(m => {
        const idx = parseInt(m.split('-')[1], 10) - 1;
        return MONTH_NAMES[idx] || m;
    });
    const monthKeys = Array.from(monthSet).sort();

    const revenueMap = {};
    revenueRows.forEach(r => { if (r.month) revenueMap[r.month.substring(0, 7)] = parseFloat(r.total) || 0; });
    const patientMap = {};
    patientRows.forEach(r => { if (r.month) patientMap[r.month.substring(0, 7)] = parseInt(r.count, 10) || 0; });
    const doctorMap = {};
    doctorRows.forEach(r => { if (r.month) doctorMap[r.month.substring(0, 7)] = parseInt(r.count, 10) || 0; });

    return {
        labels,
        revenueValues: monthKeys.map(k => revenueMap[k] || 0),
        patientValues: monthKeys.map(k => patientMap[k] || 0),
        doctorValues: monthKeys.map(k => doctorMap[k] || 0),
    };
};

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0, totalDoctors: 0, pendingVerifications: 0, totalAppointments: 0, revenue: 0
    });
    const [chartLabels, setChartLabels] = useState(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']);
    const [revenueValues, setRevenueValues] = useState([0, 0, 0, 0, 0, 0]);
    const [patientValues, setPatientValues] = useState([0, 0, 0, 0, 0, 0]);
    const [doctorValues, setDoctorValues] = useState([0, 0, 0, 0, 0, 0]);
    useEffect(() => {
        api.get('/admin/stats')
            .then(({ data }) => setStats(data))
            .catch(err => console.error('Stats error:', err));

        getAdminAnalytics()
            .then(({ data }) => {
                const { labels, revenueValues: rv, patientValues: pv, doctorValues: dv } =
                    buildChartArrays(data.revenue || [], data.patients || [], data.doctors || []);
                if (labels.length) {
                    setChartLabels(labels);
                    setRevenueValues(rv);
                    setPatientValues(pv);
                    setDoctorValues(dv);
                }
            })
            .catch(err => console.error('Analytics error:', err));
    }, []);

    const revenueData = {
        labels: chartLabels,
        datasets: [{
            label: 'Revenue (PKR)',
            data: revenueValues,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.5)',
            tension: 0.4
        }]
    };

    const userGrowthData = {
        labels: chartLabels,
        datasets: [
            {
                label: 'Patients',
                data: patientValues,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                tension: 0.4
            },
            {
                label: 'Doctors',
                data: doctorValues,
                borderColor: 'rgb(147, 51, 234)',
                backgroundColor: 'rgba(147, 51, 234, 0.5)',
                tension: 0.4
            }
        ]
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    return (
        <motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="visible">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Admin Dashboard
                </h1>
                <div className="text-sm text-gray-500 bg-white/50 px-4 py-2 rounded-full backdrop-blur-sm">
                    System Status: <span className="text-green-600 font-bold">● Online</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div variants={itemVariants}>
                    <GlassCard className="p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="text-6xl">👥</span>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Users</h3>
                        <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalUsers.toLocaleString()}</p>
                    </GlassCard>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <GlassCard className="p-6 relative overflow-hidden group border-l-4 border-l-blue-500">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="text-6xl">👨‍⚕️</span>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Pending Doctors</h3>
                        <p className="text-3xl font-bold text-blue-600 mt-2">{stats.pendingVerifications}</p>
                        <div className="mt-2 text-sm text-blue-600 font-medium">Action Required</div>
                    </GlassCard>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <GlassCard className="p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="text-6xl">📅</span>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Appointments</h3>
                        <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalAppointments.toLocaleString()}</p>
                    </GlassCard>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <GlassCard className="p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="text-6xl">💰</span>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Revenue</h3>
                        <p className="text-3xl font-bold text-gray-800 mt-2">Rs. {stats.revenue.toLocaleString()}</p>
                    </GlassCard>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div variants={itemVariants}>
                    <GlassCard className="p-6 h-full">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">Revenue Overview</h3>
                        <div className="h-64">
                            <Chart type="line" data={revenueData} />
                        </div>
                    </GlassCard>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <GlassCard className="p-6 h-full">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">User Growth</h3>
                        <div className="h-64">
                            <Chart type="line" data={userGrowthData} />
                        </div>
                    </GlassCard>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default AdminDashboard;
