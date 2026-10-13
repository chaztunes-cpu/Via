# Via

All your booked travel in one place: flights, trains, buses, ferries and more.
Open the app and see right away where you're going, when you're leaving, and where your tickets are.

## How to open it

Download this folder and double-click `index.html`. It opens in your web browser. There's nothing to install.

The first time you open it you'll see **sample trips**, so you can look around. Tap **Remove** on the banner when you're ready to add your own.

## What it does

- **Home** shows your next departure up top, with a one-tap button to open its ticket. Your upcoming trips are listed below it in date order.
- **Trips form automatically.** When you add a booking, Via puts it in the right trip. For example, the flight home joins the trip it belongs to. You can always change this.
- **Trip details** show every booking in a trip in order, plus how long you're staying in each place.
- **Booking details** look like a ticket: times, confirmation number (with a Copy button), seat and notes.
- **Tickets and documents.** Attach PDFs and screenshots to any booking. They're saved on your device and open even without internet.
- **Add from a ticket.** Tap **+**, then **Scan or upload ticket**, and choose a PDF, screenshot or photo. Once automatic reading is set up ([setup guide](docs/ticket-reader-setup.md)), Via fills in the details for you to check. Anything it can't find is left blank, and nothing is saved until you confirm. Until then, the ticket is attached and you type the details.
- **Timeline** lists every upcoming departure, with a clear icon and colour for each type of transport.
- **Add to calendar** puts any booking into Google, Apple or Outlook calendar.
- **Backup and restore** (gear icon) saves everything, tickets included, to a single file.

## Where your data lives

Everything is stored privately in your browser on this device. The only thing that ever leaves it is a ticket you ask Via to read automatically. That ticket goes to your own private ticket reader, which doesn't keep a copy.
Clearing your browser's data for this page would erase your trips, so use **Settings → Back up my trips** now and then.

## For developers

Plain HTML, CSS and JavaScript with no build step.

- `index.html`: page shell
- `css/styles.css`: all styling (light and dark mode)
- `js/app.js`: screens, navigation and actions
- `js/store.js`: on-device storage (IndexedDB)
- `js/reader.js`: adding a booking from an uploaded ticket (Add screen, ticket reader connection, review screen)
- `backend/via-reader-worker.js`: the private ticket reader (a Cloudflare Worker that asks Claude to read a ticket)
- `js/sample.js`: sample trips shown on first launch
- `js/icons.js`: icon set
