# Quick Reference: Export API

## Unified Hub Endpoint

**Base URL:** `/api/export/hub`

**Format:** `/api/export/hub?title={export-name}&{additional-params}`

## Available Exports

| Title | Description | Example URL |
|-------|-------------|-------------|
| `draft` | Draft CSV export | `/api/export/hub?title=draft` |
| `game-results` | Game results CSV | `/api/export/hub?title=game-results` |
| `character-stats` | Hero/Agent statistics | `/api/export/hub?title=character-stats&game=mlbb&seasonId=5` |
| `player-leaderboard` | Top players | `/api/export/hub?title=player-leaderboard&game=mlbb&metric=total_kills&limit=10` |
| `player-stats` | Player statistics | `/api/export/hub?title=player-stats&game=mlbb&seasonId=5` |
| `team-stats` | Team statistics | `/api/export/hub?title=team-stats&game=mlbb&seasonId=5` |
| `map-stats` | Map statistics | `/api/export/hub?title=map-stats&game=mlbb&seasonId=5` |
| `h2h-players` | Player head-to-head | `/api/export/hub?title=h2h-players&game=mlbb&playerA=1&playerB=2` |
| `h2h-teams` | Team head-to-head | `/api/export/hub?title=h2h-teams&game=mlbb&teamA=1&teamB=2` |
| `standings` | Standings export | `/api/export/hub?title=standings` |
| `standings-data` | Standings data | `/api/export/hub?title=standings-data` |
| `match-overview` | Match overview | `/api/export/hub?title=match-overview&matchId=123` |
| `valorant-map-veto` | Valorant veto | `/api/export/hub?title=valorant-map-veto` |
| `filters` | Available filters | `/api/export/hub?title=filters` |

## Common Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `game` | Game type | `mlbb` or `valorant` |
| `seasonId` | Season ID | `5` |
| `stageId` | Stage ID | `10` |
| `division` | Division | `A` or `B` |
| `metric` | Metric to sort by | `total_kills`, `avg_acs` |
| `limit` | Number of results | `5`, `10` |
| `teamId` | Team ID | `123` |
| `matchId` | Match ID | `456` |
| `gameId` | Game ID | `789` |
| `format` | Response format | `json`, `vmix` |

## Direct API Access (Without Hub)

You can also call export APIs directly:

```
/api/export/characters/stats?game=mlbb&seasonId=5
/api/export/players/leaderboard?game=valorant&metric=avg_acs&limit=10
/api/export/teams/stats?game=mlbb&seasonId=5&division=A
/api/export/head-to-head/players?game=mlbb&playerA=1&playerB=2
/api/export/filters?format=json
```

## vMix Setup

### Method 1: Hub Endpoint (Recommended)
```
URL: http://localhost:3000/api/export/hub
Query: ?title=character-stats&game=mlbb&seasonId=5
```

### Method 2: Direct API
```
URL: http://localhost:3000/api/export/characters/stats
Query: ?game=mlbb&seasonId=5
```

## Parameter Priority

1. **URL Parameters** (highest) - Override everything
2. **Database `game_id`/`match_id`** - Medium priority
3. **Database `query_params`** - Lowest priority (defaults)

## Examples

### MLBB Character Stats
```
/api/export/hub?title=character-stats&game=mlbb&seasonId=5
```

### Valorant Top 10 by ACS
```
/api/export/hub?title=player-leaderboard&game=valorant&metric=avg_acs&limit=10
```

### Team Stats with Division Filter
```
/api/export/hub?title=team-stats&game=mlbb&seasonId=5&division=A
```

### Draft (Uses Database game_id)
```
/api/export/hub?title=draft
```

### Override Database game_id
```
/api/export/hub?title=draft&gameId=999
```

## Response Formats

### JSON (Default)
```json
{
  "success": true,
  "data": [...]
}
```

### vMix Format
Add `?format=vmix` to get vMix-compatible XML/CSV output.

## Database Configuration

Set defaults in `active_api_exports` table:

```sql
UPDATE active_api_exports 
SET 
  game_id = 123,
  query_params = '{"game": "mlbb", "seasonId": 5}'::jsonb
WHERE title = 'character-stats';
```

Then use:
```
/api/export/hub?title=character-stats
```

This will automatically use `game_id=123` and the query params from the database.
