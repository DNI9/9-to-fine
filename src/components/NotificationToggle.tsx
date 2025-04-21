import React from "react";
import { IoNotifications, IoNotificationsOff } from "react-icons/io5";

interface NotificationToggleProps {
  isEnabled: boolean;
  onToggle: () => void;
}

const NotificationToggle: React.FC<NotificationToggleProps> = ({
  isEnabled,
  onToggle,
}) => {
  return (
    <button
      className={`notification-toggle-button ${isEnabled ? "enabled" : ""}`}
      onClick={onToggle}
      aria-pressed={isEnabled}
      title={isEnabled ? "Disable Notifications" : "Enable Notifications"}
    >
      {isEnabled ? <IoNotifications size={25} /> : <IoNotificationsOff size={25} />}
    </button>
  );
};

export default NotificationToggle;
