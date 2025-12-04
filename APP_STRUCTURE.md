# Wife App - Complete Structure Documentation

## Overview

**Wife App** is a task management application designed for couples and families. It provides a simple way to capture, track, and manage tasks with role-based access control. The app is built as a Progressive Web App (PWA) with native mobile support via Capacitor.

**Key Features:**
- PWA Capture Interface for quick task entry
- Full Kanban workflow with 6 columns (Backlog, To Do, Doing, In Review, Blocked, Done)
- Role-based authentication (CREATOR and WIFE roles)
- Accountability view for tracking task progress
- Offline-first architecture with Supabase sync
- Native iOS and Android support via Capacitor

---

## Technology Stack

### Core Framework
- **Next.js 16.0.1** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5** - Type safety

### Backend & Database
- **Supabase** - Backend-as-a-Service (PostgreSQL database, Edge Functions, Auth)
- **Prisma 6.19.0** - Database ORM and schema management
- **PostgreSQL** - Primary database

### Mobile
- **Capacitor 7.4.4** - Native mobile runtime
  - `@capacitor/core`
  - `@capacitor/ios`
  - `@capacitor/android`

### UI & Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **Lucide React** - Icon library
- **@hello-pangea/dnd** - Drag and drop for Kanban boards
- **class-variance-authority** - Component variant management
- **clsx** - Conditional class names

### Authentication & Security
- **bcryptjs** - Password hashing
- **Supabase Auth** - Authentication system

### Development Tools
- **ESLint** - Code linting
- **React Compiler** - React optimization
- **tsx** - TypeScript execution

---

## Project Structure

```
wife/
├── android/                    # Android native project
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/
│   ├── build.gradle
│   └── gradle/
├── ios/                        # iOS native project
│   └── App/
│       ├── App.xcodeproj/
│       ├── App.xcworkspace/
│       ├── App/
│       │   ├── AppDelegate.swift
│       │   ├── Info.plist
│       │   └── Assets.xcassets/
│       └── Podfile
├── src/                        # Application source code
│   ├── app/                    # Next.js App Router pages
│   │   ├── (app)/              # Protected app routes
│   │   │   ├── account/
│   │   │   ├── capture/
│   │   │   ├── inbox/
│   │   │   ├── workflow/
│   │   │   └── page.tsx        # Dashboard/home
│   │   ├── login/              # Authentication pages
│   │   │   ├── creator/
│   │   │   ├── stakeholder/
│   │   │   └── wife/
│   │   ├── pwa/                # PWA-specific routes
│   │   │   ├── capture/
│   │   │   └── password/
│   │   ├── layout.tsx          # Root layout
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   │   ├── accountability-view.tsx
│   │   ├── AuthGuard.tsx
│   │   ├── capture-composer.tsx
│   │   ├── password-form.tsx
│   │   ├── providers.tsx
│   │   ├── pwa-capture-content.tsx
│   │   └── sidebar.tsx
│   ├── contexts/               # React contexts
│   │   └── AuthContext.tsx     # Authentication state
│   ├── hooks/                  # Custom React hooks
│   │   └── useItems.ts         # Item management hook
│   ├── lib/                    # Utility libraries
│   │   ├── prisma.ts           # Prisma client instance
│   │   ├── supabase.ts         # Supabase client instance
│   │   └── utils.ts            # Utility functions
│   └── types/                  # TypeScript type definitions
├── prisma/                     # Database schema and migrations
│   ├── schema.prisma           # Prisma schema definition
│   ├── migrations/             # Database migration files
│   └── seed.ts                 # Database seeding script
├── supabase/                   # Supabase configuration
│   └── functions/              # Edge Functions
│       ├── login/
│       └── change-password/
├── public/                     # Static assets
│   ├── manifest.json           # PWA manifest
│   ├── favicon files
│   └── icons/
├── scripts/                    # Build and utility scripts
│   ├── generate-all-icons.js
│   └── generate-og-image.js
├── out/                        # Static export output (for Capacitor)
├── capacitor.config.ts         # Capacitor configuration
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies and scripts
└── README.md                   # Project documentation
```

---

## Application Architecture

### Frontend Architecture

#### Routing Structure (Next.js App Router)

**Protected Routes (`/app/(app)/`):**
- `/` - Dashboard/home page
- `/account` - User account management
- `/capture` - Task capture interface
- `/inbox` - Inbox view for new items
- `/workflow` - Full Kanban workflow board

**Authentication Routes (`/app/login/`):**
- `/login` - Main login page
- `/login/creator` - Creator-specific login
- `/login/stakeholder` - Stakeholder login
- `/login/wife` - Wife-specific login

**PWA Routes (`/app/pwa/`):**
- `/pwa/capture` - PWA capture interface
- `/pwa/password` - Password entry for PWA

#### Component Architecture

