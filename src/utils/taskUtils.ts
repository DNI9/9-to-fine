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
