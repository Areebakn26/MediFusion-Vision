import { useState, useEffect } from 'react';
import { FaDollarSign, FaExchangeAlt, FaExclamationTriangle } from 'react-icons/fa';
import { getPaymentHistory } from '../../services/api';
import { toast } from 'react-hot-toast';

const STATUS_STYLES = {
    succeeded: 'bg-success/10 text-success',
    completed: 'bg-success/10 text-success',
    pending: 'bg-warning/10 text-warning',
    processing: 'bg-surface-tertiary text-foreground-muted',
    failed: 'bg-error/10 text-error',
    refunded: 'bg-accent-subtle text-accent',
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
                <h1 className="text-2xl font-bold text-foreground">Finance & Support</h1>
                <p className="text-foreground-muted text-sm">Payment transactions and financial overview</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface-secondary p-6 rounded-xl shadow-card">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-success/10 text-success rounded-full">
                            <FaDollarSign className="text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-foreground-muted">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-foreground">
                                {loading ? '…' : `PKR ${totalRevenue.toLocaleString()}`}
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="bg-surface-secondary p-6 rounded-xl shadow-card">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-accent-subtle text-accent rounded-full">
                            <FaExchangeAlt className="text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-foreground-muted">Total Transactions</p>
                            <h3 className="text-2xl font-bold text-foreground">
                                {loading ? '…' : payments.length}
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="bg-surface-secondary p-6 rounded-xl shadow-card">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-error/10 text-error rounded-full">
                            <FaExclamationTriangle className="text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-foreground-muted">Total Refunded</p>
                            <h3 className="text-2xl font-bold text-foreground">
                                {loading ? '…' : `PKR ${totalRefunded.toLocaleString()}`}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment History Table */}
            <div className="bg-surface-secondary rounded-xl shadow-card overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <h3 className="font-bold text-foreground">Payment Transaction History</h3>
                </div>
                {loading ? (
                    <div className="py-12 text-center text-foreground-subtle">Loading transactions...</div>
                ) : payments.length === 0 ? (
                    <div className="py-12 text-center text-foreground-subtle">No transactions found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-secondary/50 text-xs uppercase text-foreground-muted font-semibold">
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Patient</th>
                                    <th className="p-4">Doctor</th>
                                    <th className="p-4">Amount (PKR)</th>
                                    <th className="p-4">Method</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-surface-tertiary/50 transition-colors">
                                        <td className="p-4 text-sm text-foreground-muted">
                                            {new Date(payment.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-sm text-foreground">{getPatientName(payment)}</td>
                                        <td className="p-4 text-sm text-foreground">{getDoctorName(payment)}</td>
                                        <td className="p-4 text-sm font-medium text-foreground">
                                            {parseFloat(payment.amount || 0).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-sm text-foreground-muted capitalize">
                                            {payment.payment_method || payment.paymentMethod || '—'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-xl text-xs font-bold capitalize ${STATUS_STYLES[payment.status] || 'bg-surface-tertiary text-foreground-muted'}`}>
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
