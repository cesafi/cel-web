-- Full Games Migration Script
-- Run this entire script at once in Supabase SQL Editor
-- Run AFTER matches are migrated (full_migration_matches.sql)

-- ============================================================================
-- Step 1: Create staging tables for old game data
-- ============================================================================
DROP TABLE IF EXISTS _old_mlbb_games_migration;
DROP TABLE IF EXISTS _old_valo_games_migration;
DROP TABLE IF EXISTS _migration_mlbb_games;
DROP TABLE IF EXISTS _migration_valo_games;

-- MLBB staging table
CREATE TABLE _old_mlbb_games_migration (
  id UUID PRIMARY KEY,
  series_id UUID,
  match_duration TEXT,
  team_a_status TEXT,
  team_b_status TEXT,
  match_number INTEGER,
  created_at TIMESTAMPTZ
);

-- Valorant staging table
CREATE TABLE _old_valo_games_migration (
  id UUID PRIMARY KEY,
  series_id UUID,
  map_id UUID,
  match_duration TEXT,
  match_number INTEGER,
  team_a_status TEXT,
  team_a_rounds INTEGER,
  team_b_status TEXT,
  team_b_rounds INTEGER,
  created_at TIMESTAMPTZ
);

-- Mapping tables
CREATE TABLE _migration_mlbb_games (
  old_game_id UUID PRIMARY KEY,
  old_series_id UUID,
  new_game_id INTEGER,
  team_a_status TEXT,
  team_b_status TEXT
);

CREATE TABLE _migration_valo_games (
  old_game_id UUID PRIMARY KEY,
  old_series_id UUID,
  new_game_id INTEGER,
  team_a_rounds INTEGER,
  team_b_rounds INTEGER
);

