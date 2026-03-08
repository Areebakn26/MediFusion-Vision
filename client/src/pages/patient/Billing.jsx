import { FaCreditCard, FaHistory, FaFileInvoiceDollar, FaCheckCircle, FaDownload } from 'react-icons/fa';

const Billing = () => {
    const invoices = [
        { id: 'INV-001', date: '2023-10-20', service: 'MRI Brain Scan', amount: '$350.00', status: 'Paid' },
        { id: 'INV-002', date: '2023-10-15', service: 'Virtual Consultation', amount: '$75.00', status: 'Paid' },
        { id: 'INV-003', date: '2023-09-10', service: 'General Checkup', amount: '$120.00', status: 'Pending' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Billing & Payments</h1>
                    <p className="text-gray-500 text-sm">Manage your invoices and payment methods</p>
                </div>
                <button className="bg-teal-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-teal-700 shadow-lg shadow-teal-200 transition-all">
                    Add Payment Method
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Current Plan / Balance */}
                <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl p-6 text-white shadow-lg">
                    <p className="text-teal-100 text-sm font-medium mb-1">Outstanding Balance</p>
                    <h2 className="text-3xl font-bold mb-4">$120.00</h2>
                    <button className="w-full bg-white text-teal-700 py-2 rounded-lg font-bold text-sm hover:bg-teal-50 transition-colors">
                        Pay Now
                    </button>
                </div>

                {/* Payment Method */}
                <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <FaCreditCard className="text-xl" />
                        </div>
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">Primary</span>
                    </div>
                    <p className="text-gray-500 text-sm">Visa ending in</p>
                    <p className="text-xl font-bold text-gray-800">•••• 4242</p>
                    <p className="text-xs text-gray-400 mt-1">Expires 12/25</p>
                </div>

                {/* Insurance */}
                <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <FaFileInvoiceDollar className="text-xl" />
                        </div>
                        <span className="text-teal-600 text-xs font-bold cursor-pointer hover:underline">Edit</span>
                    </div>
                    <p className="text-gray-500 text-sm">Insurance Provider</p>
                    <p className="text-lg font-bold text-gray-800">BlueCross BlueShield</p>
                    <p className="text-xs text-gray-400 mt-1">Policy #987654321</p>
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center">
                        <FaHistory className="mr-2 text-gray-400" /> Transaction History
                    </h3>
                    <button className="text-teal-600 text-sm font-medium hover:underline">Download All</button>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                            <th className="p-4">Invoice ID</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Service</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Status</th>
                            <th className="p-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {invoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 text-sm font-medium text-gray-800">{inv.id}</td>
                                <td className="p-4 text-sm text-gray-500">{inv.date}</td>
                                <td className="p-4 text-sm text-gray-800">{inv.service}</td>
                                <td className="p-4 text-sm font-bold text-gray-800">{inv.amount}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${inv.status === 'Paid' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                                        }`}>
                                        {inv.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <button className="text-gray-400 hover:text-teal-600 transition-colors">
                                        <FaDownload />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Billing;
