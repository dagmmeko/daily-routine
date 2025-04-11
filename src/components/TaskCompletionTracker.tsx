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
  const [isManualMode, setIsManualMode] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [manualStartTime, setManualStartTime] = useState("");
  const [manualEndTime, setManualEndTime] = useState("");

  // Format start time from routine.start_time (which is in format like "8:00 AM")
  const formatScheduledTime = (timeStr: string) => {
    return timeStr;
  };

  // Format actual time as ISO string
  const formatActualTime = (date: Date | null) => {
    return date ? date.toISOString() : undefined;
  };

  // Format date/time string to local time
  const formatTimeToLocal = (dateStr: string | null | undefined) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString();
  };

  // Format time string to ISO
  const formatTimeInputToISO = (timeStr: string) => {
    if (!timeStr) return undefined;

    // Create a date object with today's date and the specified time
    const today = new Date();
    const [hours, minutes] = timeStr.split(":");
    today.setHours(Number(hours), Number(minutes), 0, 0);

    return today.toISOString();
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
    // Prevent starting a completed task
    if (taskCompletion?.completed) return;

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
    setShowConfetti(true);

    // Update task completion with actual end time and mark as completed
    onComplete(
      routine.id,
      true,
      startTime?.toISOString() || taskCompletion?.actual_start_time,
      now.toISOString()
    );

    // Hide confetti after 2 seconds
    setTimeout(() => {
      setShowConfetti(false);
    }, 2000);
  };

  // Toggle completion status without tracking
  const toggleCompletion = () => {
    const newStatus = !(taskCompletion?.completed || false);

    if (newStatus) {
      setShowConfetti(true);

      // Hide confetti after 2 seconds
      setTimeout(() => {
        setShowConfetti(false);
      }, 2000);
    }

    onComplete(
      routine.id,
      newStatus,
      taskCompletion?.actual_start_time,
      taskCompletion?.actual_end_time
    );
  };

  // Save manual time entries
  const saveManualTimeEntries = () => {
    if (!manualStartTime) return;

    const startISOTime = formatTimeInputToISO(manualStartTime);
    const endISOTime = manualEndTime
      ? formatTimeInputToISO(manualEndTime)
      : taskCompletion?.actual_end_time;

    onComplete(
      routine.id,
      endISOTime ? true : taskCompletion?.completed || false,
      startISOTime,
      endISOTime
    );

    if (endISOTime && !taskCompletion?.completed) {
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
      }, 2000);
    }

    setIsManualMode(false);
  };

  // Format time difference for display
  const formatTimeDiff = (minutes: number | null) => {
    if (minutes === null) return "";

    if (minutes === 0) {
      return "On time";
    } else if (minutes > 0) {
      return `${minutes} minutes late`;
    } else {
      return `${Math.abs(minutes)} minutes early`;
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

  const getStatusColor = (diff: number | null) => {
    if (diff === null) return "";
    if (diff <= 0) return "text-emerald-500 dark:text-emerald-400 font-medium";
    if (diff <= 15) return "text-amber-500 dark:text-amber-400 font-medium";
    return "text-rose-600 dark:text-rose-500 font-bold";
  };

  // Get time status color
  const getStartStatusColor = () => {
    const diff = calculateTimeDiff(
      routine.start_time,
      taskCompletion?.actual_start_time
    );
    return getStatusColor(diff);
  };

  const getEndStatusColor = () => {
    const diff = calculateTimeDiff(
      routine.end_time,
      taskCompletion?.actual_end_time
    );
    return getStatusColor(diff);
  };

  // Initialize manual time inputs
  const initializeManualMode = () => {
    // Prevent editing time for completed tasks
    if (taskCompletion?.completed) return;

    // Convert ISO times to local time format for the input fields
    if (taskCompletion?.actual_start_time) {
      const startDate = new Date(taskCompletion.actual_start_time);
      setManualStartTime(
        `${String(startDate.getHours()).padStart(2, "0")}:${String(
          startDate.getMinutes()
        ).padStart(2, "0")}`
      );
    } else {
      // Default to current time
      const now = new Date();
      setManualStartTime(
        `${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes()
        ).padStart(2, "0")}`
      );
    }

    if (taskCompletion?.actual_end_time) {
      const endDate = new Date(taskCompletion.actual_end_time);
      setManualEndTime(
        `${String(endDate.getHours()).padStart(2, "0")}:${String(
          endDate.getMinutes()
        ).padStart(2, "0")}`
      );
    } else {
      setManualEndTime("");
    }

    setIsManualMode(true);
  };

  return (
    <div
      className={`p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border ${
        taskCompletion?.completed
          ? "border-emerald-300 dark:border-emerald-700"
          : "border-gray-100 dark:border-gray-700"
      } transition-all hover:shadow-lg ${
        taskCompletion?.completed ? "bg-emerald-50 dark:bg-emerald-900/10" : ""
      }`}
    >
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="confetti-container">
            {/* This would be replaced with a proper confetti animation library in production */}
            <div className="text-4xl animate-bounce">🎉</div>
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-bold text-xl text-gray-900 dark:text-white flex items-center">
              {routine.task_name}
              {taskCompletion?.completed && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                  <svg
                    className="mr-1 h-3 w-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Completed
                </span>
              )}
            </h4>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-1">
              Scheduled: {formatScheduledTime(routine.start_time)} —{" "}
              {formatScheduledTime(routine.end_time)}
            </div>
          </div>
        </div>

        {/* Manual time entry mode */}
        {isManualMode ? (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="startTime"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Start Time
                </label>
                <input
                  id="startTime"
                  type="time"
                  value={manualStartTime}
                  onChange={(e) => setManualStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="endTime"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  End Time
                </label>
                <input
                  id="endTime"
                  type="time"
                  value={manualEndTime}
                  onChange={(e) => setManualEndTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsManualMode(false)}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium transition-colors hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={saveManualTimeEntries}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                Save Times
              </button>
            </div>
          </div>
        ) : (
          <>
            {taskCompletion?.actual_start_time && (
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                <div className="flex justify-between items-center">
                  <div className="font-medium text-gray-700 dark:text-gray-200">
                    Started:{" "}
                    {new Date(
                      taskCompletion.actual_start_time
                    ).toLocaleTimeString()}
                  </div>
                  <div className={getStartStatusColor()}>
                    {getStartTimeDiff()}
                  </div>
                </div>
              </div>
            )}

            {taskCompletion?.actual_end_time && (
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                <div className="flex justify-between items-center">
                  <div className="font-medium text-gray-700 dark:text-gray-200">
                    Ended:{" "}
                    {new Date(
                      taskCompletion.actual_end_time
                    ).toLocaleTimeString()}
                  </div>
                  <div className={getEndStatusColor()}>{getEndTimeDiff()}</div>
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex gap-3 mt-2">
          {!isManualMode && !isTracking ? (
            <>
              <button
                className={`px-4 py-2 ${
                  taskCompletion?.completed
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                } text-white rounded-md text-sm font-medium transition-colors shadow-sm hover:shadow flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                onClick={startTracking}
                disabled={isTracking || taskCompletion?.completed}
              >
                Start Task
              </button>

              <button
                className={`px-4 py-2 ${
                  taskCompletion?.completed
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-amber-500 hover:bg-amber-600"
                } text-white rounded-md text-sm font-medium transition-colors shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2`}
                onClick={initializeManualMode}
                disabled={taskCompletion?.completed}
              >
                Enter Times
              </button>

              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm hover:shadow flex-1 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  taskCompletion?.completed
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-700 focus:ring-emerald-500"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500"
                }`}
                onClick={toggleCompletion}
              >
                {taskCompletion?.completed ? (
                  <span className="flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Completed
                  </span>
                ) : (
                  "Mark Complete"
                )}
              </button>
            </>
          ) : isTracking ? (
            <button
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm hover:shadow w-full focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
              onClick={stopTracking}
            >
              Stop & Complete
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
