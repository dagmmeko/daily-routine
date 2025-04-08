"use client";

import { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { WeeklyPerformance, DailyTaskCompletion } from "@/types";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function PerformancePage() {
  const [performance, setPerformance] = useState<WeeklyPerformance | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchPerformance = async () => {
      setLoading(true);
      setError(null);

      try {
        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        const res = await fetch(`/api/performance?date=${formattedDate}`);

        if (!res.ok) {
          throw new Error("Failed to fetch performance data");
        }

        const data = await res.json();
        setPerformance(data);
      } catch (err) {
        console.error("Error fetching performance data:", err);
        setError("Failed to load your performance data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, [selectedDate]);

  // Calculate the start and end dates of the week for display
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 }); // Sunday

  // Prepare chart data
  const chartData = {
    labels: performance?.weeklyData.map((day) => day.day) || [],
    datasets: [
      {
        label: "Completion Percentage",
        data:
          performance?.weeklyData.map((day) => day.completionPercentage) || [],
        backgroundColor: "rgba(79, 70, 229, 0.6)",
        borderColor: "rgba(79, 70, 229, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Chart options with correct typing
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Weekly Task Completion",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          // Using a more general callback function signature
          callback: (value: unknown) => `${value}%`,
        },
      },
    },
  };

  // Determine color based on performance
  const getColorClass = (percentage: number) => {
    if (percentage >= 80)
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (percentage >= 50)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Weekly Performance
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

      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Showing data for week: {format(weekStart, "MMM d, yyyy")} -{" "}
        {format(weekEnd, "MMM d, yyyy")}
      </p>

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
            Loading performance data...
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

      {!loading && !error && performance && (
        <>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Daily Completion Percentages
            </h2>
            <div className="w-full h-64">
              <Bar data={chartData} options={chartOptions} height={300} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Weekly Average
            </h2>
            <div className="flex items-center justify-center">
              <div
                className={`text-5xl font-bold p-6 rounded-full ${getColorClass(
                  performance.weeklyAverage
                )}`}
                style={{
                  width: "150px",
                  height: "150px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {performance.weeklyAverage}%
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Daily Breakdown
            </h2>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {performance.weeklyData.map((day: DailyTaskCompletion) => (
                <div key={day.date} className="py-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white">
                      {day.day}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorClass(
                        day.completionPercentage
                      )}`}
                    >
                      {day.completionPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full"
                      style={{ width: `${day.completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
