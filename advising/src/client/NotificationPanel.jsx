import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles/index.css';

const NotificationPanel = () => {
    const [notifications, setNotifications] = useState([]);

    const fetchNotifications = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/notifications', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`, // Add token
                },
            });
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000); // Poll every 10 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="notification-panel">
            <h3 className="notification-header">Notifications</h3>
            <ul className="notification-list">
                {notifications.length === 0 ? (
                    <li className="notification-item">No notifications available.</li>
                ) : (
                    notifications.map((notif) => (
                        <li
                            key={notif.id}
                            className={`notification-item ${notif.is_read ? 'read' : 'unread'}`}
                        >
                            <div className="notification-message">{notif.message}</div>
                            <div className="notification-status">
                                {notif.is_read ? 'Read' : 'Unread'}
                            </div>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
};

export default NotificationPanel;
