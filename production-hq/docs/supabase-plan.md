# Production HQ — Supabase plan

Status: **proposal, waiting for approval.** Nothing in the app has been connected yet.

The ready-to-paste database setup is in [`supabase/schema.sql`](../supabase/schema.sql). It has been tested on a local Postgres database: the due-date calculation, the duplicate-client rule, the deposit rules and the security rules all behaved as described below.

---

## 1. What needs to be stored

Everything the app shows today comes from three kinds of record. Nothing else needs saving.

| What | Where it lives now | Where it will live |
|---|---|---|
| Clients (name, contact, email) | browser storage | `clients` table |
| Projects (name, client, service type, status) | browser storage | `projects` table |
| Project status (Not Started … On Hold) | fixed list in `lib/constants.js` | `projects.status`, limited to the same 7 values |
| Service type (Ghost Production, Original Production, Track Finishing, Remix) | fixed list in `lib/constants.js` | `projects.service_type`, limited to the same 4 values |
| Chronological updates (text, time, edited time) | browser storage | `project_updates` table |
| Next action + its due date | on each project | `projects.next_action`, `projects.next_action_due_on` |
| Deposit status + date received | on each project | `projects.deposit_status`, `projects.deposit_received_on` |
| Agreed turnaround (weeks) | on each project | `projects.turnaround_weeks` |
| Project due date | calculated in the app | **calculated by the database** (`projects.due_on`) |
| Completed date | on each project | `projects.completed_at` |

Things that are *not* stored because they're worked out on the fly: dashboard counts, Needs Attention, Recent Activity, "latest update" previews and sort order.

---

## 2. The database structure

```
clients ──< projects ──< project_updates
 (one client has many projects; one project has many updates)
```

**clients**: `id`, `name`, `contact_name`, `email`, `notes`, `created_at`, `updated_at`
- Two clients can't have the same name. "Nova Kade" and " nova  kade " count as the same, matching how the app already avoids duplicates.

**projects**: `id`, `client_id`, `title`, `service_type`, `status`, `deposit_status`, `deposit_received_on`, `turnaround_weeks`, `due_on`, `next_action`, `next_action_due_on`, `started_at`, `completed_at`, `created_at`, `updated_at`
- `due_on` is filled in by the database: deposit date + turnaround weeks × 7. Nobody can type it, so it can never disagree with the deposit date or turnaround. It is empty while the deposit is pending ("Pending deposit" in the app).
- A received deposit must have a date, and a pending one can't have one.
- Status and service type only accept the values the app knows about.

**project_updates**: `id`, `project_id`, `body`, `created_at`, `edited_at`
- Updates are listed newest first by `created_at`, as the app does today.
- Empty updates are rejected.

**Safety rules built into the tables**
- A client that still has projects can't be deleted, so a stray click can't wipe a client's history.
- Deleting a project deletes its updates. The app has no "delete project" button today, so this only matters later.
- Every row also records which account owns it (`owner_id`). The security rules below use it.

Statuses and service types are stored as short codes (`in_progress`, `ghost_production`) rather than in separate tables. To add a new service type later, I'd change one line in the database and one in the app.

---

## 3. Signing in

- **Email + password**, one account (yours).
- You create the account yourself in the Supabase dashboard, then **turn off sign-ups**, so nobody else can create an account even if they find the app.
- The app gets one new screen, a simple sign-in page in the same dark style. After signing in you stay signed in on that device until you sign out.
- If the session expires, the app returns you to sign-in and keeps any text you'd typed.

## 4. Security (Row Level Security)

Supabase lets anyone holding the app's public key *send* requests. Security comes from rules inside the database that decide what each request may see. The schema:

- turns Row Level Security **on** for all three tables
- lets a **signed-in** user read and change **only the rows they own**
- gives **signed-out visitors no access at all**
- links projects only to clients with the same owner, and updates only to projects with the same owner

Tested: a second account saw 0 clients, 0 projects and 0 updates, couldn't attach a project to your client, and changed 0 of your rows. A signed-out visitor got "permission denied".

Two keys you'll see in Supabase:
- **Publishable / anon key**: safe to put in the app and to share with me. It only works within the rules above.
- **Secret / service_role key and the database password**: these bypass the rules. Never paste them into the app or a chat (including this one).

## 5. Deposit-based deadlines after the switch

- The database calculates `due_on` with the same formula as the app (tested: deposit Nov 4 + 4 weeks → Dec 2; changing to 6 weeks → Dec 16).
- The app will **display** the database's date. The New Project form keeps its live preview using the identical formula, so what you see before saving matches what's saved.
- Dates like deposit date, due date and next-action date become plain calendar dates with no time of day, so they can't shift a day across time zones.
- "Pending deposit" projects still can't be overdue, because their `due_on` is empty.

