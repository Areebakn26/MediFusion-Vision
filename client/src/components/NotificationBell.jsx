import { useState, useEffect } from 'react';
import { FaBell, FaCheckDouble, FaCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';
import Dropdown, { DropdownItem } from './ui/Dropdown';
import Badge from './ui/Badge';
import { useAuth } from '../context/AuthContext';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { token } = useAuth();
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const { data } = await getNotifications();
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        } catch (error) {
            console.error("Fetch Notifications Error:", error);
        }
    };

    useEffect(() => {
        if (token) {
            fetchNotifications();
            // Poll every 1 minute
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [token]);

    const handleMarkAsRead = async (id, link) => {
        try {
            await markNotificationRead(id);
            
            // Update local state
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));

            if (link) navigate(link);
        } catch (error) {
            console.error("Mark read error:", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Mark all read error:", error);
        }
    };

    const trigger = (
        <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <FaBell className="text-xl" />
            {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount}
                </span>
            )}
        </button>
    );

    return (
        <Dropdown trigger={trigger} align="right" className="w-80">
            <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
                <span className="font-bold text-gray-800">Notifications</span>
                {unreadCount > 0 && (
                    <button 
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-primary-blue hover:underline flex items-center gap-1"
                    >
                        <FaCheckDouble className="text-[10px]" /> Mark all read
                    </button>
                )}
            </div>

            <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500 text-sm">
                        No notifications yet
                    </div>
                ) : (
                    notifications.map(notification => (
                        <div 
                            key={notification.id}
                            onClick={() => handleMarkAsRead(notification.id, notification.link)}
                            className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors flex gap-3 ${!notification.is_read ? 'bg-blue-50/30' : ''}`}
                        >
                            <div className="mt-1">
                                {!notification.is_read ? (
                                    <FaCircle className="text-primary-blue text-[8px]" />
                                ) : (
                                    <div className="w-[8px]" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className={`text-sm ${!notification.is_read ? 'font-bold' : 'font-medium'} text-gray-800`}>
                                    {notification.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                    {notification.message}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                    {new Date(notification.createdAt).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="px-4 py-2 border-t border-gray-100 text-center bg-gray-50/50 rounded-b-xl">
                <button 
                    onClick={() => navigate('/notifications')}
                    className="text-xs text-gray-500 hover:text-primary-blue font-medium"
                >
                    View all notifications
                </button>
            </div>
        </Dropdown>
    );
};

export default NotificationBell;
