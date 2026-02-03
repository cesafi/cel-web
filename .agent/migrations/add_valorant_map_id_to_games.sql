-- Schema Migration: Add valorant_map_id to games table
-- Run this AFTER populating valorant_maps table

-- Step 1: Add new nullable column for valorant_map_id
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS valorant_map_id INTEGER REFERENCES valorant_maps(id) ON DELETE SET NULL;

-- Step 2: Migrate existing map_name data to valorant_map_id (if any existing data)
UPDATE games g
SET valorant_map_id = vm.id
FROM valorant_maps vm
WHERE g.map_name = vm.name
  AND g.valorant_map_id IS NULL;

-- Step 3: Drop the old map_name column (optional - do this after confirming migration worked)
-- ALTER TABLE games DROP COLUMN IF EXISTS map_name;

-- Verify
SELECT 
  g.id,
  g.game_number,
  g.map_name as old_map_name,
  g.valorant_map_id,
  vm.name as new_map_name
FROM games g
LEFT JOIN valorant_maps vm ON vm.id = g.valorant_map_id
LIMIT 20;
