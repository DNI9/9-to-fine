import { DragDropContext } from "@hello-pangea/dnd";
import React from "react";
import { IoBarChart, IoLogOut, IoSettingsOutline } from "react-icons/io5";
import { Navigate, Route, Routes, useNavigate } from "react-router";
import "./App.css";
import DateFilter from "./components/DateFilter";
import DaySection from "./components/DaySection";
import LofiToggle from "./components/LofiToggle";
import Login from "./components/Login";
import NotificationToggle from "./components/NotificationToggle";
import ReportPage from "./components/ReportPage";
import TaskInput from "./components/TaskInput";
import ThemeToggle from "./components/ThemeToggle";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useAuthActions } from "./hooks/useAuthActions";
import { useCalendar } from "./hooks/useCalendar";
import { useDocumentTitle } from "./hooks/useDocumentTitle";
import { useIncompleteDates } from "./hooks/useIncompleteDates";
import { useLofi } from "./hooks/useLofi";
import { useNotifications } from "./hooks/useNotifications";
import { useSettingsModal } from "./hooks/useSettingsModal";
import { useTasks } from "./hooks/useTasks";
import { useTheme } from "./hooks/useTheme";
import { getSortedDays, groupTasksByDay } from "./utils/taskUtils";

const MainContent: React.FC = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const originalTitle = "9-to-Fine - Because tracking time is totally fine... right? 😅";

  // Use our custom hooks
  const { isDarkMode, toggleTheme } = useTheme();
  const { dateFilter, setDateFilter, calendarMonth, setCalendarMonth, filterTasks } =
    useCalendar();
  const {
    tasks,
    isLoadingTasks,
    hasRunningTasks,
    handleAddTask,
    handleStartPause,
    handleComplete,
    handleDelete,
    handlePostponeTask,
    handleDragEnd,
  } = useTasks(session?.user?.id, dateFilter);
  const { isLofiEnabled, toggleLofi } = useLofi(hasRunningTasks);
  const { isNotificationsEnabled, toggleNotifications } = useNotifications(tasks);
  const { setIsSettingsModalOpen, settingsDialogRef } = useSettingsModal();
  const incompleteDates = useIncompleteDates(session?.user?.id, calendarMonth);
  const { handleLogout } = useAuthActions();

  // Set up document title management
  useDocumentTitle(tasks, originalTitle);

  // Group and sort tasks
  const tasksByDay = groupTasksByDay(filterTasks(tasks));
  const sortedDays = getSortedDays(tasksByDay);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="app-container">
        <div className="top-controls">
          <button
            onClick={() => navigate("/reports")}
            className="report-button"
            title="Reports"
          >
            <IoBarChart size={20} />
          </button>
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="settings-button"
            title="Settings"
          >
            <IoSettingsOutline size={20} />
          </button>
        </div>
        <h1 className="app-title">Track. Focus. Celebrate.</h1>
        <p className="app-description">
          Effortless daily task tracking with focus and fun.
        </p>
        <div className="input-container">
          <TaskInput onAddTask={handleAddTask} />
          <DateFilter
            selected={dateFilter}
            onSelect={setDateFilter}
            incompleteDates={incompleteDates}
            onMonthChange={setCalendarMonth}
          />
        </div>

        <div className="days-container">
          {isLoadingTasks ? (
            <div className="loading">Loading tasks...</div>
          ) : sortedDays.length > 0 ? (
            sortedDays.map(day => (
              <DaySection
                key={day}
                date={day}
                tasks={tasksByDay[day]}
                onStartPause={handleStartPause}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onPostpone={handlePostponeTask}
              />
            ))
          ) : (
            <p className="no-tasks-message">
              {dateFilter?.from
                ? "No tasks found for the selected date range"
                : "No tasks for today. Add some tasks to get started!"}
            </p>
          )}
        </div>

        {/* Settings Modal */}
        <dialog
          ref={settingsDialogRef}
          className="settings-modal"
          onClose={() => setIsSettingsModalOpen(false)}
        >
          <div className="settings-modal-content">
            <h2>Settings</h2>

            <div className="setting-item">
              <div className="setting-item-info">
                <div className="setting-item-title">Theme</div>
                <p className="setting-description">
                  Switch between light and dark mode for your preferred viewing
                  experience.
                </p>
              </div>
              <ThemeToggle isDark={isDarkMode} onToggle={toggleTheme} />
            </div>

            <div className="setting-item">
              <div className="setting-item-info">
                <div className="setting-item-title">Notifications</div>
                <p className="setting-description">
                  Get reminded every 30 minutes when a task is running to help you stay on
                  track.
                </p>
              </div>
              <NotificationToggle
                isEnabled={isNotificationsEnabled}
                onToggle={toggleNotifications}
              />
            </div>

            <div className="setting-item">
              <div className="setting-item-info">
                <div className="setting-item-title">Lofi Player</div>
                <p className="setting-description">
                  Play calming lofi beats automatically when you start a task to enhance
                  focus.
                </p>
              </div>
              <LofiToggle isEnabled={isLofiEnabled} onToggle={toggleLofi} />
            </div>

            <div className="settings-modal-buttons">
              <button
                onClick={handleLogout}
                className="settings-modal-logout"
                title="Logout"
              >
                <IoLogOut size={18} /> Logout
              </button>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="settings-modal-close"
              >
                Close
              </button>
            </div>
          </div>
        </dialog>
      </div>
    </DragDropContext>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
};

const AuthenticatedApp: React.FC = () => {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
      <Route path="/" element={session ? <MainContent /> : <Navigate to="/login" />} />
      <Route
        path="/reports"
        element={session ? <ReportPage /> : <Navigate to="/login" />}
      />
    </Routes>
  );
};

export default App;
