import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FaUserInjured, FaCalendarCheck, FaCheckCircle, FaCalendarAlt } from 'react-icons/fa';

const Analytics = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const { data } = await api.get('/doctors/analytics');
                setStats(data);
            } catch (err) {
                console.error('Analytics fetch failed:', err);
                setError('Failed to load analytics data.');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-teal-500 mr-4"></div>
            <p className="text-gray-400 font-medium">Loading analytics...</p>
        </div>
    );

    if (error) return (
        <div className="text-center py-12 text-red-500 font-medium">{error}</div>
    );

    const maxTrend = Math.max(...stats.weeklyTrend.map(d => d.count), 1);
    const totalSessionTypes = stats.virtualAppts + stats.physicalAppts;

    const cards = [
        {
            label: 'Total Patients',
            value: stats.totalPatients,
            icon: <FaUserInjured />,
            color: 'bg-blue-500',
            note: 'Unique patients seen'
        },
        {
            label: 'This Month',
            value: stats.monthlyAppts,
            icon: <FaCalendarCheck />,
            color: 'bg-teal-500',
            note: 'Appointments this month'
        },
        {
            label: 'Completed Sessions',
            value: stats.completedAppts,
            icon: <FaCheckCircle />,
            color: 'bg-green-500',
            note: 'All-time completed'
        },
        {
            label: 'Upcoming',
            value: stats.upcomingAppts,
            icon: <FaCalendarAlt />,
            color: 'bg-purple-500',
            note: 'Confirmed & pending'
        },
    ];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Practice Analytics</h1>
                    <p className="text-gray-500 text-sm">Real-time overview of your clinical performance</p>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl text-white ${stat.color} shadow-lg`}>
                                <span className="text-xl">{stat.icon}</span>
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-800">{stat.value}</h3>
                        <p className="text-gray-600 text-sm font-medium mt-1">{stat.label}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{stat.note}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Weekly Appointment Trend */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-1">Appointment Trend</h3>
                    <p className="text-xs text-gray-400 mb-6">Daily appointments over the last 7 days</p>

                    {stats.weeklyTrend.every(d => d.count === 0) ? (
                        <div className="h-48 flex items-center justify-center text-gray-300 text-sm font-medium">
                            No appointments in the last 7 days
                        </div>
                    ) : (
                        <div className="flex items-end gap-2 h-40 px-2">
                            {stats.weeklyTrend.map((day, i) => {
                                const heightPct = (day.count / maxTrend) * 100;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                        <span className="text-[11px] font-bold text-gray-500">{day.count > 0 ? day.count : ''}</span>
                                        <div className="w-full bg-teal-50 rounded-t-lg" style={{ height: '120px', position: 'relative' }}>
                                            <div
                                                className="absolute bottom-0 left-0 right-0 bg-teal-500 rounded-t-lg transition-all duration-500"
                                                style={{ height: `${day.count > 0 ? Math.max(heightPct, 6) : 0}%` }}
                                            />
                                        </div>
                                        <span className="text-[11px] text-gray-400">{day.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Session Breakdown */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-1">Session Breakdown</h3>
                    <p className="text-xs text-gray-400 mb-6">Virtual vs physical appointments</p>

                    <div className="space-y-5">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-semibold text-teal-700">Virtual</span>
                                <span className="font-bold text-gray-800">
                                    {stats.virtualAppts} {totalSessionTypes > 0 ? `(${Math.round(stats.virtualAppts / totalSessionTypes * 100)}%)` : ''}
                                </span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-teal-500 rounded-full transition-all duration-700"
                                    style={{ width: `${totalSessionTypes > 0 ? (stats.virtualAppts / totalSessionTypes * 100) : 0}%` }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-semibold text-blue-700">Physical</span>
                                <span className="font-bold text-gray-800">
                                    {stats.physicalAppts} {totalSessionTypes > 0 ? `(${Math.round(stats.physicalAppts / totalSessionTypes * 100)}%)` : ''}
                                </span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full transition-all duration-700"
                                    style={{ width: `${totalSessionTypes > 0 ? (stats.physicalAppts / totalSessionTypes * 100) : 0}%` }}
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-semibold text-green-700">Completion Rate</span>
                                <span className="text-2xl font-bold text-green-600">{stats.completionRate}%</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 rounded-full transition-all duration-700"
                                    style={{ width: `${stats.completionRate}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                {stats.completedAppts} of {totalSessionTypes} total appointments completed
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
