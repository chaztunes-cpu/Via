# Vocal Finder

Find free vocal samples in a musical key and listen to them one after another.

## How to use it

1. Get a free Freesound API key: sign in at [freesound.org](https://freesound.org), go to <https://freesound.org/apiv2/apply/>, fill in the short form, and copy the **Client secret/Api key**.
2. Double-click `index.html` in this folder to open it in your browser.
3. Paste the key. Pick a key and scale (for example A minor), and optionally a length and extra words like `female` or `chop`.
4. Press **Find samples**. Click any row to play it. Use <kbd>↓</kbd>/<kbd>J</kbd> for next, <kbd>↑</kbd>/<kbd>K</kbd> for previous, and <kbd>Space</kbd> to pause. With **Play the next one automatically** on, you can just listen through the list.

## Which samples it shows

- **CC0 only by default.** These are public-domain samples: use them however you like, with no credit or permission needed.
- Tick the CC BY box to also include samples that are free to use if you credit the creator. Their row says who to credit.
- Samples with other licences (non-commercial, Sampling+) are never shown.

Each sample is matched to the key in one of two ways, shown on its row:

- **Labelled**: the creator wrote the key in the name or tags (for example `Vocal_Am_120bpm`).
- **Detected**: Freesound's audio analysis estimated the key.

## For developers

- `index.html`: the page (search, list, player)
- `key-match.js`: key spelling and matching rules, licence checks. Also loads in Node (`require('./key-match.js')`).

It calls the Freesound API v2 text search straight from the browser, with the key as the `token` parameter. Each search sends one query per key spelling (for example `C# minor`, `C#m`, `Db minor`, `Dbm`), then rechecks every hit locally. It also sends one query filtered on Freesound's key estimate.
