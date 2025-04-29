import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { endOfMonth, format, startOfMonth } from "date-fns"; // Import startOfMonth and endOfMonth
import { DateRange } from "react-day-picker"; // Import DateRange
import { Task } from "../types";
import { supabase } from "./supabase";

// Helper to format date for Supabase (YYYY-MM-DD)
const formatDateForSupabase = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

/**
 * Fetches tasks for a given user from the Supabase 'tasks' table,
 * optionally filtering by a date range or defaulting to today.
 * Returns tasks directly matching the unified Task type.
 * @param userId - The UUID of the user whose tasks are to be fetched.
 * @param dateRange - Optional date range to filter tasks by 'current_day'. If undefined, fetches tasks for today.
 * @returns A promise that resolves to an array of Task objects.
 */
export const getTasks = async (
  userId: string,
  dateRange?: DateRange // Add optional dateRange parameter
): Promise<Task[]> => {
  if (!userId) {
    console.error("getTasks: userId is required");
    return [];
  }

  let query = supabase
    .from("tasks")
    .select("*") // Select all columns matching the Task type
    .eq("user_id", userId);

  // Apply date filtering
  if (dateRange?.from && dateRange?.to) {
    // Filter by range
    query = query
      .gte("current_day", formatDateForSupabase(dateRange.from))
      .lte("current_day", formatDateForSupabase(dateRange.to));
  } else if (dateRange?.from) {
    // Filter by single date
    query = query.eq("current_day", formatDateForSupabase(dateRange.from));
  } else {
    // Default to today if no range is provided
    query = query.eq("current_day", formatDateForSupabase(new Date()));
  }

  // Add ordering
  query = query.order("created_at", { ascending: true }); // Or order as needed

  // Execute the query
  const { data, error }: PostgrestSingleResponse<Task[]> = await query;

  if (error) {
    console.error("Error fetching tasks:", error);
    throw error; // Re-throw the error to be handled by the caller
  }

  // No mapping needed, return data directly (or empty array)
  return data ?? [];
};

/**
 * Adds one or more tasks to the Supabase 'tasks' table using the unified Task type.
 * @param tasksData - An array of objects containing the new task details (matching Task type, excluding id, user_id, created_at, updated_at).
 * @param userId - The UUID of the user adding the tasks.
 * @returns A promise that resolves to an array of the newly created Task objects (matching Task type).
 */
export const addTask = async (
  // Input data should match the Task schema (snake_case)
  tasksData: Omit<Task, "id" | "user_id" | "created_at" | "updated_at">[],
  userId: string
): Promise<Task[]> => {
  if (!userId) {
    throw new Error("addTask: userId is required");
  }
  if (!tasksData || tasksData.length === 0) {
    console.warn("addTask: No tasks provided to add.");
    return []; // Return empty array if no tasks are given
  }

  // Prepare data for bulk insertion
  const dataToInsert = tasksData.map(taskData => {
    // Ensure required fields for each task are present
    if (
      !taskData.name ||
      taskData.total_time === undefined || // Check snake_case field
      taskData.current_day === undefined // Check snake_case field
    ) {
      throw new Error(
        `addTask: Missing required fields (name, total_time, current_day) for task: ${
          taskData.name || "Unnamed Task"
        }`
      );
    }

    return {
      ...taskData,
      user_id: userId,
      // Convert start_time (number | null) from input to bigint string for DB
      start_time: taskData.start_time ? BigInt(taskData.start_time).toString() : null,
    };
  });

  // Perform bulk insert
  const { data, error }: PostgrestSingleResponse<Task[]> = await supabase
    .from("tasks")
    .insert(dataToInsert) // Insert the array of prepared data
    .select(); // Return the inserted rows

  if (error) {
    console.error("Error adding tasks:", error);
    throw error;
  }
  if (!data) {
    // This case might be less likely with bulk inserts unless the entire operation fails silently,
    // but good to keep for robustness. Supabase might return an empty array on success with no rows inserted (though we check input length).
    console.warn(
      "addTask: No data returned after bulk insert, though no error was thrown."
    );
    return [];
  }

  // No mapping needed, return data directly
  return data;
};

