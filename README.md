# Construction Brand — Project Owners Evening

A one-page, bilingual event programme for the Construction Brand evening at
**Grand Millennium Sulaimani**. Guests scan a QR code on the table and get the
running order on their phone, with the current session highlighted live.

Plain HTML, CSS and JavaScript. No build step, no dependencies, no server.
Drop it on GitHub Pages and it runs.

---

## What it does

| | |
|---|---|
| **کوردی / English** | Full Sorani + English, proper RTL. Kurdish is the default; the choice is remembered. |
| **Live running order** | Highlights whatever is happening right now, dims what has finished, marks what is next. Updates every second. |
| **Countdown** | Before doors open, the header counts down to 16:30. |
| **Progress meter** | Shows how far through the evening you are. |
| **Add to calendar** | Generates a real `.ics` file in the browser. |
| **Directions** | One tap to the venue in Google Maps. |
| **Save our number** | Generates a `.vcf` contact card with both numbers. |
| **Works offline** | A service worker caches the page, so it opens even when the ballroom wi-fi does not. |
| **Light + dark** | Follows the phone's setting, with a manual toggle. |
| **Prints cleanly** | `Ctrl+P` gives a tidy black-on-white programme. |

---

## Editing the event

**Everything lives in [`data/event.js`](data/event.js).** That is the only file
anyone needs to touch. It is commented in Kurdish and English.

```js
date: "2026-10-08",     // ← the date of the event
...
schedule: [
  { t: "17:00", mins: 20, kind: "key",
    title: { ku: "کردنەوەی ئێوارە", en: "Opening & welcome" },
    note:  { ku: "…", en: "…" } },
]
```

- `t` — start time, 24-hour `HH:MM`
- `mins` — how long it runs
- `kind` — leave empty, or use `break`, `demo`, `key` for a small label
- `tags` — product codes shown as chips, e.g. `["Kalekim 1411"]`

Times are automatically chained, so changing one start time shifts what the
page considers "now" — no other edits needed.

> ⚠️ **The date and the running order currently in the file are a draft.**
> Replace them with the confirmed programme before printing the QR code.

---

## The logo

The official artwork lives at `logo@2x.png` in the project root. One command
derives everything the site and the QR generator need from it:

```bash
python tools/prepare_logo.py
```

| Output | Used for |
|---|---|
| `assets/img/logo.png` | the **mark only** (C + B + crane), square, transparent — header badge, QR corners, QR centre |
| `assets/img/logo-full.png` | the full lockup with the wordmark — table tent |
| `assets/img/icon-512.png` | mark on a navy tile — add-to-home-screen icon |
| `assets/img/og.png` | 1200×630 share card — what WhatsApp / Telegram show when the link is pasted |
| `assets/img/wordmark.png` | CONSTRUCTION BRAND on its own (the hook stays as the O) |
| `assets/img/wordmark-light.png` | the same recoloured white / light teal — runs along the bottom of the QR frame |

The crane hook in the artwork doubles as the "O" of CONSTRUCTION, so the mark
is cut where the body of the C/B ends and only the hoist cable continues.

If the artwork ever changes: replace `logo@2x.png`, run `prepare_logo.py`, then
`generate_qr.py`. The page itself needs no edit — it loads `logo.png` and falls
back to the SVG recreation only if that file is missing.

---

## Calendar and contact files

"Add to calendar" and "Save our number" are plain links to two static files,
`assets/event.ics` and `assets/construction-brand.vcf`. That is deliberate:
a file generated in the browser and downloaded lands in *Files* on an iPhone
and never opens Calendar or Contacts; a real URL does.

**If the event's start or end time changes**, edit `DTSTART` / `DTEND` in
`assets/event.ics` (they are UTC: 16:30 Baghdad = `133000Z`). The programme
itself is unaffected — this file only carries the overall span.

---

## Publishing on GitHub Pages

```bash
git init
git add .
git commit -m "Construction Brand event programme"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**.

The site appears at `https://<user>.github.io/<repo>/` within a minute or two.

Finally, put that URL into the `url:` field at the bottom of `data/event.js`
and regenerate the QR code.

---

## The QR code

```bash
python -m pip install qrcode pillow     # once
python tools/generate_qr.py
```

It reads the URL straight out of `data/event.js`, so the code and the page can
never drift apart. To point it somewhere else:

```bash
python tools/generate_qr.py --url https://your-user.github.io/your-repo/
```

Five files land in `qr/`:

| File | Use |
|---|---|
| `construction-brand-qr.png` | 2400 px, navy on white, logo centred — slides, social, screens |
| `construction-brand-qr.svg` | true vector — give this one to the print shop |
| `construction-brand-qr-framed.png` | branded frame, logo at the **4 corners** |
| `construction-brand-qr-framed-edges.png` | branded frame, logo on the **4 edges** |
| `construction-brand-table-tent.png` | A5 portrait, 300 dpi — print and stand on each table |

The code uses **error correction level H** (~30% damage tolerance), so it still
scans with a logo in the middle, under ballroom lighting, or slightly scuffed.

If you add `assets/img/logo.png`, the generator uses it for all five marks —
the four on the frame and the one in the centre — automatically.

### Why the logo is not *inside* the code

A QR has **three** finder squares — the big targets at top-left, top-right and
bottom-left. A scanner uses those to find and orient the code, so replacing one
with a logo breaks scanning on a large share of phones. Everything the frame
adds therefore sits **outside** the code and its quiet zone, where it cannot
affect the read at all.

