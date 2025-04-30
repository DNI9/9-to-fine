import { format } from "date-fns";
import React, { useEffect, useRef, useState } from "react";
import { DateRange, DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { FaCalendar } from "react-icons/fa";

interface DateFilterProps {
  selected: DateRange | undefined;
  onSelect: (range: DateRange | undefined) => void;
  incompleteDates: string[];
  onMonthChange: (month: Date) => void;
}

const DateFilter: React.FC<DateFilterProps> = ({
  selected,
  onSelect,
  incompleteDates,
  onMonthChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const incompleteDatesSet = new Set(incompleteDates);

  const modifiers = {
    withTasks: (date: Date) => {
      const dateString = format(date, "yyyy-MM-dd");
      return incompleteDatesSet.has(dateString);
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

  const handleSelect = (range: DateRange | undefined) => {
    if (range?.from) {
      range.from.setHours(12, 0, 0, 0);
      if (range.to) {
        range.to.setHours(12, 0, 0, 0);
      }
    }
    onSelect(range);
  };

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
            onSelect={handleSelect}
            numberOfMonths={1}
            onMonthChange={onMonthChange}
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
