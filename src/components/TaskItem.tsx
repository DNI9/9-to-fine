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
  onStartPause: (id: string) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onPostpone?: (id: string) => void;
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
  const [displayTime, setDisplayTime] = useState<number>(task.totalTime);

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

  const handleCompleteClick = () => {
    if (!task.isCompleted) onComplete(task.id);
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
    <Draggable draggableId={task.id} index={index} isDragDisabled={task.isCompleted}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`
            task-item
            ${task.isCompleted ? "completed" : ""}
            ${task.isRunning ? "task-item--running" : ""}
            ${snapshot.isDragging ? "dragging" : ""}
          `}
          style={provided.draggableProps.style}
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
          <span className="task-name">{task.name}</span>

          {/* Time Display */}
          <span className="time-display">{formatTime(displayTime)}</span>

          {/* Controls */}
          <div className="controls">
            {task.isCompleted ? (
              <>
                <span className="completed-badge">Completed</span>
              </>
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
                    className={task.isRunning ? "button-pause" : "button-play"}
                    aria-label={task.isRunning ? "Pause task" : "Start task"}
                    title={task.isRunning ? "Pause task" : "Start task"}
                  >
                    {task.isRunning ? (
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
