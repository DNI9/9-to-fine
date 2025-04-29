import { useEffect } from "react";
import { Task } from "../types";

export const useDocumentTitle = (tasks: Task[], defaultTitle: string) => {
  useEffect(() => {
    const runningTask = tasks.find(task => task.is_running);

    if (runningTask) {
      const updateTitle = () => {
        const startTimeNumber = runningTask.start_time
          ? Number(runningTask.start_time)
          : null;
        if (startTimeNumber) {
          const elapsedMillis =
            Date.now() - startTimeNumber + runningTask.total_time * 1000;
          const timeStr = new Date(elapsedMillis).toISOString().substring(11, 19);
          document.title = `${timeStr} - ${runningTask.name}`;
        }
      };

      updateTitle();
      const intervalId = setInterval(updateTitle, 1000);

      return () => {
        clearInterval(intervalId);
        document.title = defaultTitle;
      };
    } else {
      document.title = defaultTitle;
    }
  }, [tasks, defaultTitle]);
};
