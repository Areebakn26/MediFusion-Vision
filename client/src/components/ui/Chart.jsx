import { motion } from 'framer-motion';
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

// Register ChartJS components
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

const Chart = ({
    type = 'line',
    data,
    options = {},
    title,
    className = ''
}) => {
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 15,
                    font: {
                        size: 12,
                        family: 'Inter, sans-serif',
                    },
                },
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#1f2937',
                bodyColor: '#4b5563',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: 12,
                displayColors: true,
                boxPadding: 6,
            },
        },
        scales: type !== 'doughnut' && type !== 'pie' ? {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                },
                ticks: {
                    font: {
                        size: 11,
                    },
                },
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    font: {
                        size: 11,
                    },
                },
            },
        } : {},
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        plugins: {
            ...defaultOptions.plugins,
            ...options.plugins,
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`bg-white/70 backdrop-blur-md rounded-2xl shadow-glass border border-white/20 p-6 ${className}`}
        >
            {title && (
                <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-primary-blue to-primary-teal bg-clip-text text-transparent">
                    {title}
                </h3>
            )}
            <div className="relative">
                <ChartComponent data={data} options={mergedOptions} />
            </div>
        </motion.div>
    );
};

export default Chart;
