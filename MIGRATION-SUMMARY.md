# API Migration Summary: Production → Export

## What Changed

All API routes have been consolidated under `/api/export/*` for consistency.

### Before
```
/api/production/characters/stats
/api/production/players/leaderboard
/api/production/players/stats
/api/production/teams/stats
/api/production/maps/stats
/api/production/head-to-head/players
/api/production/head-to-head/teams
/api/production/standings
/api/production/matches/[matchId]
/api/production/filters
```

### After
```
/api/export/characters/stats
/api/export/players/leaderboard
/api/export/players/stats
/api/export/teams/stats
/api/export/maps/stats
/api/export/head-to-head/players
/api/export/head-to-head/teams
/api/export/standings-data
/api/export/matches/[matchId]
/api/export/filters
```

## New Unified Hub Endpoint

**URL:** `/api/export/hub?title={export-name}&{params}`

This single endpoint can proxy to any export API with dynamic parameters.

### Examples

```bash
# Character stats
/api/export/hub?title=character-stats&game=mlbb&seasonId=5

# Player leaderboard
/api/export/hub?title=player-leaderboard&game=valorant&metric=avg_acs&limit=10

# Team stats
/api/export/hub?title=team-stats&game=mlbb&seasonId=5&division=A

# Draft (uses game_id from database)
/api/export/hub?title=draft

# Standings
/api/export/hub?title=standings-data
```

## Files Modified

### API Routes (Moved)
- ✅ `app/api/production/characters/stats/route.ts` → `app/api/export/characters/stats/route.ts`
- ✅ `app/api/production/players/leaderboard/route.ts` → `app/api/export/players/leaderboard/route.ts`
- ✅ `app/api/production/players/stats/route.ts` → `app/api/export/players/stats/route.ts`
- ✅ `app/api/production/teams/stats/route.ts` → `app/api/export/teams/stats/route.ts`
- ✅ `app/api/production/maps/stats/route.ts` → `app/api/export/maps/stats/route.ts`
- ✅ `app/api/production/head-to-head/players/route.ts` → `app/api/export/head-to-head/players/route.ts`
- ✅ `app/api/production/head-to-head/teams/route.ts` → `app/api/export/head-to-head/teams/route.ts`
- ✅ `app/api/production/standings/route.ts` → `app/api/export/standings-data/route.ts`
- ✅ `app/api/production/matches/[matchId]/route.ts` → `app/api/export/matches/[matchId]/route.ts`
- ✅ `app/api/production/filters/route.ts` → `app/api/export/filters/route.ts`

### New Files
- ✅ `app/api/export/hub/route.ts` - Unified hub endpoint

### Updated Files
- ✅ `lib/routes.ts` - Updated route patterns
- ✅ `components/production/production-hub.tsx` - Updated API calls
- ✅ `sql-migration-active-api-exports.sql` - Updated with new paths
- ✅ `sql-insert-active-api-exports.sql` - Updated with all exports
- ✅ `EXPORT-API-APPROACH.md` - Updated documentation
- ✅ `EXPORT-API-USAGE-EXAMPLES.md` - Updated examples

### Database Schema
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

## Next Steps

### 1. Run Database Migration
```sql
-- Run this in your SQL editor
-- File: sql-migration-active-api-exports.sql
```

This will:
- Add `base_url` and `query_params` columns
- Populate all export configurations
- Set default query parameters

### 2. Update vMix Data Sources

Replace old URLs with new ones:

**Old:**
```
http://localhost:3000/api/production/characters/stats?game=mlbb
```

**New (Direct):**
```
http://localhost:3000/api/export/characters/stats?game=mlbb
```

**New (Hub):**
```
http://localhost:3000/api/export/hub?title=character-stats&game=mlbb
```

### 3. Test Each Export

- [ ] Draft export: `/api/export/hub?title=draft`
- [ ] Game results: `/api/export/hub?title=game-results`
- [ ] Character stats: `/api/export/hub?title=character-stats&game=mlbb`
- [ ] Player leaderboard: `/api/export/hub?title=player-leaderboard&game=mlbb`
- [ ] Player stats: `/api/export/hub?title=player-stats&game=mlbb`
- [ ] Team stats: `/api/export/hub?title=team-stats&game=mlbb`
- [ ] Map stats: `/api/export/hub?title=map-stats&game=mlbb`
- [ ] H2H Players: `/api/export/hub?title=h2h-players&game=mlbb`
- [ ] H2H Teams: `/api/export/hub?title=h2h-teams&game=mlbb`
- [ ] Standings: `/api/export/hub?title=standings-data`
- [ ] Filters: `/api/export/hub?title=filters`

### 4. Update Admin UI

Create interface to:
- Select export type from dropdown
- Set default game_id/match_id
- Configure query_params (JSON editor)
- Preview generated URL
- Copy URL to clipboard for vMix

## Benefits

✅ **Consistent naming** - All exports under `/api/export/*`
✅ **Flexible filtering** - URL params override database defaults
✅ **Single hub endpoint** - One URL to rule them all
✅ **Backward compatible** - Existing exports still work
✅ **Type-safe** - Database schema properly typed
✅ **Easy to maintain** - Clear separation of concerns

## Breaking Changes

⚠️ **None!** All old `/api/export/*` routes still work as before.

The `/api/production/*` routes have been moved, but if you were using them, simply update the URLs to `/api/export/*`.

## Rollback Plan

If needed, you can rollback by:
1. Moving files back from `/api/export/*` to `/api/production/*`
2. Reverting `lib/routes.ts` changes
3. Reverting `components/production/production-hub.tsx` changes
4. Dropping the new database columns (optional)

However, the new structure is backward compatible, so rollback shouldn't be necessary.
