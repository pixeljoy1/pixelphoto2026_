# Joydeep Photography — Website Build Specification

**For:** Claude Code
**Client:** Joydeep Mitra (pixeljoy@gmail.com), Bengaluru
**Status:** Ready to build. Content database exists and is populated.
**Last updated:** 17 August 2026

---

## 0. Read this first

This is a real archive, not a demo. Every image referenced here exists in Google Drive
and has a verified file ID. Do not invent placeholder content, do not generate stock
imagery, and do not fabricate captions. If a field is empty in the database, leave it
empty and surface it as a gap.

Three things will save you a day of rediscovery:

1. **Google Drive thumbnail URLs only render for authenticated sessions.** Private Drive
   files cannot be hotlinked into a public website. Section 5 covers the required
   image pipeline. Do not build the gallery against `drive.google.com/thumbnail?id=`.
2. **The archive is uneven.** Some sets are finished and exported; others are processed
   but never exported to JPEG; others are untouched. Only `STATE = EXPORTED` rows are
   usable today. Build for the full taxonomy but launch with what exists.
3. **Some assets in the archive are not photographs.** There are AI-generated images and
   painterly/composite artworks. These are categorised separately and must never appear
   in a photography gallery. See §4.4 — this is a professional-integrity requirement,
   not a preference.

---

## 1. The brief

Joydeep is a senior UX design leader and a serious multi-genre photographer with an
archive spanning 2010–2025. The site is a portfolio: a body of work, presented as
bodies of work.

**The site's single job:** make a visitor understand, within one screen, that this is a
photographer with genuine range and genuine depth — and then let them go deep on one
thread without friction.

**Audience, in priority order:**
1. Curators, editors, competition juries — people assessing craft
2. Print buyers
3. Peer photographers
4. Recruiters/collaborators who arrive from his UX work

**Two problems the design must solve, both real:**

- **Breadth risk.** Wildlife, deep-sky astro, aviation, landscape, street, documentary,
  portrait, macro. Presented flat, breadth reads as unfocused hobbyism. Presented as
  distinct *disciplines*, it reads as mastery. The navigation carries this entire burden.
- **Depth is uneven.** Munnar has 30 finished frames; Aero India 2023 has 2. The layout
  must not make a 2-image set look like a failure. Sets are sized honestly, never padded.

---

## 2. Direction — approved references

The client reviewed five sites and made two specific choices. Follow them exactly.

### 2.1 Layout model — Kat Zhou / KatSnaps (`katsnaps.art`)
**Approved for:** overall structure.

What to take:
- Discipline-led top-level structure rather than a single undifferentiated grid
- Portfolio stays pure — commerce lives elsewhere. Zhou runs her trip business on a
  separate domain (`onestepbeyondexperiences.com`). **Apply the same rule: print sales
  and the Fizdi catalogue link out. They do not colonise the portfolio.**
- An About page that leads with credentials and conservation/subject commitment, not
  gear lists

### 2.2 Navigation + typography — Paul & Henriette (Aristide Benoist)
**Approved for:** menu behaviour and type.

What to take:
- Full-screen overlay menu. Type-led. The menu is a *composition*, not a dropdown.
- Restrained palette so images supply all colour
- Deliberate transitions between gallery states — motion carries continuity
- Modern, confident type as a primary design element

**Do not** clone its WebGL/GLSL implementation. That was a fashion portfolio with ~20
images. This archive is hundreds of frames across nine disciplines, and it must stay
fast on Indian mobile networks. Achieve the *feeling* with CSS transforms and the View
Transitions API. Section 7 sets the performance floor.

---

## 3. Design tokens

### 3.1 Palette

Near-monochrome. Photographs of tigers, nebulae and the Ganga at dawn supply every
colour on the page. The interface must not compete.

