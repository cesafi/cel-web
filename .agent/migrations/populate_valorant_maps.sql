-- Populate valorant_maps table with all Valorant maps
-- Run this BEFORE games migration

-- Insert all Valorant maps (using ON CONFLICT to avoid duplicates)
INSERT INTO valorant_maps (name, is_active, splash_image_url, created_at)
VALUES 
  ('Ascent', true, NULL, NOW()),
  ('Haven', true, NULL, NOW()),
  ('Icebox', true, NULL, NOW()),
  ('Bind', true, NULL, NOW()),
  ('Split', true, NULL, NOW()),
  ('Breeze', true, NULL, NOW()),
  ('Pearl', true, NULL, NOW()),
  ('Lotus', true, NULL, NOW()),
  ('Fracture', true, NULL, NOW()),
  ('Sunset', true, NULL, NOW()),
  ('Abyss', true, NULL, NOW())
ON CONFLICT (name) DO NOTHING;

-- Verify
SELECT * FROM valorant_maps ORDER BY name;
