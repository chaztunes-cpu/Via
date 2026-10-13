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
- **Timeline** lists every upcoming departure, with a clear icon and colour for each type of transport.
- **Add to calendar** puts any booking into Google, Apple or Outlook calendar.
- **Backup and restore** (gear icon) saves everything, tickets included, to a single file.

## Where your data lives

Everything is stored privately in your browser on this device. Nothing is uploaded anywhere.
Clearing your browser's data for this page would erase your trips, so use **Settings → Back up my trips** now and then.

## For developers

Plain HTML, CSS and JavaScript with no build step.

- `index.html`: page shell
- `css/styles.css`: all styling (light and dark mode)
- `js/app.js`: screens, navigation and actions
- `js/store.js`: on-device storage (IndexedDB)
- `js/sample.js`: sample trips shown on first launch
- `js/icons.js`: icon set
