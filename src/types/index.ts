export interface Routine {
  id: string;
  user_id: string;
  task_name: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

export interface TaskCompletion {
  id: string;
  user_id: string;
  routine_id: string;
  date: string;
  completed: boolean;
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
