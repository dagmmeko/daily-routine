"use client";

import { useState } from "react";
import { Routine, TaskCompletion } from "@/types";

interface TaskCompletionTrackerProps {
  routine: Routine;
  taskCompletion: TaskCompletion | null;
  onComplete: (
    routineId: string,
    completed: boolean,
    actualStartTime?: string,
    actualEndTime?: string
  ) => void;
}

export default function TaskCompletionTracker({
  routine,
  taskCompletion,
  onComplete,
}: TaskCompletionTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);

  // Format start time from routine.start_time (which is in format like "8:00 AM")
  const formatScheduledTime = (timeStr: string) => {
    return timeStr;
  };

  // Format actual time as ISO string
  const formatActualTime = (date: Date | null) => {
    return date ? date.toISOString() : undefined;
  };

  // Calculate time difference in minutes
  const calculateTimeDiff = (
    scheduledTime: string,
    actualTime: string | undefined
  ) => {
    if (!actualTime) return null;

    // Convert scheduled time (e.g., "8:00 AM") to today's date with that time
    const [timePart, ampm] = scheduledTime.split(" ");
    const [hourStr, minuteStr] = timePart.split(":");
    let hour = parseInt(hourStr, 10);

    if (ampm === "PM" && hour !== 12) {
      hour += 12;
    } else if (ampm === "AM" && hour === 12) {
      hour = 0;
    }

    const scheduled = new Date();
    scheduled.setHours(hour, parseInt(minuteStr, 10), 0, 0);

    // Parse actual time
    const actual = new Date(actualTime);

    // Calculate difference in minutes
    const diffMs = actual.getTime() - scheduled.getTime();
    const diffMinutes = Math.round(diffMs / 60000);

    return diffMinutes;
  };

  // Check if completed on time
  const isOnTime = (scheduledTime: string, actualTime: string | undefined) => {
    const diff = calculateTimeDiff(scheduledTime, actualTime);
    return diff !== null ? diff <= 10 : null; // 10 minutes grace period
  };

  // Start tracking
  const startTracking = () => {
    const now = new Date();
    setStartTime(now);
    setIsTracking(true);

    // Update task completion with actual start time
    onComplete(
      routine.id,
      taskCompletion?.completed || false,
      now.toISOString(),
      taskCompletion?.actual_end_time
    );
  };

  // Stop tracking
  const stopTracking = () => {
    const now = new Date();
    setEndTime(now);
    setIsTracking(false);

    // Update task completion with actual end time and mark as completed
    onComplete(
      routine.id,
      true,
      startTime?.toISOString() || taskCompletion?.actual_start_time,
      now.toISOString()
    );
  };

  // Toggle completion status without tracking
  const toggleCompletion = () => {
    const newStatus = !(taskCompletion?.completed || false);
    onComplete(
      routine.id,
      newStatus,
      taskCompletion?.actual_start_time,
      taskCompletion?.actual_end_time
    );
  };

  // Format time difference for display
  const formatTimeDiff = (minutes: number | null) => {
    if (minutes === null) return "";

    if (minutes === 0) {
      return "On time";
    } else if (minutes > 0) {
      return `${minutes} min late`;
    } else {
      return `${Math.abs(minutes)} min early`;
    }
  };

  // Get time difference for display
  const getStartTimeDiff = () => {
    return formatTimeDiff(
      calculateTimeDiff(routine.start_time, taskCompletion?.actual_start_time)
    );
  };

  const getEndTimeDiff = () => {
    return formatTimeDiff(
      calculateTimeDiff(routine.end_time, taskCompletion?.actual_end_time)
    );
  };

  return (
    <div className="p-4 bg-card rounded-lg shadow-sm">
      <div className="flex flex-col space-y-2">
        <div>
          <h4 className="font-medium text-lg">{routine.task_name}</h4>
          <div className="text-sm text-muted-foreground">
            Scheduled: {formatScheduledTime(routine.start_time)} -{" "}
            {formatScheduledTime(routine.end_time)}
          </div>
        </div>

        {taskCompletion?.actual_start_time && (
          <div className="text-sm">
            Started:{" "}
            {new Date(taskCompletion.actual_start_time).toLocaleTimeString()}
            <span
              className={`ml-2 ${
                isOnTime(routine.start_time, taskCompletion.actual_start_time)
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {getStartTimeDiff()}
            </span>
          </div>
        )}

        {taskCompletion?.actual_end_time && (
          <div className="text-sm">
            Ended:{" "}
            {new Date(taskCompletion.actual_end_time).toLocaleTimeString()}
            <span
              className={`ml-2 ${
                isOnTime(routine.end_time, taskCompletion.actual_end_time)
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {getEndTimeDiff()}
            </span>
          </div>
        )}

        <div className="flex gap-2 mt-2">
          {!isTracking ? (
            <>
              <button
                className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
                onClick={startTracking}
                disabled={isTracking}
              >
                Start
              </button>

              <button
                className={`px-3 py-1 rounded text-sm ${
                  taskCompletion?.completed
                    ? "bg-green-100 text-green-700"
                    : "bg-muted text-muted-foreground"
                }`}
                onClick={toggleCompletion}
              >
                {taskCompletion?.completed ? "Completed" : "Mark Complete"}
              </button>
            </>
          ) : (
            <button
              className="px-3 py-1 bg-red-500 text-white rounded text-sm"
              onClick={stopTracking}
            >
              Stop & Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
