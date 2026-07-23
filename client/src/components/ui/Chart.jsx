import { motion, useInView } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import { useRef } from 'react';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const MEDICAL_COLORS = {
  primary: '#5B6AFF',
  primaryLight: 'rgba(91, 106, 255, 0.3)',
  medical: '#10B981',
  medicalLight: 'rgba(16, 185, 129, 0.3)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.3)',
  info: '#3B82F6',
  infoLight: 'rgba(59, 130, 246, 0.3)',
  error: '#EF4444',
  errorLight: 'rgba(239, 68, 68, 0.3)',
  grid: 'rgba(255, 255, 255, 0.04)',
  text: '#64748B',
  textMuted: '#94A3B8',
};

const getDatasetColors = (index, type) => {
  const colorMap = [
    { border: MEDICAL_COLORS.primary, bg: MEDICAL_COLORS.primaryLight },
    { border: MEDICAL_COLORS.medical, bg: MEDICAL_COLORS.medicalLight },
    { border: MEDICAL_COLORS.warning, bg: MEDICAL_COLORS.warningLight },
    { border: MEDICAL_COLORS.info, bg: MEDICAL_COLORS.infoLight },
    { border: MEDICAL_COLORS.error, bg: MEDICAL_COLORS.errorLight },
  ];
  return colorMap[index % colorMap.length];
};

const defaultAnimation = {
  duration: 1200,
  easing: 'easeOutQuart',
};

const Chart = ({
  type = 'line',
  data,
  options = {},
  title,
  className = '',
  animateOnScroll = true,
}) => {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const shouldAnimate = animateOnScroll && !reduce ? isInView : true;

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: shouldAnimate ? defaultAnimation : false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 16,
          font: {
            size: 12,
            family: '"Inter Tight", sans-serif',
            weight: '400',
          },
          color: MEDICAL_COLORS.textMuted,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        titleColor: '#F8FAFC',
        bodyColor: MEDICAL_COLORS.textMuted,
        borderColor: MEDICAL_COLORS.grid,
        borderWidth: 1,
        padding: 14,
        displayColors: true,
        boxPadding: 8,
        cornerRadius: 8,
        titleFont: {
          family: '"Inter Tight", sans-serif',
          size: 13,
          weight: '500',
        },
        bodyFont: {
          family: '"Inter Tight", sans-serif',
          size: 12,
        },
      },
    },
    scales: type !== 'doughnut' && type !== 'pie' ? {
      y: {
        beginAtZero: true,
        grid: {
          color: MEDICAL_COLORS.grid,
          drawBorder: false,
        },
        ticks: {
          font: { size: 11, family: '"Inter Tight", sans-serif', weight: '400' },
          color: MEDICAL_COLORS.text,
          padding: 8,
        },
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 11, family: '"Inter Tight", sans-serif', weight: '400' },
          color: MEDICAL_COLORS.text,
          padding: 8,
        },
      },
    } : {},
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  const styledData = data ? {
    ...data,
    datasets: data.datasets?.map((dataset, i) => ({
      ...dataset,
      borderColor: dataset.borderColor || getDatasetColors(i, type).border,
      backgroundColor: dataset.backgroundColor || getDatasetColors(i, type).bg,
      pointBackgroundColor: dataset.pointBackgroundColor || getDatasetColors(i, type).border,
      pointBorderColor: '#0F172A',
      pointBorderWidth: 2,
      pointRadius: type === 'line' ? 4 : 0,
      pointHoverRadius: 6,
      tension: type === 'line' ? 0.4 : undefined,
      fill: type === 'line' ? true : undefined,
      borderWidth: 2,
      borderRadius: type === 'bar' ? 4 : undefined,
      borderSkipped: type === 'bar' ? false : undefined,
    })) || [],
  } : { labels: [], datasets: [] };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options.plugins,
    },
    scales: {
      ...defaultOptions.scales,
      ...options.scales,
    },
  };

  const chartComponents = {
    line: Line,
    bar: Bar,
    doughnut: Doughnut,
    pie: Pie,
  };

  const ChartComponent = chartComponents[type] || Line;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-xl border border-white/[0.06] bg-surface-secondary/80 backdrop-blur-[4px] shadow-card p-6 ${className}`}
    >
      {title && (
        <h3 className="text-lg font-medium text-foreground mb-4">
          {title}
        </h3>
      )}
      <div className="relative" style={{ height: '300px' }}>
        <ChartComponent data={styledData} options={mergedOptions} />
      </div>
    </motion.div>
  );
};

Chart.displayName = 'Chart';

export default Chart;