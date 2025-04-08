"use client";

import { useEffect, useState } from "react";
import RoutineItem from "@/components/RoutineItem";
import CompletionTimeStats from "@/components/CompletionTimeStats";
import { Routine, TaskCompletion } from "@/types";
import { format } from "date-fns";

export default function DailyRoutine() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch routines and completions
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch routines
        const routineRes = await fetch("/api/routine");
        if (!routineRes.ok) {
          throw new Error("Failed to fetch routines");
        }
        const routineData = await routineRes.json();

        // Fetch completions for selected date
        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        const completionRes = await fetch(
          `/api/completion?date=${formattedDate}`
        );
        if (!completionRes.ok) {
          throw new Error("Failed to fetch task completions");
        }
        const completionData = await completionRes.json();

        setRoutines(routineData);
        setCompletions(completionData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load your routine. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate]);

  // Handle toggling task completion with actual times
  const handleToggleComplete = async (
    routineId: string,
    date: string,
    completed: boolean,
    actualStartTime?: string,
    actualEndTime?: string
  ) => {
    try {
      const res = await fetch("/api/completion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          routineId,
          date,
          completed,
          actual_start_time: actualStartTime,
          actual_end_time: actualEndTime,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update task completion");
      }

      // Update the local state with the new completion
      const updatedCompletion = await res.json();

      setCompletions((prev) => {
        const existing = prev.findIndex((c) => c.routine_id === routineId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = updatedCompletion;
          return updated;
        } else {
          return [...prev, updatedCompletion];
        }
      });
    } catch (err) {
      console.error("Error updating task completion:", err);
      throw err;
    }
  };

  // Create a map of routine ID to completion for easier lookup
  const completionMap: Record<string, TaskCompletion> = {};
  completions.forEach((completion) => {
    completionMap[completion.routine_id] = completion;
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Today&apos;s Routine
        </h1>
        <div>
          <input
            type="date"
            value={format(selectedDate, "yyyy-MM-dd")}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      {loading && (
        <div className="text-center py-10">
          <svg
            className="animate-spin h-10 w-10 mx-auto text-indigo-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Loading your routine...
          </p>
        </div>
      )}

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:border-red-700 dark:text-red-300 mb-4"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {!loading && !error && routines.length === 0 && (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            No routine tasks found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Get started by creating your daily routine.
          </p>
          <div className="flex gap-3 justify-center">
            <a
              href="/edit-routine"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Routine
            </a>
            <a
              href="/manage-routines"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Manage Schedules
            </a>
          </div>
        </div>
      )}

      {!loading && !error && routines.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {routines.map((routine) => (
              <RoutineItem
                key={routine.id}
                routine={routine}
                date={selectedDate}
                completion={completionMap[routine.id]}
                onComplete={handleToggleComplete}
              />
            ))}
          </div>

          <div className="md:col-span-1">
            <CompletionTimeStats />

            <div className="mt-4 bg-card p-4 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">Routine Management</h3>
              <div className="flex flex-col space-y-2">
                <a
                  href="/edit-routine"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded text-center"
                >
                  Edit Routines
                </a>
                <a
                  href="/manage-routines"
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded text-center"
                >
                  Manage Schedules
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
