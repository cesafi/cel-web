# Data Migration Overview

This document outlines the migration strategy for transferring data from the old CESAFI Esports database schema to the new schema.

## Schema Mapping

### Old Schema → New Schema

| Old Table | New Table(s) | Notes |
|-----------|--------------|-------|
| `teams` | `schools`, `schools_teams` | Teams need to be split into separate school and team records |
| `players` | `players`, `player_seasons` | Players are linked to teams via seasons |
| `series` | `matches`, `match_participants` | Each series becomes a match with two participants |
| `league_schedule` | `esports_seasons_stages` | Season stages with competition phases |
| `valorant_matches` | `games` | Individual games within a match |
| `mlbb_matches` | `games` | Individual games within a match |
| `valorant_matches_player_stats` | `stats_valorant_game_player` | Player stats per game |
| `mlbb_matches_player_stats` | `stats_mlbb_game_player` | Player stats per game |
| `game_platforms` | `esports` | Games are now "esports" |
| `game_characters` | `game_characters` | Already migrated |

### Platform/Esport ID Mapping

| Old ID | Game | New esport_id |
|--------|------|---------------|
| `959e30c2-22f1-4a48-b56c-27c2fd2d87a1` | Valorant | 1 (assumed) |
| `b91cc567-c7f4-4363-a01d-20f27b6af88e` | MLBB | 2 (assumed) |

## Migration Order

1. **Schools** - Base entity, no dependencies
2. **Esports** - Base entity, no dependencies (if not exists)
3. **Seasons** - Base entity, created from league_schedule
4. **Esports Categories** - Depends on esports
5. **Esports Seasons Stages** - Depends on esports_categories and seasons
6. **Schools Teams** - Depends on schools, esport_categories, seasons
7. **Players** - Depends on schools_teams
8. **Player Seasons** - Depends on players, seasons, schools_teams
9. **Matches** - Depends on esports_seasons_stages
10. **Match Participants** - Depends on matches, schools_teams
11. **Games** - Depends on matches
12. **Game Scores** - Depends on games, match_participants
13. **Stats (Valorant/MLBB)** - Depends on games, players

## Key Transformations

### Series → Matches
- `series.id` → preserves as reference in comment
- `series.best_of` derived from `series_type` (BO1, BO2, BO3, BO5)
- `series.start_time` → `matches.scheduled_at`
- `series.status` → `matches.status` (map Finished→completed, Ongoing→live)

### Team Scores
- `team_a_score` and `team_b_score` → `match_participants.match_score`

### Individual Games
- `valorant_matches` and `mlbb_matches` → `games`
- `match_number` → `game_number`
- `match_duration` → `duration`

## Notes

- All UUIDs from old system will need to be mapped to new IDs
- Some data may not have direct counterparts (e.g., `week` field)
- Player roles from old schema are stored as arrays in `roles` column
