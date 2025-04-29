import { endOfDay, isWithinInterval, parseISO, startOfDay } from "date-fns";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { Task } from "../types";

export const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const useCalendar = () => {
  const [dateFilter, setDateFilter] = useState<DateRange | undefined>(undefined);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  const filterTasks = (tasks: Task[]) => {
    if (dateFilter?.from) {
      // Create dates at noon in local time to avoid timezone issues
      const selectedDate = new Date(dateFilter.from.setHours(12, 0, 0, 0));
      const start = startOfDay(selectedDate);
      const end = dateFilter.to
        ? endOfDay(new Date(dateFilter.to.setHours(12, 0, 0, 0)))
        : endOfDay(selectedDate);

      return tasks.filter(task => {
        const taskDate = new Date(parseISO(task.current_day).setHours(12, 0, 0, 0));
        return isWithinInterval(taskDate, { start, end });
      });
    } else {
      return tasks.filter(task => task.current_day === getTodayDateString());
    }
  };

  return {
    dateFilter,
    setDateFilter,
    calendarMonth,
    setCalendarMonth,
    filterTasks,
    getTodayDateString,
  };
};
