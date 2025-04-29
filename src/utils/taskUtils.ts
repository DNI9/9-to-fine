import { endOfMonth, startOfMonth } from "date-fns";
import { DateRange } from "react-day-picker";
import { Task } from "../types";
import { supabase } from "./supabase";

// Groups tasks by the 'current_day' field.
// @param tasks - Array of tasks to be grouped.
// @returns An object where each key is a date string and the value is an array of tasks for that date.
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

// Returns the sorted list of days from the grouped tasks.
// @param tasksByDay - The object returned from groupTasksByDay function.
// @returns An array of date strings sorted in ascending order.
export const getSortedDays = (tasksByDay: Record<string, Task[]>): string[] => {
  return Object.keys(tasksByDay).sort();
};

// Fetches dates that have incomplete tasks for a specific month
export const getIncompleteTaskDatesForMonth = async (
  userId: string,
  year: number,
  month: number
): Promise<string[]> => {
  // Create dates at noon in local time to avoid timezone issues
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
    .is("postponed_to", null); // Only include tasks that are not postponed

  if (error) {
    console.error("Error fetching incomplete task dates:", error);
    return [];
  }

  if (!tasks) return [];

  // Get unique dates that have incomplete tasks and sort them
  const uniqueDates = new Set(tasks.map(task => task.current_day));
  return Array.from(uniqueDates).sort();
};

export const getTasks = async (
  userId: string,
  dateFilter?: DateRange
): Promise<Task[]> => {
  let query = supabase.from("tasks").select("*").eq("user_id", userId);

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
