# Daily Routine Tracker

A web application that helps users manage their daily weekday routine, track their adherence to the schedule, and view weekly performance metrics.

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

## License

MIT
