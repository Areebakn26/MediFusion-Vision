import { FaDollarSign, FaTicketAlt, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

const FinanceSupport = () => {
    const tickets = [
        { id: '#TK-8821', user: 'Dr. Alice Smith', issue: 'Payment Gateway Error', status: 'Open', priority: 'High' },
        { id: '#TK-8820', user: 'John Doe (Patient)', issue: 'Refund Request', status: 'Pending', priority: 'Medium' },
        { id: '#TK-8819', user: 'Dr. Bob Jones', issue: 'Account Verification', status: 'Resolved', priority: 'Low' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Finance & Support</h1>
                <p className="text-gray-500 text-sm">Manage financial transactions and support tickets</p>
            </div>

            {/* Financial Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-soft">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-full">
                            <FaDollarSign className="text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-gray-800">$45,230.00</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-soft">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                            <FaTicketAlt className="text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Active Tickets</p>
                            <h3 className="text-2xl font-bold text-gray-800">24</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-soft">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-full">
                            <FaExclamationTriangle className="text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Pending Refunds</p>
                            <h3 className="text-2xl font-bold text-gray-800">$320.00</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Support Tickets */}
            <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Recent Support Tickets</h3>
                    <button className="text-teal-600 text-sm font-bold hover:underline">View All</button>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                            <th className="p-4">Ticket ID</th>
                            <th className="p-4">User</th>
                            <th className="p-4">Issue</th>
                            <th className="p-4">Priority</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {tickets.map((ticket) => (
                            <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 text-sm font-medium text-gray-800">{ticket.id}</td>
                                <td className="p-4 text-sm text-gray-600">{ticket.user}</td>
                                <td className="p-4 text-sm text-gray-800">{ticket.issue}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${ticket.priority === 'High' ? 'bg-red-50 text-red-600' :
                                            ticket.priority === 'Medium' ? 'bg-yellow-50 text-yellow-600' :
                                                'bg-blue-50 text-blue-600'
                                        }`}>
                                        {ticket.priority}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${ticket.status === 'Open' ? 'bg-green-50 text-green-600' :
                                            ticket.status === 'Pending' ? 'bg-orange-50 text-orange-600' :
                                                'bg-gray-100 text-gray-600'
                                        }`}>
                                        {ticket.status}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <button className="text-teal-600 hover:underline text-sm font-medium">Resolve</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FinanceSupport;
