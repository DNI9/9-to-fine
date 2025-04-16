/**
 * Formats milliseconds into HH:MM:SS string format.
 * @param ms - The time duration in milliseconds.
 * @returns The formatted time string (e.g., "01:23:45").
 */
export function formatTime(ms: number): string {
  if (ms < 0) ms = 0;

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num: number): string => num.toString().padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
