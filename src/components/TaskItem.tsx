import { Draggable } from "@hello-pangea/dnd";
import { format, parseISO } from "date-fns";
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
  onStartPause: (id: number) => void;
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
  onPostpone?: (id: number) => void;
  isOldTask?: boolean;
  onUpdate?: (id: number, updates: Partial<Task>) => void;
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
  onUpdate,
}) => {
  const [displayTimeMillis, setDisplayTimeMillis] = useState<number>(
    task.total_time * 1000
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(task.name);

  useEffect(() => {
    let intervalId: number | null = null;

    const startTimeNumber = task.start_time ? Number(task.start_time) : null;
    if (task.is_running && startTimeNumber) {
      const updateTime = () => {
        const elapsedMillis = Date.now() - startTimeNumber;
        setDisplayTimeMillis(task.total_time * 1000 + elapsedMillis);
      };

      updateTime();
      intervalId = window.setInterval(updateTime, 1000);
    } else {
      setDisplayTimeMillis(task.total_time * 1000);
    }

    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [task.is_running, task.start_time, task.total_time]);

  const handleCompleteClick = () => {
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

  const handleNameClick = () => {
    if (!task.is_completed && !task.postponed_to) {
      setIsEditing(true);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleNameSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditedName(task.name);
    }
  };

  const handleNameSave = () => {
    if (editedName.trim() && editedName !== task.name && onUpdate) {
      onUpdate(task.id, { name: editedName.trim() });
    }
    setIsEditing(false);
  };

  const postponedDateDisplay = task.postponed_to
    ? format(parseISO(task.postponed_to), "MMMM d, yyyy")
    : null;

  return (
    <Draggable
      draggableId={String(task.id)}
      index={index}
      isDragDisabled={task.is_completed || task.postponed_to !== null}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`
            task-item
            ${task.is_completed ? "completed" : ""}
            ${task.is_running ? "task-item--running" : ""}
            ${snapshot.isDragging ? "dragging" : ""}
          `}
          style={provided.draggableProps.style}
        >
          <div
            {...provided.dragHandleProps}
            className={`
              drag-handle
              ${task.is_completed ? "drag-handle--completed" : ""}
            `}
          >
            <FaGripVertical />
          </div>

          {isEditing ? (
            <input
              type="text"
              value={editedName}
              onChange={e => setEditedName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={handleNameKeyDown}
              className="task-name-input"
              autoFocus
            />
          ) : (
            <span
              className="task-name"
              title="Click to edit task name"
              onClick={handleNameClick}
              style={{
                cursor: !task.is_completed && !task.postponed_to ? "pointer" : "default",
              }}
            >
              {task.name}
            </span>
          )}

          <span className="time-display">{formatTime(displayTimeMillis)}</span>

          <div className="controls">
            {task.postponed_to ? (
              <span
                className="postponed-badge"
                title={`Postponed to ${postponedDateDisplay}`}
              >
                Postponed
              </span>
            ) : task.is_completed ? (
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
                    className={task.is_running ? "button-pause" : "button-play"}
                    aria-label={task.is_running ? "Pause task" : "Start task"}
                    title={`Press space to ${task.is_running ? "pause" : "start"} task`}
                  >
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
