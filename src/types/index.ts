export enum DayOfWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}

export interface Routine {
  id: string;
  user_id: string;
  task_name: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
  taskName?: string;
  startTime?: string;
  endTime?: string;
  schedules?: RoutineSchedule[];
}

export interface RoutineSchedule {
  id: string;
  user_id: string;
  routine_id: string;
  day_of_week: DayOfWeek;
  created_at: string;
  updated_at: string;
  routine?: Routine;
}

export interface TaskCompletion {
  id: string;
  user_id: string;
  routine_id: string;
  date: string;
  completed: boolean;
  actual_start_time?: string;
  actual_end_time?: string;
  created_at: string;
  routine?: Routine;
}

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
