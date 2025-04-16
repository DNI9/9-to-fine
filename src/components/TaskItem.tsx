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
  const [isHovered, setIsHovered] = useState(false);

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

  const getProgressColor = () => {
    if (task.isCompleted) return "var(--success-color)";
    if (task.isRunning) return "var(--primary-color)";
    return "var(--text-muted)";
  };

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={task.isCompleted}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="task-item"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr auto auto",
            gap: "12px",
            alignItems: "center",
            padding: "12px 16px",
            background: task.isCompleted
              ? "var(--gray-50)"
              : task.isRunning
              ? "var(--gray-100)"
              : snapshot.isDragging
              ? "var(--gray-100)"
              : "var(--background-card)",
            borderLeft: `4px solid ${getProgressColor()}`,
            opacity: task.isCompleted ? 0.8 : 1,
            boxShadow: snapshot.isDragging
              ? "0 4px 12px rgba(0, 0, 0, 0.15)"
              : isHovered
              ? "0 2px 8px rgba(0, 0, 0, 0.1)"
              : "none",
            transition: "all 0.2s ease",
            ...provided.draggableProps.style,
          }}
        >
          {/* Drag Handle */}
          <div
            {...provided.dragHandleProps}
            style={{
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              cursor: task.isCompleted ? "default" : "grab",
              opacity: task.isCompleted ? 0.5 : isHovered ? 1 : 0.6,
            }}
          >
            <FaGripVertical />
          </div>

          {/* Task Name */}
          <span
            style={{
              fontSize: "0.95rem",
              fontWeight: 500,
              textDecoration: task.isCompleted ? "line-through" : "none",
              color: task.isCompleted ? "var(--text-muted)" : "var(--text-primary)",
            }}
          >
            {task.name}
          </span>

          {/* Time Display */}
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "0.9rem",
              color: task.isRunning ? "var(--primary-color)" : "var(--text-secondary)",
              fontWeight: task.isRunning ? 600 : 400,
            }}
          >
            {formatTime(displayTime)}
          </span>

          {/* Controls */}
          <div style={{ display: "flex", gap: "8px" }}>
            {task.isCompleted ? (
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "var(--success-color)",
                  padding: "4px 8px",
                  background: "var(--gray-100)",
                  borderRadius: "4px",
                  fontWeight: 500,
                }}
              >
                Completed
              </span>
            ) : (
              <>
                <button
                  onClick={() => onStartPause(task.id)}
                  style={{
                    padding: "6px",
                    minWidth: "32px",
                    background: task.isRunning
                      ? "var(--warning-color)"
                      : "var(--success-color)",
                    border: "none",
                    color: "var(--white)",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "background-color 0.5s ease",
                  }}
                  aria-label={task.isRunning ? "Pause task" : "Start task"}
                  title={task.isRunning ? "Pause task" : "Start task"}
                >
                  {task.isRunning ? <FaPause /> : <FaPlay />}
                </button>
                <button
                  onClick={handleStopClick}
                  style={{
                    padding: "6px",
                    minWidth: "32px",
                    background: "var(--text-muted)",
                    border: "none",
                    color: "var(--white)",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                  aria-label="Stop task"
                  title="Stop task"
                >
                  <FaStop />
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    padding: "6px",
                    minWidth: "32px",
                    background: "var(--danger-color)",
                    border: "none",
                    color: "var(--white)",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "opacity 0.2s ease",
                  }}
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
