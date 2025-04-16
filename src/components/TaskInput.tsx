import React, { useState } from "react";

interface TaskInputProps {
  onAddTask: (name: string) => void;
}

const TaskInput: React.FC<TaskInputProps> = ({ onAddTask }) => {
  const [taskName, setTaskName] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = taskName.trim();
    if (trimmedName) {
      onAddTask(trimmedName);
      setTaskName(""); // Clear input after adding
    }
  };

  return (
    // Use a div with the class for styling, keep form for submission logic
    <div className="task-input-container">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexGrow: 1, gap: "10px" }}>
        <input
          type="text"
          value={taskName}
          onChange={e => setTaskName(e.target.value)}
          placeholder="Enter new task name" // Updated placeholder
          aria-label="New task name"
          // Inline styles removed, handled by .task-input-container input in CSS
        />
        <button type="submit" disabled={!taskName.trim()}>
          Add Task
        </button>
      </form>
    </div>
  );
};

export default TaskInput;