```
--ink            #0B0B0C   /* near-black. Page ground for galleries. */
--ink-soft       #1A1A1D   /* raised surfaces, menu overlay */
--paper          #F2F0EC   /* light ground for reading pages only (About, Story) */
--rule           #3A3A40   /* hairlines, borders, dividers */
--muted          #8A8A93   /* captions, metadata, EXIF */
--signal         #B8734A   /* single accent — see note */
```

**On `--signal`:** a burnt ochre. Justified, not decorative — it is pulled from the
Varanasi ghats and the Kumbh sets, which are the archive's most distinctive colour
signature. Use it for one thing only: the active-state marker in navigation. Never for
buttons, never for links in body copy, never as a gradient.

Galleries run on `--ink`. Reading pages run on `--paper`. The switch between them is
itself a signal about what kind of page you are on.

### 3.2 Typography

Two faces. Both variable, both self-hosted (`woff2`, `font-display: swap`).

| Role | Face | Usage |
|---|---|---|
| Display | **Sora** | Discipline names, menu items, image titles. Weights 300 + 600. |
| Body / UI | **Inter** | Captions, EXIF, About copy, all interface text. Weights 400 + 500. |

Why these: Sora is geometric with slightly unusual terminals — modern without the
Helvetica-clone neutrality of Inter alone, and it holds up at very large display sizes,
which the overlay menu needs. Inter below it is invisible in the right way. Neither is
a serif, which deliberately avoids the "fine art photography" cliché and matches
Joydeep's own UX-practitioner register.

Type scale (fluid, `clamp()`):

```
--t-menu     clamp(2.75rem, 8vw, 7rem)      /* overlay menu items — Sora 300 */
--t-h1       clamp(2rem, 5vw, 3.5rem)       /* discipline titles — Sora 300 */
--t-h2       clamp(1.25rem, 2.5vw, 1.75rem) /* set titles — Sora 600 */
--t-body     1rem                            /* Inter 400, 1.6 line-height */
--t-meta     0.8125rem                       /* Inter 500, tracking 0.06em, uppercase */
```

Set `--t-menu` in Sora 300 with `letter-spacing: -0.03em`. Large, light, tight — that is
the Paul & Henriette register.

### 3.3 Signature element

**The discipline index.** On the overlay menu, every discipline is listed with its live
frame count and year span, pulled from the database:

```
WILDLIFE            42 frames   2013 — 2025
ASTROPHOTOGRAPHY    18 frames   2020 — 2025
DOCUMENTARY         31 frames   2013 — 2022
```

This is the one memorable thing. It is honest — the numbers are real and will change as
the archive grows — and it converts the breadth problem into the site's main statement:
this is a person who has sustained multiple disciplines over fifteen years. Counts
animate up on menu open. Nothing else on the site animates numerically.

If a discipline has fewer than 5 frames, show the count anyway. Honesty is the point.

---

## 4. Content model

### 4.1 Source of truth

The database is a Google Sheet and a mirrored Excel workbook:

| Artifact | Location | Role |
|---|---|---|
| `PHOTO_VISUAL_SELECT` | Google Sheet, in `JOYDEEP_PHOTOGRAPHY` Drive folder | Client-facing visual picker with live thumbnails |
| `PHOTO_ARCHIVE_CENSUS` | Google Sheet, same folder | Set-level census |
| `Joydeep_Photography_Archive_Master.xlsx` | Downloaded file, held by client | Master workbook: SUMMARY / LIBRARY / SETS tabs. Offline mirror — **not** the live source. |

**Which one the build reads:** `PHOTO_VISUAL_SELECT` (Google Sheet) is the live source of
truth, because that is where the client marks `ON_SITE`. The xlsx is a snapshot and will
drift. Do not build against the xlsx.

**Access.** The sheet is private to `pixeljoy@gmail.com`. Before step 1 of the build
order, one of these must happen:
- **Preferred:** client creates a Google Cloud service account, shares the sheet with the
  service-account email as Viewer, and supplies credentials via env vars. This also
  covers the Drive image fetch in §5.2, which needs the same auth. One setup, both jobs.
