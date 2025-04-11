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
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskStartTime, setNewTaskStartTime] = useState("");
  const [newTaskEndTime, setNewTaskEndTime] = useState("");

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

  // Handle quick add task
  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName || !newTaskStartTime || !newTaskEndTime) return;

    try {
      const res = await fetch("/api/routine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task_name: newTaskName,
          start_time: newTaskStartTime,
          end_time: newTaskEndTime,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create task");
      }

      const newRoutine = await res.json();
      setRoutines((prev) => [...prev, newRoutine]);

      // Reset form
      setNewTaskName("");
      setNewTaskStartTime("");
      setNewTaskEndTime("");
      setShowQuickAdd(false);
    } catch (err) {
      console.error("Error creating task:", err);
      setError("Failed to create task. Please try again.");
    }
  };

  // Create a map of routine ID to completion for easier lookup
  const completionMap: Record<string, TaskCompletion> = {};
  completions.forEach((completion) => {
    completionMap[completion.routine_id] = completion;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 mr-3 text-indigo-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Today&apos;s Routine
        </h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="date"
              value={format(selectedDate, "yyyy-MM-dd")}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
          </div>
          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Quick Add Task
          </button>
        </div>
      </div>

      {showQuickAdd && (
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Quick Add Task
          </h2>
          <form onSubmit={handleQuickAddTask} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label
                  htmlFor="taskName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Task Name
                </label>
                <input
                  type="text"
                  id="taskName"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="Enter task name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="startTime"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Start Time
                </label>
                <input
                  type="time"
                  id="startTime"
                  value={newTaskStartTime}
                  onChange={(e) => setNewTaskStartTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                  type="time"
                  id="endTime"
                  value={newTaskEndTime}
                  onChange={(e) => setNewTaskEndTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Add Task
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">
            Loading your routine...
          </p>
        </div>
      )}

      {error && (
        <div
          className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300 mb-6"
          role="alert"
        >
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {!loading && !error && routines.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 border border-gray-100 dark:border-gray-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            No routine tasks found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Get started by creating your daily routine. Add tasks to track and
            manage your day efficiently.
          </p>
          <div className="flex gap-3 justify-center">
            <a
              href="/edit-routine"
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Routine
            </a>
            <a
              href="/manage-routines"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
              Manage Schedules
            </a>
          </div>
        </div>
      )}

      {!loading && !error && routines.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-indigo-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Tasks for {format(selectedDate, "EEEE, MMMM d")}
            </h2>

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

          <div className="lg:col-span-1 space-y-6">
            <CompletionTimeStats />

            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-indigo-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Routine Management
              </h3>
              <div className="flex flex-col space-y-3">
                <a
                  href="/edit-routine"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm hover:shadow flex items-center justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit Routines
                </a>
                <a
                  href="/manage-routines"
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-md text-sm font-medium transition-colors shadow-sm hover:shadow flex items-center justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
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
