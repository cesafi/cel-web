const fs = require('fs');
const path = require('path');

// Read the source file (use __dirname for proper path resolution)
const sourceFile = path.join(__dirname, '..', 'old-dbs-schema', 'players_rows.sql');
const outputFile = path.join(__dirname, 'full_migration_players.sql');
let content = fs.readFileSync(sourceFile, 'utf8');

// Transform the data
content = content
  // Change table name
  .replace(/INSERT INTO "public"\."players"/g, 'INSERT INTO _old_players_migration')
  // Rename team_id to old_team_id in the column list
  .replace(/"team_id"/g, '"old_team_id"')
  // Fix array syntax: ARRAY["Role"] -> ARRAY['Role']
  .replace(/ARRAY\["/g, "ARRAY['")
  .replace(/"\]/g, "']")
  // Fix arrays with multiple values: 'Role1","Role2' -> 'Role1','Role2'
  .replace(/","/g, "','")
  // Fix booleans: 'true' -> true, 'false' -> false  
  .replace(/, 'true'/g, ', true')
  .replace(/, 'false'/g, ', false')
  // Handle empty arrays
  .replace(/ARRAY\[\]/g, "ARRAY[]::TEXT[]")
  // Remove trailing semicolon so we can add ON CONFLICT
  .replace(/;\s*$/, '');

const header = `-- Full Players Migration Script
-- Run this entire script at once in Supabase SQL Editor

-- Step 1: Create staging table
DROP TABLE IF EXISTS _old_players_migration;

CREATE TABLE _old_players_migration (
  id UUID PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  ingame_name TEXT,
  old_team_id UUID,
  platform_id UUID,
  roles TEXT[],
  picture_url TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
);

-- Step 2: Insert player data
`;

const footer = `
ON CONFLICT (id) DO NOTHING;

-- Step 3: Migrate to actual players table
INSERT INTO players (id, first_name, last_name, ign, team_id, photo_url, role, is_active, created_at)
SELECT 
  op.id,
  op.first_name,
  op.last_name,
  op.ingame_name,
  st.id as team_id,
  NULLIF(op.picture_url, '') as photo_url,
  COALESCE(op.roles[1], '') as role,
  op.is_active,
  op.created_at
FROM _old_players_migration op
LEFT JOIN schools_teams st ON st.school_id = op.old_team_id
LEFT JOIN esports_categories ec ON ec.id = st.esport_category_id
LEFT JOIN esports e ON e.id = ec.esport_id
WHERE 
  (op.platform_id = 'b91cc567-c7f4-4363-a01d-20f27b6af88e' AND e.abbreviation = 'MLBB')
  OR
  (op.platform_id = '959e30c2-22f1-4a48-b56c-27c2fd2d87a1' AND e.abbreviation = 'VALO')
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  ign = EXCLUDED.ign,
  team_id = EXCLUDED.team_id,
  role = EXCLUDED.role;

-- Step 4: Verify
SELECT COUNT(*) as migrated_players FROM players;

-- Cleanup (optional - uncomment after verifying)
-- DROP TABLE IF EXISTS _old_players_migration;
`;

// Write the full migration file
fs.writeFileSync(outputFile, header + content + footer);
console.log('Done! Created full_migration_players.sql');