- **Fallback for early work:** client does `File → Download → CSV` from the sheet and
  drops it at `src/data/library.csv`. Unblocks layout work immediately, but must be
  re-exported by hand on every change — so treat it as temporary scaffolding, not the
  architecture.

The client marks `ON_SITE = Y` in the sheet. **Only rows marked `Y` are published.**
This is the publish gate — respect it absolutely. An unmarked row is not "not yet
reviewed", it is "not approved".

### 4.2 LIBRARY schema (per image)

| Column | Type | Notes |
|---|---|---|
| `ID` | int | Stable row id |
| `CATEGORY` | enum | Discipline — see §4.3 |
| `SET` | string | Series/shoot name. Groups images within a discipline. |
| `YEAR` | string | Year or `compiled` |
| `FILE_NAME` | string | `YYYY[-MM]_Place_Subject.jpg` |
| `FILE_ID` | string | **Google Drive file ID — the join key** |
| `DRIVE_LINK` | formula | Convenience only, not for the site |
| `STATE` | enum | `EXPORTED` \| `UNCURATED` \| `NEEDS_EXPORT` \| `WORKING` \| `ARTWORK` \| `AI_GENERATED` \| `THIRD_PARTY` |
| `ON_SITE` | Y/N | **Publish gate** |
| `GALLERY` | string | Target gallery slug (may differ from CATEGORY) |
| `SORT` | int | Order within gallery |
| `TITLE` | string | Display title |
| `CAPTION` | string | 1–2 sentences |
| `ALT_TEXT` | string | Accessibility + SEO. Required if `ON_SITE = Y`. |

`FILE_ID` is the primary key throughout the system. It resolves to the thumbnail in the
client's sheet and to the built asset on the site. Never key on filename.

### 4.3 Disciplines (current, from the db)

```
WILDLIFE          ASTRO           AVIATION
LANDSCAPE         STREET_URBAN    CULTURAL/DOCUMENTARY
PORTRAIT          MACRO_OTHER     SUBMISSIONS
```

Plus two non-photographic categories: `ARTWORK`, `AI_GENERATED`. And `BRAND` (signature
files — assets, not content).

**Naming for the site.** Use `DOCUMENTARY` publicly rather than `CULTURAL`; the Kumbh
Mela 2013 and Varanasi bodies of work are documentary photography and the label should
say so. `SUBMISSIONS` becomes `AWARDS` publicly. `MACRO_OTHER` should be split or
absorbed — do not ship a gallery called "Other".

### 4.4 Hard content rule — non-photographic assets

The archive contains:
- `ARTWORK` — heavily-worked composites and painterly treatments (a Varanasi
  watercolour PSD, a Sparrow composite)
- `AI_GENERATED` — roughly 30 Midjourney generations of the Benaras ghats
- `THIRD_PARTY` — reference images by *other* photographers, saved for processing study
  (one is by Nicolas Lefaudeux, a well-known astrophotographer)

**Requirements:**
- `THIRD_PARTY` never appears on the site under any circumstances. Not his work.
- `AI_GENERATED` and `ARTWORK` never appear in a photography gallery.
- If either is published at all, it goes in a clearly separated section, explicitly
  labelled as such at the point of display — not just in a footer disclaimer.
- Build a check into the data pipeline: if a row has `ON_SITE = Y` and
  `STATE ∈ {AI_GENERATED, THIRD_PARTY}`, **fail the build** with a clear error.

This protects him. A curator finding an unlabelled AI image in a documentary gallery is
a career problem.

---

## 5. Image pipeline — the critical section

### 5.1 The constraint

Google Drive thumbnail and view URLs require an authenticated session. They render in
the client's Google Sheet because he is signed in. **They will not render for an
anonymous visitor.** Any architecture that hotlinks Drive is broken on arrival.

### 5.2 Required approach: build-time fetch and self-host

