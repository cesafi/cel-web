# Liga Republika GFX Dashboard - Site Summary

## Overview

The **Liga Republika GFX Dashboard** is a specialized broadcast graphics management system designed for esports tournaments. It specifically supports **League of Legends (LoL)** and **Honor of Kings (HoK)**, providing production teams with real-time control over on-stream visuals.

The application serves as a central hub for managing tournament data, including match summaries, player statistics, and live pick/ban (draft) phases, ensuring that broadcast graphics are accurate, up-to-date, and visually consistent.

## Key Features

### 🎮 Multi-Game Support

- Dedicated dashboards for **League of Legends** and **Honor of Kings**.
- Game-specific data structures and asset management.

### ⚔️ Real-Time Draft Manager

- **Live Updates**: Controls the pick and ban phase graphics in real-time.
- **Champion/Hero Selection**: interfaces for selecting champions/heroes for each team.
- **Broadcast Synchronization**: Automatically updates connected broadcast sources.

### 📊 Match & Statistics Management

- **Match Summary**: Track and display post-match results and key moments.
- **Player Stats**: Monitor performance metrics such as K/D/A, gold, and damage.
- **Champion Statistics**: Analyze pick rates, ban rates, and win rates across the tournament.

### 🛠️ Production Tools

- **Export Controls**: Functionality to export data or graphical assets for external use.
- **Theme Management**: Dark/Light mode support and potential team-specific theming.
- **Responsive Design**: Fully functional on desktop and tablet/mobile for on-the-go production adjustments.

## How We Made It (Technology Stack)

This project is built using a modern, type-safe web stack focused on performance and developer experience.

### Core Framework

- **[Next.js 15](https://nextjs.org/)**: Utilizing the **App Router** for robust routing, server-side rendering, and API handling.
- **[TypeScript](https://www.typescriptlang.org/)**: Ensures type safety and code reliability throughout the application.

### UI & Styling

- **[Tailwind CSS v4](https://tailwindcss.com/)**: Utility-first CSS framework for rapid and consistent styling.
- **[Radix UI](https://www.radix-ui.com/)**: Headless UI primitives powering the component library (via **shadcn/ui** patterns) for accessible and customizable interactive elements.
- **[Framer Motion](https://www.framer.com/motion/)**: Handles complex animations and transitions for a polished user experience.
- **[Lucide React](https://lucide.dev/)**: Provides a consistent and clean icon set.

### Backend & Data

- **[Firebase](https://firebase.google.com/)**:
  - **Authentication**: Secure user login and access control.
  - **Firestore**: Real-time NoSQL database for syncing draft states and match data instantly across clients.
- **[TanStack Query (React Query)](https://tanstack.com/query/latest)**: Manages server state, caching, and data synchronization on the client side.

### Forms & Validation

- **[React Hook Form](https://react-hook-form.com/)**: Efficient form management for data entry.
- **[Zod](https://zod.dev/)**: Schema validation to ensure data integrity for inputs and API responses.

### Testing & Quality

- **[Vitest](https://vitest.dev/)**: Fast unit and integration testing framework.
- **[React Testing Library](https://testing-library.com/)**: Testing UI components in a way that resembles user interaction.

## Project Structure

The architecture follows a modular Next.js App Router layout:

- **`src/app`**: Contains the route definitions, including the main dashboard, authentication flows, and API endpoints.
- **`src/components`**: Houses reusable UI components (`/ui`) and feature-specific blocks (Draft, Header, Sidebar).
- **`src/lib`**: Utility functions, Firebase service configuration, and data contexts.
- **`.kiro`**: Specifications for the Kiro IDE integration.
