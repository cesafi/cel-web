# Export API Unified Approach

## Overview
All production/export APIs are now under `/api/export/*` for consistency. We use a single unified hub endpoint that accepts URL parameters to control filtering and options.

## Current Approach (Draft & Game Results)
- Each export has its own route: `/api/export/draft`, `/api/export/game-results`
- Uses `active_api_exports` table to store which `game_id` is active
- Admin UI updates the `game_id` in the database

## New Unified Approach

### 1. Database Schema (Current)
```sql
active_api_exports (
  id SERIAL PRIMARY KEY,
  title TEXT UNIQUE,
  game_id INTEGER,
  match_id INTEGER,
  base_url TEXT,
  query_params JSONB
)
```

### 2. Single Export Hub Endpoint
**URL:** `/api/export/hub?title={export-name}&{additional-params}`

**Examples:**
```
# Character stats for MLBB, Season 5
/api/export/hub?title=character-stats&game=mlbb&seasonId=5

# Player leaderboard for Valorant, top 10 by ACS
/api/export/hub?title=player-leaderboard&game=valorant&metric=avg_acs&limit=10

# Team stats with division filter
/api/export/hub?title=team-stats&game=mlbb&seasonId=5&division=A

# Standings (uses stored match_id from database)
/api/export/hub?title=standings
```

### 3. Consistent URL Structure

All export APIs now follow the same pattern:

```
/api/export/characters/stats
/api/export/players/leaderboard
/api/export/players/stats
/api/export/teams/stats
/api/export/maps/stats
/api/export/head-to-head/players
/api/export/head-to-head/teams
/api/export/standings
/api/export/standings-data
/api/export/matches/[matchId]
/api/export/filters
/api/export/draft
/api/export/game-results
/api/export/valorant-map-veto
```

### 4. How It Works

1. **Title Parameter**: Identifies which export configuration to use
2. **Database Values**: Provides default `game_id` or `match_id` if stored
3. **URL Parameters**: Override or add to the query (e.g., `seasonId`, `game`, `metric`)
4. **Priority**: URL params > Database params

### 5. Benefits

✅ **Consistent**: All exports under `/api/export/*`
✅ **Flexible**: Change filters without database updates
✅ **Simple**: One hub endpoint instead of 10+
✅ **Backward Compatible**: Still supports `game_id`/`match_id` from database
✅ **Production-Friendly**: vMix can easily change parameters in the URL
✅ **No Code Changes**: Add new filters by just updating the URL

### 6. Migration Path

**Option A: Keep Current Schema (Simpler)**
- Run `sql-insert-active-api-exports.sql` to populate the table
- Use `/api/export/hub` for new exports
- Keep `/api/export/draft` and `/api/export/game-results` as-is

**Option B: Enhanced Schema (More Flexible)**
- Run `sql-migration-active-api-exports.sql` to add `base_url` and `query_params` columns
- Store default parameters in JSONB format
- Allows storing complex default configurations

## Usage in Production Hub (vMix)

### Before (Multiple Endpoints)
```
Draft: http://localhost:3000/api/export/draft
Stats: http://localhost:3000/api/production/character-stats
Leaderboard: http://localhost:3000/api/production/player-leaderboard
```

### After (Single Hub Endpoint)
```
Draft: http://localhost:3000/api/export/hub?title=draft
Character Stats: http://localhost:3000/api/export/hub?title=character-stats&game=mlbb&seasonId=5
Leaderboard: http://localhost:3000/api/export/hub?title=player-leaderboard&game=valorant&limit=10
```

### Dynamic Switching
Change from MLBB to Valorant by just updating the URL:
```
# MLBB
?title=character-stats&game=mlbb&seasonId=5

# Valorant (just change the game param)
?title=character-stats&game=valorant&seasonId=5
```

## Admin UI Updates Needed

1. Add a dropdown to select which export to configure
2. Show relevant filters based on the export type
3. Allow setting default `game_id`/`match_id` in database
4. Display the generated URL for copying to vMix

## Recommendation

I recommend **Option B** (enhanced schema with JSONB) because:
- More flexible for storing default configurations
- Can store complex query parameters
- URL parameters still override everything
- Future-proof for additional metadata
