-- Migration Script: Migrate OLD teams to NEW schools table
-- Purpose: Create school records from the old teams table
-- Run this FIRST before migrating teams

-- Clear existing data (CAUTION: uncomment only if intentional)
-- DELETE FROM schools WHERE id IN (...);

-- Insert schools from old teams data
-- Note: The old schema had teams with school_abbrev and school_name combined
-- We extract unique schools and create new school records

INSERT INTO schools (id, abbreviation, name, logo_url, is_active, created_at, updated_at)
VALUES
  -- Benedicto College
  ('bd497bb9-539e-48c0-9009-556eb7c75a0c', 'BC', 'Benedicto College', 'https://uqulenyafyepinfweagp.supabase.co/storage/v1/object/sign/images/icons/teams/BC_1739197501145.webp?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJpbWFnZXMvaWNvbnMvdGVhbXMvQkNfMTczOTE5NzUwMTE0NS53ZWJwIiwiaWF0IjoxNzM5MTk3NTAzLCJleHAiOjE3NzA3MzM1MDN9.-7kiRkkyElcEDOp4InEduNWo3PfZwvxBUp7cqlsKq4U', true, NOW(), NOW()),
  
  -- Cebu Eastern College
  ('1fe8332b-a60b-495d-8f42-f607aab02bf9', 'CEC', 'Cebu Eastern College', 'https://uqulenyafyepinfweagp.supabase.co/storage/v1/object/sign/images/icons/teams/CEC_1739197506950.webp?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJpbWFnZXMvaWNvbnMvdGVhbXMvQ0VDXzE3MzkxOTc1MDY5NTAud2VicCIsImlhdCI6MTczOTE5NzUwOCwiZXhwIjoxNzcwNzMzNTA4fQ.tdFG62UUBVEAs8LRWjOoGmv7iwTbPjiKySsikgIVGBE', true, NOW(), NOW()),
  
  -- Cebu Institute of Technology - University
  ('200be020-396c-44f4-943a-c9b69a0a255c', 'CIT-U', 'Cebu Institute of Technology - University', 'https://uqulenyafyepinfweagp.supabase.co/storage/v1/object/sign/images/icons/teams/CIT-U_1739197577396.webp?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJpbWFnZXMvaWNvbnMvdGVhbXMvQ0lULVVfMTczOTE5NzU3NzM5Ni53ZWJwIiwiaWF0IjoxNzM5MTk3NTc5LCJleHAiOjE3NzA3MzM1Nzl9.jcM_7plV785unN9gjfCXYQB5aimsqbVXVy7EvYt-N_M', true, NOW(), NOW()),
  
  -- University of Southern Philippines Foundation
  ('337fd03f-dfa5-48c7-a7ff-534a54acd5b1', 'USPF', 'University of Southern Philippines Foundation', 'https://uqulenyafyepinfweagp.supabase.co/storage/v1/object/sign/images/icons/teams/USPF_1739197631558.webp?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJpbWFnZXMvaWNvbnMvdGVhbXMvVVNQRl8xNzM5MTk3NjMxNTU4LndlYnAiLCJpYXQiOjE3MzkxOTc2MzMsImV4cCI6MTc3MDczMzYzM30.rBN1WEOfksKGXTxBkMHSuCcB0edun7o6f_dZI-Mg6jo', true, NOW(), NOW()),
  
  -- University of San Jose - Recoletos
  ('37148940-dbb1-4bd3-9c93-ef9e27c62840', 'USJ-R', 'University of San Jose - Recoletos', 'https://uqulenyafyepinfweagp.supabase.co/storage/v1/object/sign/images/icons/teams/USJ-R_1741505357315.webp?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJpbWFnZXMvaWNvbnMvdGVhbXMvVVNKLVJfMTc0MTUwNTM1NzMxNS53ZWJwIiwiaWF0IjoxNzQxNTA1MzU4LCJleHAiOjE3NzMwNDEzNTh9.8PlMrb50kFZ3-X1BaywasJaeW24Dh7lGV6F0uPTbI_M', true, NOW(), NOW()),
  
  -- University of the Philippines Cebu
  ('3c3c1230-2191-4544-8d1f-ebd5ee16c924', 'UPC', 'University of the Philippines Cebu', 'https://uqulenyafyepinfweagp.supabase.co/storage/v1/object/sign/images/icons/teams/UPC_1739197618402.webp?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJpbWFnZXMvaWNvbnMvdGVhbXMvVVBDXzE3MzkxOTc2MTg0MDIud2VicCIsImlhdCI6MTczOTE5NzYyMCwiZXhwIjoxNzcwNzMzNjIwfQ.oUNtS9giX0rBcWTKWBMt7oL5DhIYmgp0-vA4gAzbaHU', true, NOW(), NOW()),
  
  -- University of Cebu - Lapu-Lapu and Mandaue
  ('69612753-d51f-431c-9900-aed31c66ec55', 'UCLM', 'University of Cebu - Lapu-Lapu and Mandaue', 'https://uqulenyafyepinfweagp.supabase.co/storage/v1/object/sign/images/icons/teams/UCLM_1739197608922.webp?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJpbWFnZXMvaWNvbnMvdGVhbXMvVUNMTV8xNzM5MTk3NjA4OTIyLndlYnAiLCJpYXQiOjE3MzkxOTc2MTAsImV4cCI6MTc3MDczMzYxMH0.oJtvp3JS5t6OMZv3gFLxdZvRuWO2KZEfNBo7yOdCezU', true, NOW(), NOW()),
  
  -- University of Cebu - Main
  ('ccc9ffb6-ae07-4ce1-bab3-714d1d713564', 'UCMN', 'University of Cebu - Main', 'https://uqulenyafyepinfweagp.supabase.co/storage/v1/object/sign/images/icons/teams/UCMN_1739197613648.webp?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJpbWFnZXMvaWNvbnMvdGVhbXMvVUNNTl8xNzM5MTk3NjEzNjQ4LndlYnAiLCJpYXQiOjE3MzkxOTc2MTUsImV4cCI6MTc3MDczMzYxNX0.lPxxZRMNd6PI8CWHeONUnN_0tOgzkSzRh5yWVZS6tso', true, NOW(), NOW()),
  
  -- University of San Carlos
  ('efdc5ceb-9805-44ef-832d-e578c4e06ad8', 'USC', 'University of San Carlos', 'https://uqulenyafyepinfweagp.supabase.co/storage/v1/object/sign/images/icons/teams/USC_1739197622666.webp?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJpbWFnZXMvaWNvbnMvdGVhbXMvVVNDXzE3MzkxOTc2MjI2NjYud2VicCIsImlhdCI6MTczOTE5NzYyNCwiZXhwIjoxNzcwNzMzNjI0fQ.n4PO74lUAJpLISiYsrBggMPDmeGF8A9-WlHPDm7pxeE', true, NOW(), NOW()),
  
  -- University of the Visayas
  ('f1b85684-0417-4750-9a46-799f63cbc6e5', 'UV', 'University of the Visayas', 'https://uqulenyafyepinfweagp.supabase.co/storage/v1/object/sign/images/icons/teams/UV_1739197635545.webp?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJpbWFnZXMvaWNvbnMvdGVhbXMvVVZfMTczOTE5NzYzNTU0NS53ZWJwIiwiaWF0IjoxNzM5MTk3NjM3LCJleHAiOjE3NzA3MzM2Mzd9.eIB_IIcAKhHpccP_5EqeyliHD_ohAa5w7FeLpxhk3dY', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  abbreviation = EXCLUDED.abbreviation,
  name = EXCLUDED.name,
  logo_url = EXCLUDED.logo_url,
  updated_at = NOW();

-- Verification query
SELECT id, abbreviation, name FROM schools ORDER BY abbreviation;
