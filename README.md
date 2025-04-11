# Daily Routine App

A task management application for daily routines.

## Fixes Applied

To fix the issues with data schema synchronization and type safety:

1. Updated all API routes to use the newer `@supabase/ssr` approach with `createClient()` instead of the deprecated `createRouteHandlerClient`.

2. Improved TypeScript interfaces in `src/types/index.ts` with proper documentation and nullable types.

3. Fixed API routes to properly use typed data structures.

4. Created database migration files to ensure schema consistency:
   - `migrations/fix_task_completions.sql`: Ensures required columns exist
   - `migrations/fix_database_schema.sql`: Comprehensive schema fixes for all tables

## To Apply Database Changes

Run the following SQL migrations in your Supabase database:

1. Apply the migrations in the `migrations` folder through the Supabase SQL editor.

2. Restart your application.

## Development

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Type Safety

The application now has full type safety between frontend and backend through:

1. Shared TypeScript interfaces in `src/types/index.ts`
2. Properly typed database operations
3. Consistent naming conventions

## Features

- Display daily routines with customizable time slots
- Task completion tracking
- Weekly performance metrics with visual charts
- User authentication via Supabase
- Dark/light theme support
- Mobile-responsive design

## Tech Stack

- **Frontend & Backend**: Next.js with App Router
- **Database ORM**: Prisma
- **Database & Authentication**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS
- **Data Visualization**: Chart.js
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- A Supabase account and project

### Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/daily-routine.git
cd daily-routine
```

2. Install dependencies:

```bash
npm install
# or
yarn
```

3. Set up your Supabase project:

   - Create a new project on [Supabase](https://supabase.com)
   - Get your project URL and anon key from the project settings
   - Enable Email/Password authentication in Auth settings

4. Configure environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase URL, anon key, and database connection string

```bash
cp .env.example .env.local
```

5. Push the Prisma schema to your database:

```bash
npx prisma db push
```

6. Start the development server:

```bash
npm run dev
# or
yarn dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Default Routine

New users start with the following default routine:

- 12 AM to 8 AM: Sleep
- 8 AM to 10 AM: Morning & Breakfast
- 10 AM to 12 PM: Work 1
- 12 PM to 2 PM: Gym
- 2 PM to 3 PM: Lunch
- 3 PM to 5 PM: Work 2
- 5 PM to 6 PM: Break
- 6 PM to 8 PM: Work 3
- 8 PM to 12 AM: Dinner & Rest

## Deployment

The app can be easily deployed on Vercel:

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Set up the environment variables in the Vercel project settings
4. Deploy

## Database Schema

- **User**: Stores user information linked to Supabase Auth
- **Routine**: Stores the user's daily routine tasks
- **TaskCompletion**: Tracks task completion status for specific days

## Database Schema Synchronization

To ensure your hosted database schema matches the local schema, follow these steps:

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the complete synchronization script from `migrations/complete_db_sync.sql`

This script will:

- Create all required tables if they don't exist
- Adjust column types to match TypeScript interfaces
- Set up required constraints
- Configure proper row-level security policies
- Set up necessary triggers

After running the migration, restart your application. The database schema will now match your local types and the application should function without type mismatches.

## Schema Overview

The schema uses the following structure:

```
- routines
  - id: UUID (PK)
  - user_id: UUID (FK to auth.users)
  - task_name: TEXT
  - start_time: TEXT
  - end_time: TEXT
  - created_at: TIMESTAMP WITH TIME ZONE
  - updated_at: TIMESTAMP WITH TIME ZONE

- routine_schedules
  - id: UUID (PK)
  - user_id: UUID (FK to auth.users)
  - routine_id: UUID (FK to routines)
  - day_of_week: INTEGER (0-6)
  - created_at: TIMESTAMP WITH TIME ZONE
  - updated_at: TIMESTAMP WITH TIME ZONE

- task_completions
  - id: UUID (PK)
  - user_id: UUID (FK to auth.users)
  - routine_id: UUID (FK to routines)
  - date: DATE
  - completed: BOOLEAN
  - actual_start_time: TIMESTAMP WITH TIME ZONE (nullable)
  - actual_end_time: TIMESTAMP WITH TIME ZONE (nullable)
  - created_at: TIMESTAMP WITH TIME ZONE
```

## License

MIT
