import React, { useEffect, useRef, useState } from "react";
import { FaArrowRight } from "react-icons/fa";

interface TaskInputProps {
  onAddTask: (names: string[]) => void;
}

const TaskInput: React.FC<TaskInputProps> = ({ onAddTask }) => {
  const [taskName, setTaskName] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only trigger if we're not already in an input/textarea
      if (
        event.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const tasks = taskName
      .split("\n")
      .map(task => task.trim())
      .filter(task => task);
    onAddTask(tasks);
    setTaskName("");
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && event.ctrlKey) {
      event.preventDefault();
      handleSubmit(event as unknown as React.FormEvent);
    }
  };

  return (
    <div className="task-input-container">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexGrow: 1, gap: "10px" }}>
        <textarea
          ref={inputRef}
          value={taskName}
          onChange={e => setTaskName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter task name(s) here... (Press '/' to focus, Ctrl+Enter to submit)"
          rows={1}
          aria-label="Task input"
        />
        <button
          type="submit"
          disabled={!taskName.trim()}
          title="Add task"
          aria-label="Add task"
        >
          <FaArrowRight size={20} />
        </button>
      </form>
    </div>
  );
};

export default TaskInput;