## 6. Moving your existing browser data

Your current data sits in the browser where you used the app. The claude.ai preview link counts as its own separate browser location.

1. **Before switching,** I add a **Settings → Copy my data** button to the current version. It copies everything as text, and works even inside the claude.ai preview, where downloads are blocked.
2. In the connected app, **Settings → Import data** lets you paste that text. It shows the clients and projects it found, each with a checkbox. The sample projects start unticked, so the demo data doesn't end up in your real database.
3. The import runs as **one all-or-nothing step**: either everything arrives or nothing changes, so a dropped connection can't leave half an import. Update timestamps and "edited" marks are kept exactly. Clients that already exist by name are reused rather than duplicated.
4. The pasted text is also offered as a backup file, so the original data is kept.

## 7. Loading, saving errors and syncing between devices

- **Loading:** the first time the dashboard opens, the project list, cards and side panels show faint placeholder rows in the same layout until data arrives. After that, opening the app shows the last-loaded data instantly while it refreshes quietly.
- **Saving:** a new update appears straight away with a faint "Saving…". If it fails (no internet, signed out), it's taken back out and a small message appears, such as "Couldn't save your update. Check your connection and try again." **The text stays in the box,** so nothing you typed is lost. Status, deposit and next-action changes behave the same way.
- **No internet:** a slim notice says you're offline. You can still read everything, but saving waits until you're back online. A full offline mode isn't planned, to keep things simple.
- **Between devices:** the app listens for changes, so an update saved on your phone appears on your laptop within a second or two without refreshing. It also re-checks whenever you return to the tab. If the same item is edited on two devices at once, the most recent save wins. For a one-person workspace this is the simplest safe choice.

## 8. Backups and exporting

- **In the app:** Settings → **Export** downloads
  - a full backup (JSON) that can be re-imported, and
  - a spreadsheet (CSV) with one row per update (date, client, project, status, update text), close to your old Google Sheet layout.
- **In Supabase:** Table Editor → choose a table → **Export → CSV**, at any time.
- Export a backup now and then, for example once a month. Automatic backups and restore options in Supabase depend on your plan; check its current plan details rather than relying on them.
- Free Supabase projects are **paused after a period of inactivity**. Supabase emails you first, and you can resume the project from the dashboard with no data lost. Using the app regularly keeps it active.

## 9. Hosting (needed for real use)

The claude.ai preview link can't talk to Supabase, because it blocks connections to other websites. To use the app for real, it needs a normal web address. I recommend **Vercel** or **Netlify**: both are free for this size of app, and I'll prepare everything so the setup is a few clicks. The preview link can stay as a demo with sample data.

---

## What you'll do in Supabase (about 15 minutes)

1. **Create a project.** Sign in at supabase.com → **New project**. Name it `production-hq`, pick the region closest to you, and choose a strong database password. Save that password in your password manager, and don't share it. Wait a minute or two for it to finish setting up.
2. **Create the tables.** Left sidebar → **SQL Editor** → **New query**. Open `supabase/schema.sql`, copy all of it, paste it in, and click **Run**. You should see "Success. No rows returned."
3. **Check it worked.** **Table Editor** should list `clients`, `projects` and `project_updates`. None of them should show an "RLS disabled" / "Unrestricted" warning.
4. **Create your account.** **Authentication → Users → Add user → Create new user**. Enter your email and a password, and tick **Auto Confirm User**.
5. **Turn off sign-ups.** **Authentication → Sign In / Providers** (labelled "Providers" or "Settings" in some versions). Turn **off** "Allow new users to sign up". Leave **Email** enabled.
6. **Copy two values for me.** Click **Connect** at the top, or go to **Project Settings → API**. Copy the **Project URL** and the **publishable** key (older projects call it the **anon public** key). Send me both. They're safe to share. Don't send the secret/service_role key or your database password.
7. **Later, once the app is hosted:** **Authentication → URL Configuration** → set **Site URL** to the app's address, so password-reset emails link to the right place.

## What I'll build after you approve

1. Supabase connection, plus the sign-in screen (same design).
2. Rewrite only `src/data/api.js` to read and write Supabase, converting between the database's field names and the app's. The dashboard, panel and form stay exactly as they are.
3. Loading placeholders, save-error messages, offline notice and live sync.
4. A small Settings page: Copy/Import data, Export backup, Sign out.
5. A "demo mode" that keeps today's sample-data behaviour whenever Supabase isn't configured, so the preview link keeps working.
6. Hosting setup and a short guide.
