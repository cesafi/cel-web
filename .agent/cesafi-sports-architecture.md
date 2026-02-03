# Project Architecture

## Overview
This project is a modern web application built with **Next.js 16 (App Router)**, designed for high performance and type safety. It leverages **Supabase** for the backend (database & auth) and **Tailwind CSS v4** for styling.

## 1. Technology Stack

### Core
-   **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
-   **Language**: TypeScript
-   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + CSS Modules (globals.css)
-   **State Management**: [TanStack Query (React Query)](https://tanstack.com/query/latest) & React Server Components

### Backend & Data
-   **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
-   **Authentication**: Supabase Auth (SSR)
-   **ORM/Querying**: Supabase JS Client (`@supabase/supabase-js`)
-   **Validation**: Zod (Schema validation)

### UI Components
-   **Primitives**: [Radix UI](https://www.radix-ui.com/)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Forms**: React Hook Form + Zod resolvers
-   **Animations**: Framer Motion

---

## 2. Directory Structure

The project follows a clean architecture separating concerns between UI, Business Logic, and Data Access.

```
src/
├── actions/        # Server Actions (Controller Layer)
│   └── matches.ts  # Wraps services, handling validation & revalidation
├── app/            # Next.js App Router (UI Layer)
│   ├── (auth)/     # Authentication routes (Login, Signup)
│   ├── (protected)/# Protected routes (Admin Dashboard)
│   ├── (public)/   # Public routes (Landing, Schedule)
│   ├── api/        # Route Handlers (for edge cases / webhooks)
│   └── layout.tsx  # Root layout with Providers
├── components/     # React Components
│   └── ui/         # Reusable primitives (buttons, inputs)
├── hooks/          # Custom React Hooks
├── lib/            # Shared Utilities & Configurations
│   ├── supabase/   # Supabase Client Handlers (Client/Server)
│   ├── types/      # TypeScript Definitions
│   └── utils/      # Helper functions
├── services/       # Business Logic & Data Access (Model Layer)
│   └── matches.ts  # Core logic, DB queries
└── styles/         # Global styles
```

---

## 3. Data Architecture Layers

The application uses a **Service-Repository** pattern adapted for Next.js Server Actions.

### Layer 1: UI Components (Client/Server)
The entry point. Components trigger data fetching or mutations.
-   **Fetching**: Server Components call **Actions** or **Services** directly. Client Components use `useQuery` which calls **Actions**.
-   **Mutations**: Forms trigger Server Actions.

### Layer 2: Server Actions (`src/actions`)
Acts as the **Controller** or **API Gateway**.
-   **Role**: Validates input, handles auth checks (implicitly via service), triggers revalidation.
-   **Tech**: `'use server'` directive.
-   **Example**:
    ```typescript
    // src/actions/matches.ts
    'use server';
    export async function createMatch(data: unknown) {
      const parsed = createMatchSchema.parse(data); // Validation
      const result = await MatchService.insert(parsed); // Call Service
      if (result.success) revalidateMatches(); // Cache handling
      return result;
    }
    ```

### Layer 3: Service Layer (`src/services`)
Acts as the **Model** and **Business Logic**.
-   **Role**: Contains the core logic, database queries, and data transformations.
-   **Tech**: Static classes extending `BaseService`.
-   **Example**:
    ```typescript
    // src/services/matches.ts
    export class MatchService extends BaseService {
      static async insert(data: MatchInsert) {
        const supabase = await this.getClient();
        // logic (e.g. conflict checks)
        return supabase.from('matches').insert(data)...
      }
    }
    ```

### Layer 4: Data Access & Infrastructure
-   **Supabase Client** (`src/lib/supabase`):
    -   `client.ts`: Uses `createBrowserClient` for client-side usage.
    -   `server.ts`: Uses `createServerClient` with cookie handling for SSR/Server Actions.
-   **BaseService**: Abstract class managing client instantiation (detects server vs client environment automatically).

---

## 4. Key Configurations

-   **Authentication**: Handled via Supabase middleware and SSR helpers.
-   **Caching/Revalidation**: Next.js `revalidatePath` and `revalidateTag` are used within Actions after successful mutations.
-   **Environment Variables**: Managed in `.env.local` (e.g., `NEXT_PUBLIC_SUPABASE_URL`).
