import React, { useState } from "react";

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

  return (
    <div className="task-input-container">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexGrow: 1, gap: "10px" }}>
        <textarea
          value={taskName}
          onChange={e => setTaskName(e.target.value)}
          placeholder="Enter task name(s) here..."
          rows={1}
          aria-label="Task input"
        />
        <button type="submit" disabled={!taskName.trim()}>
          Add task(s)
        </button>
      </form>
    </div>
  );
};

export default TaskInput;
