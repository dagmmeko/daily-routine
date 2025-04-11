"use client";

import { useState, useEffect } from "react";
import { Routine } from "@/types";
import { defaultRoutine } from "@/lib/defaultRoutine";

export default function EditRoutinePage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Expose setRoutines for testing
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__setRoutinesForTest = setRoutines;
    }
  }, []);

  // Form state for a new routine item
  const [newRoutine, setNewRoutine] = useState({
    taskName: "",
    startTime: "",
    endTime: "",
  });

  // Fetch existing routines
  useEffect(() => {
    const fetchRoutines = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/routine");
        if (!res.ok) {
          throw new Error("Failed to fetch routines");
        }

        const data = await res.json();
        console.log("Fetched routines:", data); // Debug log to inspect data
        setRoutines(data);

        // Expose routines for testing purposes
        if (typeof window !== "undefined") {
          (window as any).__routines = data;
        }
      } catch (err) {
        console.error("Error fetching routines:", err);
        setError("Failed to load your routines. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchRoutines();
  }, []);

  // Handle adding a new routine
  const handleAddRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newRoutine.taskName || !newRoutine.startTime || !newRoutine.endTime) {
      setError("Please fill in all fields");
      return;
    }

    try {
      const res = await fetch("/api/routine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newRoutine),
      });

      if (!res.ok) {
        throw new Error("Failed to add routine");
      }

      const addedRoutine = await res.json();
      setRoutines([...routines, addedRoutine]);
      setNewRoutine({ taskName: "", startTime: "", endTime: "" });
      setSuccess("Routine added successfully");
    } catch (err) {
      console.error("Error adding routine:", err);
      setError("Failed to add routine. Please try again.");
    }
  };

  // Handle updating a routine
  const handleUpdateRoutine = async (
    id: string,
    updatedData: Partial<Routine>
  ) => {
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/routine/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskName: updatedData.taskName,
          startTime: updatedData.startTime,
          endTime: updatedData.endTime,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update routine");
      }

      const updatedRoutine = await res.json();

      setRoutines(
        routines.map((routine) =>
          routine.id === id ? updatedRoutine : routine
        )
      );

      setSuccess("Routine updated successfully");
    } catch (err) {
      console.error("Error updating routine:", err);
      setError("Failed to update routine. Please try again.");
    }
  };

  // Handle deleting a routine
  const handleDeleteRoutine = async (id: string) => {
    if (!confirm("Are you sure you want to delete this routine item?")) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/routine/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete routine");
      }

      setRoutines(routines.filter((routine) => routine.id !== id));
      setSuccess("Routine deleted successfully");
    } catch (err) {
      console.error("Error deleting routine:", err);
      setError("Failed to delete routine. Please try again.");
    }
  };

  // Handle resetting to the default routine
  const handleResetToDefault = async () => {
    if (
      !confirm(
        "Are you sure you want to reset to the default routine? This will delete all your existing routines."
      )
    ) {
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Delete all existing routines
      const deletePromises = routines.map((routine) =>
        fetch(`/api/routine/${routine.id}`, { method: "DELETE" })
      );

      await Promise.all(deletePromises);

      // Add all default routines
      const createPromises = defaultRoutine.map((routine) =>
        fetch("/api/routine", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            taskName: routine.taskName,
            startTime: routine.startTime,
            endTime: routine.endTime,
          }),
        })
      );

      const responses = await Promise.all(createPromises);
      const newRoutines = await Promise.all(responses.map((res) => res.json()));

      setRoutines(newRoutines);
      setSuccess("Reset to default routine successfully");
    } catch (err) {
      console.error("Error resetting routine:", err);
      setError("Failed to reset routine. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle editing a routine (inline editing)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Routine | null>(null);

  const startEditing = (routine: Routine) => {
    setEditingId(routine.id);
    setEditForm({
      ...routine,
      // Make sure we always have camelCase fields populated
      taskName: routine.taskName || routine.task_name,
      startTime: routine.startTime || routine.start_time,
      endTime: routine.endTime || routine.end_time,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEditing = async () => {
    if (!editForm || !editingId) return;

    // Validate form
    if (!editForm.taskName || !editForm.startTime || !editForm.endTime) {
      setError("Please fill in all fields");
      return;
    }

    await handleUpdateRoutine(editingId, {
      taskName: editForm.taskName,
      startTime: editForm.startTime,
      endTime: editForm.endTime,
    });

    setEditingId(null);
    setEditForm(null);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Edit Daily Routine
        </h1>
        <button
          onClick={handleResetToDefault}
          disabled={loading}
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset to Default
        </button>
      </div>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:border-red-700 dark:text-red-300 mb-4"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {success && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative dark:bg-green-900 dark:border-green-700 dark:text-green-300 mb-4"
          role="alert"
        >
          <span className="block sm:inline">{success}</span>
        </div>
      )}

      {loading ? (
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
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Add New Routine Item
            </h2>
            <form onSubmit={handleAddRoutine} className="space-y-4">
              <div>
                <label
                  htmlFor="taskName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Task Name
                </label>
                <input
                  type="text"
                  id="taskName"
                  value={newRoutine.taskName}
                  onChange={(e) =>
                    setNewRoutine({ ...newRoutine, taskName: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="E.g., Sleep, Work, Gym"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="startTime"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Start Time
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    value={newRoutine.startTime}
                    onChange={(e) =>
                      setNewRoutine({
                        ...newRoutine,
                        startTime: e.target.value,
                      })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="endTime"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    End Time
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    value={newRoutine.endTime}
                    onChange={(e) =>
                      setNewRoutine({ ...newRoutine, endTime: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Routine
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Your Routine Items
            </h2>

            {routines.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No routine items found. Add some above.
              </p>
            ) : (
              <div className="space-y-4">
                {routines.map((routine) => (
                  <div
                    key={routine.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-md p-4"
                  >
                    {editingId === routine.id ? (
                      // Edit form
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Task Name
                          </label>
                          <input
                            type="text"
                            value={editForm?.taskName || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm!,
                                taskName: e.target.value,
                              })
                            }
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Start Time
                            </label>
                            <input
                              type="time"
                              value={editForm?.startTime || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm!,
                                  startTime: e.target.value,
                                })
                              }
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              End Time
                            </label>
                            <input
                              type="time"
                              value={editForm?.endTime || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm!,
                                  endTime: e.target.value,
                                })
                              }
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={saveEditing}
                            className="px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Read-only view
                      <div>
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {routine.taskName || routine.task_name}
                          </h3>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEditing(routine)}
                              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteRoutine(routine.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {routine.startTime || routine.start_time} -{" "}
                          {routine.endTime || routine.end_time}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