**Core Components:**
- `AuthGuard.tsx` - Route protection wrapper
- `providers.tsx` - React context providers (Auth, etc.)
- `sidebar.tsx` - Navigation sidebar
- `capture-composer.tsx` - Task creation form
- `accountability-view.tsx` - Task accountability tracking
- `pwa-capture-content.tsx` - PWA-specific capture UI
- `password-form.tsx` - Password input component

#### State Management

**Contexts:**
- `AuthContext` - Manages user authentication state
  - User session
  - Login/logout functions
  - Loading states

**Custom Hooks:**
- `useItems` - Item management hook
  - Fetches items from Supabase
  - Supports filtering by status and capturedBy
  - Provides create, update, delete functions
  - Real-time updates via Supabase subscriptions

---

## Database Schema

### Models

#### User
```prisma
- id: String (CUID)
- name: String (unique)
- password: String (hashed)
- role: Role (CREATOR | WIFE)
- createdAt: DateTime
```

**Relations:**
- `items` - Items created by user
- `capturedItems` - Items captured by user
- `statusChanges` - Status changes made by user

#### Item
```prisma
- id: String (CUID)
- humanId: String (unique, CUID)
- title: String
- rawInstructions: Text
- notes: Text (optional)
- type: ItemType (TASK | INFO)
- status: ItemStatus
- priority: Priority (HIGH | MEDIUM | LOW)
- swimlane: Swimlane (EXPEDITE | PROJECT | HABIT | HOME)
- labels: String[]
- routingNotes: Text (optional)
- order: Int (optional, for manual ordering)

// Timestamps
- createdAt: DateTime
- updatedAt: DateTime
- statusChangedAt: DateTime
- lastProgressAt: DateTime (optional)
- startedAt: DateTime (optional)
- completedAt: DateTime (optional)
- blockedAt: DateTime (optional)

// Metrics
- totalTimeInCreate: Int (minutes in DOING)
- cycleCount: Int (times returned to TODO from DOING)

// Relations
- createdByUserId: String
- capturedByUserId: String (optional)
```

**Indexes:**
- `[status, statusChangedAt]` - Freshness queries
- `[createdByUserId, createdAt]` - User's items
- `[swimlane, priority]` - Kanban queries
- `[capturedByUserId, createdAt]` - Captured items
- `[status, swimlane, order]` - Manual ordering

#### StatusChange
```prisma
- id: String (CUID)
- itemId: String
- fromStatus: ItemStatus (optional, null for creation)
- toStatus: ItemStatus
- changedAt: DateTime
- changedById: String (optional)
- reason: String (optional)
- duration: Int (optional, minutes in previous status)
```

#### Rule
```prisma
- id: String (CUID)
- ruleKey: String (unique)
- ruleValue: String
- description: String (optional)
- isActive: Boolean
- createdAt: DateTime
```

#### SystemMessage
```prisma
- id: String (CUID)
- ruleKey: String
- message: String
- severity: Severity (ERROR | WARNING | INFO | SUCCESS)
- createdAt: DateTime
```

### Enums

**Role:**
- `CREATOR` - Primary user who manages tasks
- `WIFE` - Secondary user who captures tasks

**ItemType:**
- `TASK` - Actionable task
- `INFO` - Informational item

**ItemStatus:**
- `INBOX` - Newly captured items
- `BACKLOG` - Planned but not started
- `TODO` - Ready to start
- `DOING` - Currently in progress
- `IN_REVIEW` - Awaiting review
- `BLOCKED` - Blocked by dependencies
- `DONE` - Completed
- `ARCHIVE` - Archived

**Priority:**
- `HIGH`
- `MEDIUM`
- `LOW`

**Swimlane:**
- `EXPEDITE` - Urgent items
- `PROJECT` - Regular projects
- `HABIT` - Recurring tasks
- `HOME` - Home-related tasks

**Severity:**
- `ERROR`
- `WARNING`
- `INFO`
- `SUCCESS`

---

## Backend Architecture

### Supabase Integration

**Client Configuration:**
- Located in `src/lib/supabase.ts`
- Uses environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Edge Functions:**
- `login` - User authentication
- `change-password` - Password management

### Prisma Integration

**Client Configuration:**
- Located in `src/lib/prisma.ts`
- Singleton pattern for development
- Uses `DATABASE_URL` environment variable

**Schema Management:**
- Schema defined in `prisma/schema.prisma`
- Migrations in `prisma/migrations/`
- Seed script: `prisma/seed.ts`

---

## Mobile Configuration

### Capacitor Setup

**Configuration (`capacitor.config.ts`):**
```typescript
- appId: 'com.wifeapp.mobile'
- appName: 'Wife App'
- webDir: 'out'  // Next.js static export directory
```

**Platforms:**
- **iOS**: Native Xcode project in `ios/App/`
- **Android**: Native Gradle project in `android/app/`

