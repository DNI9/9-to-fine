import React, { useState } from "react";
import { FaArrowRight } from "react-icons/fa";

interface TaskInputProps {
  onAddTask: (name: string) => void;
}

const TaskInput: React.FC<TaskInputProps> = ({ onAddTask }) => {
  const [taskName, setTaskName] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const tasks = taskName
      .split("\n")
      .map(task => task.trim())
      .filter(task => task);
    console.log("Tasks to add:", tasks); // Debugging line
    tasks.forEach(task => {
      onAddTask(task);
    });
    setTaskName(""); // Clear input after adding
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
          value={taskName}
          onChange={e => setTaskName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter task name(s) here... (Ctrl+Enter to submit)"
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