-- ============================================================================
-- Step 2: Insert MLBB game data
-- ============================================================================
INSERT INTO _old_mlbb_games_migration ("id", "series_id", "match_duration", "team_a_status", "team_b_status", "match_number", "created_at") VALUES ('0022dc98-fc40-4824-9e5e-368620cb9d19', 'a3fcac4d-66c0-4060-aeef-cbd073171570', '17:36', 'Win', 'Loss', '1', '2025-03-22 05:41:25.533257+00'), ('024c917c-f95c-4cc8-8bc4-b001a8115279', 'e2521440-39f0-4f7f-a815-33e9f61dddfb', '15:30', 'Win', 'Loss', '3', '2025-04-12 12:11:16.994699+00'), ('0ccd4db4-02e1-4172-8126-9a19f3e25535', 'a5f7f9da-9249-44a3-9eec-31fea412f279', '15:39', 'Win', 'Loss', '3', '2025-04-13 03:35:15.16242+00'), ('0ef5f1b7-5f48-40ef-94d9-0562d030f76a', 'a35cd9e8-b3a4-4f62-972a-f619d4dbd4e7', '13:06', 'Loss', 'Win', '3', '2025-04-05 07:05:45.378357+00'), ('15f1085a-734a-481e-af06-f44b3b982697', '96bdcf93-2dcb-4b69-847d-5ea1ec0d5420', '15:30', 'Win', 'Loss', '1', '2025-03-01 04:36:27.671715+00'), ('16b3c150-bfe8-4189-b2ff-aa726540d2b6', 'e2521440-39f0-4f7f-a815-33e9f61dddfb', '22:14', 'Loss', 'Win', '4', '2025-04-12 12:17:54.934862+00'), ('19ca1b84-c5fd-43fa-b82b-c04b5fbee230', '0c44059d-7460-48b2-9027-d40c8b4f82cf', '13:30', 'Loss', 'Win', '1', '2025-03-22 03:07:37.176868+00'), ('2261b221-36e1-4862-94e3-c6fefcbe4b76', 'a35cd9e8-b3a4-4f62-972a-f619d4dbd4e7', '15:24', 'Loss', 'Win', '1', '2025-04-05 06:15:09.522378+00'), ('2500b1f2-d6e5-49b3-9800-dcef190bcf38', '8784545f-8105-436e-a337-09f93d73c6d6', '17:34', 'Loss', 'Win', '3', '2025-04-12 06:53:25.386405+00'), ('26529bdb-b7a1-43a0-a9c7-d508e67c0230', '5cb608b1-e520-48b1-8f8c-2e8f19461977', '15:08', 'Loss', 'Win', '1', '2025-03-08 05:52:23.613532+00'), ('2a39734c-9da1-4bd8-b1fb-73f7f8843204', '270751ed-dae5-49ac-a719-b0200d082835', '12:12', 'Loss', 'Win', '2', '2025-04-05 04:08:21.206229+00'), ('2ae81513-f230-4d9c-af8b-5c957dfc5189', 'd526aadc-accb-43c2-bd58-a522e76c045f', '22:51', 'Win', 'Loss', '1', '2025-03-15 06:03:17.386537+00'), ('2c598cf3-df59-4f6f-8927-067f5eebf3ce', '8278d422-e54e-4316-a4d6-b989b43bb345', '10:55', 'Loss', 'Win', '2', '2025-02-22 05:33:47.381639+00'), ('32536566-26a7-46d4-aebc-0505ca72ebdb', '8278d422-e54e-4316-a4d6-b989b43bb345', '12:51', 'Loss', 'Win', '1', '2025-02-22 04:48:20.425477+00'), ('3ab33274-0783-4229-b4f0-e4d51d7eb55c', '2d5d6102-115b-435a-b33a-3f2b9d332755', '14:39', 'Loss', 'Win', '2', '2025-03-01 06:47:06.801073+00'), ('463e215f-fcea-4956-9900-6fc2fefa29cb', '96ccaaa4-a0e6-46ad-8941-041f24dcec19', '14:46', 'Win', 'Loss', '1', '2025-02-08 09:10:13.898727+00'), ('4799eb9c-0832-4aa2-a469-b6a637a66b10', '900c4839-ad08-43c8-a8ec-f62c728e0d1e', '13:23', 'Loss', 'Win', '1', '2025-02-08 07:04:17.360394+00'), ('4a3f71a5-858c-42bb-b8d5-ce8423c71434', '5cb608b1-e520-48b1-8f8c-2e8f19461977', '11:29', 'Loss', 'Win', '2', '2025-03-08 06:27:28.132194+00'), ('4e72a517-6ced-4f1e-b885-edb9c6ea73cd', 'c0821ad2-57e1-4d38-b4d7-13d0dd4a3797', '11:20', 'Draw', 'Draw', '2', '2025-03-29 08:13:06.941335+00'), ('4f2ae0f0-a3b4-40d8-9ac3-ed39b355c4ed', '3d1bd6e5-f9d9-443a-9f57-594f87d7a8d1', '12:37', 'Draw', 'Draw', '4', '2025-03-29 08:37:39.772814+00'), ('5244a0f3-b974-4fb5-8a62-6121a4cc44ab', '116698aa-7371-421a-8a9d-42b2fc2d7c52', '10:57', 'Loss', 'Win', '1', '2025-02-16 02:13:18.129926+00'), ('560cb9c3-b03d-4ac2-a2a9-80387e13e8b4', '96ccaaa4-a0e6-46ad-8941-041f24dcec19', '16:10', 'Win', 'Loss', '1', '2025-02-08 09:42:13.922135+00'), ('59547fe0-68e9-4106-b669-08a617b075ed', '4b0b3efd-08a6-48b5-9e10-b99618d2ba64', '11:33', 'Win', 'Loss', '2', '2025-03-08 05:29:22.513296+00'), ('5acbf69b-d591-4001-8545-e8d64be9936c', 'c0821ad2-57e1-4d38-b4d7-13d0dd4a3797', '17:38', 'Draw', 'Draw', '1', '2025-03-29 08:09:24.526871+00'), ('639a86bf-f5cd-4a0f-8047-27482e2a37a2', 'e6e4c2e2-be79-40dd-888c-498abcc1655b', '11:37', 'Loss', 'Win', '1', '2025-02-16 01:55:31.847368+00'), ('66955235-75cd-438c-90d6-fb6033613c25', '8784545f-8105-436e-a337-09f93d73c6d6', '20:34', 'Loss', 'Win', '1', '2025-04-12 06:10:41.266447+00'), ('6a1376c8-c20e-4b43-8277-050f406de8cb', 'f52d2e44-797e-4df0-8727-578c498f074e', '16:03', 'Win', 'Loss', '1', '2025-03-01 08:00:25.153873+00'), ('6f005e73-c034-4465-9944-ecdfabb53673', '3ee4f806-93d9-4152-94af-8f675e08a09c', '11:38', 'Loss', 'Win', '1', '2025-03-22 04:50:09.391845+00'), ('701c826f-b058-4cdf-a4e1-c6402e653c4e', '3f7b55d2-85e3-4959-b578-c3cdd4528beb', '17:45', 'Loss', 'Win', '3', '2025-02-08 13:00:58.720679+00'), ('7643acb6-db90-476c-bf52-8b98a73419f7', 'a5f7f9da-9249-44a3-9eec-31fea412f279', '16:38', 'Win', 'Loss', '2', '2025-04-13 03:22:26.201437+00'), ('7931501c-3301-44cc-b8d3-dc9dab9ba1f6', '3f7b55d2-85e3-4959-b578-c3cdd4528beb', '17:22', 'Loss', 'Win', '1', '2025-02-08 11:17:42.268112+00'), ('7c0744eb-e5b0-4057-90ac-70a79a177ca4', 'd526aadc-accb-43c2-bd58-a522e76c045f', '10:43', 'Win', 'Loss', '2', '2025-03-15 06:24:43.41429+00'), ('82236f99-7df5-4a6c-8f15-95deba5e4b2e', 'cd69f327-9030-422e-a69b-d3eba156135a', '13:22', 'Win', 'Loss', '2', '2025-02-16 01:43:31.267226+00'), ('847289bc-3719-4d71-ae96-7aeb2b58675f', '29ab3009-6fae-49bb-b2b9-3e2bd99a5593', '13:42', 'Loss', 'Win', '1', '2025-03-22 07:08:01.690117+00'), ('88992ce0-3e3d-4a68-a9f7-858c09db525e', 'e4aebd77-7dcf-4111-a39c-44ca086f745b', '15:46', 'Loss', 'Win', '2', '2025-03-15 03:44:48.70585+00'), ('8a6c0f4f-2f52-40d3-91e0-b389a31fc05d', '116698aa-7371-421a-8a9d-42b2fc2d7c52', '31:07', 'Loss', 'Win', '2', '2025-02-16 02:19:40.826722+00'), ('8ba3bb89-212d-45d9-9d94-f3ec509b53df', '900c4839-ad08-43c8-a8ec-f62c728e0d1e', '10:59', 'Loss', 'Win', '2', '2025-02-08 07:35:47.723604+00'), ('8ed67b0c-ffbf-47af-beda-d56628df2425', 'e2521440-39f0-4f7f-a815-33e9f61dddfb', '12:38', 'Loss', 'Win', '1', '2025-04-12 11:52:25.654858+00'), ('9066d878-3ceb-4118-9fcd-945652a328de', 'e6e4c2e2-be79-40dd-888c-498abcc1655b', '13:45', 'Loss', 'Win', '2', '2025-02-16 02:03:40.687804+00'), ('99b031e2-bb52-4373-9b0d-b4f66089a21c', 'a35cd9e8-b3a4-4f62-972a-f619d4dbd4e7', '19:25', 'Loss', 'Win', '2', '2025-04-05 06:34:02.336377+00'), ('9f54fbc8-a9b5-486d-9b86-3fe69cb97e60', 'f52d2e44-797e-4df0-8727-578c498f074e', '17:30', 'Win', 'Loss', '2', '2025-03-01 08:37:07.227082+00'), ('a050c0c0-2cb7-4d61-8969-cf458e3a650b', '5ccbae08-cc44-4ae8-963f-c4f8902b0228', '10:45', 'Win', 'Loss', '2', '2025-02-22 06:01:50.429427+00'), ('a0a963b5-58e9-4441-b1a7-768efd440cec', 'cd69f327-9030-422e-a69b-d3eba156135a', '17:15', 'Win', 'Loss', '1', '2025-02-16 01:27:28.045653+00'), ('a336946a-e71a-41b6-abfc-37c3135c7f4d', '3d1bd6e5-f9d9-443a-9f57-594f87d7a8d1', '11:10', 'Draw', 'Draw', '3', '2025-03-29 08:29:27.952327+00'), ('aa22db2c-0d94-42c9-9e35-2583806840c2', '270751ed-dae5-49ac-a719-b0200d082835', '15:06', 'Loss', 'Win', '1', '2025-04-05 03:04:21.946759+00'), ('ab91ea95-f10f-4a7c-9622-b692b7989bb7', '8784545f-8105-436e-a337-09f93d73c6d6', '18:45', 'Loss', 'Win', '2', '2025-04-12 06:34:58.316386+00'), ('b06c0e56-084c-45ee-a275-f141ae6d630a', '5ccbae08-cc44-4ae8-963f-c4f8902b0228', '11:15', 'Win', 'Loss', '1', '2025-02-22 05:43:57.224605+00'), ('b7a62cc6-21cf-47c2-b014-2302484b22aa', '2d5d6102-115b-435a-b33a-3f2b9d332755', '17:31', 'Loss', 'Win', '1', '2025-03-01 06:16:10.509386+00'), ('c04c0b88-6e4c-40eb-ac18-2538f0e893a7', '39b55af6-0423-41e6-8479-a01bbdbb7a1b', '11:35', 'Loss', 'Win', '1', '2025-01-30 13:00:10.987071+00'), ('c19e3147-1a41-4778-af06-fcc05de6e532', 'e4aebd77-7dcf-4111-a39c-44ca086f745b', '12:30', 'Loss', 'Win', '3', '2025-03-15 04:17:00.857413+00'), ('c41ccd2b-323e-41f1-86c9-82acadc0a6e7', 'c44d1cc0-3066-42e6-9401-11483ea222c9', '12:00', 'Loss', 'Win', '1', '2025-03-22 03:37:25.591915+00'), ('c9a0be36-0c75-421f-b60a-32312bf89bde', '3f7b55d2-85e3-4959-b578-c3cdd4528beb', '22:44', 'Win', 'Loss', '2', '2025-02-08 12:09:07.605459+00'), ('c9d4b501-e2cf-4cd7-a28b-7e08ca3db957', 'e2521440-39f0-4f7f-a815-33e9f61dddfb', '09:23', 'Loss', 'Win', '2', '2025-04-12 12:02:38.846817+00'), ('d34b6241-028d-439c-b9a5-a0f9474f5010', '4b0b3efd-08a6-48b5-9e10-b99618d2ba64', '11:20', 'Win', 'Loss', '1', '2025-03-08 04:23:27.528085+00'), ('df42e8be-be05-408c-99b6-4ffadd1e51fb', 'df412b52-3763-4271-9611-731d3023308c', '16:20', 'Loss', 'Win', '2', '2025-02-22 08:50:58.524814+00'), ('e10f2ef7-42a4-4a0c-a9ae-8efc06449b31', '270751ed-dae5-49ac-a719-b0200d082835', '12:31', 'Loss', 'Win', '3', '2025-04-05 04:19:25.126371+00'), ('e1336ca4-b7b1-49d9-8e03-6e5d36f6d176', 'df412b52-3763-4271-9611-731d3023308c', '14:31', 'Loss', 'Win', '1', '2025-02-22 07:47:16.307605+00'), ('e16c5382-3e92-4846-8b34-d0d8f5c4e88a', 'a5f7f9da-9249-44a3-9eec-31fea412f279', '18:02', 'Win', 'Loss', '4', '2025-04-13 04:03:29.13778+00'), ('f2662bd2-f913-469c-b6a1-ab0342ecdf05', '2b29c9c5-b7de-43c7-b5cb-3062b813fc54', '11:39', 'Loss', 'Win', '1', '2025-03-22 06:21:04.670845+00'), ('fa5ea9ed-f4f4-4358-9382-61b5b5e2da3f', '96bdcf93-2dcb-4b69-847d-5ea1ec0d5420', '24:10', 'Win', 'Loss', '2', '2025-03-01 04:42:49.411843+00'), ('fe6bd44b-fae5-4329-b5b1-261d124eceb1', 'a5f7f9da-9249-44a3-9eec-31fea412f279', '14:29', 'Loss', 'Win', '1', '2025-04-13 02:55:17.300498+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Step 3: Insert Valorant game data
-- ============================================================================
INSERT INTO _old_valo_games_migration ("id", "series_id", "map_id", "match_duration", "match_number", "team_a_status", "team_a_rounds", "team_b_status", "team_b_rounds", "created_at") VALUES ('0254c246-6382-43c3-8d28-33ee0d8d1822', '336f0d63-8f35-4dcc-96a8-1e6937e47c35', '6f7dafd3-8314-4b31-be28-64af5c874405', '38:45', '1', 'Win', '13', 'Loss', '5', '2025-02-16 08:49:27.947244+00'), ('06be28bc-e16d-48d7-a109-084e63da1c12', 'feadc155-1d43-46f8-bbd1-0ea7ae1b2955', '850c09b9-53ef-4dc9-a68b-1cdde3344d0e', '32:54', '2', 'Loss', '5', 'Win', '13', '2025-03-09 05:33:10.40992+00'), ('0beb6507-3590-4854-8c43-4100d84a8307', '336f0d63-8f35-4dcc-96a8-1e6937e47c35', '850c09b9-53ef-4dc9-a68b-1cdde3344d0e', '37:15', '2', 'Win', '13', 'Loss', '6', '2025-02-16 09:28:08.79452+00'), ('106e930e-3aa8-4410-85ed-ee930fc000bc', '75b17ed3-7f99-4fb5-b9ce-574a5909182e', '6f7dafd3-8314-4b31-be28-64af5c874405', '33:51', '2', 'Win', '13', 'Loss', '5', '2025-04-06 07:47:50.595599+00'), ('14a7df4e-5e05-48ff-93a3-0ac5f334b4a7', '4d88e8a8-9ed3-4b55-9de6-99f2bb27ceb1', 'df0aa279-5978-4880-9aba-bcce0f47bc1c', '49:19', '1', 'Loss', '12', 'Win', '14', '2025-03-02 09:21:40.417502+00'), ('18518786-1479-43db-977f-7ff126808975', '4e80f902-4407-4243-8063-04fbbc4e7dc3', 'a4a59961-2e1f-4215-8a23-95d4dcba0af0', '00:00', '1', 'Win', '13', 'Loss', '0', '2025-03-23 02:35:16.818653+00'), ('202db343-75a2-49ea-9a1d-ee125f37e3ff', 'eb9fe6bd-7b5e-4b15-8447-57d371168f31', '11cb7121-09ab-432f-9990-a9b7af4a2f99', '45:07', '2', 'Win', '13', 'Loss', '9', '2025-02-23 05:11:33.040695+00'), ('2bd796d8-8c64-448b-854d-c845f49d4ed1', 'ccb5dcb5-18cc-46ca-a335-a35cb71e1120', '850c09b9-53ef-4dc9-a68b-1cdde3344d0e', '34:24', '1', 'Win', '13', 'Loss', '5', '2025-02-09 11:20:16.085655+00'), ('2c995881-191b-4891-b2d8-b3cd2a13bd01', '0a113356-625c-4b28-a961-fce254bb930b', 'df0aa279-5978-4880-9aba-bcce0f47bc1c', '52:45', '1', 'Win', '13', 'Loss', '9', '2025-03-23 07:51:17.797093+00'), ('2ebe19e9-cea5-411a-8dc9-db61e4282181', 'fa663c18-c75a-4645-ae3b-7a6b7229be1b', 'dc54e13f-a71c-47e9-971e-56df4658655d', '23:26', '2', 'Loss', '2', 'Win', '13', '2025-01-29 03:37:52.481792+00'), ('3048f2d6-96d6-48a4-ab10-5828999b74b5', '649e1f48-2bf2-4b09-8314-eb8418182df6', 'a4a59961-2e1f-4215-8a23-95d4dcba0af0', '65:48', '1', 'Loss', '14', 'Win', '16', '2025-02-16 06:29:30.274458+00'), ('3771ae32-39c1-4710-9f38-9b954cfa38b0', 'eb9fe6bd-7b5e-4b15-8447-57d371168f31', '850c09b9-53ef-4dc9-a68b-1cdde3344d0e', '44:36', '1', 'Win', '13', 'Loss', '11', '2025-02-23 04:09:13.61162+00'), ('41e2967d-09c6-4f98-8fc1-899c6cf04346', 'e6320c46-4d2c-4104-a09d-d5d5133b075c', '6ae4304a-6d71-4973-9162-1af96529e06d', '28:39', '2', 'Loss', '3', 'Win', '13', '2025-03-16 07:18:07.226475+00'), ('43a298e3-e20f-40de-98ce-1784f37b5a46', '25f7ada4-61f3-4021-b0e0-9fc1f63b8905', 'df0aa279-5978-4880-9aba-bcce0f47bc1c', '53:11', '2', 'Win', '13', 'Loss', '8', '2025-03-30 08:36:37.465161+00'), ('44340265-5fc1-4749-a4e7-13920d12a2e9', '387cc4cd-f85d-4d1d-88a6-0255e482c45c', '850c09b9-53ef-4dc9-a68b-1cdde3344d0e', '24:49', '2', 'Loss', '4', 'Win', '13', '2025-03-09 07:18:36.594052+00'), ('46e126e4-6928-4940-80a0-c66dfc2c1952', '48db9ef9-b620-449b-8def-4eb3bf178266', '850c09b9-53ef-4dc9-a68b-1cdde3344d0e', '42:54', '1', 'Win', '13', 'Loss', '11', '2025-02-09 13:49:40.820857+00'), ('47fef763-2aa9-4cec-ba5a-cb317205b6de', 'd39f6575-0327-45c0-94ce-dff1a6acc2a9', 'a4a59961-2e1f-4215-8a23-95d4dcba0af0', '51:57', '1', 'Win', '14', 'Loss', '12', '2025-03-30 04:30:54.945454+00'), ('4839045a-aecd-4372-bf75-b02bb3be4ddb', '9f68f0ae-c0fd-492b-9452-c85665d8515b', '850c09b9-53ef-4dc9-a68b-1cdde3344d0e', '47:15', '1', 'Loss', '10', 'Win', '13', '2025-04-06 03:36:03.603305+00'), ('4bb361ed-f782-4540-b6f7-90171078da02', '942c708b-bc89-4fb0-8187-a9fd3636da7c', 'df0aa279-5978-4880-9aba-bcce0f47bc1c', '67:56', '2', 'Win', '16', 'Loss', '14', '2025-02-09 09:10:36.111614+00'), ('4bbc22df-5a8c-477b-a8a5-2a735bc8dbf2', '0167a304-ecb1-40e9-88e1-ef0cb83532a5', 'e90d9ba5-81f4-464a-b5ba-31b6a598bd8b', '45:40', '2', 'Win', '13', 'Loss', '9', '2025-02-23 10:12:32.764774+00'), ('518a564f-a012-4a27-b8b9-6cc510614096', '440011ad-b8c0-42e1-a3f9-2319f19da9d1', 'df0aa279-5978-4880-9aba-bcce0f47bc1c', '47:13', '1', 'Win', '13', 'Loss', '8', '2025-04-13 08:47:29.661059+00'), ('534ba92b-68e3-4874-9c64-7e81302fd14d', '4d88e8a8-9ed3-4b55-9de6-99f2bb27ceb1', 'a4a59961-2e1f-4215-8a23-95d4dcba0af0', '49:24', '2', 'Loss', '11', 'Win', '13', '2025-03-02 04:41:21.840488+00'), ('58ba4ea3-ae12-465e-9f7a-76713d496a92', 'ccb5dcb5-18cc-46ca-a335-a35cb71e1120', '6f7dafd3-8314-4b31-be28-64af5c874405', '31:00', '2', 'Win', '13', 'Loss', '2', '2025-02-09 12:35:08.552373+00'), ('5deec4d3-78ab-42cc-bc2e-ba9cf85e0340', '2a44f533-5574-4ed3-a10f-bfbea13b8a3c', 'df0aa279-5978-4880-9aba-bcce0f47bc1c', '23:32', '2', 'Win', '13', 'Loss', '1', '2025-02-23 07:14:06.323341+00'), ('617c7608-05b2-4d21-91a9-a1629fae280a', '9e80708c-70d0-4e87-9120-793b68f118d4', '6ae4304a-6d71-4973-9162-1af96529e06d', '37:34', '1', 'Win', '13', 'Loss', '5', '2025-03-16 03:34:51.416458+00'), ('6c0173aa-1bd2-44e2-a8e9-ad67e01dcbce', '02b88fa8-4ec0-4f2c-9a6a-a6ee14a51e11', 'e90d9ba5-81f4-464a-b5ba-31b6a598bd8b', '26:18', '2', 'Win', '13', 'Loss', '4', '2025-03-02 09:41:14.169054+00'), ('71f89af3-b0d2-492d-8c5f-56a04c479e05', '02b88fa8-4ec0-4f2c-9a6a-a6ee14a51e11', '11cb7121-09ab-432f-9990-a9b7af4a2f99', '21:38', '1', 'Win', '13', 'Loss', '0', '2025-03-02 09:35:24.266852+00'), ('77e5b229-e2e4-45ca-8a9d-fc92af35c7d0', '834c1b72-8ff4-4541-a216-2c06561f4f89', 'e90d9ba5-81f4-464a-b5ba-31b6a598bd8b', '33:45', '1', 'Win', '13', 'Loss', '4', '2025-03-23 08:51:45.694875+00'), ('782dd195-0175-4376-a497-a08bb5aae577', 'b495943f-f4bc-4b50-a705-39dab11463e0', '850c09b9-53ef-4dc9-a68b-1cdde3344d0e', '27:37', '1', 'Loss', '3', 'Win', '13', '2025-03-23 05:20:32.281611+00'), ('78599cf0-eeda-40b4-abd5-8515456243be', '649e1f48-2bf2-4b09-8314-eb8418182df6', '58707bba-8426-4b40-b7b4-796d3ad75021', '33:49', '2', 'Win', '13', 'Loss', '7', '2025-02-16 07:11:30.619445+00'), ('7b5aa5ef-77e9-46c3-ac3c-a774d65b2dbe', '74e62423-1a98-4603-99a8-c823b2aa69f9', 'df0aa279-5978-4880-9aba-bcce0f47bc1c', '46:00', '2', 'Win', '13', 'Loss', '11', '2025-02-16 04:24:33.411402+00'), ('7cf62a1b-6799-4ff7-be18-99476cad0840', 'fa663c18-c75a-4645-ae3b-7a6b7229be1b', '11cb7121-09ab-432f-9990-a9b7af4a2f99', '33:57', '1', 'Loss', '3', 'Win', '13', '2025-01-29 03:37:52.481792+00'), ('8144dfe4-696b-414a-ad5a-be5a39369b3f', '25f7ada4-61f3-4021-b0e0-9fc1f63b8905', '850c09b9-53ef-4dc9-a68b-1cdde3344d0e', '49:25', '3', 'Loss', '11', 'Win', '13', '2025-03-30 09:36:33.498839+00'), ('814c941c-0f14-4b53-980e-c840a7dba685', '475c906e-9fdc-4d65-8e77-a4c665c02206', '58707bba-8426-4b40-b7b4-796d3ad75021', '31:46', '1', 'Win', '13', 'Loss', '4', '2025-04-13 07:09:43.901477+00'), ('82d4d346-b92a-460b-b514-92e1a6a6ea93', '0167a304-ecb1-40e9-88e1-ef0cb83532a5', '6ae4304a-6d71-4973-9162-1af96529e06d', '56:25', '1', 'Loss', '13', 'Win', '15', '2025-02-23 08:59:11.449289+00'), ('8362e8cf-c4ba-45a2-82d8-2b025e8e08a0', '942c708b-bc89-4fb0-8187-a9fd3636da7c', '850c09b9-53ef-4dc9-a68b-1cdde3344d0e', '31:15', '1', 'Loss', '5', 'Win', '13', '2025-02-09 07:49:13.938345+00'), ('89617b9f-0002-4852-9ed6-c4c8a93de546', '74e62423-1a98-4603-99a8-c823b2aa69f9', 'e90d9ba5-81f4-464a-b5ba-31b6a598bd8b', '32:00', '1', 'Win', '13', 'Loss', '5', '2025-02-16 03:30:41.52782+00'), ('8eda60f4-074d-436d-aa6e-32b2190a5b75', 'e6320c46-4d2c-4104-a09d-d5d5133b075c', '58707bba-8426-4b40-b7b4-796d3ad75021', '45:36', '1', 'Loss', '5', 'Win', '13', '2025-03-16 06:21:25.533845+00'), ('98d3585c-79e2-4a84-a5bd-4526dfdd8766', '2a44f533-5574-4ed3-a10f-bfbea13b8a3c', '58707bba-8426-4b40-b7b4-796d3ad75021', '37:47', '1', 'Win', '13', 'Loss', '7', '2025-02-23 06:43:03.611859+00'), ('991380be-35aa-4cff-89a0-53f3ee47f0de', '75b17ed3-7f99-4fb5-b9ce-574a5909182e', '6ae4304a-6d71-4973-9162-1af96529e06d', '37:33', '1', 'Win', '13', 'Loss', '5', '2025-04-06 06:00:06.056996+00'), ('992d8680-6174-4368-ac99-e431bf4017ad', 'ae175668-de7c-4c33-8aa2-a20d40a20b3f', '58707bba-8426-4b40-b7b4-796d3ad75021', '30:04', '1', 'Loss', '3', 'Win', '13', '2025-03-23 06:54:57.24234+00'), ('9a71facd-527d-42f1-a0aa-738e64811aba', '9e80708c-70d0-4e87-9120-793b68f118d4', '11cb7121-09ab-432f-9990-a9b7af4a2f99', '32:51', '2', 'Win', '13', 'Loss', '5', '2025-03-16 04:16:29.702133+00'), ('a3cdaff3-265f-4fa0-8210-740f9e2c641b', 'c577d845-f702-498b-8c3d-a93ca91f1e33', '58707bba-8426-4b40-b7b4-796d3ad75021', '33:41', '2', 'Win', '13', 'Loss', '6', '2025-01-29 03:37:52.481792+00'), ('a555ab9f-386f-4768-b6a3-603520bfc0ce', '6ce5ca2c-cfc7-4e7d-9c1d-e7bfd920096a', 'df0aa279-5978-4880-9aba-bcce0f47bc1c', '38:10', '1', 'Loss', '4', 'Win', '13', '2025-02-07 07:09:03.038484+00'), ('ab18e387-a52f-4574-ba6e-a6696a79eb47', 'c577d845-f702-498b-8c3d-a93ca91f1e33', 'a4a59961-2e1f-4215-8a23-95d4dcba0af0', '29:43', '1', 'Win', '13', 'Loss', '4', '2025-01-29 03:37:52.481792+00'), ('ac7b2e99-96bb-4024-921c-0136b0911eb0', 'b544f4c4-9961-4c3e-80eb-ae2e095df8fe', '850c09b9-53ef-4dc9-a68b-1cdde3344d0e', '36:04', '2', 'Loss', '7', 'Win', '13', '2025-03-02 09:32:02.261319+00'), ('b28081df-2c58-4c13-a7e1-75a0216efe6e', 'ab8676b0-1c50-4df7-9248-b101906c785a', '850c09b9-53ef-4dc9-a68b-1cdde3344d0e', '29:47', '1', 'Loss', '3', 'Win', '13', '2025-04-13 04:20:15.678385+00'), ('b374723c-5b74-4aff-82bc-480343a1df54', '48db9ef9-b620-449b-8def-4eb3bf178266', 'a4a59961-2e1f-4215-8a23-95d4dcba0af0', '29:23', '2', 'Win', '13', 'Loss', '2', '2025-02-09 13:52:49.61462+00'), ('b6621448-c08a-4e19-b8c9-0f1f7b9f351b', '25f7ada4-61f3-4021-b0e0-9fc1f63b8905', '11cb7121-09ab-432f-9990-a9b7af4a2f99', '64:44', '1', 'Loss', '11', 'Win', '13', '2025-03-30 07:10:43.514332+00'), ('b6fd438f-b596-4774-8f7d-b6de124db17a', '5bd746f5-3c3d-4527-8ea8-5cefa430e758', 'a4a59961-2e1f-4215-8a23-95d4dcba0af0', '51:09', '1', 'Loss', '11', 'Win', '13', '2025-03-23 04:26:05.441785+00'), ('c1385627-896a-411d-8426-ae63253d5c48', 'b544f4c4-9961-4c3e-80eb-ae2e095df8fe', 'a4a59961-2e1f-4215-8a23-95d4dcba0af0', '43:29', '1', 'Loss', '10', 'Win', '13', '2025-03-02 09:28:49.472001+00'), ('cefa1315-71eb-4c45-9a96-fc24176f3c0f', 'feadc155-1d43-46f8-bbd1-0ea7ae1b2955', '11cb7121-09ab-432f-9990-a9b7af4a2f99', '39:28', '1', 'Loss', '8', 'Win', '13', '2025-03-09 04:29:30.582059+00'), ('d481ece3-a1fa-44e4-9633-c97e1c344530', '9f68f0ae-c0fd-492b-9452-c85665d8515b', 'a4a59961-2e1f-4215-8a23-95d4dcba0af0', '32:02', '2', 'Loss', '4', 'Win', '13', '2025-04-06 04:22:48.123698+00'), ('de176fb8-1c41-474c-8417-137de186b75b', '440011ad-b8c0-42e1-a3f9-2319f19da9d1', 'a4a59961-2e1f-4215-8a23-95d4dcba0af0', '37:42', '2', 'Win', '13', 'Loss', '6', '2025-04-13 09:55:03.943756+00'), ('e225bfc0-71d7-47cb-8a10-6d1c94c395bd', '387cc4cd-f85d-4d1d-88a6-0255e482c45c', 'e90d9ba5-81f4-464a-b5ba-31b6a598bd8b', '20:31', '1', 'Loss', '1', 'Win', '13', '2025-03-09 06:39:41.431463+00'), ('e4a78e43-878f-4f42-9989-338f1fb64572', 'ab8676b0-1c50-4df7-9248-b101906c785a', 'df0aa279-5978-4880-9aba-bcce0f47bc1c', '34:58', '2', 'Loss', '6', 'Win', '13', '2025-04-13 04:24:12.309332+00'), ('f0fdbb43-f05a-4a5c-98b3-5a1cc82cffe1', '475c906e-9fdc-4d65-8e77-a4c665c02206', '11cb7121-09ab-432f-9990-a9b7af4a2f99', '40:45', '2', 'Win', '13', 'Loss', '7', '2025-04-13 06:52:40.069239+00'), ('f28464af-7da7-4964-8527-7bf522c8a4c2', '6ce5ca2c-cfc7-4e7d-9c1d-e7bfd920096a', '11cb7121-09ab-432f-9990-a9b7af4a2f99', '27:32', '2', 'Loss', '3', 'Win', '13', '2025-02-12 00:00:33.748156+00'), ('fa07d65a-40dc-4332-8eed-faa3fd7ab9f6', 'f4de9b19-aa58-4333-9886-7682b8382e45', '11cb7121-09ab-432f-9990-a9b7af4a2f99', '30:33', '1', 'Win', '13', 'Loss', '3', '2025-01-29 03:37:52.481792+00'), ('ffdd5859-134f-4493-9b63-6ea718fc21ab', 'd39f6575-0327-45c0-94ce-dff1a6acc2a9', '58707bba-8426-4b40-b7b4-796d3ad75021', '32:12', '2', 'Win', '13', 'Loss', '6', '2025-03-30 05:08:54.26545+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Step 4: Migrate MLBB games to games table
-- ============================================================================
DO $$
DECLARE
  game_record RECORD;
  new_game_id INTEGER;
  new_match_id INTEGER;
BEGIN
  FOR game_record IN 
    SELECT * FROM _old_mlbb_games_migration
    ORDER BY series_id, match_number
  LOOP
    -- Get the new match_id from our mapping table
    SELECT m.new_match_id INTO new_match_id
    FROM _migration_series_to_matches m
    WHERE m.old_series_id = game_record.series_id;
    
    IF new_match_id IS NOT NULL THEN
      INSERT INTO games (
        match_id,
        game_number,
        duration,
        valorant_map_id,
        created_at,
        updated_at
      )
      VALUES (
        new_match_id,
        game_record.match_number,
        game_record.match_duration::interval,
        NULL, -- MLBB doesn't have maps
        game_record.created_at,
        NOW()
      )
      RETURNING id INTO new_game_id;
      
      -- Track the mapping with team status for game_scores
      INSERT INTO _migration_mlbb_games (old_game_id, old_series_id, new_game_id, team_a_status, team_b_status)
      VALUES (game_record.id, game_record.series_id, new_game_id, game_record.team_a_status, game_record.team_b_status);
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- Step 5: Migrate Valorant games to games table
-- ============================================================================
DO $$
DECLARE
  game_record RECORD;
  new_game_id INTEGER;
  new_match_id INTEGER;
  map_id_val INTEGER;
BEGIN
  FOR game_record IN 
    SELECT * FROM _old_valo_games_migration
    ORDER BY series_id, match_number
  LOOP
    -- Get the new match_id from our mapping table
    SELECT m.new_match_id INTO new_match_id
    FROM _migration_series_to_matches m
    WHERE m.old_series_id = game_record.series_id;
    
    -- Map old map_id UUID to new valorant_maps.id
    SELECT vm.id INTO map_id_val
    FROM valorant_maps vm
    WHERE vm.name = CASE game_record.map_id
      WHEN '6f7dafd3-8314-4b31-be28-64af5c874405' THEN 'Ascent'
      WHEN '850c09b9-53ef-4dc9-a68b-1cdde3344d0e' THEN 'Haven'
      WHEN 'df0aa279-5978-4880-9aba-bcce0f47bc1c' THEN 'Icebox'
      WHEN 'a4a59961-2e1f-4215-8a23-95d4dcba0af0' THEN 'Bind'
      WHEN '11cb7121-09ab-432f-9990-a9b7af4a2f99' THEN 'Split'
      WHEN 'e90d9ba5-81f4-464a-b5ba-31b6a598bd8b' THEN 'Breeze'
      WHEN '6ae4304a-6d71-4973-9162-1af96529e06d' THEN 'Pearl'
      WHEN '58707bba-8426-4b40-b7b4-796d3ad75021' THEN 'Lotus'
      WHEN 'dc54e13f-a71c-47e9-971e-56df4658655d' THEN 'Fracture'
      ELSE NULL
    END;
    
    IF new_match_id IS NOT NULL THEN
      INSERT INTO games (
        match_id,
        game_number,
        duration,
        valorant_map_id,
        created_at,
        updated_at
      )
      VALUES (
        new_match_id,
        game_record.match_number,
        game_record.match_duration::interval,
        map_id_val,
        game_record.created_at,
        NOW()
      )
      RETURNING id INTO new_game_id;
      
      -- Track the mapping with round scores for game_scores
      INSERT INTO _migration_valo_games (old_game_id, old_series_id, new_game_id, team_a_rounds, team_b_rounds)
      VALUES (game_record.id, game_record.series_id, new_game_id, game_record.team_a_rounds, game_record.team_b_rounds);
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- Step 6: Create game_scores for MLBB games
-- ============================================================================
DO $$
DECLARE
  game_record RECORD;
  participant_a_id INTEGER;
  participant_b_id INTEGER;
  team_a_score INTEGER;
  team_b_score INTEGER;
BEGIN
  FOR game_record IN 
    SELECT 
      mg.new_game_id,
      mg.old_series_id,
      mg.team_a_status,
      mg.team_b_status,
      os.team_a_id,
      os.team_b_id,
      os.platform_id
    FROM _migration_mlbb_games mg
    JOIN _old_series_migration os ON os.id = mg.old_series_id
  LOOP
    -- For MLBB: Win=1, Loss=0, Draw=0
    team_a_score := CASE game_record.team_a_status WHEN 'Win' THEN 1 ELSE 0 END;
    team_b_score := CASE game_record.team_b_status WHEN 'Win' THEN 1 ELSE 0 END;
    
    -- Get match participant for Team A
    SELECT mp.id INTO participant_a_id
    FROM match_participants mp
    JOIN games g ON g.match_id = mp.match_id
    JOIN schools_teams st ON st.id = mp.team_id
    WHERE g.id = game_record.new_game_id
      AND st.school_id = game_record.team_a_id
      AND st.esport_category_id = 1 -- MLBB
    LIMIT 1;
    
    -- Get match participant for Team B
    SELECT mp.id INTO participant_b_id
    FROM match_participants mp
    JOIN games g ON g.match_id = mp.match_id
    JOIN schools_teams st ON st.id = mp.team_id
    WHERE g.id = game_record.new_game_id
      AND st.school_id = game_record.team_b_id
      AND st.esport_category_id = 1 -- MLBB
    LIMIT 1;
    
    -- Insert scores
    IF participant_a_id IS NOT NULL THEN
      INSERT INTO game_scores (game_id, match_participant_id, score, created_at, updated_at)
      VALUES (game_record.new_game_id, participant_a_id, team_a_score, NOW(), NOW())
      ON CONFLICT DO NOTHING;
    END IF;
    
    IF participant_b_id IS NOT NULL THEN
      INSERT INTO game_scores (game_id, match_participant_id, score, created_at, updated_at)
      VALUES (game_record.new_game_id, participant_b_id, team_b_score, NOW(), NOW())
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- Step 7: Create game_scores for Valorant games
-- ============================================================================
DO $$
DECLARE
  game_record RECORD;
  participant_a_id INTEGER;
  participant_b_id INTEGER;
BEGIN
  FOR game_record IN 
    SELECT 
      vg.new_game_id,
      vg.old_series_id,
      vg.team_a_rounds,
      vg.team_b_rounds,
      os.team_a_id,
      os.team_b_id,
      os.platform_id
    FROM _migration_valo_games vg
    JOIN _old_series_migration os ON os.id = vg.old_series_id
  LOOP
    -- Get match participant for Team A
    SELECT mp.id INTO participant_a_id
    FROM match_participants mp
    JOIN games g ON g.match_id = mp.match_id
    JOIN schools_teams st ON st.id = mp.team_id
    WHERE g.id = game_record.new_game_id
      AND st.school_id = game_record.team_a_id
      AND st.esport_category_id = 2 -- Valorant
    LIMIT 1;
    
    -- Get match participant for Team B
    SELECT mp.id INTO participant_b_id
    FROM match_participants mp
    JOIN games g ON g.match_id = mp.match_id
    JOIN schools_teams st ON st.id = mp.team_id
    WHERE g.id = game_record.new_game_id
      AND st.school_id = game_record.team_b_id
      AND st.esport_category_id = 2 -- Valorant
    LIMIT 1;
    
    -- Insert scores (rounds for Valorant)
    IF participant_a_id IS NOT NULL THEN
      INSERT INTO game_scores (game_id, match_participant_id, score, created_at, updated_at)
      VALUES (game_record.new_game_id, participant_a_id, game_record.team_a_rounds, NOW(), NOW())
      ON CONFLICT DO NOTHING;
    END IF;
    
    IF participant_b_id IS NOT NULL THEN
      INSERT INTO game_scores (game_id, match_participant_id, score, created_at, updated_at)
      VALUES (game_record.new_game_id, participant_b_id, game_record.team_b_rounds, NOW(), NOW())
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- Step 8: Verification
-- ============================================================================
SELECT 'Games migrated:' as info, COUNT(*) as count FROM games;
SELECT 'Game scores created:' as info, COUNT(*) as count FROM game_scores;

-- Sample verification
SELECT 
  g.id as game_id,
  m.name as match_name,
  g.game_number,
  g.duration,
  vm.name as map_name,
  e.abbreviation as esport
FROM games g
JOIN matches m ON m.id = g.match_id
JOIN esports_seasons_stages ess ON ess.id = m.stage_id
JOIN esports_categories ec ON ec.id = ess.esport_category_id
JOIN esports e ON e.id = ec.esport_id
LEFT JOIN valorant_maps vm ON vm.id = g.valorant_map_id
ORDER BY g.created_at DESC
LIMIT 10;

-- ============================================================================
-- Cleanup (optional - uncomment after verifying)
-- ============================================================================
-- DROP TABLE IF EXISTS _migration_mlbb_games;
-- DROP TABLE IF EXISTS _migration_valo_games;
-- DROP TABLE IF EXISTS _old_mlbb_games_migration;
-- DROP TABLE IF EXISTS _old_valo_games_migration;
