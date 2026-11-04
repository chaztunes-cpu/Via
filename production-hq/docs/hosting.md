# Putting Production HQ online (Vercel)

About 10 minutes, free, no coding. You only do this once. After that, every
change I push updates the site automatically.

## 1. Get the code onto your main branch

My work is on the branch `claude/modest-curie-sgz61m`. Vercel publishes your
repository's main branch, so the changes need to be merged first. Ask me to
open a pull request, then click **Merge** on GitHub. Your Via travel app is
in a different folder and isn't affected.

## 2. Create the site on Vercel

1. Go to **vercel.com** → **Sign up** → **Continue with GitHub**.
2. **Add New… → Project**, find **Via** in the list, click **Import**.
   If it isn't listed, click **Adjust GitHub App Permissions** and allow the Via repository.
3. On the settings screen:
   - **Root Directory**: click **Edit** and choose **`production-hq`** (important)
   - **Framework Preset**: Vite (usually detected automatically)
   - Leave everything else as it is. The Supabase address and publishable
     key are already in the project, so there are no environment variables to add.
4. Click **Deploy**. After a minute you get an address like
   `https://production-hq-yourname.vercel.app`. Open it: you should see the sign-in page.

## 3. Tell Supabase the new address

In Supabase: **Authentication → URL Configuration** → set **Site URL** to the
Vercel address (for example `https://production-hq-yourname.vercel.app`) → **Save**.

## 4. Sign in and bring your data over

1. Sign in with the email and password you created in Supabase.
2. Optional: in the old preview link, open **Settings → Copy my data**.
   In the new site, open **Settings → Import from the prototype**, paste,
   review the ticked projects (sample projects start unticked), and click **Import**.

## Good to know

- Use the same address on your phone and computer. Changes appear on both within a second or two.
- **Settings → Download full backup** saves everything to a file. Do this now and then.
- Forgot your password? In Supabase: **Authentication → Users** → click your user → set a new password.
- Free Supabase projects pause after a period of inactivity. If the app
  says it can't reach the server, open supabase.com and click **Restore project**.
