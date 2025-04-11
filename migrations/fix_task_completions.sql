-- Ensure actual_start_time and actual_end_time columns exist in task_completions
DO $$ 
BEGIN
    -- Check if actual_start_time and actual_end_time columns exist
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
END $$; 