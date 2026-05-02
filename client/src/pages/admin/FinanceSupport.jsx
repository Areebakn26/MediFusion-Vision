import { useState, useEffect } from 'react';
import { FaDollarSign, FaExchangeAlt, FaExclamationTriangle } from 'react-icons/fa';
import { getPaymentHistory } from '../../services/api';
import { toast } from 'react-hot-toast';

const STATUS_STYLES = {
    succeeded: 'bg-green-50 text-green-700',
    completed: 'bg-green-50 text-green-700',
    pending: 'bg-yellow-50 text-yellow-700',
    processing: 'bg-gray-100 text-gray-600',
    failed: 'bg-red-50 text-red-700',
    refunded: 'bg-blue-50 text-blue-700',
};

const FinanceSupport = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getPaymentHistory()
            .then(({ data }) => {
                const list = Array.isArray(data) ? data : (data.payments || []);
                setPayments(list);
            })
            .catch(err => {
                console.error('Payment history error:', err);
                toast.error('Failed to load payment history');
            })
            .finally(() => setLoading(false));
    }, []);

    const totalRevenue = payments
        .filter(p => p.status === 'succeeded' || p.status === 'completed')
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const totalRefunded = payments
        .filter(p => p.status === 'refunded')
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const getPatientName = (p) =>
        p.Appointment?.Patient?.User?.name ||
        p.appointment?.patient?.user?.name ||
        p.patientName ||
        '—';

    const getDoctorName = (p) =>
        p.Appointment?.Doctor?.User?.name ||
        p.appointment?.doctor?.user?.name ||
        p.doctorName ||
        '—';

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Finance & Support</h1>
                <p className="text-gray-500 text-sm">Payment transactions and financial overview</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-soft">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-full">
                            <FaDollarSign className="text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-gray-800">
                                {loading ? '…' : `PKR ${totalRevenue.toLocaleString()}`}
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-soft">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                            <FaExchangeAlt className="text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Transactions</p>
                            <h3 className="text-2xl font-bold text-gray-800">
                                {loading ? '…' : payments.length}
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-soft">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-full">
                            <FaExclamationTriangle className="text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Refunded</p>
                            <h3 className="text-2xl font-bold text-gray-800">
                                {loading ? '…' : `PKR ${totalRefunded.toLocaleString()}`}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment History Table */}
            <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">Payment Transaction History</h3>
                </div>
                {loading ? (
                    <div className="py-12 text-center text-gray-400">Loading transactions...</div>
                ) : payments.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">No transactions found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Patient</th>
                                    <th className="p-4">Doctor</th>
                                    <th className="p-4">Amount (PKR)</th>
                                    <th className="p-4">Method</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-sm text-gray-600">
                                            {new Date(payment.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-sm text-gray-800">{getPatientName(payment)}</td>
                                        <td className="p-4 text-sm text-gray-800">{getDoctorName(payment)}</td>
                                        <td className="p-4 text-sm font-medium text-gray-900">
                                            {parseFloat(payment.amount || 0).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 capitalize">
                                            {payment.payment_method || payment.paymentMethod || '—'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold capitalize ${STATUS_STYLES[payment.status] || 'bg-gray-100 text-gray-600'}`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinanceSupport;
