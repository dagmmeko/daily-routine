"use client";

import { useState, useEffect } from "react";
import { TaskCompletion, TimeComparisonStats } from "@/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function CompletionTimeStats() {
  const [stats, setStats] = useState<TimeComparisonStats>({
    onTimeCount: 0,
    lateCount: 0,
    totalCompletedCount: 0,
    onTimePercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<"week" | "month">("week");

  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);

      // Calculate date range based on time frame
      const endDate = new Date();
      const startDate = new Date();

      if (timeFrame === "week") {
        startDate.setDate(endDate.getDate() - 7);
      } else {
        startDate.setDate(endDate.getDate() - 30);
      }

      // Format dates for query
      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      // Fetch completions with routines
      const { data: completions, error } = await supabase
        .from("task_completions")
        .select(
          `
          *,
          routine:routines(*)
        `
        )
        .gte("date", startDateStr)
        .lte("date", endDateStr)
        .eq("completed", true);

      if (error) {
        console.error("Error fetching completion stats:", error);
        setLoading(false);
        return;
      }

      // Calculate stats
      let onTimeCount = 0;
      let lateCount = 0;

      completions.forEach((completion: TaskCompletion) => {
        if (
          completion.routine &&
          completion.actual_start_time &&
          completion.actual_end_time
        ) {
          // Check if task started on time (within 10 minutes of scheduled time)
          const isStartOnTime = isTimeOnTime(
            completion.routine.start_time,
            completion.actual_start_time
          );

          // Check if task ended on time (within 10 minutes of scheduled time)
          const isEndOnTime = isTimeOnTime(
            completion.routine.end_time,
            completion.actual_end_time
          );

          // Task is considered on time if both start and end are on time
          if (isStartOnTime && isEndOnTime) {
            onTimeCount++;
          } else {
            lateCount++;
          }
        }
      });

      const totalCompletedCount = onTimeCount + lateCount;
      const onTimePercentage =
        totalCompletedCount > 0
          ? Math.round((onTimeCount / totalCompletedCount) * 100)
          : 0;

      setStats({
        onTimeCount,
        lateCount,
        totalCompletedCount,
        onTimePercentage,
      });

      setLoading(false);
    }

    fetchStats();
  }, [timeFrame, supabase]);

  // Function to check if a time is within 10 minutes of the scheduled time
  const isTimeOnTime = (scheduledTime: string, actualTime: string) => {
    // Convert scheduled time (e.g., "8:00 AM") to a date object
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
    const diffMs = Math.abs(actual.getTime() - scheduled.getTime());
    const diffMinutes = Math.round(diffMs / 60000);

    // Consider on time if within 10 minutes
    return diffMinutes <= 10;
  };

  return (
    <div className="p-4 bg-card rounded-lg shadow-sm">
      <h3 className="text-xl font-semibold mb-4">Time Performance</h3>

      <div className="mb-4">
        <div className="flex space-x-2 mb-2">
          <button
            className={`px-3 py-1 rounded text-sm ${
              timeFrame === "week"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
            onClick={() => setTimeFrame("week")}
          >
            Last Week
          </button>
          <button
            className={`px-3 py-1 rounded text-sm ${
              timeFrame === "month"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
            onClick={() => setTimeFrame("month")}
          >
            Last Month
          </button>
        </div>
      </div>

      {loading ? (
        <div>Loading stats...</div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between">
            <div>
              <div className="text-2xl font-bold">
                {stats.onTimePercentage}%
              </div>
              <div className="text-sm text-muted-foreground">On Time</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {stats.totalCompletedCount}
              </div>
              <div className="text-sm text-muted-foreground">
                Completed Tasks
              </div>
            </div>
          </div>

          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{ width: `${stats.onTimePercentage}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-background rounded">
              <div className="text-xl font-semibold text-green-500">
                {stats.onTimeCount}
              </div>
              <div className="text-sm">On Time</div>
            </div>
            <div className="p-3 bg-background rounded">
              <div className="text-xl font-semibold text-red-500">
                {stats.lateCount}
              </div>
              <div className="text-sm">Late</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
