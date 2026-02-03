-- Create the enum type for stage types
CREATE TYPE stage_type AS ENUM ('round_robin', 'single_elimination', 'double_elimination');

-- Add the stage_type column to the esports_seasons_stages table
ALTER TABLE esports_seasons_stages 
ADD COLUMN stage_type stage_type NOT NULL DEFAULT 'round_robin';

-- Comment on column
COMMENT ON COLUMN esports_seasons_stages.stage_type IS 'The format of the stage: round_robin, single_elimination, or double_elimination';
