-- Add duration_days column to promotions table
ALTER TABLE public.promotions
ADD COLUMN duration_days INTEGER DEFAULT 7;

-- Update existing records to have the default value
UPDATE public.promotions
SET duration_days = 7
WHERE duration_days IS NULL;

-- Add a comment to the column for better documentation
COMMENT ON COLUMN public.promotions.duration_days IS 'The number of days the campaign is expected to run, defaults to 7 days'; 