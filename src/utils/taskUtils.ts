import { endOfMonth, startOfMonth } from "date-fns";
import { DateRange } from "react-day-picker";
import { Task } from "../types";
import { supabase } from "./supabase";

export const groupTasksByDay = (tasks: Task[]): Record<string, Task[]> => {
  const tasksByDay = tasks.reduce((acc, task) => {
    const day = task.current_day;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return tasksByDay;
};

export const getSortedDays = (tasksByDay: Record<string, Task[]>): string[] => {
  return Object.keys(tasksByDay).sort();
};

export const getIncompleteTaskDatesForMonth = async (
  userId: string,
  year: number,
  month: number
): Promise<string[]> => {
  const monthDate = new Date(year, month - 1, 1, 12, 0, 0, 0);
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);

  const startDate = start.toISOString().split("T")[0];
  const endDate = end.toISOString().split("T")[0];

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("current_day, is_completed, postponed_to")
    .eq("user_id", userId)
    .gte("current_day", startDate)
    .lte("current_day", endDate)
    .eq("is_completed", false)
    .is("postponed_to", null);

  if (error) {
    console.error("Error fetching incomplete task dates:", error);
    return [];
  }

  if (!tasks) return [];

  const uniqueDates = new Set(tasks.map(task => task.current_day));
  return Array.from(uniqueDates).sort();
};

export const getTasks = async (
  userId: string,
  dateFilter?: DateRange
): Promise<Task[]> => {
  let query = supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("current_day", { ascending: true })
    .order("position", { ascending: true });

  if (dateFilter?.from) {
    const start = dateFilter.from.toISOString().split("T")[0];
    const end = dateFilter.to ? dateFilter.to.toISOString().split("T")[0] : start;
    query = query.gte("current_day", start).lte("current_day", end);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }

  return data || [];
};

export const addTask = async (
  tasks: Omit<Task, "id" | "user_id" | "created_at" | "updated_at">[],
  userId: string
): Promise<Task[]> => {
  const tasksWithUserId = tasks.map(task => ({
    ...task,
    user_id: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase.from("tasks").insert(tasksWithUserId).select();

  if (error) {
    console.error("Error adding tasks:", error);
    throw error;
  }

  return data || [];
};

export const updateTask = async (
  taskId: number,
  updates: Partial<Omit<Task, "id" | "user_id" | "created_at" | "updated_at">>
): Promise<Task> => {
  const { data, error } = await supabase
    .from("tasks")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .select()
    .single();

  if (error) {
    console.error("Error updating task:", error);
    throw error;
  }

  if (!data) {
    throw new Error("No task found to update");
  }

  return data;
};

export const deleteTask = async (taskId: number): Promise<void> => {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};

interface PositionUpdate {
  id: number;
  position: number;
}

export const updatePositions = async (updates: PositionUpdate[]): Promise<void> => {
  if (updates.length === 0) return;

  const { error } = await supabase.rpc("update_task_positions", {
    position_updates: updates,
  });

  if (error) {
    console.error("Error updating positions:", error);
    throw error;
  }
};
