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
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-accent mr-4"></div>
            <p className="text-foreground-subtle font-medium">Loading analytics...</p>
        </div>
    );

    if (error) return (
        <div className="text-center py-12 text-error font-medium">{error}</div>
    );

    const maxTrend = Math.max(...stats.weeklyTrend.map(d => d.count), 1);
    const totalSessionTypes = stats.virtualAppts + stats.physicalAppts;

    const cards = [
        {
            label: 'Total Patients',
            value: stats.totalPatients,
            icon: <FaUserInjured />,
            color: 'bg-accent',
            note: 'Unique patients seen'
        },
        {
            label: 'This Month',
            value: stats.monthlyAppts,
            icon: <FaCalendarCheck />,
            color: 'bg-accent',
            note: 'Appointments this month'
        },
        {
            label: 'Completed Sessions',
            value: stats.completedAppts,
            icon: <FaCheckCircle />,
            color: 'bg-success',
            note: 'All-time completed'
        },
        {
            label: 'Upcoming',
            value: stats.upcomingAppts,
            icon: <FaCalendarAlt />,
            color: 'bg-accent',
            note: 'Confirmed & pending'
        },
    ];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Practice Analytics</h1>
                    <p className="text-foreground-muted text-sm">Real-time overview of your clinical performance</p>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((stat, index) => (
                    <div key={index} className="bg-surface-secondary p-6 rounded-xl shadow-card border border-white/5 hover:shadow-card-hover transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl text-white ${stat.color} shadow-card`}>
                                <span className="text-xl">{stat.icon}</span>
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
                        <p className="text-foreground-muted text-sm font-medium mt-1">{stat.label}</p>
                        <p className="text-foreground-subtle text-xs mt-0.5">{stat.note}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Weekly Appointment Trend */}
                <div className="bg-surface-secondary p-6 rounded-xl shadow-card border border-white/5">
                    <h3 className="font-bold text-foreground mb-1">Appointment Trend</h3>
                    <p className="text-xs text-foreground-subtle mb-6">Daily appointments over the last 7 days</p>

                    {stats.weeklyTrend.every(d => d.count === 0) ? (
                        <div className="h-48 flex items-center justify-center text-foreground-subtle text-sm font-medium">
                            No appointments in the last 7 days
                        </div>
                    ) : (
                        <div className="flex items-end gap-2 h-40 px-2">
                            {stats.weeklyTrend.map((day, i) => {
                                const heightPct = (day.count / maxTrend) * 100;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                        <span className="text-[11px] font-bold text-foreground-muted">{day.count > 0 ? day.count : ''}</span>
                                        <div className="w-full bg-accent-subtle rounded-t-lg" style={{ height: '120px', position: 'relative' }}>
                                            <div
                                                className="absolute bottom-0 left-0 right-0 bg-accent rounded-t-lg transition-all duration-500"
                                                style={{ height: `${day.count > 0 ? Math.max(heightPct, 6) : 0}%` }}
                                            />
                                        </div>
                                        <span className="text-[11px] text-foreground-subtle">{day.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Session Breakdown */}
                <div className="bg-surface-secondary p-6 rounded-xl shadow-card border border-white/5">
                    <h3 className="font-bold text-foreground mb-1">Session Breakdown</h3>
                    <p className="text-xs text-foreground-subtle mb-6">Virtual vs physical appointments</p>

                    <div className="space-y-5">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-semibold text-accent">Virtual</span>
                                <span className="font-bold text-foreground">
                                    {stats.virtualAppts} {totalSessionTypes > 0 ? `(${Math.round(stats.virtualAppts / totalSessionTypes * 100)}%)` : ''}
                                </span>
                            </div>
                            <div className="h-3 bg-surface-tertiary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-accent rounded-full transition-all duration-700"
                                    style={{ width: `${totalSessionTypes > 0 ? (stats.virtualAppts / totalSessionTypes * 100) : 0}%` }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-semibold text-accent">Physical</span>
                                <span className="font-bold text-foreground">
                                    {stats.physicalAppts} {totalSessionTypes > 0 ? `(${Math.round(stats.physicalAppts / totalSessionTypes * 100)}%)` : ''}
                                </span>
                            </div>
                            <div className="h-3 bg-surface-tertiary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-accent rounded-full transition-all duration-700"
                                    style={{ width: `${totalSessionTypes > 0 ? (stats.physicalAppts / totalSessionTypes * 100) : 0}%` }}
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-semibold text-success">Completion Rate</span>
                                <span className="text-2xl font-bold text-success">{stats.completionRate}%</span>
                            </div>
                            <div className="h-3 bg-surface-tertiary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-success rounded-full transition-all duration-700"
                                    style={{ width: `${stats.completionRate}%` }}
                                />
                            </div>
                            <p className="text-xs text-foreground-subtle mt-2">
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
