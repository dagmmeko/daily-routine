-- Complete database synchronization for Daily Routine app
-- This ensures the hosted database schema matches local TypeScript definitions

-- First: Ensure all tables exist with proper structure
CREATE TABLE IF NOT EXISTS public.routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.routine_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 for Sunday, 6 for Saturday
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT false NOT NULL,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Second: Fix column types and constraints to match TypeScript types
DO $$ 
BEGIN
    -- Ensure time columns are TEXT to match TypeScript string type
    BEGIN
        ALTER TABLE public.routines ALTER COLUMN start_time TYPE TEXT;
        EXCEPTION WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE public.routines ALTER COLUMN end_time TYPE TEXT;
        EXCEPTION WHEN OTHERS THEN NULL;
    END;
    
    -- Ensure date column is DATE type
    BEGIN
        ALTER TABLE public.task_completions ALTER COLUMN date TYPE DATE USING date::date;
        EXCEPTION WHEN OTHERS THEN NULL;
    END;
    
    -- Ensure actual_start_time and actual_end_time are nullable
    BEGIN
        ALTER TABLE public.task_completions ALTER COLUMN actual_start_time DROP NOT NULL;
        EXCEPTION WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE public.task_completions ALTER COLUMN actual_end_time DROP NOT NULL;
        EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $$;

-- Third: Ensure unique constraints to prevent duplicate entries
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'task_completion_unique'
    ) THEN
        ALTER TABLE public.task_completions ADD CONSTRAINT task_completion_unique UNIQUE (user_id, routine_id, date);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'routine_schedule_unique'
    ) THEN
        ALTER TABLE public.routine_schedules ADD CONSTRAINT routine_schedule_unique UNIQUE (user_id, routine_id, day_of_week);
    END IF;
END $$;

-- Fourth: Enable Row Level Security (RLS) for all tables
DO $$
BEGIN
    -- Enable RLS
    ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.routine_schedules ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'routines' AND policyname = 'Users can view their own routines') THEN
        CREATE POLICY "Users can view their own routines" ON public.routines FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'routines' AND policyname = 'Users can insert their own routines') THEN
        CREATE POLICY "Users can insert their own routines" ON public.routines FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'routines' AND policyname = 'Users can update their own routines') THEN
        CREATE POLICY "Users can update their own routines" ON public.routines FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'routines' AND policyname = 'Users can delete their own routines') THEN
        CREATE POLICY "Users can delete their own routines" ON public.routines FOR DELETE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'task_completions' AND policyname = 'Users can view their own task completions') THEN
        CREATE POLICY "Users can view their own task completions" ON public.task_completions FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'task_completions' AND policyname = 'Users can insert their own task completions') THEN
        CREATE POLICY "Users can insert their own task completions" ON public.task_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'task_completions' AND policyname = 'Users can update their own task completions') THEN
        CREATE POLICY "Users can update their own task completions" ON public.task_completions FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'task_completions' AND policyname = 'Users can delete their own task completions') THEN
        CREATE POLICY "Users can delete their own task completions" ON public.task_completions FOR DELETE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'routine_schedules' AND policyname = 'Users can view their own routine schedules') THEN
        CREATE POLICY "Users can view their own routine schedules" ON public.routine_schedules FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'routine_schedules' AND policyname = 'Users can insert their own routine schedules') THEN
        CREATE POLICY "Users can insert their own routine schedules" ON public.routine_schedules FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'routine_schedules' AND policyname = 'Users can update their own routine schedules') THEN
        CREATE POLICY "Users can update their own routine schedules" ON public.routine_schedules FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'routine_schedules' AND policyname = 'Users can delete their own routine schedules') THEN
        CREATE POLICY "Users can delete their own routine schedules" ON public.routine_schedules FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Fifth: Create updated_at trigger function for routines if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_set_timestamp') THEN
        CREATE FUNCTION trigger_set_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    END IF;
    
    -- Create triggers if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_routines') THEN
        CREATE TRIGGER set_timestamp_routines
        BEFORE UPDATE ON public.routines
        FOR EACH ROW
        EXECUTE FUNCTION trigger_set_timestamp();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_routine_schedules') THEN
        CREATE TRIGGER set_timestamp_routine_schedules
        BEFORE UPDATE ON public.routine_schedules
        FOR EACH ROW
        EXECUTE FUNCTION trigger_set_timestamp();
    END IF;
END $$; 