# MNU Level 4 Timetable

Static frontend timetable for **Minia National University · Faculty of Computers and Artificial Intelligence · Level 4 · First Semester · 2026/2027**.

## Current timetable source
The current `data.js` intentionally contains **lecture records only**, based solely on the latest user-provided lecture schedule. All section-specific sessions have been removed.

The current lecture source contains:
- 5 lecture courses
- 3 group-specific lecture records for each course
- 73 timetable records (15 lectures + 58 section sessions) total
- Instructor names and lecture room/location information where supplied
- No section sessions

## Main features
- Group 1 / 2 / 3 and Sections 1–15.
- Personalized filtering driven by the current timetable data.
- 12-hour time display in the website and print/PDF output.
- Distinct group identity colors:
  - Group 1 — Blue
  - Group 2 — Violet
  - Group 3 — Teal
- Lecture cards use a darker group tone; Section/Lab cards use a lighter tone.
- University and Faculty logos appear in the website header and printable output.
- Mobile-friendly day-by-day timetable on small screens.
- `Download My Timetable` downloads a personalized PDF for the selected Group + Section.
- `Print / Save PDF` uses the browser print layout with the same group colors, logos, and 12-hour times.
- Selection is remembered with `localStorage`.
- Footer credit: **Created by Muhammed Moaz**.

## Run locally
From this folder:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:4173
```

## Data verification
`data.js` contains **73 timetable records (15 lectures + 58 section sessions)** and **0 section records**.

Run:

```powershell
python validate_data.py
```

## Project structure
- `index.html` — UI structure
- `styles.css` — screen, responsive and print styling
- `app.js` — selection, filtering, rendering, 12-hour formatting and downloads
- `data.js` — current structured timetable data
- `assets/` — university and faculty logos
- `pdfs/` — personalized PDFs regenerated from the current `data.js`
- `build_pdfs.py` — regenerates the personalized PDFs from `data.js`
- `validate_data.py` — data validation checks

No external website, iframe, remote asset, login, database, or backend is required.


Current data source: the user-provided timetable schedule in the latest prompt. Previous timetable data is not used.
