import { Task } from "../types";

const STORAGE_KEY = "chronotaskTasks";

/**
 * Loads tasks from localStorage.
 * Returns an empty array if no tasks are found or if there's a parsing error.
 */
export function loadTasks(): Task[] {
  try {
    const storedTasks = localStorage.getItem(STORAGE_KEY);
    if (storedTasks) {
      // Basic validation could be added here if needed
      return JSON.parse(storedTasks) as Task[];
    }
  } catch (error) {
    console.error("Error loading tasks from localStorage:", error);
    // Optionally clear corrupted data: localStorage.removeItem(STORAGE_KEY);
  }
  return []; // Return empty array if nothing stored or error occurred
}

/**
 * Saves the current list of tasks to localStorage.
 * @param tasks - The array of tasks to save.
 */
export function saveTasks(tasks: Task[]): void {
  try {
    const tasksString = JSON.stringify(tasks);
    localStorage.setItem(STORAGE_KEY, tasksString);
  } catch (error) {
    console.error("Error saving tasks to localStorage:", error);
    // Handle potential storage quota errors if necessary
  }
}