**Build Process:**
1. Next.js builds static export to `out/`
2. Capacitor syncs `out/` to native projects
3. Native projects build and deploy

---

## Build & Development

### Scripts (`package.json`)

```bash
npm run dev      # Start Next.js development server
npm run build    # Build for production (Prisma + Next.js)
npm run start    # Start production server
npm run lint     # Run ESLint
npm run seed     # Seed database
```

### Build Process

1. **Prisma Generation**: `prisma generate` (runs on postinstall)
2. **Next.js Build**: `next build` (static export for Capacitor)
3. **Capacitor Sync**: `npx cap sync` (syncs web assets to native)

### Environment Variables

**Required:**
```bash
DATABASE_URL=postgresql://...
AUTH_SECRET=...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_BASE_URL=https://...
```

---

## Key Features Implementation

### 1. PWA Capture Interface

**Location:** `src/app/pwa/capture/page.tsx`

- Standalone PWA interface for quick task capture
- Voice or text input
- Minimal UI for fast access
- Password-protected entry

### 2. Kanban Workflow

**Location:** `src/app/(app)/workflow/page.tsx`

- 6-column board: Backlog, To Do, Doing, In Review, Blocked, Done
- Drag-and-drop using `@hello-pangea/dnd`
- Swimlane organization (Expedite, Project, Habit, Home)
- WIP limits per column
- Manual ordering support

### 3. Accountability View

**Location:** `src/components/accountability-view.tsx`

- Tracks task progress over time
- Shows time since assignment
- Completion status tracking
- Progress metrics

### 4. Role-Based Authentication

**Implementation:**
- `AuthContext` manages user state
- `AuthGuard` protects routes
- Role-based UI rendering
- Supabase Edge Functions for auth

**Roles:**
- **CREATOR**: Full access, manages workflow
- **WIFE**: Can capture tasks, view assigned items

### 5. Offline-First Architecture

- Supabase real-time subscriptions
- Local state management
- Sync when online
- PWA capabilities for offline access

---

## File Organization Patterns

### Components
- Located in `src/components/`
- Named with kebab-case: `accountability-view.tsx`
- Client components use `'use client'` directive

### Pages
- Next.js App Router structure
- Route groups: `(app)` for protected routes
- Layout files: `layout.tsx` for shared layouts

### Hooks
- Custom hooks in `src/hooks/`
- Named with `use` prefix: `useItems.ts`

### Utilities
- Library code in `src/lib/`
- Shared utilities in `src/lib/utils.ts`

### Types
- TypeScript types in `src/types/`
- Prisma-generated types from `@prisma/client`

---

## Configuration Files

### Next.js (`next.config.ts`)
- Static export mode (`output: 'export'`)
- React Compiler enabled
- Unoptimized images (for static export)

### TypeScript (`tsconfig.json`)
- Strict mode enabled
- Path aliases: `@/*` → `./src/*`
- React JSX transform

### Capacitor (`capacitor.config.ts`)
- App ID and name
- Web directory: `out/`

### Prisma (`prisma/schema.prisma`)
- PostgreSQL datasource
- Full schema definition
- Enum definitions

---

## Deployment

### Web (Vercel/Static Hosting)
1. Build: `npm run build`
2. Deploy `out/` directory
3. Configure environment variables

### iOS
1. Build: `npm run build`
2. Sync: `npx cap sync ios`
3. Open: `npx cap open ios`
4. Build in Xcode

### Android
1. Build: `npm run build`
2. Sync: `npx cap sync android`
3. Open: `npx cap open android`
4. Build in Android Studio

---

## Development Workflow

### Adding a New Feature

1. **Database Changes:**
   - Update `prisma/schema.prisma`
   - Create migration: `npx prisma migrate dev`
   - Generate client: `npx prisma generate`

2. **Frontend Changes:**
   - Create components in `src/components/`
   - Add pages in `src/app/`
   - Update hooks if needed

3. **Backend Changes:**
   - Add Edge Functions in `supabase/functions/`
   - Update Supabase policies if needed

4. **Mobile Sync:**
   - After web changes: `npx cap sync`
   - Test on iOS/Android simulators

---

## Security Considerations

- Password hashing with bcryptjs
- Supabase Row Level Security (RLS)
- Environment variable protection
- HTTPS required for production
- Secure authentication via Supabase Edge Functions

---

## Performance Optimizations

- React Compiler enabled
- Static export for fast loading
- Prisma connection pooling
- Supabase real-time subscriptions
- Indexed database queries
- Optimized bundle size

---

## Future Enhancements

- Real-time collaboration
- Mobile push notifications
- Advanced analytics
- Task templates
- Recurring tasks
- File attachments
- Comments and discussions

---

## Documentation References

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

*Last Updated: December 2024*

