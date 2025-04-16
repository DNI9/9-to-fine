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
    <form onSubmit={handleSubmit} style={{ marginBottom: "20px", padding: "5px" }}>
      <input
        type="text"
        value={taskName}
        onChange={e => setTaskName(e.target.value)}
        placeholder="Enter new task name and press Enter"
        aria-label="New task name"
        style={{
          width: "100%",
          padding: "15px",
          boxSizing: "border-box",
        }}
      />
    </form>
  );
};

export default TaskInput;
