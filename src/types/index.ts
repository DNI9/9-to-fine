export interface Task {
  id: string;
  name: string;
  totalTime: number; // Store time in milliseconds
  startTime: number | null; // Timestamp when the timer was last started, null if paused/stopped
  isRunning: boolean;
  isCompleted: boolean;
  currentDay: string; // Format: 'YYYY-MM-DD'
}
