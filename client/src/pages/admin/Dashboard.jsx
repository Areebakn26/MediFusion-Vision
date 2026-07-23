import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  SurfaceCard,
  DataCard,
  StatusBadge,
  Chart,
  PageHeader,
  StaggerContainer,
  StaggerItem,
} from '../../components/ui';
import { getAdminAnalytics } from '../../services/api';
import api from '../../services/api';
import { Users, Stethoscope, DollarSign, Calendar, ClipboardCheck, Microscope, AlertCircle, TrendingUp } from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const buildChartArrays = (revenueRows, patientRows, doctorRows, scanRows = []) => {
  const monthSet = new Set();
  [...revenueRows, ...patientRows, ...doctorRows, ...scanRows].forEach(r => {
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
  const scanMap = {};
  scanRows.forEach(r => { if (r.month) scanMap[r.month.substring(0, 7)] = parseInt(r.count, 10) || 0; });

  return {
    labels,
    revenueValues: monthKeys.map(k => revenueMap[k] || 0),
    patientValues: monthKeys.map(k => patientMap[k] || 0),
    doctorValues:  monthKeys.map(k => doctorMap[k] || 0),
    scanValues:    monthKeys.map(k => scanMap[k] || 0),
  };
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0, totalDoctors: 0, totalPatients: 0, totalScans: 0,
    pendingVerifications: 0, totalAppointments: 0, revenue: 0
  });
  const [chartLabels, setChartLabels] = useState([]);
  const [revenueValues, setRevenueValues] = useState([]);
  const [patientValues, setPatientValues] = useState([]);
  const [doctorValues, setDoctorValues] = useState([]);
  const [scanValues, setScanValues] = useState([]);
  const reduce = useReducedMotion();

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data))
      .catch(err => console.error('Stats error:', err));

    getAdminAnalytics()
      .then(({ data }) => {
        const { labels, revenueValues: rv, patientValues: pv, doctorValues: dv, scanValues: sv } =
          buildChartArrays(data.revenue || [], data.patients || [], data.doctors || [], data.scans || []);
        if (labels.length) {
          setChartLabels(labels);
          setRevenueValues(rv);
          setPatientValues(pv);
          setDoctorValues(dv);
          setScanValues(sv);
        }
      })
      .catch(err => console.error('Analytics error:', err));
  }, []);

  const revenueData = {
    labels: chartLabels,
    datasets: [{ label: 'Revenue (PKR)', data: revenueValues, borderColor: 'rgb(16, 185, 129)', backgroundColor: 'rgba(16, 185, 129, 0.3)', tension: 0.4, fill: true }]
  };

  const userGrowthData = {
    labels: chartLabels,
    datasets: [
      { label: 'Patients', data: patientValues, borderColor: 'rgb(59, 130, 246)', backgroundColor: 'rgba(59, 130, 246, 0.3)', tension: 0.4, fill: true },
      { label: 'Doctors', data: doctorValues, borderColor: 'rgb(147, 51, 234)', backgroundColor: 'rgba(147, 51, 234, 0.3)', tension: 0.4, fill: true }
    ]
  };

  const scansData = {
    labels: chartLabels,
    datasets: [{ label: 'Scans Uploaded', data: scanValues, borderColor: 'rgb(245, 158, 11)', backgroundColor: 'rgba(245, 158, 11, 0.3)', tension: 0.4, fill: true }]
  };

  const statCards = [
    { icon: Users, label: 'Total Users', value: stats.totalUsers.toLocaleString(), accentColor: 'accent' },
    { icon: Users, label: 'Total Patients', value: stats.totalPatients.toLocaleString(), accentColor: 'accent' },
    { icon: AlertCircle, label: 'Pending Doctors', value: stats.pendingVerifications, sub: 'Action Required', accentColor: 'warning' },
    { icon: DollarSign, label: 'Total Revenue', value: `Rs. ${stats.revenue.toLocaleString()}`, accentColor: 'medical' },
    { icon: Calendar, label: 'Appointments', value: stats.totalAppointments.toLocaleString(), accentColor: 'accent' },
    { icon: Stethoscope, label: 'Total Doctors', value: stats.totalDoctors.toLocaleString(), accentColor: 'medical' },
    { icon: Microscope, label: 'Total Scans', value: stats.totalScans.toLocaleString(), accentColor: 'info' },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Dashboard"
        subtitle="System overview and analytics"
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
            <h3 className="text-lg font-bold text-foreground mb-6">Revenue Overview</h3>
            <div className="h-64"><Chart type="line" data={revenueData} /></div>
          </SurfaceCard>
        </StaggerItem>
        <StaggerItem delay={0.15}>
          <SurfaceCard className="p-6 h-full">
            <h3 className="text-lg font-bold text-foreground mb-6">User Growth</h3>
            <div className="h-64"><Chart type="line" data={userGrowthData} /></div>
          </SurfaceCard>
        </StaggerItem>
        <StaggerItem delay={0.2} className="lg:col-span-2">
          <SurfaceCard className="p-6 h-full">
            <h3 className="text-lg font-bold text-foreground mb-6">Scans per Month</h3>
            <div className="h-64"><Chart type="bar" data={scansData} /></div>
          </SurfaceCard>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
};

export default AdminDashboard;