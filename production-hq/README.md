# Production HQ

Dashboard for managing music production projects: ghost production, original productions, track finishing and remixes.

So far only the homepage (dashboard) is built. It runs on sample data. There's no database or login yet.

## Run it

```bash
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173).

## How the code is organised

```
src/
  data/
    sampleData.js     Sample clients, projects and updates (shaped like future Supabase tables)
    api.js            The only place the UI gets data from. Swap these functions for Supabase queries later.
  lib/
    constants.js      Statuses, service types, colours, sort options, "needs attention" thresholds
    projects.js       Pure logic: joins, stats, filtering, sorting, needs-attention rules, recent activity
    dates.js          Date formatting helpers
  hooks/
    useDashboardData.js  Loads data through api.js
  components/
    layout/           Sidebar, mobile nav, app shell (nav items live in navigation.js)
    ui/               Reusable pieces: Button, Card, StatusBadge, Select, SearchInput, ClientAvatar
    dashboard/        Dashboard sections: header, stats, active projects, needs attention, recent activity
  pages/
    Dashboard.jsx     The homepage
    ComingSoon.jsx    Placeholder for pages not built yet (All Projects, Clients, project pages, …)
```

Data model: **clients** → **projects** (one client, many projects) → **updates** (a dated, chronological log per project, like the rows under each client in the old Google Sheet).

## Needs Attention rules

A project shows up when any of these is true (thresholds are in `lib/constants.js`):

- Deadline is overdue or within 7 days
- Status is Ready for Delivery
- Status is Revisions
- No update in 10+ days, unless it's Awaiting Client Feedback or On Hold (that's the client's move)
