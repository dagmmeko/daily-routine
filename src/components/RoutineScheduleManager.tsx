"use client";

import { useState, useEffect } from "react";
import { DayOfWeek, Routine, RoutineSchedule } from "@/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function RoutineScheduleManager() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineSchedules, setRoutineSchedules] = useState<RoutineSchedule[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(DayOfWeek.Monday);
  const [selectedRoutine, setSelectedRoutine] = useState<string>("");

  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Fetch all routines
      const { data: routinesData, error: routinesError } = await supabase
        .from("routines")
        .select("*")
        .order("task_name");

      if (routinesError) {
        console.error("Error fetching routines:", routinesError);
        setLoading(false);
        return;
      }

      // Fetch all routine schedules
      const { data: schedulesData, error: schedulesError } = await fetch(
        "/api/routine-schedule"
      )
        .then((res) => res.json())
        .catch((err) => {
          console.error("Error fetching routine schedules:", err);
          return { data: [] };
        });

      setRoutines(routinesData);
      setRoutineSchedules(schedulesData || []);
      setLoading(false);
    }

    fetchData();
  }, [supabase]);

  // Get schedules for a specific day
  const getSchedulesForDay = (day: DayOfWeek) => {
    return routineSchedules.filter((schedule) => schedule.day_of_week === day);
  };

  // Check if a routine is scheduled for a specific day
  const isRoutineScheduledForDay = (routineId: string, day: DayOfWeek) => {
    return routineSchedules.some(
      (schedule) =>
        schedule.routine_id === routineId && schedule.day_of_week === day
    );
  };

  // Add a routine to a day
  const addRoutineToDay = async () => {
    if (!selectedRoutine) return;

    try {
      const response = await fetch("/api/routine-schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          routine_id: selectedRoutine,
          day_of_week: selectedDay,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add routine to day");
      }

      const newSchedule = await response.json();
      setRoutineSchedules([...routineSchedules, newSchedule]);
    } catch (error) {
      console.error("Error adding routine to day:", error);
    }
  };

  // Remove a routine from a day
  const removeRoutineFromDay = async (scheduleId: string) => {
    try {
      const response = await fetch(`/api/routine-schedule/${scheduleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove routine from day");
      }

      setRoutineSchedules(
        routineSchedules.filter((schedule) => schedule.id !== scheduleId)
      );
    } catch (error) {
      console.error("Error removing routine from day:", error);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Manage Routine Schedules</h2>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {/* Add Routine to Day */}
          <div className="p-4 bg-card rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Add Routine to Day</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium">
                  Select Routine:
                </label>
                <select
                  className="w-full p-2 rounded border"
                  value={selectedRoutine}
                  onChange={(e) => setSelectedRoutine(e.target.value)}
                >
                  <option value="">Select a routine</option>
                  {routines.map((routine) => (
                    <option key={routine.id} value={routine.id}>
                      {routine.task_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">
                  Select Day:
                </label>
                <select
                  className="w-full p-2 rounded border"
                  value={selectedDay}
                  onChange={(e) =>
                    setSelectedDay(Number(e.target.value) as DayOfWeek)
                  }
                >
                  {dayNames.map((day, index) => (
                    <option key={index} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded"
              onClick={addRoutineToDay}
              disabled={!selectedRoutine}
            >
              Add Routine to Day
            </button>
          </div>

          {/* Daily Schedule View */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Weekly Schedule</h3>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {Object.values(DayOfWeek)
                .filter((v) => !isNaN(Number(v)))
                .map((day) => (
                  <div key={day} className="bg-card rounded-lg shadow-sm p-4">
                    <h4 className="font-medium text-lg mb-2">
                      {dayNames[Number(day)]}
                    </h4>

                    {getSchedulesForDay(Number(day) as DayOfWeek).length > 0 ? (
                      <ul className="space-y-2">
                        {getSchedulesForDay(Number(day) as DayOfWeek).map(
                          (schedule) => {
                            const routine = routines.find(
                              (r) => r.id === schedule.routine_id
                            );

                            return (
                              <li
                                key={schedule.id}
                                className="flex justify-between items-center bg-background p-2 rounded"
                              >
                                <span>{routine?.task_name}</span>
                                <button
                                  className="text-destructive text-sm"
                                  onClick={() =>
                                    removeRoutineFromDay(schedule.id)
                                  }
                                >
                                  Remove
                                </button>
                              </li>
                            );
                          }
                        )}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        No routines
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
