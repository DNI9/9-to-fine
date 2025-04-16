import { Draggable } from "@hello-pangea/dnd";
import React, { useEffect, useState } from "react";
import { FaGripVertical, FaPause, FaPlay, FaStop } from "react-icons/fa";
import { Task } from "../types";
import { formatTime } from "../utils/timeUtils";

interface TaskItemProps {
  task: Task;
  index: number;
  onStartPause: (id: string) => void;
  onStop: (id: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, index, onStartPause, onStop }) => {
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

  const getProgressColor = () => {
    if (task.isCompleted) return "#28a745";
    if (task.isRunning) return "#007bff";
    return "#6c757d";
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
              ? "#f8f9fa"
              : task.isRunning
              ? "#e3f2fd"
              : snapshot.isDragging
              ? "#f0f7ff"
              : "#ffffff",
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
              color: "#adb5bd",
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
              color: task.isCompleted ? "#6c757d" : "#212529",
            }}
          >
            {task.name}
          </span>

          {/* Time Display */}
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "0.9rem",
              color: task.isRunning ? "#007bff" : "#495057",
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
                  color: "#28a745",
                  padding: "4px 8px",
                  background: "#e9f7ef",
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
                    background: task.isRunning ? "#ff4757" : "#4cd137",
                    border: "none",
                    color: "#fff",
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
                    background: "#6c757d",
                    border: "none",
                    color: "#fff",
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
              </>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TaskItem;
