-- Create public schema tables

-- Routines Table
CREATE TABLE IF NOT EXISTS public.routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Task Completions Table
CREATE TABLE IF NOT EXISTS public.task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create unique constraint to prevent duplicate entries
ALTER TABLE public.task_completions ADD CONSTRAINT task_completion_unique UNIQUE (user_id, routine_id, date);

-- Set up Row Level Security (RLS) policies
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

-- Policy for routines - users can only see and modify their own routines
CREATE POLICY "Users can view their own routines" 
  ON public.routines 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own routines" 
  ON public.routines 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routines" 
  ON public.routines 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routines" 
  ON public.routines 
  FOR DELETE USING (auth.uid() = user_id);

-- Policy for task_completions - users can only see and modify their own task completions
CREATE POLICY "Users can view their own task completions" 
  ON public.task_completions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task completions" 
  ON public.task_completions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task completions" 
  ON public.task_completions 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task completions" 
  ON public.task_completions 
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function for routines
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_routines
BEFORE UPDATE ON public.routines
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp(); 