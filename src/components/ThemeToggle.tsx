import React from "react";
import { FaSun } from "react-icons/fa";
import { HiMiniMoon } from "react-icons/hi2";

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, onToggle }) => {
  // Removed inline styles, added className
  return (
    <button
      onClick={onToggle}
      className="theme-toggle-button" // Added class
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <FaSun size={20} /> : <HiMiniMoon size={20} />}
    </button>
  );
};

export default ThemeToggle;
