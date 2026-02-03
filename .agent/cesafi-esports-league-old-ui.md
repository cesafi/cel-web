# Key UI Features: Schedule & Statistics

This document outlines the core user interface capabilities and features available in the Schedule and Statistics sections of the application.

## 📅 Schedule Page

The Schedule page is designed for easy navigation through match history and upcoming games, featuring intuitive time-based controls and platform filtering.

### 1. Navigation & Content Control
- **Sticky Date Header**: A persistent header remains visible while scrolling, displaying the currently viewed date (Month, Day, Year) and Day of the Week.
- **Date Navigation Controls**:
    - **Previous/Next Arrows**: Quickly jump tom yesterday's or tomorrow's matches.
    - **"Today" Button**: One-click action to snap the view back to the current date.
- **Infinite Scroll / Virtualized List**: The schedule allows smooth scrolling through a timeline of matches without needing to paginate manually.

### 2. Filtering
- **Platform Filter**: A dropdown menu allows users to filter matches by Game Platform (e.g., **All Games**, **MLBB**, **Valorant**).
    - When a specific platform is selected, the schedule only displays series relevant to that game.

### 3. Match Display
- **Grouped by Date**: Matches are logically grouped under their respective dates.
- **Series Details**: Displays teams involved, and likely the status or score of the series (handled by `SeriesGroup` component).

---

## 📊 Statistics Page

The Statistics page provides a deep dive into player and team performance, offering granular filtering and sorting capabilities to analyze data across different games and seasons.

### 1. Multi-Level Filtering
The sidebar (or top bar on mobile) offers a robust set of filters to narrow down the dataset:
- **Game Platform**: Toggle between **MLBB** and **Valorant** datasets.
- **Team**: Filter detailed statistics to show only players from a specific team.
- **Season Type**: Filter by season categories (e.g., Regular Season, Playoffs).
- **Season Number**: Drill down to specific season iterations.
- **League Stage**: Further refine by stage (e.g., Group Stage, Finals).
- **"Apply Filter" Action**: Changes are batched and applied only when the user explicitly clicks "Apply Filter", preventing unnecessary re-renders while adjusting settings.

### 2. Interactive Data Table
The centerpiece is a responsive data table that adapts based on the selected Game Platform.

#### **Common Features**
- **Sortable Columns**: Clicking on any column header (e.g., Games Played, KDA, MVP) sorts the table in Ascending or Descending order. Visual arrows indicate the current sort direction.
- **Player Identity**: Shows Player Name, Team Logo, and Team Abbreviation.

#### **Platform-Specific Metrics**

**🎮 Mobile Legends: Bang Bang (MLBB)**
| Metric | Description |
| :--- | :--- |
| **HERO** | The hero played most frequently or specific to the stat row. |
| **GMS** | Games Played. |
| **MVP** | Total MVPs earned. |
| **R** | Rating / Score. |
| **KPG / DPG / APG** | Kills / Deaths / Assists per Game. |
| **GLD** | Total Gold (or Gold per minute). |
| **HDMG** | Hero Damage. |
| **TDMG** | Turret Damage. |
| **DMGT** | Damage Taken. |
| **TF%** | Teamfight Participation Percentage. |
| **K / D / A** | Total Kills, Deaths, and Assists. |
| **LS / TS** | Longest Spree / Triple Spree (or similar kill streaks). |

**🔫 Valorant**
| Metric | Description |
| :--- | :--- |
| **AGENT** | The agent played. |
| **GMS / RNDS** | Games / Rounds Played. |
| **MVP** | Total MVPs. |
| **ACS** | Average Combat Score. |
| **KPG / DPG / APG** | Kills / Deaths / Assists per Game. |
| **KPR / DPR / APR** | Kills / Deaths / Assists per Round. |
| **K / D / A** | Total Kills, Deaths, and Assists. |
| **FB** | First Bloods. |
| **PL / DF** | Plants / Defuses. |

### 3. Responsiveness & Design
- **Adaptive Layouts**:
    - The table automatically adjusts for different screen sizes. On smaller devices (mobile), less critical columns may be hidden or layouts simplified to maintain readability.
    - **Header & Controls**: Buttons and dropdowns resize or stack appropriately for touch interfaces.
- **Visual Feedback**:
    - **Loading States**: Clear indicators appear while data is being fetched or when filters are applied.
    - **Hover Effects**: Rows and interactive elements have hover states to guide user interaction.
