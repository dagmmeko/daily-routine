export enum DayOfWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}

/**
 * Database Tables
 */
export interface Routine {
  id: string;
  user_id: string;
  task_name: string;
  start_time: string; // ISO string
  end_time: string; // ISO string
  created_at: string;
  updated_at: string;
  // Frontend only properties, not in database
  taskName?: string; // Alias for task_name
  startTime?: string; // Alias for start_time
  endTime?: string; // Alias for end_time
  schedules?: RoutineSchedule[];
}

export interface RoutineSchedule {
  id: string;
  user_id: string;
  routine_id: string;
  day_of_week: DayOfWeek;
  created_at: string;
  updated_at: string;
  // Relations
  routine?: Routine;
}

export interface TaskCompletion {
  id: string;
  user_id: string;
  routine_id: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  actual_start_time?: string | null; // ISO string
  actual_end_time?: string | null; // ISO string
  created_at: string;
  // Relations
  routine?: Routine;
}

/**
 * Frontend data structures
 */
export interface DailyTaskCompletion {
  date: string;
  completionPercentage: number;
  day: string;
}

export interface WeeklyPerformance {
  weeklyData: DailyTaskCompletion[];
  weeklyAverage: number;
}

export interface TimeComparisonStats {
  onTimeCount: number;
  lateCount: number;
  totalCompletedCount: number;
  onTimePercentage: number;
}
