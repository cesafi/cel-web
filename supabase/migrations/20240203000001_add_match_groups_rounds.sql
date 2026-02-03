-- Add group_name, round, and match_order columns to the matches table
ALTER TABLE matches 
ADD COLUMN group_name text,
ADD COLUMN round integer,
ADD COLUMN match_order integer;

-- Add comments for clarity
COMMENT ON COLUMN matches.group_name IS 'The name of the subgroup (e.g., Group A, Group B)';
COMMENT ON COLUMN matches.round IS 'The round number of the match (e.g., 1, 2, 3)';
COMMENT ON COLUMN matches.match_order IS 'The ordering of the match within the round or group';
