# CESAFI Esports League - Project Plan & Architecture

## 1. Overview

**Project Summary:**
The **CESAFI Esports League** platform is a specialized web application designed to manage and showcase the inter-school esports competitions of CESAFI. It focuses on **Mobile Legends: Bang Bang (MLBB)** and **Valorant**. The platform will facilitate tournament management, data tracking, and audience engagement through a modern, esports-centric interface.

**Key Differences from Old CESAFI Sports:**

- **Game-Centric Logic:** Instead of generic sports matches, the system is built around esports "Matches" (Series) and "Games" (Individual Maps/Rounds).
- **Esports Statistics:** tailored data models for MOBA (MLBB) and FPS (Valorant) specific metrics (KDA, CSM, ACS, Headshot %).
- **Interactive Veto System:** A real-time or turn-based map veto feature for Valorant match setup.
- **Hero/Agent Database:** Management of game characters (Heroes/Agents) for statistical analysis.

**High-Level Architecture:**

- **Frontend:** Next.js (App Router) with Tailwind CSS & Shadcn UI.
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions, Realtime).
- **Storage:** Supabase Storage (Player photos, Team logos, Article images).
- **Realtime:** Supabase Realtime for live match updates and Veto system synchronization.

## 2. Feature List

### Core Features

- **Authentication:** Email/Password implementation restricted to Admin/School Representatives/Writers. Public access for viewing.
- **Admin Dashboard:** Central hub for data entry (matches, results, schedule) and content scheduling.
- **Standings & Leaderboards:**
  - Team Standings (W-L, Points, Game Diff).
  - Player Stats Leaderboards (Top Killer, Top Assist, Highest ACS).
- **Tournaments & Seasons:** Support for multiple seasons/splits.

### Esports Specifics

- **Valorant Module:**
  - Map Veto System (Ban/Pick UI).
  - Agent Select tracking.
  - Detailed Match Stats (Map score, Round history).
- **MLBB Module:**
  - Hero Pick/Ban tracking.
  - Gold/XP graphing (Time-series data if live-data integration is possible, otherwise manual post-match summary).

### Content & Engagement

- **Articles & News:** Rich text editor for match recaps and announcements.
- **Live Match Ticker:** "Live Now" banner for active games.
- **School Pages:** Profiles for participating schools/universities.

## 3. User Roles & Permissions

| Role                | Permissions                                                          |
| :------------------ | :------------------------------------------------------------------- |
| **Guest**           | Read-only access to all public pages (Standings, Matches, Articles). |
| **Writer**          | Create/Edit Articles. Upload images for articles.                    |
| **Head Writer**     | Approve/Publish Articles. Manage Writer team.                        |
| **League Operator** | Manage Matches, Enter Scores, Manage Teams/Players, Run Vetoes.      |
| **Admin**           | Full System Access (Manage Users, System Settings, Season rollover). |

## 4. Database Schema (Supabase)

### Core Tables

#### `profiles`

- `id` (uuid, pk, references auth.users)
- `role` (enum: admin, operator, head_writer, writer)
- `full_name` (text)

#### `schools`

- `id` (uuid, pk)
- `name` (text)
- `short_name` (text)
- `logo_url` (text)

#### `teams`

- `id` (uuid, pk)
- `school_id` (uuid, fk)
- `name` (text)
- `game_type` (enum: 'mlbb', 'valorant')
- `logo_url` (text)
- `season_id` (uuid, fk)

#### `players`

- `id` (uuid, pk)
- `team_id` (uuid, fk)
- `ign` (text) - In-Game Name
- `real_name` (text)
- `role` (text) - e.g., 'Jungler', 'Duelist'
- `photo_url` (text)

### Match System

#### `matches` (The Series)

- `id` (uuid, pk)
- `team_a_id` (uuid, fk)
- `team_b_id` (uuid, fk)
- `start_time` (timestamp)
- `status` (enum: scheduled, live, finished)
- `format` (enum: bo1, bo3, bo5)
- `winner_id` (uuid, fk, nullable)
- `score_team_a` (int)
- `score_team_b` (int)
- `round_type` (enum: group, playoffs, finals)

#### `games` (Individual Maps/Rounds)

- `id` (uuid, pk)
- `match_id` (uuid, fk)
- `game_number` (int)
- `map_name` (text) - Nullable for MLBB
- `duration_seconds` (int)
- `winner_id` (uuid, fk)
- `mvp_player_id` (uuid, fk)

### Esports Stats Tables

#### `stats_valorant_game_player`

- `id` (uuid, pk)
- `game_id` (uuid, fk)
- `player_id` (uuid, fk)
- `agent_name` (text)
- `acs` (int)
- `kills` (int)
- `deaths` (int)
- `assists` (int)
- `adr` (float)
- `headshot_percent` (float)
- `first_bloods` (int)

#### `stats_mlbb_game_player`

- `id` (uuid, pk)
- `game_id` (uuid, fk)
- `player_id` (uuid, fk)
- `hero_name` (text)
- `kills` (int)
- `deaths` (int)
- `assists` (int)
- `gold` (int)
- `gpm` (int)
- `xp` (int)
- `xpm` (int)
- `damage_dealt` (int)
- `damage_taken` (int)
- `turret_damage` (int)

#### `valorant_map_vetoes`

