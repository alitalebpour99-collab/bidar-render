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
| `src/Quote.tsx` | «سخنِ ماندگار»: one sourced saying on an illuminated page: a lapis ground with paper grain and gold flecks, a tazhib frame drawn on with the pen, the saying inked word by word as it is read (a verse in Gulzar, prose in Naskh), the speaker's round cinnabar seal, the source line in Naskh |
| `src/Figure.tsx` | «چهره‌ها»: one person as a Swiss poster of type only (no face, no picture): the name huge, a disc in the era's colour, a ruler of five thousand years on which the life lights up and opens into a close-up, the dictionary's line and facts on cards that flip in, a saying to close |
| `src/Quiz.tsx` | «حدس بزن»: a game show: the question (a flag question shows the site's own flag), three pills that pop in as they are read, a ring counting five silent seconds with a soft tick, the reveal (green, a check, a burst), the line of context and «تو درست زدی؟ در کامنت بنویس» |
| `src/Cover.tsx` | the still tile for the profile grid, in each series' look |
| `src/timeline.ts` | every beat's start and the burned-in captions, from the narrator's character alignment; a silent beat with `min` between two said ones is a hold: the one take is cut there and plays on after it |
| `src/Safe.tsx` | the safe stage (Instagram's 4:5 feed crop, the viewers' buttons) and the captions |
| `src/kit.tsx` | the frame, the type (Vazirmatn; Gulzar for the «بیدار» mark only), motion helpers, sound effects |
| `music.mjs`, `sfx.mjs` | the bed and the effects, synthesized (no sample, no licence) |
| `worker.mjs` | asks the site for work, renders, hands the files back |
| `scripts/narrate.mjs` | narrates a sample with ElevenLabs (eleven_v3, voice Shahram), as the site does |
| `samples/` | one episode of each series: props, narration (MP3 + alignment), tile; `samples/site/` the same kinds in the site's own shape (bidar `lib/social/props.ts`), silent, for `src/adapt.ts`; `book-1` (chapter 3) and `book-2` (chapter 8) are the book's, made by the site's own code, with no narration file: their sound is fetched from the site; `quote-1`/`-2`, `figure-1`/`-2`, `quiz-1`/`-2` were made by the site's own code (bidar `feat/social-formats-a`), the `-1` of each narrated |

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
  The quote, the figure and the quiz have no burned-in captions either: what
  the narrator says is the text on screen, inked, wiped in or popped in as it
  is said. Their beds are dark, minimal drones (a sub pulse under the figure
  and the quiz); no piano, no santur.
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
- After either changes on the site: `node sync-data.mjs <path to bidar>`.
- Vazirmatn, Gulzar, Noto Serif and Noto Sans Avestan (SIL Open Font
  License), loaded from Google Fonts at render time.
