import { Droppable } from "@hello-pangea/dnd";
import React from "react";
import { Task } from "../types";
import TaskItem from "./TaskItem"; // Assuming TaskItem is in the same directory

interface DaySectionProps {
  date: string; // 'YYYY-MM-DD' format
  tasks: Task[];
  onStartPause: (id: string) => void;
  onStop: (id: string) => void;
}

const DaySection: React.FC<DaySectionProps> = ({ date, tasks, onStartPause, onStop }) => {
  // sectionStyle and titleStyle removed, using CSS classes now

  // Format date for display (e.g., "April 17, 2025")
  const displayDate = new Date(date + "T00:00:00").toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    // Removed timeZone: "UTC" to use local timezone for display
  });

  // Get today's date in YYYY-MM-DD format (Local)
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, "0");
  const todayDateString = `${year}-${month}-${day}`;

  // Check if the section's date is today
  const isToday = date === todayDateString;

  return (
    // Apply the day-section class here
    <div className="day-section">
      {/* Remove inline style from h2 */}
      <h2>{isToday ? "Today's Tasks" : displayDate}</h2>
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
            {tasks.length > 0 ? (
              tasks.map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  index={index}
                  onStartPause={onStartPause}
                  onStop={onStop}
                />
              ))
            ) : (
              // Remove inline style from p tag
              <p>No tasks for this day. Drag tasks here.</p>
            )}
            {provided.placeholder} {/* Placeholder for dragging items */}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default DaySection;
