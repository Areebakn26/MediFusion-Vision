import { FaChartLine, FaUserInjured, FaDollarSign, FaCalendarCheck } from 'react-icons/fa';

const Analytics = () => {
    const stats = [
        { label: 'Total Patients', value: '1,234', change: '+12%', icon: <FaUserInjured />, color: 'bg-blue-500' },
        { label: 'Appointments', value: '56', change: '+5%', icon: <FaCalendarCheck />, color: 'bg-teal-500' },
        { label: 'Revenue', value: '$12,450', change: '+8%', icon: <FaDollarSign />, color: 'bg-purple-500' },
        { label: 'Growth', value: '24%', change: '+2%', icon: <FaChartLine />, color: 'bg-orange-500' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Practice Analytics</h1>
                    <p className="text-gray-500 text-sm">Overview of your practice performance</p>
                </div>
                <select className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-teal-500">
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                    <option>This Year</option>
                </select>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-soft hover:shadow-lg transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl text-white ${stat.color} shadow-lg shadow-opacity-20`}>
                                <span className="text-xl">{stat.icon}</span>
                            </div>
                            <span className="text-green-500 text-xs font-bold bg-green-50 px-2 py-1 rounded-lg">
                                {stat.change}
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                        <p className="text-gray-500 text-sm">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Charts Section (Mock Visuals) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-soft">
                    <h3 className="font-bold text-gray-800 mb-6">Patient Visits Trend</h3>
                    <div className="h-64 flex items-end justify-between space-x-2 px-4">
                        {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                            <div key={i} className="w-full bg-teal-100 rounded-t-lg relative group">
                                <div
                                    className="absolute bottom-0 left-0 right-0 bg-teal-500 rounded-t-lg transition-all duration-500 group-hover:bg-teal-600"
                                    style={{ height: `${height}%` }}
                                ></div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4 text-xs text-gray-400">
                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-soft">
                    <h3 className="font-bold text-gray-800 mb-6">Revenue Breakdown</h3>
                    <div className="flex items-center justify-center h-64">
                        <div className="w-48 h-48 rounded-full border-8 border-teal-100 border-t-teal-500 border-r-blue-500 border-b-purple-500 relative">
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-2xl font-bold text-gray-800">$12k</span>
                                <span className="text-xs text-gray-500">Total</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center gap-6 mt-4">
                        <div className="flex items-center text-sm text-gray-600">
                            <span className="w-3 h-3 bg-teal-500 rounded-full mr-2"></span> Consultations
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                            <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span> Surgeries
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                            <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span> Diagnostics
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