- `id` (uuid, pk)
- `match_id` (uuid, fk)
- `team_id` (uuid, fk)
- `map_name` (text)
- `action` (enum: pick, ban, remain)
- `sequence_order` (int)

## 5. API Endpoints (Next.js Server Actions / Supabase SDK)

Access will primarily be via the Supabase Client (RLS protected), but helper actions will exist for complex logic.

### **Match Management**

- `GET /api/matches?game=valorant&status=live`
- `POST /api/matches` (Admin: Create Match)
- `PUT /api/matches/:id/result` (Admin: Update Score)

### **Veto System (Realtime)**

- `POST /api/veto/:match_id/action`
  - Body: `{ teamId, mapName, action: 'BAN' | 'PICK' }`
- `GET /api/veto/:match_id/state`

### **Statistics**

- `GET /api/stats/leaderboard/mlbb/kills`
- `GET /api/stats/leaderboard/valorant/acs`

## 6. UI/UX Pages & Components

### Public Pages

- **/ (Home):** Hero carousel (Latest news), Live Match Cards, Standings Preview.
- **/schedule:** Calendar view of upcoming matches. Filter by game.
- **/standings:** Split view (MLBB / Valorant).
- **/teams:** Grid of team cards. Click to view roster + past results.
- **/players:** Searchable directory of players.
- **/matches/[id]:**
  - **Overview:** Score, Stream Embed (YouTube/Twitch).
  - **Stats:** Tabbed table for Game 1, Game 2, etc.
  - **Veto:** (Valorant) Visual display of picked/banned maps.

### Admin Dashboard (`/admin`)

- **/admin/cms/articles:** Article Editor.
- **/admin/league/matches:** List view with "Edit Result" and "Launch Veto" buttons.
- **/admin/league/teams:** Roster management.

### Valorant Map Veto Page (`/veto/[match_id]`)

- **Visuals:** Large map cards.
- **State:** "Team A's Turn to BAN".
- **Interaction:** Captains click to Ban/Pick.
- **Realtime:** Updates instantly for observers.

## 7. Esports Statistics Requirements

### MLBB (Mobile Legends)

- **KDA**: (Kills + Assists) / Deaths
- **GPM (Gold Per Minute)**: Indicator of farming efficiency.
- **XPM (XP Per Minute)**: Leveling speed.
- **DPM (Damage Per Minute)** or Total Damage.
- **Team Fight Participation (KP%)**: (Player K + A) / Team Total Kills.
- **Objective Control**: Turtle/Lord kills (usually team stat).

### Valorant

- **ACS (Average Combat Score)**: The ultimate metric for impact.
- **K/D/A**: Standard FPS stats.
- **ADR (Average Damage per Round)**: Consistent damage output.
- **HS% (Headshot Percentage)**: Mechanical aim precision.
- **KAST**: % of rounds with Kill, Assist, Survive, or Trade.
- **First Bloods (FK)**: Opening duel wins.
- **Plants/Defuses**: Objective play.

## 8. Valorant Map Vetoing Workflow

**Logic:**

1.  **Coin Flip:** Determine Team A (starts) vs Team B.
2.  **Phase 1 (Ban):**
    - Team A Bans Map 1
    - Team B Bans Map 2
3.  **Phase 2 (Pick):**
    - Team A Picks Map 3 (played first)
    - Team B Picks Map 4 (played second)
4.  **Phase 3 (Ban/Decider):**
    - Team A Bans Map 5
    - Team B Bans Map 6
    - _Existing Map 7 is the Decider (played third)_

**UI Flow:**

- Secure Link sent to Team Captains.
- Timer (30s) per turn.
- Maps greyscale when banned, Highlighted when picked.

## 9. Admin Workflow

- **Match Setup:** Admin creates match -> Generates Veto Link -> Sends to teams.
- **Post-Match:** Admin inputs stats manually (copy-paste from screenshot or API import) or confirms automatic data if integrated.
- **Result Verification:** "Publish" button to make results public.

## 10. Migration Plan

1.  **Backup:** Export old Supabase data.
2.  **Init:** New Supabase project `cesafi-esports`.
3.  **Refactor Schema:** Run SQL migrations for new tables.
4.  **Seed:** Import Schools and generic data.
5.  **Accounts:** Create Admin/Writer accounts manually.

## 11. Realtime & Notifications

- Use **Supabase Realtime** on the `matches` table to update the "Live Score" on the homepage without refreshing.
- Use **Realtime** on `valorant_map_veto` table for the picking screen.

## 12. Security & Policies

- **RLS (Row Level Security):**
  - public: `SELECT` on all matches, stats, articles.
  - admin: `ALL` access.
  - writers: `INSERT/UPDATE` on articles only.
- **API:**
  - `veto` endpoints require a secret token or captain authentication.

## 13. Testing & QA

- **Unit:** Test Veto logic calculation (does the sequence move to the next team correctly?).
- **E2E:** Playwright test simulating a full Match lifecycle (Create -> Veto -> Score input -> Leaderboard update).
- **Manual:** Check responsive design on Mobile for Standings tables (scrollable views).

---

### Summary Checklist

- [ ] Database Schema SQL Script
- [ ] Next.js Project Init matching new design
- [ ] Auth Setup (Roles)
- [ ] Map Veto Component (Interactive)
- [ ] Stats Entry Forms (Complex)
- [ ] Public Leaderboard Pages