### The scan check

Every run decodes each generated PNG back and compares it to the target URL, at
full size and again at 25% size (roughly what a small print looks like to a
camera). If any file fails to decode, the script **exits with an error** rather
than leave you with a dead QR:

```
Scan check (decoded back from the generated image):
  OK    construction-brand-qr.png                both sizes
  OK    construction-brand-qr-framed.png         both sizes
```

This does not replace scanning it yourself with two real phones — camera,
lighting and paper are variables the script cannot see.

> The table tent is set in English only. PIL cannot shape Arabic script, so a
> Kurdish version would come out with the letters disconnected. If you want a
> Kurdish card, export it from the designer's tool and just place the
> `construction-brand-qr.svg` into it.

---

## The feedback switch (one QR, two pages)

A printed QR code is a fixed URL — it can't change. So the switch lives in the
**page**, not the code. Same URL all night; the page decides what to show from
the clock.

| When a guest scans | What they get |
|---|---|
| Any time before **21:15** | The programme |
| **21:15 → 21:30** (last 15 min) and for 7 days after | The feedback form |
| More than 7 days after | A short thank-you and your contact details |

Both boundaries are set in `data/event.js`:

```js
feedback: {
  opensBeforeEndMins: 15,   // 15 min before the last item ends
  closesAfterDays: 7,
}
```

### Why this is safe

- **Timezone-proof.** Times are compared as absolute instants with `+03:00`
  baked in, not as wall-clock. A guest whose phone is set to Dubai or London
  still flips at the same real-world second as everyone else.
- **Works with no internet.** The service worker has the page cached, and the
  clock runs on the phone. The switch does not need the network at all.
- **Catches open tabs.** The clock is checked every second, so a page someone
  left open at 17:00 turns into the feedback form by itself at 21:15.
- **Answers survive a language switch.** Selections are stored by stable key,
  not by the visible Kurdish/English text.
- **Nothing is lost, and nothing is faked.** Every answer is written to an
  outbox on the phone *before* it is sent, and removed only once Google
  confirms delivery. If the send fails the guest is told it is saved and
  pending — never "we have it" — and it retries by itself.
- **A misconfigured form cannot fake a success.** If the form ID or any of the
  six entry IDs is missing or still a placeholder, the page refuses to use the
  Google path at all and falls back to WhatsApp.
- **The programme is never a one-way door.** Moving between the two views is an
  in-page toggle that does not change the URL, and a "Give feedback" button
  appears on the programme once the window is open.
- **Clocks are printed in Baghdad time**, never the phone's, so a handset on
  the wrong timezone still shows `16:30 – 21:30`.

### The manual override

If the evening runs long or short, these work instantly with no redeploy:

```
<url>?view=schedule    force the programme
<url>?view=feedback    force the feedback form
```

Keep both on a phone as bookmarks on the night. This is also your escape hatch
if a guest's phone has a genuinely wrong clock.

### Where the answers go

By default the form sends to a **Google Form**, which means free, unlimited,
and results land in a Google Sheet your team can read live.

1. Create a Google Form with six questions, in this order:
   **Rating** (short answer), **Sessions**, **Interest**, **Comment**,
   **Name**, **Phone** — all short answer / paragraph.
2. Open the form → ⋮ menu → **Get pre-filled link** → fill each field with
   dummy text → **Get link** → copy it.
3. That link contains `entry.123456789=...` for each question. Copy the form ID
   (the long string after `/d/e/`) and the six entry IDs into `data/event.js`:

```js
googleFormId: "1FAIpQLSd...",
entries: {
  rating:   "entry.111111111",
  sessions: "entry.222222222",
  ...
}
```

4. **Submit one test response from your phone and confirm it appears in the
   sheet.** Do not skip this — if the entry IDs are wrong the guest still sees
   "thank you" but nothing is recorded. This is the single most important test
   on the whole checklist.

Leave `googleFormId` empty and the form falls back to opening **WhatsApp** with
the answers pre-typed, so the evening is never left with no way to collect them.
The guest has to press send, so it is a fallback, not the plan.

---

## Before the event — checklist

- [ ] Confirm the final running order and put it in `data/event.js`
- [ ] Confirm the date, and that doors really open at 16:30
- [ ] Drop the official logo in at `assets/img/logo.png`
- [ ] Create the Google Form and paste the form ID + six entry IDs
- [ ] **Send a test response and confirm it lands in the sheet**
- [ ] Open `?view=feedback` on a phone and check the form reads well in Kurdish
- [ ] Publish to GitHub Pages and open the live URL on a real phone
- [ ] Put the live URL into `url:` in `data/event.js`, push again
- [ ] Regenerate the QR code, **scan it yourself with two different phones**
- [ ] Print the table tents
- [ ] Open the page once on the venue wi-fi so the offline cache is warm
- [ ] Save `?view=schedule` and `?view=feedback` as bookmarks on a staff phone

---

## File map

```
index.html                  the page
data/event.js               ← everything you edit lives here
assets/css/style.css        design system, light + dark, RTL
assets/js/app.js            live clock, language, calendar and contact files
assets/img/logo.svg         recreated mark (override with logo.png)
assets/img/favicon.svg      tab icon
tools/generate_qr.py        QR + print-ready table tent
qr/                         generated output
sw.js                       offline cache
manifest.webmanifest        "add to home screen"
```
