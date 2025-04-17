// src/components/LofiToggle.tsx
import React from "react";
// Removed import for LofiToggle.css

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
      {/* Simple SVG Music Note Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        width="18"
        height="18"
      >
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
      </svg>
    </button>
  );
};

export default LofiToggle;
