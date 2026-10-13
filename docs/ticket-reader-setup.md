# Set up automatic ticket reading

This guide sets up your **ticket reader**: a small private service that reads an uploaded ticket and tells Via the booking details. It takes about 20 minutes.

**You'll need:**
- A computer is easiest, though a phone works too.
- Two free accounts: **Anthropic** (the AI that reads the ticket) and **Cloudflare** (where your ticket reader runs).
- About **$5** of prepaid Anthropic credit. Reading a ticket costs a small fraction of a cent, so $5 lasts a very long time.

**Your secrets stay secret.** Your Anthropic key goes only into Cloudflare. It's never put in Via or on GitHub, and nobody else ever sees it.

---

## Part 1: Get an Anthropic API key (about 5 minutes)

1. Go to **https://console.anthropic.com** and sign up.
2. Add credit: open **Billing** and add **$5**.
3. Set a spending limit so costs can never surprise you: open **Limits** and set a monthly limit, for example $10.
4. Create a key: open **API Keys**, click **Create Key**, name it `Via ticket reader`, and click **Create**.
5. **Copy the key** (it starts with `sk-ant-`) and keep it somewhere safe for a few minutes. Anthropic shows it only once.

## Part 2: Make up a passcode (1 minute)

Make up a long passcode, at least 20 characters. Four random words work well, like `maple-orbit-canyon-violet-42`.

The passcode stops anyone else from using your ticket reader and spending your credit. You'll type it into Cloudflare and into Via.

## Part 3: Create the ticket reader on Cloudflare (about 10 minutes)

1. Go to **https://dash.cloudflare.com** and sign up for a free account.
2. In the left menu, open **Workers & Pages** (it may be under **Compute**), then click **Create**.
3. Choose **Start with Hello World** (or **Create Worker**). Name it **`via-reader`** and click **Deploy**.
4. Click **Edit code**. Delete everything in the editor.
5. Open the ticket reader code at
   **https://github.com/chaztunes-cpu/Via/blob/claude/travel-ticket-tracker-wdf6uz/backend/via-reader-worker.js**
   Click the **Copy raw file** button (two overlapping squares, top right of the code), then paste it into the Cloudflare editor.
6. Click **Deploy**.
7. Go back to your Worker's page, open **Settings**, then **Variables and Secrets**, and click **Add**. Add these two, choosing type **Secret** for both:

   | Type | Variable name | Value |
   |---|---|---|
   | Secret | `ANTHROPIC_API_KEY` | your key from Part 1 |
   | Secret | `VIA_PASSCODE` | your passcode from Part 2 |

   Type the names exactly as shown, then click **Deploy** (or **Save**).
8. Find your Worker's address on its page. It looks like `https://via-reader.your-name.workers.dev`. Open it in your browser. You should see:
   `{"service":"via-reader","ready":true,"missing":[]}`
   If `ready` is `false`, the `missing` list shows which setting from step 7 still needs adding.

## Part 4: Connect Via (1 minute)

1. Open Via on your phone and tap the **gear** icon.
2. Tap **Automatic ticket reading**.
3. Paste your Worker's address from Part 3, step 8, and type your passcode.
4. Tap **Save**. Via checks the connection and shows **"Connected. Automatic reading is on"**. If something's wrong, it tells you what to fix.

Done. Tap **+**, then **Scan or upload ticket**, and try one of your tickets.

---

## Good to know

- **Costs:** each ticket costs well under a cent on Claude Haiku 5.5. Your monthly limit from Part 1 caps your spending.
- **Privacy:** a ticket is sent to your ticket reader only when you choose to scan one. The reader passes it to Anthropic to be read and keeps nothing. Anthropic doesn't use API data to train its models and keeps it only for a limited time; see Anthropic's privacy policy for details. Your bookings and tickets stay saved on your phone.
- **Leave logging off:** Cloudflare offers logs for Workers. Leaving them off keeps things fully private; the ticket reader doesn't write ticket details to logs anyway.
- **Using a different web address for Via:** the ticket reader only accepts requests from `https://chaztunes-cpu.github.io`. If Via ever moves, add a **Text** variable called `ALLOWED_ORIGIN` with the new address, such as `https://example.com`.
- **Turning it off:** in Via, open Settings → Automatic ticket reading → **Turn off automatic reading**. To stop it completely, delete the Worker in Cloudflare and the key in Anthropic.

## If something isn't working

| Via says | What to do |
|---|---|
| Via couldn't reach that address | Check the address is copied exactly, including `https://`. |
| The passcode doesn't match | Type the passcode again in Via, or update `VIA_PASSCODE` in Cloudflare so they match. |
| isn't finished setting up | Add the setting it names in Cloudflare (Part 3, step 7), then deploy. |
| The Anthropic API key isn't working | Create a new key in Anthropic and replace `ANTHROPIC_API_KEY` in Cloudflare. |
| Your Anthropic account is out of credit | Add credit under **Billing** at console.anthropic.com. |
