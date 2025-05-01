import { useState } from "react";

export const useTargetHours = () => {
  const [targetHours, setTargetHours] = useState<number | null>(() => {
    const saved = localStorage.getItem("targetHours");
    return saved ? Number(saved) : null;
  });

  const updateTargetHours = (hours: number | null) => {
    setTargetHours(hours);
    if (hours === null) {
      localStorage.removeItem("targetHours");
    } else {
      localStorage.setItem("targetHours", hours.toString());
    }
  };

  return {
    targetHours,
    setTargetHours: updateTargetHours,
  };
};
