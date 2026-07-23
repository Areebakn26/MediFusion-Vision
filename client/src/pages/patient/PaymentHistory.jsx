import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard, Badge, Button } from '../../components/ui';
import api from '../../services/api';

const PaymentHistory = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalSpent: 0, lastPayment: null });

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            // Mock API call - replace with actual endpoint
            // const { data } = await api.get('/payments');

            // Mock Data for demonstration
            const mockData = [
                {
                    id: '1',
                    date: '2024-11-28T10:30:00Z',
                    description: 'Consultation with Dr. Sarah Khan',
                    amount: 2500,
                    status: 'succeeded',
                    method: 'card',
                    transactionId: 'tx_123456789'
                },
                {
                    id: '2',
                    date: '2024-11-15T14:00:00Z',
                    description: 'MRI Brain Scan Analysis',
                    amount: 5000,
                    status: 'succeeded',
                    method: 'card',
                    transactionId: 'tx_987654321'
                },
                {
                    id: '3',
                    date: '2024-11-10T09:15:00Z',
                    description: 'Consultation with Dr. Ali Raza',
                    amount: 2000,
                    status: 'refunded',
                    method: 'wallet',
                    transactionId: 'tx_456123789'
                }
            ];

            setPayments(mockData);

            // Calculate stats
            const total = mockData
                .filter(p => p.status === 'succeeded')
                .reduce((acc, curr) => acc + curr.amount, 0);
            setStats({
                totalSpent: total,
                lastPayment: mockData[0]
            });

        } catch (error) {
            console.error("Error fetching payments:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const variants = {
            succeeded: 'success',
            pending: 'warning',
            failed: 'danger',
            refunded: 'default'
        };
        return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
    };

    return (
        <div className="min-h-screen bg-surface p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold text-accent">
                        Payment History
                    </h1>
                    <p className="text-foreground-muted mt-1">Track your medical expenses and receipts</p>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <GlassCard className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-foreground-muted font-medium">Total Spent</p>
                                <h3 className="text-2xl font-bold text-foreground">Rs. {stats.totalSpent.toLocaleString()}</h3>
                            </div>
                            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center text-success text-xl">
                                💰
                            </div>
                        </GlassCard>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <GlassCard className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-foreground-muted font-medium">Last Payment</p>
                                <h3 className="text-2xl font-bold text-foreground">
                                    Rs. {stats.lastPayment?.amount.toLocaleString() || 0}
                                </h3>
                            </div>
                            <div className="w-12 h-12 bg-accent-subtle rounded-full flex items-center justify-center text-accent text-xl">
                                💳
                            </div>
                        </GlassCard>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <GlassCard className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-foreground-muted font-medium">Payment Methods</p>
                                <h3 className="text-lg font-bold text-foreground">Visa ending 4242</h3>
                            </div>
                            <div className="w-12 h-12 bg-accent-subtle rounded-full flex items-center justify-center text-accent text-xl">
                                🏦
                            </div>
                        </GlassCard>
                    </motion.div>
                </div>

                {/* Transactions Table */}
                <GlassCard className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-surface-secondary/50 border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">Receipt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-foreground-muted">
                                            Loading transactions...
                                        </td>
                                    </tr>
                                ) : payments.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-foreground-muted">
                                            No payment history found.
                                        </td>
                                    </tr>
                                ) : (
                                    payments.map((payment, index) => (
                                        <motion.tr
                                            key={payment.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="hover:bg-accent-subtle/30 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground-muted">
                                                {new Date(payment.date).toLocaleDateString()}
                                                <br />
                                                <span className="text-xs text-foreground-subtle">{new Date(payment.date).toLocaleTimeString()}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-foreground">{payment.description}</div>
                                                <div className="text-xs text-foreground-muted">ID: {payment.transactionId}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-foreground">
                                                Rs. {payment.amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(payment.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Button variant="ghost" size="sm" className="text-accent hover:text-accent-hover">
                                                    ⬇ Download
                                                </Button>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default PaymentHistory;
