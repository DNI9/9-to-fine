import { endOfMonth, format, startOfMonth } from "date-fns";
import React, { useEffect, useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import { useNavigate } from "react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../utils/supabase";

// Define interfaces for processed data
interface TimeSpentData {
  name: string;
  time: number; // Store time in HOURS
  incomplete: boolean; // Flag if any task instance was incomplete
}

// Interface for daily total data
interface DailyTotalData {
  date: string;
  totalHours: number;
}

// Interface for daily task count data
interface DailyTaskCountData {
  date: string;
  count: number;
}

// Interface matching the relevant fields from fetched Supabase data
interface FetchedTask {
  name: string;
  total_time: number; // in seconds
  is_completed: boolean;
  current_day: string; // 'YYYY-MM-DD'
  // start_time might be needed if we want to calculate based on start/end again,
  // but total_time seems more direct if available and accurate.
  // start_time: string | null;
}

const ReportPage: React.FC = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [timeSpentData, setTimeSpentData] = useState<TimeSpentData[]>([]);
  const [dailyTotalsData, setDailyTotalsData] = useState<DailyTotalData[]>([]);
  const [dailyTaskCountData, setDailyTaskCountData] = useState<DailyTaskCountData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTaskData = async () => {
      if (!session?.user?.id) return;

      try {
        setIsLoading(true);

        // Get the current month's date range
        const today = new Date();
        today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);

        const { data: tasks, error: fetchError } = await supabase
          .from("tasks")
          .select("name, total_time, is_completed, current_day")
          .eq("user_id", session.user.id)
          .gte("current_day", format(monthStart, "yyyy-MM-dd"))
          .lte("current_day", format(monthEnd, "yyyy-MM-dd"));

        if (fetchError) throw fetchError;
        if (!tasks) throw new Error("No tasks data returned.");

        // --- Process Data for Historical Daily Totals & Task Counts ---
        const timePerDay: { [key: string]: number } = {}; // Store total seconds per day
        const tasksPerDay: { [key: string]: number } = {}; // Store task count per day

        tasks.forEach((task: FetchedTask) => {
          if (task.current_day) {
            const dayKey = task.current_day;
            // Aggregate total time
            if (task.total_time > 0) {
              timePerDay[dayKey] = (timePerDay[dayKey] || 0) + task.total_time;
            }
            // Count tasks
            tasksPerDay[dayKey] = (tasksPerDay[dayKey] || 0) + 1;
          }
        });

        // Format Daily Totals (Time)
        const formattedDailyTotals: DailyTotalData[] = Object.entries(timePerDay)
          .map(([date, totalSeconds]) => ({
            date,
            totalHours: parseFloat((totalSeconds / 3600).toFixed(2)),
          }))
          .sort((a, b) => a.date.localeCompare(b.date));
        setDailyTotalsData(formattedDailyTotals);

        // Format Daily Task Counts
        const formattedTaskCounts: DailyTaskCountData[] = Object.entries(tasksPerDay)
          .map(([date, count]) => ({
            date,
            count,
          }))
          .sort((a, b) => a.date.localeCompare(b.date));
        setDailyTaskCountData(formattedTaskCounts);

        // --- Process Data for Time Spent Per Task (for the selected date) ---
        // Filter tasks by the selected date *after* processing daily totals
        const filteredTasks = tasks.filter(task => task.current_day === selectedDate);
        const timePerTask: {
          [key: string]: { totalSeconds: number; incomplete: boolean };
        } = {};
        filteredTasks.forEach((task: FetchedTask) => {
          if (task.total_time > 0) {
            const current = timePerTask[task.name] || {
              totalSeconds: 0,
              incomplete: false,
            };
            timePerTask[task.name] = {
              totalSeconds: current.totalSeconds + task.total_time,
              incomplete: current.incomplete || !task.is_completed,
            };
          }
        });

        // Convert aggregated seconds to hours for the single-day chart
        const formattedTimeSpentData: TimeSpentData[] = Object.entries(timePerTask).map(
          ([name, data]) => ({
            name,
            time: parseFloat((data.totalSeconds / 3600).toFixed(2)),
            incomplete: data.incomplete,
          })
        );
        setTimeSpentData(formattedTimeSpentData);
      } catch (error) {
        console.error("Error fetching task data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskData();
  }, [session?.user?.id, selectedDate]); // Added selectedDate to dependency array

  if (isLoading) {
    return <div className="loading-message">Loading reports...</div>;
  }

  return (
    <div className="report-page-container">
      <div className="report-header">
        <h1>Reports</h1>
        {/* Back to Home Button */}
        <button onClick={() => navigate("/")} className="button home-button">
          <IoArrowBack /> Back to Home
        </button>
      </div>

      {/* Date Filter Section */}
      <section className="report-section date-filter-section">
        <label htmlFor="report-date" className="input-label">
          Select Date:{" "}
        </label>
        <input
          type="date"
          id="report-date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="input theme-input" // Use theme input class
        />
      </section>

      <section className="report-section">
        <h2>Time Spent Per Task on {selectedDate} (Hours)</h2>
        {/* Chart Container with theme styles */}
        <div className="report-chart-container">
          {timeSpentData.length === 0 ? (
            <p className="no-data-message">No task data available for {selectedDate}.</p>
          ) : (
            <ResponsiveContainer>
              <BarChart
                data={timeSpentData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 30, // Adjusted left margin for wider label
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                {/* Updated YAxis label */}
                <YAxis
                  label={{ value: "Hours", angle: -90, position: "insideLeft" }}
                  domain={[0, "auto"]} // Ensure Y axis starts at 0
                />
                {/* Updated Tooltip formatter */}
                <Tooltip
                  formatter={(value: number, _name, props) => [
                    `${value.toFixed(2)} hr${value !== 1 ? "s" : ""}${
                      props.payload.incomplete ? " (Incomplete)" : ""
                    }`,
                    "Time Spent",
                  ]}
                />
                <Legend />
                {/* Use Cell for individual bar colors */}
                <Bar dataKey="time" name="Time Spent (hrs)">
                  {timeSpentData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.incomplete ? "#ff7300" : "#8884d8"}
                    /> // Orange for incomplete
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Historical Daily Totals Chart */}
      <section className="report-section">
        <h2>Total Time Spent Per Day (Hours)</h2>
        {/* Chart Container with theme styles */}
        <div className="report-chart-container">
          {dailyTotalsData.length === 0 ? (
            <p className="no-data-message">No historical data available.</p>
          ) : (
            <ResponsiveContainer>
              {/* Changed to LineChart */}
              <LineChart
                data={dailyTotalsData}
                margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis
                  label={{ value: "Total Hours", angle: -90, position: "insideLeft" }}
                  domain={[0, "auto"]}
                />
                <Tooltip
                  formatter={(value: number) => [
                    `${value.toFixed(2)} hr${value !== 1 ? "s" : ""}`,
                    "Total Time",
                  ]}
                />
                <Legend />
                {/* Changed Bar to Line */}
                <Line
                  type="monotone"
                  dataKey="totalHours"
                  stroke="#82ca9d"
                  name="Total Time (hrs)"
                  activeDot={{ r: 8 }} // Optional: highlight point on hover
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Daily Task Count Chart */}
      <section className="report-section">
        <h2>Tasks Recorded Per Day</h2>
        {/* Chart Container with theme styles */}
        <div className="report-chart-container">
          {dailyTaskCountData.length === 0 ? (
            <p className="no-data-message">No task count data available.</p>
          ) : (
            <ResponsiveContainer>
              <LineChart
                data={dailyTaskCountData}
                margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis
                  label={{ value: "Task Count", angle: -90, position: "insideLeft" }}
                  allowDecimals={false} // Ensure Y-axis shows whole numbers
                  domain={[0, "auto"]}
                />
                <Tooltip
                  formatter={(value: number) => [
                    `${value} task${value !== 1 ? "s" : ""}`, // Format tooltip
                    "Tasks Recorded",
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#ff7300" // Different color for this chart
                  name="Tasks Recorded"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
};

export default ReportPage;
