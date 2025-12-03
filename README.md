# Wife App

Simple task management for couples and families. Stop nagging. Start tracking.

## Features

- **PWA Capture Interface** - Stakeholders can capture tasks via voice or text from anywhere
- **Accountability View** - Track task progress, time since assigned, completion status
- **Full Kanban Workflow** - 6 columns (Backlog, To Do, Doing, In Review, Blocked, Done) with swimlanes and WIP limits
- **Role-Based Auth** - CREATOR and STAKEHOLDER roles
- **Offline-First** - Works without internet, syncs when online

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication
AUTH_SECRET=your-auth-secret-here
```

Generate `AUTH_SECRET`:
```bash
openssl rand -base64 32
```

## Database Setup

The database schema is managed with Prisma. After setting up your database:

1. Run the initial migration SQL script in Supabase SQL Editor:
   - `prisma/migrations/init_wife_app.sql`

2. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
