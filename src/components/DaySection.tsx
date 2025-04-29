import { Droppable } from "@hello-pangea/dnd";
import { format, parseISO } from "date-fns";
import React from "react";
import { Task } from "../types";
import TaskItem from "./TaskItem";

interface DaySectionProps {
  date: string; // 'YYYY-MM-DD' format
  tasks: Task[];
  onStartPause: (id: number) => void;
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
  onPostpone?: (id: number) => void;
}

const DaySection: React.FC<DaySectionProps> = ({
  date,
  tasks,
  onStartPause,
  onComplete,
  onDelete,
  onPostpone,
}) => {
  const getTotalTimeInMillis = () => {
    return tasks.reduce((totalMillis, task) => {
      let taskMillis = task.total_time * 1000;
      const startTimeNumber = task.start_time ? Number(task.start_time) : null;
      if (task.is_running && startTimeNumber) {
        taskMillis += Date.now() - startTimeNumber;
      }
      return totalMillis + taskMillis;
    }, 0);
  };

  // Parse the date string using date-fns and format it consistently
  const displayDate = format(parseISO(date), "MMMM d, yyyy");

  // Get today's date in YYYY-MM-DD format using date-fns
  const todayDateString = format(new Date(), "yyyy-MM-dd");

  // Check if the section's date is today
  const isToday = date === todayDateString;

  // Sort tasks with completed ones at the bottom
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.is_completed === b.is_completed) return 0;
    return a.is_completed ? 1 : -1;
  });

  return (
    // Apply the day-section class here
    <div className="day-section">
      <div className="day-header">
        <h2>{isToday ? "Today's Tasks" : displayDate}</h2>
        <span className="day-total-time">
          {format(new Date(getTotalTimeInMillis()), "HH:mm:ss")}
        </span>
      </div>
      <Droppable droppableId={date}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              // Optional: visual feedback when dragging over
              backgroundColor: snapshot.isDraggingOver ? "#e0f7fa" : "transparent",
              transition: "background-color 0.2s ease",
              paddingBottom: "1px", // Prevent margin collapse
            }}
          >
            {sortedTasks.length > 0 ? (
              sortedTasks.map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  index={index}
                  onStartPause={onStartPause}
                  onComplete={onComplete}
                  onDelete={onDelete}
                  onPostpone={onPostpone}
                  isOldTask={!isToday}
                />
              ))
            ) : (
              <p>No tasks for this day. Start by adding new task.</p>
            )}
            {provided.placeholder} {/* Placeholder for dragging items */}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default DaySection;
