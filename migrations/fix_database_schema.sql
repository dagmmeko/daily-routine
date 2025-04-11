-- Comprehensive schema fix for the Daily Routine app
DO $$ 
BEGIN
    -- Ensure actual_start_time and actual_end_time columns exist in task_completions
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'task_completions' 
        AND column_name = 'actual_start_time'
    ) THEN
        -- Add actual_start_time column if it doesn't exist
        ALTER TABLE public.task_completions ADD COLUMN actual_start_time TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'task_completions' 
        AND column_name = 'actual_end_time'
    ) THEN
        -- Add actual_end_time column if it doesn't exist
        ALTER TABLE public.task_completions ADD COLUMN actual_end_time TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Update column types to match our TypeScript definitions
    
    -- Fix time columns to be properly accepted as strings or timestamps
    ALTER TABLE public.routines ALTER COLUMN start_time TYPE TEXT;
    ALTER TABLE public.routines ALTER COLUMN end_time TYPE TEXT;
    
    -- Fix date column format
    ALTER TABLE public.task_completions ALTER COLUMN date TYPE DATE USING date::date;
    
    -- Fix JSON handling for task_completions
    ALTER TABLE public.task_completions 
    ALTER COLUMN actual_start_time DROP NOT NULL,
    ALTER COLUMN actual_end_time DROP NOT NULL;
END $$; 