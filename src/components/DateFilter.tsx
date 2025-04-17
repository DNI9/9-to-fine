import React, { useEffect, useRef, useState } from "react";
import { DateRange, DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { FaCalendar } from "react-icons/fa";

interface DateFilterProps {
  selected: DateRange | undefined;
  onSelect: (range: DateRange | undefined) => void;
}

const DateFilter: React.FC<DateFilterProps> = ({ selected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

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
