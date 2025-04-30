import { Droppable } from "@hello-pangea/dnd";
import { format, parseISO } from "date-fns";
import React from "react";
import { Task } from "../types";
import { formatTime } from "../utils/timeUtils";
import TaskItem from "./TaskItem";

interface DaySectionProps {
  date: string;
  tasks: Task[];
  onStartPause: (id: number) => void;
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
  onPostpone?: (id: number) => void;
  onUpdate: (id: number, updates: Partial<Task>) => void;
}

const DaySection: React.FC<DaySectionProps> = ({
  date,
  tasks,
  onStartPause,
  onComplete,
  onDelete,
  onPostpone,
  onUpdate,
}) => {
  const getTotalTimeInMillis = () => {
    return tasks.reduce((totalMillis, task) => {
      if (task.total_time === 0 && !task.is_running) {
        return totalMillis;
      }

      let taskMillis = task.total_time * 1000;

      if (task.is_running && task.start_time) {
        const startTimeNumber = Number(task.start_time);
        const elapsedMillis = Date.now() - startTimeNumber;
        taskMillis += elapsedMillis;
      }

      return totalMillis + taskMillis;
    }, 0);
  };

  const displayDate = format(parseISO(date), "MMMM d, yyyy");

  const todayDateString = format(new Date(), "yyyy-MM-dd");

  const isToday = date === todayDateString;

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.is_completed === b.is_completed) return 0;
    return a.is_completed ? 1 : -1;
  });

  return (
    <div className="day-section">
      <div className="day-header">
        <h2>{isToday ? "Today's Tasks" : displayDate}</h2>
        <span className="day-total-time">{formatTime(getTotalTimeInMillis())}</span>
      </div>
      <Droppable droppableId={date}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              backgroundColor: snapshot.isDraggingOver ? "#e0f7fa" : "transparent",
              transition: "background-color 0.2s ease",
              paddingBottom: "1px",
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
                  onUpdate={onUpdate}
                />
              ))
            ) : (
              <p>No tasks for this day. Start by adding new task.</p>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default DaySection;
