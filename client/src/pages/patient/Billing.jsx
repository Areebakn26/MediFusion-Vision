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
                    <h1 className="text-2xl font-bold text-foreground">Billing & Payments</h1>
                    <p className="text-foreground-muted text-sm">Manage your invoices and payment methods</p>
                </div>
                <button className="bg-accent text-white px-6 py-2 rounded-xl font-medium hover:bg-accent-hover transition-all">
                    Add Payment Method
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Current Plan / Balance */}
                <div className="bg-medical rounded-xl p-6 text-white shadow-card">
                    <p className="text-accent/80 text-sm font-medium mb-1">Outstanding Balance</p>
                    <h2 className="text-3xl font-bold mb-4">$120.00</h2>
                    <button className="w-full bg-surface-secondary text-accent py-2 rounded-lg font-bold text-sm hover:bg-accent-subtle transition-colors">
                        Pay Now
                    </button>
                </div>

                {/* Payment Method */}
                <div className="bg-surface-secondary rounded-xl p-6 shadow-card border border-white/5">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-accent-subtle text-accent rounded-xl">
                            <FaCreditCard className="text-xl" />
                        </div>
                        <span className="bg-success/10 text-success text-xs px-2 py-1 rounded-full font-bold">Primary</span>
                    </div>
                    <p className="text-foreground-muted text-sm">Visa ending in</p>
                    <p className="text-xl font-bold text-foreground">•••• 4242</p>
                    <p className="text-xs text-foreground-subtle mt-1">Expires 12/25</p>
                </div>

                {/* Insurance */}
                <div className="bg-surface-secondary rounded-xl p-6 shadow-card border border-white/5">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-accent-subtle text-accent rounded-xl">
                            <FaFileInvoiceDollar className="text-xl" />
                        </div>
                        <span className="text-accent text-xs font-bold cursor-pointer hover:underline">Edit</span>
                    </div>
                    <p className="text-foreground-muted text-sm">Insurance Provider</p>
                    <p className="text-lg font-bold text-foreground">BlueCross BlueShield</p>
                    <p className="text-xs text-foreground-subtle mt-1">Policy #987654321</p>
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-surface-secondary rounded-xl shadow-card overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-bold text-foreground flex items-center">
                        <FaHistory className="mr-2 text-foreground-subtle" /> Transaction History
                    </h3>
                    <button className="text-accent text-sm font-medium hover:underline">Download All</button>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-surface-secondary/60 text-xs uppercase text-foreground-muted font-semibold">
                            <th className="p-4">Invoice ID</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Service</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Status</th>
                            <th className="p-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {invoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-surface-tertiary/50 transition-colors">
                                <td className="p-4 text-sm font-medium text-foreground">{inv.id}</td>
                                <td className="p-4 text-sm text-foreground-muted">{inv.date}</td>
                                <td className="p-4 text-sm text-foreground">{inv.service}</td>
                                <td className="p-4 text-sm font-bold text-foreground">{inv.amount}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${inv.status === 'Paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                                        }`}>
                                        {inv.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <button className="text-foreground-subtle hover:text-accent transition-colors">
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
