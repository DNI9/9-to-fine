export interface Task {
  id: number;
  user_id: string;
  name: string;
  total_time: number;
  start_time: string | null;
  is_running: boolean;
  is_completed: boolean;
  current_day: string;
  postponed_to: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}
