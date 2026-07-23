import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import api from '../../services/api';
import {
  SurfaceCard,
  DataCard,
  StatusBadge,
  Button,
  Chart,
  PageHeader,
  StaggerContainer,
  StaggerItem,
} from '../../components/ui';

const DoctorDashboard = () => {
  const [stats, setStats] = useState({ appointments: 0, patients: 0, earnings: 0 });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const reduce = useReducedMotion();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Dashboard - Fetching appointments...');
        const response = await api.get('/appointments');
        const appointments = response.data || [];

        console.log('Dashboard - Appointments received:', appointments.length, appointments);

        const uniquePatients = new Set(appointments.map(a => a.patient?.id || a.patient_id || a.patient?.User?.id));
        const totalEarnings = appointments
          .filter(a => a.status === 'completed')
          .reduce((acc, curr) => acc + (curr.consultation_fee || curr.amount || 0), 0);

        console.log('Dashboard - Stats calculated:', {
          appointments: appointments.length,
          patients: uniquePatients.size,
          earnings: totalEarnings
        });

        setStats({
          appointments: appointments.length,
          patients: uniquePatients.size,
          earnings: totalEarnings
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todays = appointments.filter(app => {
          if (!app.date) return false;
          const appDate = new Date(app.date);
          appDate.setHours(0, 0, 0, 0);
          return appDate.getTime() === today.getTime();
        });

        console.log('Dashboard - Today\'s appointments:', todays.length);
        setTodayAppointments(todays);

      } catch (error) {
        console.error("Dashboard - Error fetching data:", error);
        console.error("Dashboard - Error response:", error.response?.data);
        setStats({ appointments: 0, patients: 0, earnings: 0 });
        setTodayAppointments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [chartData, setChartData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Patients Visited',
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4
      },
      {
        label: 'Appointments',
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.5)',
        tension: 0.4
      }
    ]
  });

  useEffect(() => {
    if (stats.appointments > 0) {
      const avgPerDay = Math.max(1, Math.floor(stats.appointments / 7));
      setChartData({
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Patients Visited',
            data: [avgPerDay, avgPerDay, avgPerDay, avgPerDay, avgPerDay, avgPerDay, avgPerDay],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            tension: 0.4
          },
          {
            label: 'Appointments',
            data: [avgPerDay, avgPerDay, avgPerDay, avgPerDay, avgPerDay, avgPerDay, avgPerDay],
            borderColor: 'rgb(147, 51, 234)',
            backgroundColor: 'rgba(147, 51, 234, 0.5)',
            tension: 0.4
          }
        ]
      });
    } else {
      setChartData({
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Patients Visited',
            data: [0, 0, 0, 0, 0, 0, 0],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            tension: 0.4
          },
          {
            label: 'Appointments',
            data: [0, 0, 0, 0, 0, 0, 0],
            borderColor: 'rgb(147, 51, 234)',
            backgroundColor: 'rgba(147, 51, 234, 0.5)',
            tension: 0.4
          }
        ]
      });
    }
  }, [stats.appointments]);

  const statCards = [
    {
      icon: '👥',
      label: 'Total Patients',
      value: stats.patients,
      accentColor: 'accent',
      trend: 12,
      trendLabel: 'vs last month',
    },
    {
      icon: '📅',
      label: 'Appointments',
      value: stats.appointments,
      accentColor: 'info',
      trend: todayAppointments.length,
      trendLabel: 'today',
    },
    {
      icon: '💰',
      label: 'Total Earnings',
      value: `Rs. ${stats.earnings.toLocaleString()}`,
      accentColor: 'medical',
      trend: 0,
      trendLabel: 'pending payouts',
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Doctor Dashboard"
        subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      />

      <StaggerContainer>
        {statCards.map((stat, index) => (
          <StaggerItem key={index} delay={index * 0.08}>
            <DataCard
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              trend={stat.trend}
              trendLabel={stat.trendLabel}
              accentColor={stat.accentColor}
            />
          </StaggerItem>
        ))}
      </StaggerContainer>

      <StaggerContainer>
        <StaggerItem delay={0.1}>
          <SurfaceCard className="p-6 h-full">
            <h3 className="text-lg font-bold text-foreground mb-6">Patient Analytics</h3>
            <div className="h-64">
              <Chart type="line" data={chartData} animateOnScroll />
            </div>
          </SurfaceCard>
        </StaggerItem>

        <StaggerItem delay={0.15}>
          <SurfaceCard className="h-full flex flex-col">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-lg font-bold text-foreground">Today's Schedule</h3>
              <Link to="/doctor/appointments" className="text-sm text-accent hover:underline">View All</Link>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
              {loading ? (
                <div className="text-center py-8 text-foreground-muted">Loading...</div>
              ) : todayAppointments.length > 0 ? (
                todayAppointments.map(app => (
                  <div key={app._id || app.id} className="flex items-center p-3 rounded-xl hover:bg-accent-subtle/50 transition-colors border border-transparent hover:border-accent/20">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mr-4 shadow-card ${app.type === 'physical' ? 'bg-accent-subtle text-accent' : 'bg-accent-subtle text-accent'}`}>
                      {(app.patient?.name || app.patient?.User?.name || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{app.patient?.name || app.patient?.User?.name || 'Unknown Patient'}</p>
                      <div className="flex items-center text-xs text-foreground-muted mt-1">
                        <span className="bg-surface-tertiary px-2 py-0.5 rounded text-foreground-muted font-medium mr-2">{app.timeSlot || app.time_slot}</span>
                        <span className="capitalize">{app.type || 'virtual'}</span>
                      </div>
                    </div>
                    <div className="ml-2">
                      {app.type === 'virtual' && (
                        <Link to={`/doctor/consultation/${app._id || app.id}`}>
                          <Button size="sm" className="rounded-full w-8 h-8 p-0 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-surface-tertiary rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">📅</div>
                  <p className="text-foreground-muted">No appointments today.</p>
                  <p className="text-xs text-foreground-subtle mt-1">Enjoy your free time!</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-white/5 bg-surface-secondary/50">
              <Button variant="outline" className="w-full justify-center">Manage Schedule</Button>
            </div>
          </SurfaceCard>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
};

export default DoctorDashboard;