```
Drive (source of truth, private)
   ↓  authenticated fetch at build time, by FILE_ID
Local /assets/originals/   (gitignored)
   ↓  sharp — resize, compress, strip EXIF-GPS, watermark
/public/img/{slug}/{id}-{width}.avif|webp|jpg
   ↓
Static site
```

**Responsive widths:** 400, 800, 1200, 2000. Serve AVIF with WebP and JPEG fallbacks.
Never ship an original — several are 15–28 MB.

**Auth:** service account with read access, credentials in env vars. Never commit them.

**Caching:** cache fetched originals by `FILE_ID` and skip re-download if unchanged.
The archive is large and the client is on an Indian connection; a full re-fetch on every
build is unacceptable.

### 5.3 EXIF

Strip GPS coordinates from every published image. Wildlife location data is genuinely
sensitive — precise coordinates for tiger and Asiatic lion sightings should not be
public. This is not optional.

Retain and optionally display: camera, lens, focal length, aperture, shutter, ISO.
Photographers in his audience want this; put it behind a subtle toggle, not always-on.

### 5.4 Watermark

Signature files are in Drive under `06_BRAND_ASSETS`:

| File | Drive file ID |
|---|---|
| `sign_2018_BLACK.png` | `1v0Cxbp5VNDPXRGu5_E-UCyqMY8TkrgWF` |
| `sign_2018_WHITE.png` | `1ooLD-qafdybgISyFwOfrbUwxl2AwH0MN` |
| `sign_2018_REALLYSMALL_WHITE.png` | `1OXddjIGfVRlNYvB2hFQGrHdJgzfZeOGC` |

Apply the white mark bottom-right at ~8% image width, 60% opacity, on full-size views
only. Never watermark thumbnails — it makes grids noisy. One image is already
watermarked in-file (`2020_Andromeda_M31_signed.jpg`); detect and skip, or maintain a
skip-list.

---

## 6. Structure

### 6.1 Routes

```
/                          Home
/work                      All disciplines index
/work/:discipline          e.g. /work/wildlife
/work/:discipline/:set     e.g. /work/documentary/varanasi-print-pack
/about
/prints                    Outbound to Fizdi — not a shop
/contact
```

Sets get real URLs. The Varanasi pack and Kumbh Mela 2013 are bodies of work that
deserve to be linkable and shareable on their own.

### 6.2 Home

The hero is a thesis, and the thesis is *range across time*.

Full-bleed single image, auto-advancing slowly (8s) through one hero frame per
discipline, with a discipline label and year in the corner. Respect
`prefers-reduced-motion` — no auto-advance, first frame only.

Below the fold: the discipline index (§3.3) as a navigable list, not a card grid. Then a
short statement. No "Featured In" logo strip unless there are real credentials to put
in it.

### 6.3 Overlay menu — the Paul & Henriette element

- Trigger: fixed top-right, hairline, label `Menu` / `Close` (word, not hamburger)
- Full viewport, `--ink-soft`, opens with a 400ms clip-path or transform reveal
- Items stagger in at 30ms intervals
- Each item: discipline name in `--t-menu`, with frame count and year span in `--t-meta`
- Hover: the item fills with `--signal`; a representative frame fades in at low opacity
  behind the menu. This is the one indulgence — implement it well or omit it entirely.
- Escape closes. Focus trapped while open. Full keyboard navigation.

### 6.4 Discipline page

Masonry preserving native aspect ratios — never crop to a uniform grid. Astro frames are
wide, portraits are tall, and forcing a square grid destroys them.

Group by `SET` with the set name as a sticky subheading. Sets of 2 and sets of 30 both
render honestly at their real size.

### 6.5 Set page

For substantial sets, this is an essay: title, year, location, 2–3 paragraphs of context,
then the sequence in `SORT` order. The Kumbh Mela 2013 and Varanasi Print Pack sets carry
enough weight to justify this treatment.

### 6.6 Lightbox

