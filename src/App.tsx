import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import confetti from "canvas-confetti";
import React, { useCallback, useEffect, useRef, useState } from "react";
import "./App.css"; // We'll create this later for basic styling
import DaySection from "./components/DaySection";
import TaskInput from "./components/TaskInput";
import ThemeToggle from "./components/ThemeToggle";
import { Task } from "./types";
import { loadTasks, saveTasks } from "./utils/storageUtils";
import { pauseLofi, playRandomLofi, resumeLofi, stopLofi } from "./utils/youtubePlayer"; // Import lofi functions

// Helper to get today's date in YYYY-MM-DD format based on local time
const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(loadTasks());
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return (
      savedTheme === "dark" ||
      (savedTheme === null && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });
  // State to track if lofi should be playing
  const [isLofiPlaying, setIsLofiPlaying] = useState(false);
  // Ref to store the original title, avoiding potential stale closures
  const originalTitleRef = useRef(
    "9-to-Fine - Because tracking time is totally fine... right? 😅"
  );

  // Set theme on body when dark mode changes
  useEffect(() => {
    document.body.dataset.theme = isDarkMode ? "dark" : "light";
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Save tasks whenever they change
  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  // Update document title when tasks are running
  useEffect(() => {
    const runningTask = tasks.find(task => task.isRunning);
    const originalTitle = originalTitleRef.current; // Capture ref value here

    if (runningTask) {
      const updateTitle = () => {
        if (runningTask.startTime) {
          const elapsed = Date.now() - runningTask.startTime + runningTask.totalTime;
          const timeStr = new Date(elapsed).toISOString().substring(11, 19); // Format as HH:MM:SS
          document.title = `${timeStr} - ${runningTask.name}`;
        }
      };

      // Update immediately and then every second
      updateTitle();
      const intervalId = setInterval(updateTitle, 1000);

      return () => {
        clearInterval(intervalId);
        document.title = originalTitle; // Use captured value in cleanup
      };
    } else {
      document.title = originalTitle; // Use captured value outside effect too
    }
  }, [tasks]);

  // Effect to control Lofi playback based on running tasks
  useEffect(() => {
    const shouldPlay = tasks.some(task => task.isRunning);

    if (shouldPlay && !isLofiPlaying) {
      // If any task is running and lofi isn't marked as playing
      console.log("Attempting to resume or start Lofi...");
      // Try resuming first, in case it was just paused
      resumeLofi().then(resumed => {
        if (!resumed) {
          // If resumeLofi returned false (didn't resume), then play a new random video
          console.log("Resume failed or not applicable, starting new Lofi video.");
          playRandomLofi();
        } else {
          console.log("Lofi resumed successfully.");
        }
      });
      setIsLofiPlaying(true); // Mark as playing regardless of resume/start
    } else if (!shouldPlay && isLofiPlaying) {
      // If no tasks are running and lofi is marked as playing
      console.log("Pausing Lofi...");
      pauseLofi(); // Pause instead of stopping
      setIsLofiPlaying(false);
    }
    // No cleanup needed here as pause/resume handle player state
  }, [tasks, isLofiPlaying]); // Depend on tasks and the playing state

  const handleAddTask = useCallback((name: string) => {
    const newTask: Task = {
      id: crypto.randomUUID(), // Modern way to generate unique IDs
      name,
      totalTime: 0,
      startTime: null,
      isRunning: false,
      isCompleted: false,
      currentDay: getTodayDateString(),
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
  }, []);

  const handleStartPause = useCallback((id: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === id && !task.isCompleted) {
          if (task.isRunning) {
            // Pausing
            const elapsed = task.startTime ? Date.now() - task.startTime : 0;
            return {
              ...task,
              isRunning: false,
              startTime: null,
              totalTime: task.totalTime + elapsed,
            };
          } else {
            // Starting / Resuming
            return { ...task, isRunning: true, startTime: Date.now() };
          }
        }
        return task;
      })
    );
  }, []);

  const handleStop = useCallback(
    (id: string) => {
      setTasks(prevTasks =>
        prevTasks.map(task => {
          if (task.id === id && !task.isCompleted) {
            let finalTotalTime = task.totalTime;
            if (task.isRunning && task.startTime) {
              // Calculate final elapsed time if it was running
              finalTotalTime += Date.now() - task.startTime;
            }
            // Trigger confetti when completing a task
            confetti({
              particleCount: 100,
              spread: 80,
              origin: { y: 0.8 },
            });
            return {
              ...task,
              isRunning: false,
              isCompleted: true,
              startTime: null,
              totalTime: finalTotalTime,
            };
          }
          return task;
        })
      );

      // Check if this was the last running task, if so, stop lofi completely
      const anyOtherTaskRunning = tasks.some(task => task.id !== id && task.isRunning);
      if (!anyOtherTaskRunning) {
        console.log("Last task stopped, stopping Lofi completely.");
        stopLofi(); // Stop music when task is completed
        setIsLofiPlaying(false); // Update state as well
      }
    },
    [tasks]
  ); // Added tasks dependency because we check other tasks

  const handleDelete = useCallback((id: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
  }, []);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination, draggableId } = result;

      // Dropped outside a valid droppable area
      if (!destination) {
        return;
      }

      // Dropped in the same place
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }

      // Find the task being dragged
      const taskToMove = tasks.find(task => task.id === draggableId);
      if (!taskToMove) return; // Should not happen

      // Update the task's day
      const updatedTask = { ...taskToMove, currentDay: destination.droppableId };

      // Reorder tasks
      setTasks(prevTasks => {
        const otherTasks = prevTasks.filter(task => task.id !== draggableId);
        const tasksInDestinationDay = otherTasks.filter(
          task => task.currentDay === destination.droppableId
        );
        tasksInDestinationDay.splice(destination.index, 0, updatedTask); // Insert at new position

        // Combine tasks from other days with the updated destination day tasks
        const tasksNotInDestination = otherTasks.filter(
          task => task.currentDay !== destination.droppableId
        );
        return [...tasksNotInDestination, ...tasksInDestinationDay];
      });
    },
    [tasks]
  ); // Dependency on tasks is important here

  // Group tasks by day for rendering
  const tasksByDay = tasks.reduce((acc, task) => {
    const day = task.currentDay;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(task);
    // Optional: Sort tasks within a day if needed, e.g., by creation time or name
    return acc;
  }, {} as Record<string, Task[]>);

  // Sort days chronologically for display
  const sortedDays = Object.keys(tasksByDay).sort();

  // Ensure today's section is always visible, even if empty
  const todayStr = getTodayDateString();
  if (!tasksByDay[todayStr]) {
    tasksByDay[todayStr] = [];
    if (!sortedDays.includes(todayStr)) {
      // Add today and re-sort if it wasn't present
      sortedDays.push(todayStr);
      sortedDays.sort();
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="app-container">
        <ThemeToggle isDark={isDarkMode} onToggle={() => setIsDarkMode(prev => !prev)} />
        <h1>9-to-Fine</h1>
        <p className="app-description">
          A simple time tracking app to manage your daily tasks with drag-and-drop
          organization.
        </p>
        <TaskInput onAddTask={handleAddTask} />

        <div className="days-container">
          {sortedDays.map(day => (
            <DaySection
              key={day}
              date={day}
              tasks={tasksByDay[day]}
              onStartPause={handleStartPause}
              onStop={handleStop}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    </DragDropContext>
  );
};

export default App;
