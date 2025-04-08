"use client";

import { useState } from "react";
import { Routine, TaskCompletion } from "@/types";
import { format } from "date-fns";

interface RoutineItemProps {
  routine: Routine;
  date: Date;
  completion?: TaskCompletion;
  onComplete: (
    routineId: string,
    date: string,
    completed: boolean
  ) => Promise<void>;
}

export default function RoutineItem({
  routine,
  date,
  completion,
  onComplete,
}: RoutineItemProps) {
  const [loading, setLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(
    completion?.completed || false
  );

  const formattedDate = format(date, "yyyy-MM-dd");

  const handleToggleComplete = async () => {
    setLoading(true);
    const newStatus = !isCompleted;

    try {
      await onComplete(routine.id, formattedDate, newStatus);
      setIsCompleted(newStatus);
    } catch (error) {
      console.error("Error updating completion status:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center p-4 mb-3 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex-1">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {routine.task_name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {routine.start_time} - {routine.end_time}
        </p>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={handleToggleComplete}
          disabled={loading}
          className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
        />
      </div>
    </div>
  );
}
