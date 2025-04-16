import { Draggable } from "@hello-pangea/dnd";
import React, { useEffect, useState } from "react";
import { Task } from "../types";
import { formatTime } from "../utils/timeUtils";

interface TaskItemProps {
  task: Task;
  index: number; // Required by react-beautiful-dnd
  onStartPause: (id: string) => void;
  onStop: (id: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, index, onStartPause, onStop }) => {
  // State to hold the time displayed, updated by the interval if running
  const [displayTime, setDisplayTime] = useState<number>(task.totalTime);

  useEffect(() => {
    let intervalId: number | null = null;

    if (task.isRunning && task.startTime) {
      // Calculate initial display time immediately when starting/resuming
      const elapsedSinceStart = Date.now() - task.startTime;
      setDisplayTime(task.totalTime + elapsedSinceStart);

      // Update the display time every second
      intervalId = window.setInterval(() => {
        // Ensure startTime is still valid before calculating
        if (task.startTime) {
          const elapsed = Date.now() - task.startTime;
          setDisplayTime(task.totalTime + elapsed);
        }
      }, 1000);
    } else {
      // If paused or stopped, ensure display shows the final accumulated time
      setDisplayTime(task.totalTime);
    }

    // Cleanup function to clear the interval when the component unmounts
    // or when the task stops running
    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [task.isRunning, task.startTime, task.totalTime]); // Re-run effect if these change

  const handleStopClick = () => {
    if (!task.isCompleted) {
      onStop(task.id);
    }
  };

  const itemStyle = {
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: "10px 15px",
    marginBottom: "8px",
    backgroundColor: task.isCompleted ? "#f0f0f0" : task.isRunning ? "#e6f7ff" : "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    opacity: task.isCompleted ? 0.6 : 1,
  };

  const buttonStyle = {
    marginLeft: "5px",
    padding: "5px 10px",
    cursor: "pointer",
  };

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={task.isCompleted}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...itemStyle,
            ...provided.draggableProps.style,
            // Optional: visual change while dragging
            backgroundColor: snapshot.isDragging ? "#d4eaff" : itemStyle.backgroundColor,
          }}
        >
          <span>{task.name}</span>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ marginRight: "15px", fontFamily: "monospace" }}>
              {formatTime(displayTime)}
            </span>
            {task.isCompleted ? (
              <span>Completed</span>
            ) : (
              <>
                <button
                  onClick={() => onStartPause(task.id)}
                  style={buttonStyle}
                  aria-label={task.isRunning ? "Pause task" : "Start task"}
                >
                  {task.isRunning ? "Pause" : "Start"}
                </button>
                <button
                  onClick={handleStopClick}
                  style={buttonStyle}
                  disabled={task.isCompleted}
                  aria-label="Stop task"
                >
                  Stop
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
