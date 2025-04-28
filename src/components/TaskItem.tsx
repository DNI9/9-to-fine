import { Draggable } from "@hello-pangea/dnd";
import React, { useEffect, useState } from "react";
import { FaGripVertical } from "react-icons/fa";
import {
  IoIosCheckmarkCircle,
  IoIosClock,
  IoIosPause,
  IoIosPlayCircle,
  IoIosRemoveCircle,
} from "react-icons/io";
import { Task } from "../types";
import { formatTime } from "../utils/timeUtils";

interface TaskItemProps {
  task: Task;
  index: number;
  onStartPause: (id: number) => void; // Changed id type to number
  onComplete: (id: number) => void; // Changed id type to number
  onDelete: (id: number) => void; // Changed id type to number
  onPostpone?: (id: number) => void; // Changed id type to number
  isOldTask?: boolean;
}

const ICON_SIZE = 18;

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  index,
  onStartPause,
  onComplete,
  onDelete,
  onPostpone,
  isOldTask,
}) => {
  // Display time state now stores milliseconds
  const [displayTimeMillis, setDisplayTimeMillis] = useState<number>(
    task.total_time * 1000 // Initialize with total_time (seconds) converted to ms
  );

  useEffect(() => {
    let intervalId: number | null = null;

    // Use snake_case properties
    const startTimeNumber = task.start_time ? Number(task.start_time) : null;
    if (task.is_running && startTimeNumber) {
      const updateTime = () => {
        const elapsedMillis = Date.now() - startTimeNumber;
        // Calculate total milliseconds: initial total_time (seconds) converted + elapsed ms
        setDisplayTimeMillis(task.total_time * 1000 + elapsedMillis);
      };

      updateTime(); // Initial update
      intervalId = window.setInterval(updateTime, 1000); // Update every second
    } else {
      // If not running, display the stored total time (total_time in seconds, converted to ms)
      setDisplayTimeMillis(task.total_time * 1000);
    }

    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
    // Depend on snake_case properties now
  }, [task.is_running, task.start_time, task.total_time]);

  const handleCompleteClick = () => {
    // Use snake_case property
    if (!task.is_completed) onComplete(task.id);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${task.name}"?`)) {
      onDelete(task.id);
    }
  };

  const handlePostpone = () => {
    if (onPostpone) {
      onPostpone(task.id);
    }
  };

  return (
    <Draggable
      draggableId={String(task.id)} // Convert number id to string for draggableId
      index={index}
      // Use snake_case properties
      isDragDisabled={task.is_completed || task.postponed_to !== undefined}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          // Use snake_case properties for class names
          className={`
            task-item
            ${task.is_completed ? "completed" : ""}
            ${task.is_running ? "task-item--running" : ""}
            ${snapshot.isDragging ? "dragging" : ""}
          `}
          style={provided.draggableProps.style}
        >
          {/* Drag Handle */}
          <div
            {...provided.dragHandleProps}
            // Use snake_case property for class name
            className={`
              drag-handle
              ${task.is_completed ? "drag-handle--completed" : ""}
            `}
          >
            <FaGripVertical />
          </div>

          {/* Task Name */}
          <span className="task-name">{task.name}</span>

          {/* Time Display - format from milliseconds */}
          <span className="time-display">{formatTime(displayTimeMillis)}</span>

          {/* Controls */}
          <div className="controls">
            {/* Use snake_case property */}
            {task.postponed_to ? (
              <span
                className="postponed-badge"
                // Use snake_case property
                title={`Postponed to ${new Date(
                  task.postponed_to + "T00:00:00"
                ).toLocaleDateString()}`}
              >
                Postponed
              </span>
            ) : // Use snake_case property
            task.is_completed ? (
              <span className="completed-badge">Completed</span>
            ) : (
              <>
                {isOldTask ? (
                  <button
                    onClick={handlePostpone}
                    className="button-postpone"
                    aria-label="Postpone to today"
                    title="Postpone to today"
                  >
                    <IoIosClock size={ICON_SIZE} />
                  </button>
                ) : (
                  <button
                    onClick={() => onStartPause(task.id)}
                    // Use snake_case property for class and labels/titles
                    className={task.is_running ? "button-pause" : "button-play"}
                    aria-label={task.is_running ? "Pause task" : "Start task"}
                    title={task.is_running ? "Pause task" : "Start task"}
                  >
                    {/* Use snake_case property */}
                    {task.is_running ? (
                      <IoIosPause size={ICON_SIZE} />
                    ) : (
                      <IoIosPlayCircle size={ICON_SIZE} />
                    )}
                  </button>
                )}
                <button
                  onClick={handleCompleteClick}
                  className="button-complete"
                  aria-label="Complete task"
                  title="Complete task"
                >
                  <IoIosCheckmarkCircle size={ICON_SIZE} />
                </button>
              </>
            )}
            <button
              onClick={handleDelete}
              className="button-delete"
              aria-label="Delete task"
              title="Delete task"
            >
              <IoIosRemoveCircle size={ICON_SIZE} />
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TaskItem;