Full-bleed on `--ink`. Keyboard: arrows, Escape. Swipe on touch. Caption and optional
EXIF in a bottom bar that auto-hides. Preload adjacent images. Deep-linkable via URL
fragment.

---

## 7. Non-negotiables

**Performance.** LCP under 2.5s on a 4G connection from Bengaluru — test against that,
not localhost. Lazy-load everything below the fold. Ship a blur-up placeholder (LQIP)
per image. Total JS under 100 KB gzipped. If the framework cannot hit this, change
framework, not the target.

**Accessibility.** Every published image has `ALT_TEXT` — the build fails without it.
Visible keyboard focus. `prefers-reduced-motion` honoured throughout. Menu focus-trapped.
Contrast ratio ≥ 4.5:1 for all text.

**SEO.** Per-image structured data (`ImageObject`) with `creator` and `copyright`.
`OpenGraph` per set. Sitemap. `robots.txt` permitting image indexing — discoverability
matters more than scraping paranoia for a portfolio.

**Rights.** Visible copyright. A plain-language licensing note on `/about`. No
right-click blocking — it does not work, and it insults the audience.

---

## 8. Recommended stack

**Astro** + Tailwind + Sharp.

Rationale: content-driven, image-heavy, near-zero interactivity requirement. Astro ships
no JS by default, has a first-class image pipeline, and its content collections map
cleanly onto the sheet-derived data. React would cost 40 KB+ for a site whose only
stateful component is a lightbox — write that in ~80 lines of vanilla JS.

**Data flow:** a build-time script pulls the Google Sheet via API into
`src/data/library.json`, filtered to `ON_SITE = Y`. Commit the JSON so builds are
reproducible when the sheet is unreachable.

---

## 9. Build order

1. Sheet → JSON pipeline, with the `AI_GENERATED` / `THIRD_PARTY` build-time guard
2. Drive fetch + Sharp processing, with `FILE_ID` caching
3. Tokens and type scale
4. Discipline and set pages — get real images on screen early
5. Overlay menu
6. Home
7. Lightbox
8. About, Prints, Contact
9. Performance and accessibility pass against the §7 targets

---

## 10. Current archive state

At time of writing: **104 images catalogued, 42 sets identified, 84 export-ready.**
Zero rows marked `ON_SITE = Y` — the client is doing that selection pass now.

**Strongest material available today:**
- Munnar Super Select 2017 — 30 finished frames, largest coherent set
- **Varanasi Print Pack 1.1 (2022)** — 16 frames, shot across the city on two bodies over
  four days, finished twice (print + web) with size guide and room mockups. The most
  professionally packaged work in the archive. Lead with this.
- Astro deep-sky 2020–21 — Horsehead, California Nebula, M31, M33
- hi-RES EXPO 2020 — 13 large exports including a Milky Way frame
- Birds Mysuru / Ranganathittu 2024 — 6 DxO-processed frames
- Head-On Photo Awards 2021 — his own competition submission

**Known gaps — do not design around content that does not exist yet:**
- Aero India 2025: 25 DxO-processed DNGs, zero JPEG exports. Needs a local export.
- Gir Asiatic Lions (Jan 2025): processed DNGs loose in `CARD_DUMP_`, no JPEGs.
- Hornbills Valparai 2025: processed, not exported.
- Roughly 19 sets untouched or unassessed.
- Sony Aero 2021: ~40 camera JPEGs, curation started and abandoned.

The archive will grow substantially once those exports run. Build the taxonomy for the
full picture; launch with what is marked `Y`.

---

## 11. Open questions for the client

1. Domain?
2. `MACRO_OTHER` — split into Macro and Food, or drop from launch?
3. Should `ARTWORK` (watercolour, composites) appear at all, or stay on Fizdi only?
4. Is the Fizdi catalogue the print channel, or is a direct print sale wanted later?
5. Aritra's collaborative wildlife work — joint credit, separate section, or omitted?
