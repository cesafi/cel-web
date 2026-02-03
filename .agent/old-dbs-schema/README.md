# Old Database Schema Data

This directory contains SQL INSERT statements extracted from the old CESAFI Esports database.
These files are used as source data for migration to the new schema.

## Files

| File | Description | Row Count |
|------|-------------|-----------|
| `series_rows.sql` | Match series (series = match in new schema) | ~130 |
| `teams_rows.sql` | Team records (now split into schools + schools_teams) | 11 |
| `players_rows.sql` | Player roster data | ~200 |
| `league_schedule_rows.sql` | Season/stage schedule info | 9 |
| `valorant_matches_rows.sql` | Individual Valorant games | - |
| `mlbb_matches_rows.sql` | Individual MLBB games | - |
| `valorant_matches_player_stats_rows.sql` | Valorant player statistics | - |
| `mlbb_matches_player_stats_rows.sql` | MLBB player statistics | - |
| `game_platforms_rows.sql` | Game/esport definitions | 2 |
| `game_characters_rows.sql` | Hero/agent character data | - |
| `player_league_schedules_rows.sql` | Player-schedule associations | - |

## Platform ID Reference

- **MLBB**: `b91cc567-c7f4-4363-a01d-20f27b6af88e`
- **Valorant**: `959e30c2-22f1-4a48-b56c-27c2fd2d87a1`

## Migration Scripts

See `.agent/migrations/` for the SQL migration scripts that transform this data.
