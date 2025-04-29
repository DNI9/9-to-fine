import React from "react";
import { IoLogOut } from "react-icons/io5";
import LofiToggle from "./LofiToggle";
import NotificationToggle from "./NotificationToggle";
import ThemeToggle from "./ThemeToggle";

interface SettingsModalProps {
  settingsDialogRef: React.RefObject<HTMLDialogElement>;
  isDarkMode: boolean;
  toggleTheme: () => void;
  isNotificationsEnabled: boolean;
  toggleNotifications: () => void;
  isLofiEnabled: boolean;
  toggleLofi: () => void;
  handleLogout: () => void;
  setIsSettingsModalOpen: (isOpen: boolean) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  settingsDialogRef,
  isDarkMode,
  toggleTheme,
  isNotificationsEnabled,
  toggleNotifications,
  isLofiEnabled,
  toggleLofi,
  handleLogout,
  setIsSettingsModalOpen,
}) => {
  return (
    <dialog
      ref={settingsDialogRef}
      className="settings-modal"
      onClose={() => setIsSettingsModalOpen(false)}
    >
      <div className="settings-modal-content">
        <h2>Settings</h2>

        <div className="setting-item">
          <div className="setting-item-info">
            <div className="setting-item-title">Theme</div>
            <p className="setting-description">
              Switch between light and dark mode for your preferred viewing experience.
            </p>
          </div>
          <ThemeToggle isDark={isDarkMode} onToggle={toggleTheme} />
        </div>

        <div className="setting-item">
          <div className="setting-item-info">
            <div className="setting-item-title">Notifications</div>
            <p className="setting-description">
              Get reminded every 30 minutes when a task is running to help you stay on
              track.
            </p>
          </div>
          <NotificationToggle
            isEnabled={isNotificationsEnabled}
            onToggle={toggleNotifications}
          />
        </div>

        <div className="setting-item">
          <div className="setting-item-info">
            <div className="setting-item-title">Lofi Player</div>
            <p className="setting-description">
              Play calming lofi beats automatically when you start a task to enhance
              focus.
            </p>
          </div>
          <LofiToggle isEnabled={isLofiEnabled} onToggle={toggleLofi} />
        </div>

        <div className="settings-modal-buttons">
          <button onClick={handleLogout} className="settings-modal-logout" title="Logout">
            <IoLogOut size={18} /> Logout
          </button>
          <button
            onClick={() => setIsSettingsModalOpen(false)}
            className="settings-modal-close"
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default SettingsModal;
