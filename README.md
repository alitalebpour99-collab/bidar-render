# bidar-render

The Reels of Bidar's social pages, as a Remotion project. Bidar is a
trilingual encyclopedia of Iran's history and culture: <https://bidar.ahura.cloud>.

This repository only draws. A composition draws exactly what the site hands
it (`src/props.ts`) and nothing else; the plan, the texts, the narration, the
owner's review and the posting live in the site. How the two talk is
[`docs/contract.md`](docs/contract.md): Divan's contract (`divan-render`),
renamed for Bidar.

| file | what |
|---|---|
| `src/Borders.tsx` | «مرزهای ایران، دوره به دوره»: Bidar's period extents on a lapis sea, today's border drawn in gold |
| `src/Myth.tsx` | «باور یا سند؟»: a claim, three pieces of evidence, Bidar's confidence stamp, on parchment |
| `src/Word.tsx` | «سفر یک واژه»: a word travelling over a night-teal map, in each language's own script |
| `src/Book.tsx` | «از کتاب»: a passage of the narrated book «روایتِ ایران» on a parchment leaf, its words lit as the book's own recording reads them, the leaf turning on its spine, the closed lapis cover at the end |
| `src/Flag.tsx` | «پرچم‌های ایران»: a flag of the site's /iran/flags as a vexillologist's drawing (grid, frame, centre and dimension lines), built layer by layer from the site's own SVG (`src/data/flags.json`), a compass sweeping the emblem in, the colours with their names and codes, the stamp «بازسازیِ تقریبی», the flag waving at the end |
| `src/Treaty.tsx` | «آنچه از دست رفت»: a treaty of the atlas as a parchment that unrolls and is sealed in wax, then a light regional map (the region's countries of Natural Earth 1:110m, projected once) where each lost place pins in and its label turns to «امروز: …» |
| `src/City.tsx` | «شهرها در گذرِ دوره‌ها»: a city of the atlas on a brass astrolabe, the periods before 1979 round its rim, those that held the city lit one after another, gold where it was a capital |
| `src/Cover.tsx` | the still tile for the profile grid, in each series' look |
| `src/timeline.ts` | every beat's start and the burned-in captions, from the narrator's character alignment |
| `src/Safe.tsx` | the safe stage (Instagram's 4:5 feed crop, the viewers' buttons) and the captions |
| `src/kit.tsx` | the frame, the type (Vazirmatn; Gulzar for the «بیدار» mark only), motion helpers, sound effects |
| `music.mjs`, `sfx.mjs` | the bed and the effects, synthesized (no sample, no licence); the flag, the treaty and the city have held tones only (an open pad; a low drone with a slow sub pulse; a drone with a swelling fifth) |
| `worker.mjs` | asks the site for work, renders, hands the files back |
| `scripts/narrate.mjs` | narrates a sample with ElevenLabs (eleven_v3, voice Shahram), as the site does |
| `samples/` | one episode of each series: props, narration (MP3 + alignment), tile; `flag-*`, `treaty-*`, `city-*` in the site's own shape, made by its code (bidar `lib/social/drawn.ts`), the narrated ones with their spoken beats; `samples/site/` the same kinds in the site's own shape (bidar `lib/social/props.ts`), silent, for `src/adapt.ts`; `book-1` (chapter 3) and `book-2` (chapter 8) are the book's, made by the site's own code, with no narration file: their sound is fetched from the site |

## Where it runs

On GitHub, in this public repository: public repositories' jobs cost nothing.

- `.github/workflows/render.yml`: `node worker.mjs` in one pass every quarter
  of an hour; a look that finds nothing ends in seconds. It needs the Actions
  secret `BIDAR_RENDER_SECRET` (the same value as on the site); until it is
  set, every look ends at once.
- `.github/workflows/samples.yml`: renders the files in `samples/` and keeps
  the videos as the run's artifact (`mode: stills` for single frames). No key needed.

Never on Ahura's shared server, and not on a small PC: a render is a headless
Chrome drawing for minutes.

## Every Reel

- 1080 × 1920, 30 fps, H.264 at a fixed 2.3 Mbit/s with AAC 160 kbit/s (a Reel
  of 30–40 s is about 9–12 MB), levelled to −14 LUFS (`finish.mjs`).
- Persian and right to left; Vazirmatn for every text, Gulzar for «بیدار».
- The hook is on screen from the first frame and the picture already moves.
- One idea; a cut or a change of motion about every two seconds.
- Captions burned in, word by word with the narrator; the source line on
  screen in the last seconds. The book («از کتاب») has no narrator and no
  bed: its page is its caption, lit word by word with the book's recording.
- Designed on the full frame, drawn on the safe stage (`STAGE_K`): nothing to
  read outside y 290–1590 of the screen, nothing in the lower right rail.

## Look at a format

```bash
npm ci
node build.mjs                                    # the bundle, into bundle/
node render.mjs borders --props samples/borders-1.json --voice samples/borders-1.voice.json --still auto
node render.mjs borders --props samples/borders-1.json --voice samples/borders-1.voice.json
```

Or run the «Samples» workflow and download its artifact.

## Data and fonts

- `src/data/countries-110m.json`: Natural Earth 1:110m (public domain), the
  copy Bidar's site uses (`public/data/countries-110m.json`).
- `src/data/iran-eras.json`: Bidar's period extents
  (`public/data/iran-eras.json`), simplified from
  [aourednik/historical-basemaps](https://github.com/aourednik/historical-basemaps);
  approximate, and shown as such. Credited as on the site's atlas page.
- `src/data/flags.json`: the site's flag pictures (`public/flags/flag_*.svg`,
  Wikimedia Commons based or the site's own approximate reconstructions),
  split into their layers in the file's order: the field (a layer as large as
  the flag), the stripes (as wide as it), the emblem (the rest). Today's flag
  is not copied: the lane never shows it.
- After any of them changes on the site: `node sync-data.mjs <path to bidar>`
  (`--check` only says whether they differ).
- Vazirmatn, Gulzar, Noto Serif and Noto Sans Avestan (SIL Open Font
  License), loaded from Google Fonts at render time.