/**
 * Updates an existing task in the Supabase 'tasks' table using the unified Task type.
 * @param taskId - The ID of the task to update.
 * @param updates - An object containing the fields to update (matching Task type).
 * @returns A promise that resolves to the updated Task object (matching Task type).
 */
// REMOVED: TaskUpdatePayload type definition

export const updateTask = async (
  taskId: number,
  // Updates should match the Task schema (snake_case)
  updates: Partial<Omit<Task, "id" | "user_id" | "created_at" | "updated_at">>
): Promise<Task> => {
  // Prepare updates for Supabase. Explicitly handle start_time conversion if it exists and is a number.
  const updatesForSupabase = { ...updates };

  // Check if start_time is present in the updates and needs conversion from number
  if ("start_time" in updates && typeof updates.start_time === "number") {
    // Convert the number timestamp to a bigint string for Supabase
    updatesForSupabase.start_time = BigInt(updates.start_time).toString();
  } else if ("start_time" in updates && updates.start_time === null) {
    // Ensure null is passed correctly if provided as null
    updatesForSupabase.start_time = null;
  }
  // If updates.start_time is already a string or undefined, it's used as is from the spread (...)

  // Prevent updating user_id or id via this function (already excluded by Omit type, but good practice)
  // delete updatesForSupabase.user_id;
  // delete updatesForSupabase.id;

  // Prevent updating user_id or id via this function (already excluded by Omit type, but good practice)
  // delete updatesForSupabase.user_id;
  // delete updatesForSupabase.id;

  if (Object.keys(updatesForSupabase).length === 0) {
    console.warn("updateTask: No valid fields provided for update.");
    throw new Error("updateTask: No fields to update.");
  }

  const { data, error }: PostgrestSingleResponse<Task> = await supabase
    .from("tasks")
    .update(updatesForSupabase) // Use the prepared updates
    .eq("id", taskId)
    .select() // Return the updated row
    .single(); // Expecting a single row back

  if (error) {
    console.error("Error updating task:", error);
    throw error;
  }
  if (!data) {
    throw new Error(
      `updateTask: No task found with id ${taskId} or no data returned after update.`
    );
  }

  // No mapping needed, return data directly
  return data;
};

/**
 * Deletes a task from the Supabase 'tasks' table.
 * @param taskId - The ID of the task to delete.
 * @returns A promise that resolves when the deletion is complete.
 */
export const deleteTask = async (taskId: number): Promise<void> => {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};

/**
 * Fetches the distinct dates within a given month and year that have incomplete tasks.
 * @param userId - The UUID of the user.
 * @param year - The full year (e.g., 2024).
 * @param month - The month (1-12).
 * @returns A promise that resolves to an array of date strings (YYYY-MM-DD).
 */
export const getIncompleteTaskDatesForMonth = async (
  userId: string,
  year: number,
  month: number // Month is 1-based
): Promise<string[]> => {
  if (!userId) {
    console.error("getIncompleteTaskDatesForMonth: userId is required");
    return [];
  }

  // Create Date objects for the start and end of the month
  const monthDate = new Date(year, month - 1, 1); // Month is 0-indexed for Date constructor
  const startDate = startOfMonth(monthDate);
  const endDate = endOfMonth(monthDate);

  // Format dates for Supabase query
  const startDayString = formatDateForSupabase(startDate);
  const endDayString = formatDateForSupabase(endDate);

  // Query for distinct dates with incomplete, non-postponed tasks within the month
  const { data, error } = await supabase
    .from("tasks")
    .select("current_day") // Select only the date column
    .eq("user_id", userId)
    .eq("is_completed", false) // Task is incomplete
    .is("postponed_to", null) // Task is not postponed
    .gte("current_day", startDayString) // Within the start date
    .lte("current_day", endDayString); // Within the end date

  if (error) {
    console.error("Error fetching incomplete task dates:", error);
    throw error;
  }

  // Extract unique dates from the result
  const uniqueDates = [...new Set(data?.map(item => item.current_day) ?? [])];

  return uniqueDates;
};
