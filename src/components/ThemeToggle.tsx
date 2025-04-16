import React from "react";
import { FaMoon, FaSun } from "react-icons/fa";

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        position: "absolute",
        top: "20px",
        right: "20px",
        padding: "10px",
        borderRadius: "50%",
        border: "none",
        background: "var(--background-card)",
        color: "var(--text-primary)",
        cursor: "pointer",
        boxShadow: "var(--shadow-md)",
        transition: "var(--transition-normal)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {isDark ? <FaSun size={20} /> : <FaMoon size={20} />}
    </button>
  );
};

export default ThemeToggle;
