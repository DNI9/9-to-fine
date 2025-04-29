import { useEffect, useState } from "react";
import { getIncompleteTaskDatesForMonth } from "../utils/taskUtils";

export const useIncompleteDates = (userId: string | undefined, calendarMonth: Date) => {
  const [incompleteDates, setIncompleteDates] = useState<string[]>([]);

  useEffect(() => {
    const fetchIncompleteDates = async () => {
      if (userId) {
        try {
          const year = calendarMonth.getFullYear();
          const month = calendarMonth.getMonth() + 1;
          const dates = await getIncompleteTaskDatesForMonth(userId, year, month);
          setIncompleteDates(dates);
        } catch (error) {
          console.error("Failed to fetch incomplete task dates:", error);
          setIncompleteDates([]);
        }
      } else {
        setIncompleteDates([]);
      }
    };

    fetchIncompleteDates();
  }, [userId, calendarMonth]);

  return incompleteDates;
};
