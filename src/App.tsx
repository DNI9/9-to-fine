import { DragDropContext } from "@hello-pangea/dnd";
import React from "react";
import { IoBarChart, IoSettingsOutline } from "react-icons/io5";
import { Navigate, Route, Routes, useNavigate } from "react-router";
import "./App.css";
import DateFilter from "./components/DateFilter";
import DaySection from "./components/DaySection";
import Login from "./components/Login";
import ReportPage from "./components/ReportPage";
import SettingsModal from "./components/SettingsModal";
import TaskInput from "./components/TaskInput";
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

  useDocumentTitle(tasks, originalTitle);

  const tasksByDay = groupTasksByDay(filterTasks(tasks));
  const sortedDays = getSortedDays(tasksByDay);

  return (
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

      <DragDropContext onDragEnd={handleDragEnd}>
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
      </DragDropContext>
      <SettingsModal
        settingsDialogRef={settingsDialogRef}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        isNotificationsEnabled={isNotificationsEnabled}
        toggleNotifications={toggleNotifications}
        isLofiEnabled={isLofiEnabled}
        toggleLofi={toggleLofi}
        handleLogout={handleLogout}
        setIsSettingsModalOpen={setIsSettingsModalOpen}
      />
    </div>
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
