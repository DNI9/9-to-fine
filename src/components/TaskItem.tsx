import { Draggable, DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd"; // Re-add Draggable and add types
import React, { useEffect, useState } from "react";
import { FaPause, FaPlay, FaStop } from "react-icons/fa"; // Import icons
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

  // Define dynamic styles based on task state
  const getDynamicStyle = (isDragging: boolean): React.CSSProperties => {
    let backgroundColor = "var(--background-container)"; // Default from CSS .task-item
    let opacity = 1;

    if (isDragging) {
      backgroundColor = "#d4eaff"; // Dragging feedback
    } else if (task.isCompleted) {
      backgroundColor = "#e9ecef"; // Completed background
      opacity = 0.6;
    } else if (task.isRunning) {
      backgroundColor = "#e6f7ff"; // Running background (light blue)
    }

    // Only return dynamic parts, combine with provided styles later
    return {
      backgroundColor,
      opacity,
    };
  };

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={task.isCompleted}>
      {(
        provided: DraggableProvided,
        snapshot: DraggableStateSnapshot // Add types here
      ) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="task-item" // Apply the base class
          // Combine dynamic styles and provided styles here
          style={{
            ...getDynamicStyle(snapshot.isDragging),
            ...provided.draggableProps.style,
          }}
        >
          {/* Task Name */}
          <span>{task.name}</span>

          {/* Controls Area */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {" "}
            {/* Added gap */}
            {/* Time Display */}
            <span style={{ fontFamily: "monospace", whiteSpace: "nowrap" }}>
              {" "}
              {/* Prevent wrapping */}
              {formatTime(displayTime)}
            </span>
            {/* Status/Buttons */}
            {task.isCompleted ? (
              <span style={{ fontSize: "0.9em", color: "#6c757d" }}>Completed</span>
            ) : (
              <>
                {/* Start/Pause Button */}
                <button
                  onClick={() => onStartPause(task.id)}
                  // buttonStyle removed, uses general button style from App.css
                  aria-label={task.isRunning ? "Pause task" : "Start task"}
                  title={task.isRunning ? "Pause task" : "Start task"} // Tooltip
                >
                  {task.isRunning ? <FaPause /> : <FaPlay />}
                </button>
                {/* Stop Button */}
                <button
                  onClick={handleStopClick}
                  // buttonStyle removed, uses .task-item button style from App.css
                  disabled={task.isCompleted}
                  aria-label="Stop task"
                  title="Stop task" // Tooltip
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
