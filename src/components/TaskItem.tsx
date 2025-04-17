import { Draggable } from "@hello-pangea/dnd";
import React, { useEffect, useState } from "react";
import { FaGripVertical, FaPause, FaPlay, FaStop, FaTrash } from "react-icons/fa";
import { Task } from "../types";
import { formatTime } from "../utils/timeUtils";

interface TaskItemProps {
  task: Task;
  index: number;
  onStartPause: (id: string) => void;
  onStop: (id: string) => void;
  onDelete: (id: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  index,
  onStartPause,
  onStop,
  onDelete,
}) => {
  const [displayTime, setDisplayTime] = useState<number>(task.totalTime);
  // isHovered state is no longer needed as we'll use CSS :hover

  useEffect(() => {
    let intervalId: number | null = null;

    if (task.isRunning && task.startTime) {
      const updateTime = () => {
        const elapsed = Date.now() - task.startTime!;
        setDisplayTime(task.totalTime + elapsed);
      };

      updateTime();
      intervalId = window.setInterval(updateTime, 1000);
    } else {
      setDisplayTime(task.totalTime);
    }

    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [task.isRunning, task.startTime, task.totalTime]);

  const handleStopClick = () => {
    if (!task.isCompleted) onStop(task.id);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${task.name}"?`)) {
      onDelete(task.id);
    }
  };

  // getProgressColor is no longer needed, handled by CSS classes

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={task.isCompleted}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          // Combine base class with conditional modifiers
          className={`
            task-item
            ${task.isCompleted ? "task-item--completed" : ""}
            ${task.isRunning ? "task-item--running" : ""}
            ${snapshot.isDragging ? "task-item--dragging" : ""}
          `}
          // Remove inline styles except for dnd required ones
          style={provided.draggableProps.style} // Keep dnd styles
        >
          {/* Drag Handle */}
          <div
            {...provided.dragHandleProps}
            className={`
              drag-handle
              ${task.isCompleted ? "drag-handle--completed" : ""}
            `}
          >
            <FaGripVertical />
          </div>

          {/* Task Name */}
          <span className="task-name">
            {" "}
            {/* Completed style handled by parent modifier */}
            {task.name}
          </span>

          {/* Time Display */}
          <span className="time-display">
            {" "}
            {/* Running style handled by parent modifier */}
            {formatTime(displayTime)}
          </span>

          {/* Controls */}
          <div className="controls">
            {task.isCompleted ? (
              <span className="completed-badge">
                {" "}
                {/* Use existing class */}
                Completed
              </span>
            ) : (
              <>
                {/* Use button-play or button-pause based on state */}
                <button
                  onClick={() => onStartPause(task.id)}
                  className={task.isRunning ? "button-pause" : "button-play"}
                  aria-label={task.isRunning ? "Pause task" : "Start task"}
                  title={task.isRunning ? "Pause task" : "Start task"}
                >
                  {task.isRunning ? <FaPause /> : <FaPlay />}
                </button>
                {/* Use button-stop class */}
                <button
                  onClick={handleStopClick}
                  className="button-stop"
                  aria-label="Stop task"
                  title="Stop task"
                >
                  <FaStop />
                </button>
                {/* Add a button-delete class */}
                <button
                  onClick={handleDelete}
                  className="button-delete"
                  aria-label="Delete task"
                  title="Delete task"
                >
                  <FaTrash />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TaskItem;
