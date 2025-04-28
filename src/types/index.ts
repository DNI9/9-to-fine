// Unified Task type matching the Supabase 'tasks' table schema
export interface Task {
  id: number;
  user_id: string;
  name: string;
  total_time: number; // Stored as seconds (int4)
  start_time: string | null; // Stored as bigint string representation of milliseconds timestamp
  is_running: boolean;
  is_completed: boolean;
  current_day: string; // Stored as date ('YYYY-MM-DD')
  postponed_to: string | null; // Stored as date ('YYYY-MM-DD') or null
  created_at: string;
  updated_at: string;
}
