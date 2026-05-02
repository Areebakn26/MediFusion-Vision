import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaUserShield, FaBan, FaTrash } from 'react-icons/fa';
import { getAllUsers, blockUser, deleteAdminUser } from '../../services/api';
import { GlassCard, Button, Badge, Input } from '../../components/ui';
import { toast } from 'react-hot-toast';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await getAllUsers();
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching users', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const deriveStatus = (user) => {
        if (!user.is_active) return 'blocked';
        if (user.status === 'pending_verification') return 'pending';
        return 'active';
    };

    const handleAction = async (id, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
        try {
            if (action === 'block') {
                await blockUser(id, true);
                setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: false } : u));
                toast.success('User blocked successfully');
            } else if (action === 'unblock') {
                await blockUser(id, false);
                setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: true } : u));
                toast.success('User unblocked successfully');
            } else if (action === 'delete') {
                await deleteAdminUser(id);
                setUsers(prev => prev.filter(u => u.id !== id));
                toast.success('User deleted successfully');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${action} user`);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const getRoleBadge = (role) => {
        const variants = { admin: 'primary', doctor: 'secondary', patient: 'success' };
        return <Badge variant={variants[role] || 'default'}>{(role || '').toUpperCase()}</Badge>;
    };

    const getStatusBadge = (status) => {
        const variants = { active: 'success', blocked: 'danger', pending: 'warning' };
        return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    User Management
                </h1>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-72">
                        <Input
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    <select
                        className="px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 outline-none bg-white/50"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="doctor">Doctor</option>
                        <option value="patient">Patient</option>
                    </select>
                </div>
            </div>

            <GlassCard className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading users...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No users found.</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user, index) => {
                                    const status = deriveStatus(user);
                                    return (
                                        <motion.tr
                                            key={user.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="hover:bg-blue-50/30 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-blue-600 font-bold shadow-sm">
                                                        {(user.name || '?').charAt(0)}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-bold text-gray-900">{user.name}</div>
                                                        <div className="text-sm text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getRoleBadge(user.role)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2">
                                                    {user.role !== 'admin' && (
                                                        status === 'blocked' ? (
                                                            <button
                                                                onClick={() => handleAction(user.id, 'unblock')}
                                                                className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="Unblock User"
                                                            >
                                                                <FaUserShield />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleAction(user.id, 'block')}
                                                                className="text-orange-600 hover:text-orange-900 p-2 hover:bg-orange-50 rounded-lg transition-colors"
                                                                title="Block User"
                                                            >
                                                                <FaBan />
                                                            </button>
                                                        )
                                                    )}
                                                    {user.role !== 'admin' && (
                                                        <button
                                                            onClick={() => handleAction(user.id, 'delete')}
                                                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete User"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
};

export default Users;
