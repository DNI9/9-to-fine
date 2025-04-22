import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { Task } from "../types";
import { supabase } from "./supabase";

// REMOVED: SupabaseTask interface definition
// REMOVED: mapSupabaseTaskToLocal helper function
// REMOVED: mapLocalTaskToSupabase helper function

/**
 * Fetches all tasks for a given user from the Supabase 'tasks' table.
 * Returns tasks directly matching the unified Task type.
 * @param userId - The UUID of the user whose tasks are to be fetched.
 * @returns A promise that resolves to an array of Task objects.
 */
export const getTasks = async (userId: string): Promise<Task[]> => {
  if (!userId) {
    console.error("getTasks: userId is required");
    return [];
  }
  // Fetch data, assuming it matches the unified Task type directly
  const { data, error }: PostgrestSingleResponse<Task[]> = await supabase
    .from("tasks")
    .select("*") // Select all columns matching the Task type
    .eq("user_id", userId)
    .order("created_at", { ascending: true }); // Or order as needed

  if (error) {
    console.error("Error fetching tasks:", error);
    throw error; // Re-throw the error to be handled by the caller
  }

  // No mapping needed, return data directly (or empty array)
  return data ?? [];
};

/**
 * Adds a new task to the Supabase 'tasks' table using the unified Task type.
 * @param taskData - An object containing the new task details (matching Task type, excluding id, user_id, created_at, updated_at).
 * @param userId - The UUID of the user adding the task.
 * @returns A promise that resolves to the newly created Task object (matching Task type).
 */
export const addTask = async (
  // Input data should match the Task schema (snake_case)
  taskData: Omit<Task, "id" | "user_id" | "created_at" | "updated_at">,
  userId: string
): Promise<Task> => {
  if (!userId) {
    throw new Error("addTask: userId is required");
  }

  // Prepare data for insertion, ensuring user_id is included
  // Handle start_time conversion: number timestamp (if provided) to bigint string
  const dataToInsert = {
    ...taskData,
    user_id: userId,
    // Convert start_time (number | null) from input to bigint string for DB
    start_time: taskData.start_time ? BigInt(taskData.start_time).toString() : null,
  };

  // Ensure required fields for insert are present
  if (
    !dataToInsert.name ||
    dataToInsert.total_time === undefined || // Check snake_case field
    dataToInsert.current_day === undefined // Check snake_case field
  ) {
    throw new Error("addTask: Missing required fields (name, total_time, current_day)");
  }

  const { data, error }: PostgrestSingleResponse<Task> = await supabase
    .from("tasks")
    .insert(dataToInsert) // Insert the prepared data
    .select() // Return the inserted row
    .single(); // Expecting a single row back

  if (error) {
    console.error("Error adding task:", error);
    throw error;
  }
  if (!data) {
    throw new Error("addTask: No data returned after insert");
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
