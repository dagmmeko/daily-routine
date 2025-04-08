"use client";

import { useState } from "react";
import { Routine, TaskCompletion } from "@/types";
import { format } from "date-fns";
import TaskCompletionTracker from "./TaskCompletionTracker";

interface RoutineItemProps {
  routine: Routine;
  date: Date;
  completion?: TaskCompletion;
  onComplete: (
    routineId: string,
    date: string,
    completed: boolean,
    actualStartTime?: string,
    actualEndTime?: string
  ) => Promise<void>;
}

export default function RoutineItem({
  routine,
  date,
  completion,
  onComplete,
}: RoutineItemProps) {
  const [loading, setLoading] = useState(false);

  const formattedDate = format(date, "yyyy-MM-dd");

  const handleComplete = async (
    routineId: string,
    completed: boolean,
    actualStartTime?: string,
    actualEndTime?: string
  ) => {
    setLoading(true);

    try {
      await onComplete(
        routineId,
        formattedDate,
        completed,
        actualStartTime,
        actualEndTime
      );
    } catch (error) {
      console.error("Error updating completion status:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TaskCompletionTracker
      routine={routine}
      taskCompletion={completion || null}
      onComplete={handleComplete}
    />
  );
}
