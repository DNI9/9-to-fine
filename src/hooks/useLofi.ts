import { useEffect, useState } from "react";
import { pauseLofi, playRandomLofi, resumeLofi, stopLofi } from "../utils/youtubePlayer";

export const useLofi = (hasRunningTasks: boolean) => {
  const [isLofiEnabled, setIsLofiEnabled] = useState(() => {
    const savedLofiPref = localStorage.getItem("lofiEnabled");
    return savedLofiPref !== null ? JSON.parse(savedLofiPref) : false;
  });
  const [isLofiPlaying, setIsLofiPlaying] = useState(false);

  useEffect(() => {
    if (!isLofiEnabled) {
      if (isLofiPlaying) {
        console.log("Lofi disabled, stopping playback.");
        stopLofi();
        setIsLofiPlaying(false);
      }
      return;
    }

    if (hasRunningTasks && !isLofiPlaying) {
      console.log("Attempting to resume or start Lofi (enabled)...");
      resumeLofi().then(resumed => {
        if (!resumed) {
          console.log("Resume failed or not applicable, starting new Lofi video.");
          playRandomLofi();
        } else {
          console.log("Lofi resumed successfully.");
        }
      });
      setIsLofiPlaying(true);
    } else if (!hasRunningTasks && isLofiPlaying) {
      console.log("Pausing Lofi (enabled)...");
      pauseLofi();
      setIsLofiPlaying(false);
    }
  }, [hasRunningTasks, isLofiPlaying, isLofiEnabled]);

  const toggleLofi = () => {
    setIsLofiEnabled((prevEnabled: boolean) => {
      const newState = !prevEnabled;
      localStorage.setItem("lofiEnabled", JSON.stringify(newState));
      if (!newState && isLofiPlaying) {
        console.log("Toggled Lofi off, stopping playback.");
        stopLofi();
        setIsLofiPlaying(false);
      }
      return newState;
    });
  };

  return {
    isLofiEnabled,
    isLofiPlaying,
    toggleLofi,
  };
};
