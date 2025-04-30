import { DropResult } from "@hello-pangea/dnd";
import confetti from "canvas-confetti";
import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { Task } from "../types";
import {
  addTask,
  deleteTask,
  getTasks,
  updatePositions,
  updateTask,
} from "../utils/taskUtils";

export const getTodayDateString = (): string => {
  return format(new Date(), "yyyy-MM-dd");
};

export const useTasks = (
  userId: string | undefined,
  dateFilter: DateRange | undefined
) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      if (userId) {
        setIsLoadingTasks(true);
        try {
          const fetchedTasks = await getTasks(userId, dateFilter);
          setTasks(fetchedTasks);
        } catch (error) {
          console.error("Failed to fetch tasks:", error);
        } finally {
          setIsLoadingTasks(false);
        }
      } else {
        setTasks([]);
        setIsLoadingTasks(false);
      }
    };

    fetchTasks();
  }, [userId, dateFilter]);

  const handleAddTask = useCallback(
    (names: string[]) => {
      if (!userId) {
        console.error("Cannot add tasks: User not logged in.");
        return;
      }
      if (!names || names.length === 0) {
        console.warn("handleAddTask: No task names provided.");
        return;
      }

      const now = new Date();
      const optimisticTasks: Task[] = [];
      const newTasksData: Omit<Task, "id" | "user_id" | "created_at" | "updated_at">[] =
        [];
      const tempIds: number[] = [];
      const maxPosition = Math.max(...tasks.map(t => t.position), 0);

      names.forEach((name, index) => {
        const trimmedName = name.trim();
        if (!trimmedName) return;

        const tempId = now.getTime() + index;
        tempIds.push(tempId);
        const position = maxPosition + (index + 1) * 1000;

        const todayString = getTodayDateString();

        optimisticTasks.push({
          id: tempId,
          user_id: userId,
          name: trimmedName,
          total_time: 0,
          start_time: null,
          is_running: false,
          is_completed: false,
          current_day: todayString,
          postponed_to: null,
          position,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        });

        newTasksData.push({
          name: trimmedName,
          total_time: 0,
          start_time: null,
          is_running: false,
          is_completed: false,
          current_day: todayString,
          postponed_to: null,
          position,
        });
      });

      if (optimisticTasks.length === 0) return;

      setTasks(prevTasks => [...prevTasks, ...optimisticTasks]);

      addTask(newTasksData, userId)
        .then((addedTasks: Task[]) => {
          setTasks(prevTasks => {
            const nonTempTasks = prevTasks.filter(task => !tempIds.includes(task.id));
            return [...nonTempTasks, ...addedTasks];
          });
        })
        .catch((error: Error) => {
          console.error("Failed to add tasks:", error);
          setTasks(prevTasks => prevTasks.filter(task => !tempIds.includes(task.id)));
        });
    },
    [userId, tasks]
  );

  const handleStartPause = useCallback(
    (id: number) => {
      const taskIndex = tasks.findIndex(task => task.id === id);
      if (taskIndex === -1) return;

      const taskToUpdate = tasks[taskIndex];
      if (taskToUpdate.is_completed) return;

      const originalTasks = [...tasks];
      let optimisticTask: Task;
      let updatesForBackend: Partial<
        Omit<Task, "id" | "user_id" | "created_at" | "updated_at">
      >;
      const now = Date.now();
      const startTimeNumber = taskToUpdate.start_time
        ? Number(taskToUpdate.start_time)
        : null;

      if (taskToUpdate.is_running) {
        const elapsedMillis = startTimeNumber ? now - startTimeNumber : 0;
        const elapsedSeconds = Math.round(elapsedMillis / 1000);
        const newTotalTime = taskToUpdate.total_time + elapsedSeconds;

        optimisticTask = {
          ...taskToUpdate,
          is_running: false,
          start_time: null,
          total_time: newTotalTime,
          updated_at: new Date(now).toISOString(),
        };
        updatesForBackend = {
          is_running: false,
          start_time: null,
          total_time: newTotalTime,
        };
      } else {
        optimisticTask = {
          ...taskToUpdate,
          is_running: true,
          start_time: String(now),
          updated_at: new Date(now).toISOString(),
        };
        updatesForBackend = {
          is_running: true,
          start_time: String(now),
        };
      }

      setTasks(prevTasks =>
        prevTasks.map(task => (task.id === id ? optimisticTask : task))
      );

      updateTask(id, updatesForBackend)
        .then((updatedTaskResult: Task) => {
          setTasks(prevTasks =>
            prevTasks.map(task => (task.id === id ? updatedTaskResult : task))
          );
        })
        .catch((error: Error) => {
          console.error("Failed to update task (start/pause):", error);
          setTasks(originalTasks);
        });
    },
    [tasks]
  );

  const handleComplete = useCallback(
    (id: number) => {
      const taskIndex = tasks.findIndex(task => task.id === id);
      if (taskIndex === -1) return;

      const taskToComplete = tasks[taskIndex];
      if (taskToComplete.is_completed) return;

      const originalTasks = [...tasks];
      const now = Date.now();
      let finalTotalTimeSeconds = taskToComplete.total_time;
      const startTimeNumber = taskToComplete.start_time
        ? Number(taskToComplete.start_time)
        : null;

      if (taskToComplete.is_running && startTimeNumber) {
        const elapsedMillis = now - startTimeNumber;
        finalTotalTimeSeconds += Math.round(elapsedMillis / 1000);
      }

      const optimisticTask: Task = {
        ...taskToComplete,
        is_running: false,
        is_completed: true,
        start_time: null,
        total_time: finalTotalTimeSeconds,
        updated_at: new Date(now).toISOString(),
      };

      const updatesForBackend: Partial<
        Omit<Task, "id" | "user_id" | "created_at" | "updated_at">
      > = {
        is_running: false,
        is_completed: true,
        start_time: null,
        total_time: finalTotalTimeSeconds,
      };

      setTasks(prevTasks =>
        prevTasks.map(task => (task.id === id ? optimisticTask : task))
      );

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.8 },
      });

      updateTask(id, updatesForBackend)
        .then((updatedTaskResult: Task) => {
          setTasks(prevTasks =>
            prevTasks.map(task => (task.id === id ? updatedTaskResult : task))
          );
        })
        .catch((error: Error) => {
          console.error("Failed to complete task:", error);
          setTasks(originalTasks);
        });
    },
    [tasks]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      const originalTasks = tasks;
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));

      try {
        await deleteTask(id);
      } catch (error) {
        console.error("Failed to delete task:", error);
        setTasks(originalTasks);
      }
    },
    [tasks]
  );

  const handlePostponeTask = useCallback(
    async (id: number) => {
      if (!userId) {
        console.error("Cannot postpone task: User not logged in.");
        return;
      }

      const taskToCopy = tasks.find(task => task.id === id);
      if (!taskToCopy) return;

      const today = getTodayDateString();
      const originalTasks = [...tasks];
      const maxPosition = Math.max(
        ...tasks.filter(t => t.current_day === today).map(t => t.position),
        0
      );

      const updatesForOriginal: Partial<
        Omit<Task, "id" | "user_id" | "created_at" | "updated_at">
      > = {
        postponed_to: today,
        is_running: false,
        start_time: null,
      };

      const newTaskData: Omit<Task, "id" | "user_id" | "created_at" | "updated_at"> = {
        name: taskToCopy.name,
        total_time: 0,
        start_time: null,
        is_running: false,
        is_completed: false,
        current_day: today,
        postponed_to: null,
        position: maxPosition + 1000,
      };

      const updatedOriginalTaskOptimistic: Task = {
        ...taskToCopy,
        ...updatesForOriginal,
        updated_at: new Date().toISOString(),
      };

      const tempNewTaskId = Date.now() + 1;
      const newOptimisticTask: Task = {
        id: tempNewTaskId,
        user_id: userId,
        ...newTaskData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setTasks(prevTasks => [
        ...prevTasks.map(task => (task.id === id ? updatedOriginalTaskOptimistic : task)),
        newOptimisticTask,
      ]);

      try {
        const updatedOriginalTask = await updateTask(id, updatesForOriginal);
        const addedTasks = await addTask([newTaskData], userId);

        if (addedTasks.length === 0) {
          throw new Error("Postpone failed: Could not create the new task entry.");
        }
        const addedNewTask = addedTasks[0];

        setTasks(prevTasks => [
          ...prevTasks
            .map(task => {
              if (task.id === id) return updatedOriginalTask;
              if (task.id === tempNewTaskId) return null;
              return task;
            })
            .filter((task): task is Task => task !== null),
          addedNewTask,
        ]);
      } catch (error) {
        console.error("Failed to postpone task:", error);
        setTasks(originalTasks);
      }
    },
    [tasks, userId]
  );

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination, draggableId } = result;

      if (!destination) return;

      const taskId = parseInt(draggableId, 10);
      const taskToMove = tasks.find(task => task.id === taskId);
      if (!taskToMove) return;

      const newTasks = Array.from(tasks);
      const taskToMoveIndex = newTasks.findIndex(task => task.id === taskId);
      const [removed] = newTasks.splice(taskToMoveIndex, 1);

      if (source.droppableId !== destination.droppableId) {
        removed.current_day = destination.droppableId;
      }

      const destinationDayStartIndex = newTasks.findIndex(
        task => task.current_day === destination.droppableId
      );
      const insertIndex =
        destinationDayStartIndex === -1
          ? newTasks.length
          : destinationDayStartIndex + destination.index;

      newTasks.splice(insertIndex, 0, removed);

      const positionUpdates: { id: number; position: number }[] = [];
      const basePosition = 1000;
      const increment = 1000;

      const affectedTasks = newTasks.filter(
        task =>
          task.current_day === destination.droppableId ||
          (source.droppableId !== destination.droppableId &&
            task.current_day === source.droppableId)
      );

      affectedTasks.forEach((task, index) => {
        const newPosition = basePosition + index * increment;
        task.position = newPosition;
        positionUpdates.push({ id: task.id, position: newPosition });
      });

      setTasks(newTasks);

      const updateBackend = async () => {
        try {
          await updatePositions(positionUpdates);

          if (source.droppableId !== destination.droppableId) {
            await updateTask(taskId, { current_day: destination.droppableId });
          }
        } catch (error) {
          console.error("Failed to update task order:", error);
          setTasks(tasks);
        }
      };

      updateBackend();
    },
    [tasks]
  );

  const hasRunningTasks = tasks.some(task => task.is_running);

  return {
    tasks,
    isLoadingTasks,
    hasRunningTasks,
    handleAddTask,
    handleStartPause,
    handleComplete,
    handleDelete,
    handlePostponeTask,
    handleDragEnd,
  };
};
