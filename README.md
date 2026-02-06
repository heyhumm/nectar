# Mission Control

Real-time task management system built with Next.js, Convex, and shadcn/ui.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Initialize Convex

Run Convex in development mode (this will prompt you to log in and create a project):

```bash
npx convex dev
```

This will:
- Prompt you to log in to Convex
- Create a new Convex project
- Generate the `_generated` files in the `convex/` directory
- Create a `.env.local` file with your `NEXT_PUBLIC_CONVEX_URL`

### 3. Run the development server

In a separate terminal:

```bash
npm run dev
```

Open [http://localhost:4847](http://localhost:4847) to view the app.

## Adding Seed Data

After Convex is running, you can add test data through the Convex dashboard:

1. Go to [dashboard.convex.dev](https://dashboard.convex.dev)
2. Select your project
3. Go to the "Data" tab
4. Add sample data to the `agents`, `tasks`, `activities`, and `documents` tables

### Example Seed Data

**Agents:**
```json
{
  "name": "Research Agent",
  "role": "Research Specialist",
  "status": "active",
  "sessionKey": "session-001"
}
```

**Tasks:**
```json
{
  "title": "Analyze market trends",
  "description": "Research current market trends for Q1",
  "status": "in_progress",
  "assigneeIds": [],
  "createdAt": 1706900000000,
  "updatedAt": 1706900000000
}
```

## Project Structure

```
mission-control/
├── convex/                   # Convex backend
│   ├── schema.ts             # Database schema
│   ├── agents.ts             # Agent queries
│   ├── tasks.ts              # Task queries
│   ├── messages.ts           # Message queries
│   ├── activities.ts         # Activity feed queries
│   ├── documents.ts          # Document queries
│   └── notifications.ts      # Notification queries
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout with ConvexProvider
│   │   ├── page.tsx          # Main dashboard
│   │   └── providers.tsx     # ConvexClientProvider
│   ├── components/
│   │   ├── ui/               # shadcn components
│   │   ├── layout/           # Layout components
│   │   ├── activity/         # Activity feed components
│   │   ├── tasks/            # Task board components
│   │   ├── agents/           # Agent components
│   │   └── documents/        # Document components
│   └── lib/
│       └── utils.ts
└── .env.local                # Convex URL (auto-generated)
```

## Features

- Real-time Kanban board with 5 status columns
- Agent status monitoring in sidebar
- Document management panel
- Activity feed with recent events
- Task detail view with messages and documents
- **Task Scheduling** - Schedule tasks to become available at a future date/time

### Task Scheduling

Tasks can be scheduled for a future date using the `scheduledAt` field. Scheduled tasks:
- Are hidden from agent task lists until their scheduled time arrives
- Can be viewed by passing `includeScheduled: true` to list queries
- Support ISO 8601 datetime strings or Unix timestamps (milliseconds)

**Schedule a task:**
```typescript
// Using the CLI or API
npx convex run tasks:schedule '{"id": "<task-id>", "scheduledAt": 1706900000000}'
```

**Unschedule a task:**
```bash
npx convex run tasks:unschedule '{"id": "<task-id>"}'
```

**List all tasks including scheduled:**
```bash
npx convex run tasks:list '{"includeScheduled": true}'
```

**List upcoming scheduled tasks:**
```bash
npx convex run tasks:listScheduled
```
