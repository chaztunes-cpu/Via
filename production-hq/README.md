# Production HQ

Dashboard for managing music production projects: ghost production, original productions, track finishing and remixes.

The app runs in one of two modes:

- **Live** (normal): your data is stored in Supabase and you sign in with your account. Works on any device. Setup: [`docs/supabase-plan.md`](docs/supabase-plan.md), database: [`supabase/schema.sql`](supabase/schema.sql), going online: [`docs/hosting.md`](docs/hosting.md).
- **Demo**: sample data saved only in this browser, no sign-in. Used by the shareable preview link, or when the Supabase settings in `.env` are missing (or `VITE_DEMO_MODE=true`).

## What you can do on the dashboard

- **Quick updates.** Click any project to open its panel on the right. Type an update and press **Save Update** (or Ctrl/⌘ + Enter). Every update is timestamped, listed newest first, and can be edited or deleted. The project jumps to the top of "Recently updated".
- **Status and Next Action.** Status is where the project stands (In Progress, Revisions…). Next Action is the specific next task, with an optional due date. Both are edited in the panel. Rows show the next action on the client line.
- **Deposit and turnaround.** Each project has a deposit status (Awaiting Deposit / Deposit Received), the date the deposit arrived (defaults to today) and an agreed turnaround in weeks. The **Project Due Date is calculated**: deposit date + turnaround (e.g. Nov 4 + 4 weeks = Dec 2). Until the deposit is received it shows "Pending deposit" and the project can't be overdue. All three can be changed later in the project panel and the due date updates everywhere. The Next Action due date stays a separate, manually picked date.
- **Several projects per client.** New Project lets you pick an existing client or add a new one. Typing a name that already exists (in any capitalisation) reuses that client instead of creating a duplicate. The panel lists the client's other projects.

## Run it

```bash
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173). To try it without Supabase, run `VITE_DEMO_MODE=true npm run dev`.

## How the code is organised

```
src/
  data/
    sampleData.js     Sample clients, projects and updates (shaped like future Supabase tables)
    api.js            The only place the UI reads or saves data; forwards to the live or demo source
    supabaseApi.js    Live source: Supabase tables, sign-in, live sync, import
    localApi.js       Demo source: sample data in this browser
    localStore.js     Browser storage for demo mode
    config.js         Chooses live or demo mode
    DataProvider.jsx  Holds the data; instant saves with undo on failure, live sync, cached first load
  lib/
    constants.js      Statuses, service types, colours, sort options, "needs attention" thresholds
    projects.js       Pure logic: joins, stats, filtering, sorting, needs-attention rules, recent activity
    dates.js          Date formatting helpers
  components/
    layout/           Sidebar, mobile nav, app shell (nav items live in navigation.js)
    ui/               Reusable pieces: Button, Card, StatusBadge, Select, SearchInput, ClientAvatar
    dashboard/        Dashboard sections: header, stats, active projects, needs attention, recent activity
    project/          Project slide-out panel (status, next action, updates) and the New Project form
  pages/
    Dashboard.jsx     The homepage
    Settings.jsx      Account, backup/export, copy/import data
    SignIn.jsx        Sign-in screen (live mode)
    ComingSoon.jsx    Placeholder for pages not built yet (All Projects, Clients, project pages, …)
```

Data model: **clients** → **projects** (one client, many projects) → **updates** (a dated, chronological log per project, like the rows under each client in the old Google Sheet).
Each project has its own name, service type, status, deposit status and date, turnaround (weeks), next action (+ due date) and update log. The project due date is never stored; `computeDueDate()` in `lib/projects.js` works it out, so it can't fall out of sync. `fetchClientWithProjects()` in `api.js` and `getClientProjects()` in `lib/projects.js` are ready for future client profile pages.

## Needs Attention rules

Completed and On Hold projects never appear. Otherwise a project shows up when (thresholds are in `lib/constants.js`):

1. Its Next Action is overdue or due within 2 days (shown first)
2. Its project due date is overdue or within 7 days (never while awaiting a deposit)
3. Its status is Ready for Delivery
4. Its status is Revisions
5. It hasn't been updated in 10+ days

Projects Awaiting Client Feedback only appear because of rule 1, when a follow-up is due.
