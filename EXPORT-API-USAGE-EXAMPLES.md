# Export API Usage Examples

## Database Schema ✅

The `active_api_exports` table now has:
- `id` - Primary key
- `title` - Unique identifier for the export
- `game_id` - Optional: For game-specific exports (draft, game-results)
- `match_id` - Optional: For match-specific exports
- `base_url` - The API route path (can include `[gameId]` or `[matchId]` placeholders)
- `query_params` - JSONB object with default query parameters

## Consistent URL Structure

All export APIs are now under `/api/export/*`:

```
/api/export/hub                      (unified hub endpoint)
/api/export/characters/stats         (hero/agent statistics)
/api/export/players/leaderboard      (top players)
/api/export/players/stats            (player statistics)
/api/export/teams/stats              (team statistics)
/api/export/maps/stats               (map statistics)
/api/export/head-to-head/players     (player H2H)
/api/export/head-to-head/teams       (team H2H)
/api/export/standings                (standings export)
/api/export/standings-data           (standings data)
/api/export/matches/[matchId]        (match overview)
/api/export/filters                  (available filters)
/api/export/draft                    (draft CSV)
/api/export/game-results             (game results CSV)
/api/export/valorant-map-veto        (veto data)
```

## Parameter Priority (Highest to Lowest)

1. **URL Parameters** (highest priority) - Override everything
2. **Database `game_id`/`match_id`** - Medium priority
3. **Database `query_params`** - Lowest priority (defaults)

## Usage Examples

### 1. Draft Export
```
Database:
  title: 'draft'
  base_url: '/api/games/draft/[gameId]'
  game_id: 123
  query_params: {}

URL: /api/export/hub?title=draft
Result: Fetches /api/games/draft/123

URL: /api/export/hub?title=draft&gameId=456
Result: Fetches /api/games/draft/456 (URL overrides database)
```

### 2. Character Stats
```
Database:
  title: 'character-stats'
  base_url: '/api/export/characters/stats'
  query_params: {"game": "mlbb"}

URL: /api/export/hub?title=character-stats
Result: /api/export/characters/stats?game=mlbb

URL: /api/export/hub?title=character-stats&seasonId=5
Result: /api/export/characters/stats?game=mlbb&seasonId=5

URL: /api/export/hub?title=character-stats&game=valorant&seasonId=5
Result: /api/export/characters/stats?game=valorant&seasonId=5
(URL param overrides database default)
```

### 3. Player Leaderboard
```
Database:
  title: 'player-leaderboard'
  base_url: '/api/export/players/leaderboard'
  query_params: {"game": "mlbb", "metric": "total_kills", "limit": 5}

URL: /api/export/hub?title=player-leaderboard
Result: /api/export/players/leaderboard?game=mlbb&metric=total_kills&limit=5

URL: /api/export/hub?title=player-leaderboard&limit=10
Result: /api/export/players/leaderboard?game=mlbb&metric=total_kills&limit=10

URL: /api/export/hub?title=player-leaderboard&game=valorant&metric=avg_acs&limit=10
Result: /api/export/players/leaderboard?game=valorant&metric=avg_acs&limit=10
```

### 4. Team Stats with Filters
```
Database:
  title: 'team-stats'
  base_url: '/api/export/teams/stats'
  query_params: {"game": "mlbb"}

URL: /api/export/hub?title=team-stats&seasonId=5&division=A
Result: /api/export/teams/stats?game=mlbb&seasonId=5&division=A
```

## vMix Integration

### Setup in vMix Data Source

**Base URL:** `http://localhost:3000/api/export/hub`

**Query String Templates:**

1. **Draft (Current Game)**
   ```
   ?title=draft
   ```

2. **Character Stats (Dynamic)**
   ```
   ?title=character-stats&game={game}&seasonId={seasonId}
   ```
   Where `{game}` and `{seasonId}` are vMix variables

3. **Leaderboard (Top 5 Kills)**
   ```
   ?title=player-leaderboard&game=mlbb&metric=total_kills&limit=5
   ```

4. **Leaderboard (Top 10 ACS - Valorant)**
   ```
   ?title=player-leaderboard&game=valorant&metric=avg_acs&limit=10
   ```

### Switching Between Games

Instead of changing the endpoint, just change the `game` parameter:

**MLBB:**
```
/api/export/hub?title=character-stats&game=mlbb&seasonId=5
```

**Valorant:**
```
/api/export/hub?title=character-stats&game=valorant&seasonId=5
```

## Direct API Access (Without Hub)

You can also call the export APIs directly:

```
# Direct character stats
/api/export/characters/stats?game=mlbb&seasonId=5

# Direct player leaderboard
/api/export/players/leaderboard?game=valorant&metric=avg_acs&limit=10

# Direct team stats
/api/export/teams/stats?game=mlbb&seasonId=5&division=A
```

## Admin UI Workflow

1. **Select Export Type** (dropdown with all titles)
2. **Set Default Game/Match** (if applicable)
   - For draft: Select game from dropdown
   - For match-overview: Select match from dropdown
3. **Configure Default Query Params** (JSON editor)
   ```json
   {
     "game": "mlbb",
     "seasonId": 5,
     "division": "A"
   }
   ```
4. **Preview Generated URL**
   ```
   http://localhost:3000/api/export/hub?title=character-stats&game=mlbb&seasonId=5&division=A
   ```
5. **Copy to vMix**

## Benefits

✅ **Consistent URLs** - All under `/api/export/*`
✅ **One hub endpoint** - `/api/export/hub`
✅ **Flexible filtering** - Add any query param without code changes
✅ **Database defaults** - Set common params once
✅ **URL overrides** - Change params on-the-fly in vMix
✅ **Backward compatible** - Existing draft/game-results still work
✅ **Type-safe** - Database schema is properly typed
✅ **Direct access** - Can bypass hub if needed

## Migration Checklist

- [x] Move all `/api/production/*` to `/api/export/*`
- [x] Rename `/api/export/production` to `/api/export/hub`
- [x] Update SQL migration scripts
- [x] Update documentation
- [ ] Update admin UI to manage exports
- [ ] Test each export type
- [ ] Update vMix data sources
- [ ] Document for production team
