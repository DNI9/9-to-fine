import React, { useEffect, useRef, useState } from "react";
import { DateRange, DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { FaCalendar } from "react-icons/fa";
import { Task } from "../types";

interface DateFilterProps {
  selected: DateRange | undefined;
  onSelect: (range: DateRange | undefined) => void;
  tasks: Task[];
}

const DateFilter: React.FC<DateFilterProps> = ({ selected, onSelect, tasks }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Create a map of dates with incomplete tasks (excluding postponed tasks)
  const datesWithIncompleteTasks = tasks.reduce((acc, task) => {
    if (!task.isCompleted && !task.postponedTo) {
      acc[task.currentDay] = true;
    }
    return acc;
  }, {} as Record<string, boolean>);

  // Custom modifier for days with incomplete tasks
  const modifiers = {
    withTasks: (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;
      return !!datesWithIncompleteTasks[dateString];
    },
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="date-filter-container">
      <button
        ref={buttonRef}
        className="date-filter-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle date filter"
        title="Toggle date filter"
      >
        <FaCalendar size={20} />
      </button>

      {isOpen && (
        <div ref={popoverRef} className="date-filter-popover">
          <DayPicker
            mode="range"
            defaultMonth={selected?.from}
            selected={selected}
            onSelect={onSelect}
            numberOfMonths={1}
            modifiers={modifiers}
            modifiersClassNames={{
              withTasks: "rdp-day_withTasks",
            }}
          />
          {selected && (
            <button className="clear-filter" onClick={() => onSelect(undefined)}>
              Clear Filter
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DateFilter;
