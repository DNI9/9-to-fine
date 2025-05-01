import confetti from "canvas-confetti";
import React, { useEffect, useRef } from "react";

interface ProgressBarProps {
  currentHours: number;
  targetHours: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentHours, targetHours }) => {
  const progress = Math.min((currentHours / targetHours) * 100, 100);
  const prevProgressRef = useRef<number>(0);

  useEffect(() => {
    // Only trigger confetti if we just hit 100% (not when component mounts at 100%)
    if (progress === 100 && prevProgressRef.current < 100) {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.7 },
        colors: ["#7c3aed", "#6d28d9", "#10b981", "#f59e0b"],
        gravity: 1.2,
        scalar: 1.2,
        shapes: ["star", "circle"],
      });
    }
    prevProgressRef.current = progress;
  }, [progress]);

  return (
    <div className="progress-container">
      <div
        className="progress-bar"
        title={`${currentHours.toFixed(1)} / ${targetHours} hours`}
      >
        <div className="progress-bar-background">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }}>
            <span className="progress-text">{`${progress.toFixed(0)}%`}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
