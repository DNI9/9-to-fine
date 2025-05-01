import { useEffect, useRef, useState } from "react";
import { Task } from "../types";
import { playNotificationSound } from "../utils/soundUtils";

const NOTIFICATION_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds

export const useNotifications = (tasks: Task[]) => {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(() => {
    const savedPref = localStorage.getItem("notificationsEnabled");
    return savedPref !== null ? JSON.parse(savedPref) : false;
  });
  const taskNotificationsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const checkLongRunningTasks = () => {
      if (!isNotificationsEnabled) return;

      tasks.forEach(task => {
        const taskIdStr = String(task.id);
        const startTimeNumber = task.start_time ? Number(task.start_time) : null;
        if (task.is_running && startTimeNumber) {
          const runningMillis = Date.now() - startTimeNumber + task.total_time * 1000;
          const notificationCount = Math.floor(runningMillis / NOTIFICATION_INTERVAL);
          const lastNotified = taskNotificationsRef.current[taskIdStr] || 0;

          if (notificationCount > lastNotified && Notification.permission === "granted") {
            playNotificationSound();
            new Notification(
              `Task "${task.name}" has been running for ${
                notificationCount * 30
              } minutes`,
              {
                body: "Take a moment to check your progress!",
                icon: "/favicon.ico",
              }
            );
            taskNotificationsRef.current[taskIdStr] = notificationCount;
          }
        } else {
          delete taskNotificationsRef.current[taskIdStr];
        }
      });
    };

    const intervalId = setInterval(checkLongRunningTasks, 60000); // Check every minute
    return () => clearInterval(intervalId);
  }, [tasks, isNotificationsEnabled]);

  const toggleNotifications = () => {
    setIsNotificationsEnabled((prevEnabled: boolean) => {
      const newState = !prevEnabled;

      if (newState) {
        if (Notification.permission === "granted") {
          localStorage.setItem("notificationsEnabled", JSON.stringify(true));
          return true;
        } else if (Notification.permission === "denied") {
          alert(
            "Notification permission was denied. Please enable notifications in your browser settings to use this feature."
          );
          localStorage.setItem("notificationsEnabled", JSON.stringify(false));
          return false;
        } else {
          // Permission is "default", need to request it
          Notification.requestPermission().then(permission => {
            const isGranted = permission === "granted";
            localStorage.setItem("notificationsEnabled", JSON.stringify(isGranted));
            setIsNotificationsEnabled(isGranted);
          });
          return false; // Initially set to false until permission is granted
        }
      }

      // When disabling notifications
      localStorage.setItem("notificationsEnabled", JSON.stringify(false));
      return false;
    });
  };

  return {
    isNotificationsEnabled,
    toggleNotifications,
  };
};
