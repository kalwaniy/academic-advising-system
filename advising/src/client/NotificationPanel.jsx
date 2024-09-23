import React from 'react';
import './styles/index.css'; // For notification styles

const notifications = [
  { id: 1, message: 'Your prerequisite waiver has been approved!' },
  { id: 2, message: 'Reminder: Meeting with advisor tomorrow at 10 AM' },
  { id: 3, message: 'New task: Submit documents for course registration.' },
];

function NotificationPanel() {
  return (
    <div className="notification-panel">
      <h3>Notifications</h3>
      {notifications.length === 0 ? (
        <p>No notifications</p>
      ) : (
        <ul>
          {notifications.map((notification) => (
            <li key={notification.id}>{notification.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default NotificationPanel;
