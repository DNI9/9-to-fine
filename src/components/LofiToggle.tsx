import React from "react";
import { MdMusicNote } from "react-icons/md";

interface LofiToggleProps {
  isEnabled: boolean;
  onToggle: () => void;
}

const LofiToggle: React.FC<LofiToggleProps> = ({ isEnabled, onToggle }) => {
  return (
    <button
      className={`lofi-toggle-button ${isEnabled ? "enabled" : ""}`}
      onClick={onToggle}
      aria-pressed={isEnabled}
      title={isEnabled ? "Disable Lofi Beats" : "Enable Lofi Beats"}
    >
      <MdMusicNote size={25} />
    </button>
  );
};

export default LofiToggle;
