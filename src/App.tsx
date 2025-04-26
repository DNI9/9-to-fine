import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import confetti from "canvas-confetti";
import { endOfDay, isWithinInterval, parseISO, startOfDay } from "date-fns";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { DateRange } from "react-day-picker";
import { IoLogOut } from "react-icons/io5";
import { Navigate, Route, Routes } from "react-router";
import "./App.css";
import DateFilter from "./components/DateFilter";
import DaySection from "./components/DaySection";
import LofiToggle from "./components/LofiToggle";
import Login from "./components/Login";
import NotificationToggle from "./components/NotificationToggle";
import TaskInput from "./components/TaskInput";
import ThemeToggle from "./components/ThemeToggle";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Task } from "./types";
// Removed loadTasks, saveTasks imports
import { supabase } from "./utils/supabase"; // Import supabase client
import { addTask, deleteTask, getTasks, updateTask } from "./utils/taskUtils"; // Import Supabase task functions
import { pauseLofi, playRandomLofi, resumeLofi, stopLofi } from "./utils/youtubePlayer";

// Helper to get today's date in YYYY-MM-DD format based on local time
const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Add this constant at the top with other constants
const NOTIFICATION_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds

const MainContent: React.FC = () => {
  const { session } = useAuth(); // Get session which contains user info
  const [tasks, setTasks] = useState<Task[]>([]); // Initialize with empty array
  const [isLoadingTasks, setIsLoadingTasks] = useState(true); // Add loading state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark";
  });
  const [isLofiEnabled, setIsLofiEnabled] = useState(() => {
    const savedLofiPref = localStorage.getItem("lofiEnabled");
    return savedLofiPref !== null ? JSON.parse(savedLofiPref) : false;
  });
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(() => {
    const savedPref = localStorage.getItem("notificationsEnabled");
    return savedPref !== null ? JSON.parse(savedPref) : false;
  });
  const [dateFilter, setDateFilter] = useState<DateRange | undefined>(undefined);
  // State to track if lofi is *currently* playing (internal state)
  const [isLofiPlaying, setIsLofiPlaying] = useState(false);
  // Ref to store the original title, avoiding potential stale closures
  const originalTitleRef = useRef(
    "9-to-Fine - Because tracking time is totally fine... right? 😅"
  );
  const taskNotificationsRef = useRef<Record<string, number>>({});

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to log out?")) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
    }
  };

  // Fetch tasks from Supabase when component mounts and user is logged in
  useEffect(() => {
    const fetchTasks = async () => {
      if (session?.user?.id) {
        setIsLoadingTasks(true);
        try {
          const fetchedTasks = await getTasks(session.user.id);
          setTasks(fetchedTasks);
        } catch (error) {
          console.error("Failed to fetch tasks:", error);
          // Handle error appropriately, maybe show a message to the user
        } finally {
          setIsLoadingTasks(false);
        }
      } else {
        setTasks([]); // Clear tasks if no user
        setIsLoadingTasks(false);
      }
    };

    fetchTasks();
    // Depend on user ID instead of the whole session object
  }, [session?.user?.id]); // Re-fetch only if user ID changes

  // Set theme on body when dark mode changes
  useEffect(() => {
    document.body.dataset.theme = isDarkMode ? "dark" : "light";
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Update document title when tasks are running
  useEffect(() => {
    // Use snake_case property
    const runningTask = tasks.find(task => task.is_running);
    const originalTitle = originalTitleRef.current; // Capture ref value here

    if (runningTask) {
      const updateTitle = () => {
        // Use snake_case property, convert string timestamp to number for calculation
        const startTimeNumber = runningTask.start_time
          ? Number(runningTask.start_time)
          : null;
        if (startTimeNumber) {
          // Use total_time (already in seconds)
          const elapsedMillis =
            Date.now() - startTimeNumber + runningTask.total_time * 1000;
          const timeStr = new Date(elapsedMillis).toISOString().substring(11, 19); // Format as HH:MM:SS
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

  // Effect to control Lofi playback based on running tasks AND the toggle state
  useEffect(() => {
    // --- Lofi Logic ---
    if (!isLofiEnabled) {
      // If Lofi is disabled, ensure it's stopped and exit early
      if (isLofiPlaying) {
        console.log("Lofi disabled, stopping playback.");
        stopLofi();
        setIsLofiPlaying(false);
      }
      return; // Don't proceed with playback logic if disabled
    }

    // Lofi is enabled, proceed with play/pause logic
    // Use snake_case property
    const shouldPlay = tasks.some(task => task.is_running);

    if (shouldPlay && !isLofiPlaying) {
      // If any task is running and lofi isn't marked as playing
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
    } else if (!shouldPlay && isLofiPlaying) {
      // If no tasks are running and lofi is marked as playing
      console.log("Pausing Lofi (enabled)...");
      pauseLofi();
      setIsLofiPlaying(false);
    }
  }, [tasks, isLofiPlaying, isLofiEnabled]); // Add isLofiEnabled dependency

  useEffect(() => {
    const checkLongRunningTasks = () => {
      if (!isNotificationsEnabled) return; // Skip if notifications are disabled

      tasks.forEach(task => {
        const taskIdStr = String(task.id); // Use string for ref key
        const startTimeNumber = task.start_time ? Number(task.start_time) : null;
        if (task.is_running && startTimeNumber) {
          const runningMillis = Date.now() - startTimeNumber + task.total_time * 1000;
          const notificationCount = Math.floor(runningMillis / NOTIFICATION_INTERVAL);
          const lastNotified = taskNotificationsRef.current[taskIdStr] || 0;

          if (notificationCount > lastNotified && Notification.permission === "granted") {
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

  // Handler for the Lofi toggle switch
  const handleLofiToggle = useCallback(() => {
    setIsLofiEnabled((prevEnabled: boolean) => {
      const newState = !prevEnabled;
      localStorage.setItem("lofiEnabled", JSON.stringify(newState));
      // If turning Lofi off while it's playing, stop it immediately
      if (!newState && isLofiPlaying) {
        console.log("Toggled Lofi off, stopping playback.");
        stopLofi();
        setIsLofiPlaying(false); // Update internal playing state too
      }
      return newState;
    });
  }, [isLofiPlaying]); // Depend on isLofiPlaying to stop correctly

  const handleNotificationToggle = useCallback(() => {
    setIsNotificationsEnabled((prevEnabled: boolean) => {
      const newState = !prevEnabled;

      if (newState) {
        // When enabling notifications, check/request permission
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
  }, []);

  const handleAddTask = useCallback(
    (name: string) => {
      // Removed async
      if (!session?.user?.id) {
        console.error("Cannot add task: User not logged in.");
        return; // Or show an error message
      }
      const userId = session.user.id;
      const tempId = Date.now(); // Generate temporary ID
      const now = new Date().toISOString();

      // Create the optimistic task object
      const optimisticTask: Task = {
        id: tempId, // Use temporary ID
        user_id: userId,
        name,
        total_time: 0,
        start_time: null,
        is_running: false,
        is_completed: false,
        current_day: getTodayDateString(),
        postponed_to: null,
        created_at: now, // Add timestamp
        updated_at: now, // Add timestamp
      };

      // Optimistically update the UI
      setTasks(prevTasks => [...prevTasks, optimisticTask]);

      // Prepare data for the backend (without temporary fields)
      const newTaskData: Omit<Task, "id" | "user_id" | "created_at" | "updated_at"> = {
        name,
        total_time: 0,
        start_time: null,
        is_running: false,
        is_completed: false,
        current_day: getTodayDateString(),
        postponed_to: null,
      };

      // Call the backend function without awaiting here
      addTask(newTaskData, userId)
        .then(addedTask => {
          // Replace the temporary task with the real one from the backend
          setTasks(prevTasks =>
            prevTasks.map(task => (task.id === tempId ? addedTask : task))
          );
        })
        .catch(error => {
          console.error("Failed to add task:", error);
          // Revert the optimistic update on failure
          setTasks(prevTasks => prevTasks.filter(task => task.id !== tempId));
          // Handle error (e.g., show notification)
        });
    },
    [session]
  ); // Depend on session

  const handleStartPause = useCallback(
    (id: number) => {
      // Removed async
      const taskIndex = tasks.findIndex(task => task.id === id);
      if (taskIndex === -1) return; // Task not found

      const taskToUpdate = tasks[taskIndex];
      if (taskToUpdate.is_completed) return; // Cannot start/pause completed task

      const originalTasks = [...tasks]; // Store original state for potential revert
      let optimisticTask: Task;
      let updatesForBackend: Partial<
        Omit<Task, "id" | "user_id" | "created_at" | "updated_at">
      >;
      const now = Date.now();
      const startTimeNumber = taskToUpdate.start_time
        ? Number(taskToUpdate.start_time)
        : null;

      if (taskToUpdate.is_running) {
        // Pausing
        const elapsedMillis = startTimeNumber ? now - startTimeNumber : 0;
        const elapsedSeconds = Math.round(elapsedMillis / 1000);
        const newTotalTime = taskToUpdate.total_time + elapsedSeconds;

        optimisticTask = {
          ...taskToUpdate,
          is_running: false,
          start_time: null,
          total_time: newTotalTime,
          updated_at: new Date(now).toISOString(), // Optimistically update timestamp
        };
        updatesForBackend = {
          is_running: false,
          start_time: null,
          total_time: newTotalTime,
        };
      } else {
        // Starting / Resuming
        optimisticTask = {
          ...taskToUpdate,
          is_running: true,
          start_time: String(now), // Store as string for consistency? Or keep as number? Let's use string like before.
          updated_at: new Date(now).toISOString(), // Optimistically update timestamp
        };
        updatesForBackend = {
          is_running: true,
          start_time: String(now),
        };
      }

      // Optimistically update UI
      setTasks(prevTasks =>
        prevTasks.map(task => (task.id === id ? optimisticTask : task))
      );

      // Call backend update
      updateTask(id, updatesForBackend)
        .then(updatedTaskResult => {
          // Optional: Update state again with the exact result from backend
          // This ensures consistency if backend modifies data (e.g., precise updated_at)
          setTasks(prevTasks =>
            prevTasks.map(task => (task.id === id ? updatedTaskResult : task))
          );
        })
        .catch(error => {
          console.error("Failed to update task (start/pause):", error);
          // Revert UI on failure
          setTasks(originalTasks);
          // Handle error (e.g., show notification)
        });
    },
    [tasks]
  ); // Depend on tasks

  const handleComplete = useCallback(
    (id: number) => {
      // Removed async
      const taskIndex = tasks.findIndex(task => task.id === id);
      if (taskIndex === -1) return; // Task not found

      const taskToComplete = tasks[taskIndex];
      if (taskToComplete.is_completed) return; // Already completed

      const originalTasks = [...tasks]; // Store original state for potential revert
      const now = Date.now();
      let finalTotalTimeSeconds = taskToComplete.total_time;
      const startTimeNumber = taskToComplete.start_time
        ? Number(taskToComplete.start_time)
        : null;

      // Calculate final time if task was running
      if (taskToComplete.is_running && startTimeNumber) {
        const elapsedMillis = now - startTimeNumber;
        finalTotalTimeSeconds += Math.round(elapsedMillis / 1000);
      }

      // Create optimistic task state
      const optimisticTask: Task = {
        ...taskToComplete,
        is_running: false,
        is_completed: true,
        start_time: null,
        total_time: finalTotalTimeSeconds,
        updated_at: new Date(now).toISOString(), // Optimistically update timestamp
      };

      // Prepare updates for the backend
      const updatesForBackend: Partial<
        Omit<Task, "id" | "user_id" | "created_at" | "updated_at">
      > = {
        is_running: false,
        is_completed: true,
        start_time: null,
        total_time: finalTotalTimeSeconds,
      };

      // --- Optimistic UI Updates ---
      // 1. Update tasks state
      const optimisticTasks = originalTasks.map(task =>
        task.id === id ? optimisticTask : task
      );
      setTasks(optimisticTasks);

      // 3. Check Lofi state based on optimistic tasks
      const anyOtherTaskRunning = optimisticTasks.some(
        task => task.id !== id && task.is_running
      );
      if (!anyOtherTaskRunning && isLofiEnabled) {
        console.log("Optimistic: Last task stopped, stopping Lofi completely (enabled).");
        stopLofi();
        setIsLofiPlaying(false);
      } else if (!anyOtherTaskRunning && !isLofiEnabled) {
        console.log("Optimistic: Last task stopped, Lofi already disabled.");
        if (isLofiPlaying) setIsLofiPlaying(false); // Ensure internal state is correct
      }
      // --- End Optimistic UI Updates ---

      // Call backend update
      updateTask(id, updatesForBackend)
        .then(updatedTaskResult => {
          setTasks(prevTasks =>
            prevTasks.map(task => (task.id === id ? updatedTaskResult : task))
          );
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.8 },
          });
        })
        .catch(error => {
          console.error("Failed to complete task:", error);
          // Revert UI on failure (except confetti)
          setTasks(originalTasks);
          // Re-evaluate Lofi state based on original tasks if needed (complex, might skip for simplicity)
          // Handle error (e.g., show notification)
        });
    },
    [tasks, isLofiEnabled, isLofiPlaying] // Keep dependencies
  );

  const handleDelete = useCallback(
    async (id: number) => {
      // Optimistic UI update
      const originalTasks = tasks;
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));

      try {
        await deleteTask(id);
      } catch (error) {
        console.error("Failed to delete task:", error);
        // Revert UI update on failure
        setTasks(originalTasks);
        // Handle error (e.g., show notification)
      }
    },
    [tasks]
  ); // Depend on tasks for optimistic update

  const handlePostponeTask = useCallback(
    async (id: number) => {
      // ID is now number
      if (!session?.user?.id) {
        console.error("Cannot postpone task: User not logged in.");
        return;
      }
      const userId = session.user.id;
      const taskToCopy = tasks.find(task => task.id === id);
      if (!taskToCopy) return;

      const today = getTodayDateString();

      // 1. Prepare update for the original task using snake_case
      const originalTaskUpdate: Partial<
        Omit<Task, "id" | "user_id" | "created_at" | "updated_at">
      > = {
        postponed_to: today,
        // Optionally stop timer if it was running? Depends on desired behavior.
        // is_running: false,
        // start_time: null,
        // total_time: calculate final time if needed
      };

      // 2. Prepare data for the new task using snake_case
      const newTaskData: Omit<Task, "id" | "user_id" | "created_at" | "updated_at"> = {
        name: taskToCopy.name, // Copy name
        total_time: 0, // Reset time, use snake_case
        start_time: null, // Use snake_case
        is_running: false, // Use snake_case
        is_completed: false, // Use snake_case
        current_day: today, // Use snake_case
        postponed_to: null, // Use snake_case
      };

      try {
        // Update original task first (expects snake_case)
        const updatedOriginalTask = await updateTask(id, originalTaskUpdate);
        // Then add the new task (expects snake_case)
        const addedNewTask = await addTask(newTaskData, userId);

        // Update state with both results
        setTasks(prevTasks => [
          ...prevTasks.map(task => (task.id === id ? updatedOriginalTask : task)),
          addedNewTask,
        ]);
      } catch (error) {
        console.error("Failed to postpone task:", error);
        // Handle error (potentially revert state if needed, though complex)
      }
    },
    [tasks, session]
  ); // Depend on tasks and session

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

      // Find the task being dragged (ID is now number)
      const taskId = parseInt(draggableId, 10); // draggableId is string
      const taskToMove = tasks.find(task => task.id === taskId);
      if (!taskToMove) return;

      // Update the task's day optimistically for smooth UI
      // const updatedTask = { ...taskToMove, currentDay: destination.droppableId }; // Removed unused variable

      // Reorder tasks in the state
      // const reorderedTasks = [...tasks]; // Removed unused variable
      // const [movedTask] = reorderedTasks.splice(source.index, 1); // Removed unused variable
      // Find the correct index in the potentially filtered/sorted list for the destination
      // This is tricky if the visual list doesn't match the raw `tasks` state order.
      // A simpler optimistic update: just update the task's day in the main state.
      // The grouping/sorting logic later will handle the visual placement.

      setTasks(prevTasks =>
        prevTasks.map(task =>
          // Use snake_case property
          task.id === taskId ? { ...task, current_day: destination.droppableId } : task
        )
      );

      // Update the task in Supabase in the background (expects snake_case)
      updateTask(taskId, { current_day: destination.droppableId }).catch(error => {
        console.error("Failed to update task day after drag:", error);
        // Optionally revert state or notify user on failure
        // For simplicity, we won't revert here, but log the error.
      });
    },
    [tasks] // Keep dependency
  ); // Dependency on tasks is important here

  // Filter tasks based on date range or show only today's tasks if no filter
  const filterTasks = (tasks: Task[]) => {
    if (dateFilter?.from) {
      const start = startOfDay(dateFilter.from);
      const end = dateFilter.to ? endOfDay(dateFilter.to) : endOfDay(dateFilter.from);

      return tasks.filter(task => {
        // Use snake_case property
        const taskDate = parseISO(task.current_day);
        return isWithinInterval(taskDate, { start, end });
      });
    } else {
      // When no filter is active, only show today's tasks
      // Use snake_case property
      return tasks.filter(task => task.current_day === getTodayDateString());
    }
  };

  // Filtered tasks before grouping by day
  const filteredTasks = filterTasks(tasks);

  // Group tasks by day (using filtered tasks)
  const tasksByDay = filteredTasks.reduce((acc, task) => {
    // Use snake_case property
    const day = task.current_day;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Sort days chronologically
  const sortedDays = Object.keys(tasksByDay).sort();

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="app-container">
        <div className="top-controls">
          <ThemeToggle
            isDark={isDarkMode}
            onToggle={() => setIsDarkMode(prev => !prev)}
          />
          <NotificationToggle
            isEnabled={isNotificationsEnabled}
            onToggle={handleNotificationToggle}
          />
          <LofiToggle isEnabled={isLofiEnabled} onToggle={handleLofiToggle} />
          {/* Add Logout Button */}
          <button onClick={handleLogout} className="logout-button" title="Logout">
            <IoLogOut size={20} />
          </button>
        </div>
        <h1 className="app-title">Track. Focus. Celebrate.</h1>
        <p className="app-description">
          Effortless daily task tracking with focus and fun.
        </p>
        <div className="input-container">
          <TaskInput onAddTask={handleAddTask} />
          <DateFilter selected={dateFilter} onSelect={setDateFilter} tasks={tasks} />
        </div>

        <div className="days-container">
          {isLoadingTasks ? (
            <div className="loading">Loading tasks...</div>
          ) : sortedDays.length > 0 ? (
            sortedDays.map(day => (
              <DaySection
                key={day}
                date={day}
                tasks={tasksByDay[day]}
                onStartPause={handleStartPause}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onPostpone={handlePostponeTask}
              />
            ))
          ) : (
            // Show message if not loading and no tasks match filter/day
            <p className="no-tasks-message">
              {dateFilter?.from
                ? "No tasks found for the selected date range"
                : "No tasks for today. Add some tasks to get started!"}
            </p>
          )}
        </div>
      </div>
    </DragDropContext>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
};

const AuthenticatedApp: React.FC = () => {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
      <Route path="/" element={session ? <MainContent /> : <Navigate to="/login" />} />
    </Routes>
  );
};

export default App;
