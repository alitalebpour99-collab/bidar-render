# The contract between the site and the renderer

Bidar's Reels are planned, written and posted by the site
(<https://bidar.ahura.cloud>). This repository only draws them. The two talk
over HTTP, exactly as Divan's site and `divan-render` do; only the names
changed (`DIVAN_*` became `BIDAR_*`). This file is the whole contract: a site
that follows it can be served by this renderer, and nothing else is assumed.

## Who calls whom

The renderer calls the site. The site never calls the renderer; at most it
starts the GitHub workflow `render.yml` of this repository (a
`workflow_dispatch` with a fine-grained token for this repository only), the
way Divan's site does when something waits.

```
GitHub Actions (render.yml, every 15 min)        bidar.ahura.cloud
  worker.mjs ── GET  /api/social/work?peek=1&can=…   ──▶  {ok, waiting}
             ── GET  /api/social/work?max=1&can=…    ──▶  {ok, jobs:[RenderJob]}   (claims them)
             ── POST /api/social/work?id=7&file=video   (MP4)
             ── POST /api/social/work?id=7&file=cover   (JPEG)
             ── POST /api/social/work?id=7&done=1       {"seconds": 34.2}
          or ── POST /api/social/work?id=7&failed=1     {"error": "…"}
```

## Authentication

Every call carries `Authorization: Bearer <BIDAR_RENDER_SECRET>`.

- The site keeps the secret in its environment (Coolify, app `bidar`) as
  `BIDAR_RENDER_SECRET`, 24 characters or more, and compares it in constant
  time. A missing or short secret on the site refuses every call.
- This repository keeps the same value as the Actions secret
  `BIDAR_RENDER_SECRET`. It is public: the secret is never in a file.
- Wrong or missing secret: `403 {"ok": false, "error": "forbidden"}`.

The renderer does not retry a 4xx answer (it will not change by asking again);
it retries a network error or a 5xx answer twice, after 4 and 8 seconds.

## `GET /api/social/work?peek=1&can=<list>`

A cheap look; claims nothing.

```json
{ "ok": true, "waiting": 2 }
```

`waiting` counts the Reels whose status is `wanted` (or `rendering` but claimed
more than 90 minutes ago) and whose hour is less than 40 hours away, and which
this renderer can draw (see `can`).

## `GET /api/social/work?max=1&can=<list>`

Claims up to `max` jobs (1 to 3, default 3; the worker asks for 1) and returns them.
Claiming sets the row to `rendering` with the time, so a second renderer does
not take it; a claim older than 90 minutes is given out again.

```json
{ "ok": true, "jobs": [RenderJob] }
```

### `can`

The comma-separated list of the optional compositions this bundle holds,
beyond the Reels: `story`, `cards`. **This renderer currently sends `can=`
(empty)**: it draws Reels and their grid tile only. A site must never hand it
a Story or a carousel, and should not plan any while no renderer has said it
can (Divan keeps the last `can` it saw).

### RenderJob

```ts
type RenderJob = {
  id: number;            // the post's row id
  format: string;        // the composition: "borders" | "myth" | "word" | "book" | "quote" | "figure" | "quiz"
  name: string;          // a file-safe name, e.g. "reel-7"
  props: object;         // the composition's props (below), built by the site from its own data
  cover: CoverProps;     // the still tile for the profile grid
  voice?: VoiceLine[] | null; // the narrator; null or absent = a silent Reel (still made); always null for "book"
};

type VoiceLine = {
  cue: string;           // "all" (one take for the whole Reel) or a beat id
  text: string;          // exactly the text sent to ElevenLabs
  b64: string;           // the MP3, base64
  seconds: number;       // its length: the last character's end time
  // Bidar's one addition to Divan's line: ElevenLabs' character alignment,
  // passed through unchanged from POST /v1/text-to-speech/{voice}/with-timestamps.
  // Optional; without it the captions are spread over the line by characters.
  alignment?: {
    characters: string[];
    character_start_times_seconds: number[];
    character_end_times_seconds: number[];
  };
};
```

**The recommended voice is one take per Reel** (`cue: "all"`), because
`eleven_v3` changes its tone between separate calls: `text` is the beats'
`say` joined with `"\n"` in order (`props.beats.map(b => b.say).join("\n")`).
The renderer finds every beat's `say` in that text and starts the beat's
picture where its first character is said, so the picture follows the voice.
The captions are burned in from the same alignment, word by word.

The site sends the take as ElevenLabs returns it. The renderer shortens its
pauses and, by at most 15 % of tempo (pitch kept), brings it toward its
series' length (`VOICE_TARGET` in `voice.mjs`: borders 36 s, myth 32 s, word
36 s of voice), and moves the alignment with it; Shahram's raw takes of
about 500 characters run 45 s.

Lines with a beat id as cue are also accepted (one call per beat, as Divan
makes them): each beat then lasts as long as its line.

Voice settings Bidar uses for the narrated book and these Reels: model
`eleven_v3`, voice **Shahram** `rNb3hdSf0n4ROIbYC8Bl`, `language_code: "fa"`,
`output_format=mp3_44100_128`. Diacritics (ـَ ـِ ـُ) may be put into `say` where
the voice misreads a name (سِند, اَکَدی, بابِل …); the captions drop them.
`scripts/narrate.mjs` in this repository is the reference call.

### A book Reel: the book's own recording, cut here

A job of `format: "book"` («از کتاب») is a passage of about forty seconds of
the site's narrated book «روایتِ ایران». It has **no narrator** (`voice: null`):
its sound is the book's own recording of the section, which the site already
serves publicly, and the renderer cuts it (the site's server has no ffmpeg).

- `props.audioUrl` names the recording:
  `https://bidar.ahura.cloud/book/audio/fa/<chapter>-<section>.mp3` (44.1 kHz
  mono, 64 kbit/s). Only an `https` file under `/book/audio/` of the site (or
  of `BIDAR_URL`'s host) is fetched.
- `props.from` and `props.to` are the cut, in seconds of that file. `to` may
  pass the file's end (a passage that ends its section): the file's end is
  then the cut. The site has already put both in pauses (a paragraph's start,
  a sentence's end).
- `voice.mjs` `bookVoice` fetches the file, cuts it with ffmpeg (`-ss from -t
  to−from`, a 30 ms fade in and a 180 ms fade out, nothing else: **no change
  of pace and no pause taken out**, unlike a narrator's take) and writes it as
  the Reel's one voice line, cue `read`.
- **The captions follow the recorded words**: `props.words` holds every word
  of the passage as the book writes it with its start in seconds after `from`
  (from the site's `public/book/audio/fa/words.json`, the book reader's own
  timing). `bookVoice` turns them into an alignment of ElevenLabs' shape
  (every letter of a word from its start to the next word's start), so
  `src/timeline.ts` times the karaoke as it times a narrator.
- The beats are `start` (the hook, silent, at least 3 s), `read` (the
  passage's words joined by spaces) and `end` (the close, silent).
- No bed (`music.mjs` `hasBed`): the book is read with nothing under it; only
  a soft paper sound at each turn of the leaf.

### «سخنِ ماندگار», «چهره‌ها», «حدس بزن»: the site's shape, and holds

Jobs of `format: "quote"`, `"figure"` and `"quiz"` are narrated like the
first three (one take, `cue: "all"`) and drawn in the site's own shape (bidar
`lib/social/props.ts`; `src/props.ts` QuoteProps, FigureProps, QuizProps). Their
beats are the site's (`src/adapt.ts` derives the same ones when a sample has
none):

- quote: `start` (the name and the epithet), `l1…` (each line of the saying: a
  verse's half or a sentence), `rest` (silent, 1.6 s), `seal` (the name and the
  years), `end` (silent);
- figure: `start`, `life` (silent, 2.6 s: the ruler lights the years up),
  `def`, `f1…` (the facts), `q1…` (a saying, when there is one), `end`;
- quiz: `start` (the question), `o1`–`o3` («یک: …»), `count` (silent, 5 s),
  `answer` («پاسخ: …»), `why`, `end` («تو درست زدی؟ در کامنت بنویس»).

**A hold**: a beat whose `say` is empty, with `min`, between two beats that are
said. In the narrator's one take it is an empty line; `src/timeline.ts` cuts
the take in the pause before the next said beat and plays the rest `min`
seconds later (the voice in pieces: `tl.voice[{file, from, trim, frames}]`). A
silent Reel times it like any silent beat.

A quiz of `kind: "flag"` carries `flag.svg`, the site's own drawing
(`https://bidar.ahura.cloud/flags/<name>.svg`); only such an address is drawn.
The render fetches it like a font: without it the render fails and is tried
again.

## `POST /api/social/work?id=<id>&file=video`

Body: the MP4 (`content-type: video/mp4`), at most 60 MB. The site checks
`ftyp` at byte 4. `{"ok": true}`, or `409 {"ok": false, "error": "…"}` when the
post is not `rendering` or the file is wrong.

## `POST /api/social/work?id=<id>&file=cover`

Body: the JPEG tile (`content-type: image/jpeg`), at most 6 MB, starting `FF D8`.

## `POST /api/social/work?id=<id>&done=1`

Body: `{"seconds": 34.2}`, the video's length. The site checks that the video
and the cover are both in, sets the post `ready`, and shows it to the owner.

## `POST /api/social/work?id=<id>&failed=1`

Body: `{"error": "<first line of the error, at most 240 characters>"}`. The
site counts the try; after three it marks the post `failed` and tells the owner.
The renderer prints nothing of a Reel's content in its log.

## `GET /api/social/busy` (public, no secret)

`{"ok": true, "busy": false}`: whether a render was claimed in the last 90
minutes. For anyone about to deploy onto the shared server. The renderer does
not call it.

## The props

Types are in `src/props.ts`; one example of each is in `samples/`. Every text a
Reel shows comes from the props: nothing is written in the compositions.

```ts
type Beat = { id: string; say: string; min?: number /* seconds, when silent */ };

type Base = {
  format: "borders" | "myth" | "word";
  series: string;      // the series' name, shown small under the mark
  episode: number;
  hook: string;        // the line on screen from the very first frame
  beats: Beat[];       // the narration in order; the first is the hook, the last the close
  source: string;      // the source line, on screen in the last seconds
  sources?: string[];  // the full references (for the caption; not drawn)
  close?: string;      // the last card's line (borders, myth; the word has `cta`)
};

// «مرزهای ایران، دوره به دوره»
type BordersProps = Base & {
  format: "borders";
  stamp: string;                    // «گسترهٔ تقریبی»
  stops: {
    at: string;                     // the beat that shows it
    era: string;                    // a key of src/data/iran-eras.json, or "today"
    name: string;                   // «هخامنشیان»
    years: string;                  // «۵۵۰ تا ۳۳۰ پیش از میلاد»
    line?: string;                  // a short line under the name
    tick: string;                   // its mark on the line of time, «۵۵۰ پ.م»
    capital?: { name: string; lonlat: [number, number] }; // marked on the map
  }[];
};

// «باور یا سند؟»
type MythProps = Base & {
  format: "myth";
  subject: string;                  // «منشورِ کوروش»
  claim: string;                    // the popular claim, drawn in quotes
  evidence: { at: string; n: string; title: string; text: string; chip?: string }[]; // three
  verdict: { at: string; level: "FACT" | "CONTESTED" | "ALLEGATION"; label: string; line: string };
};

// «سفر یک واژه»
type WordProps = Base & {
  format: "word";
  word: string;                     // «پردیس»
  hookWord?: string;                // shown big from the first frame, "paradise"
  hookAt?: [number, number];        // where the camera starts (lon, lat)
  stops: {
    at: string;
    lang: string;                   // «اوستایی»
    form: string;                   // the word in its own script
    script: "avestan" | "greek" | "latin" | "persian";
    roman?: string;                 // transliteration, e.g. "pairi-daēza"
    gloss: string;                  // what it meant there
    when: string;                   // «سدهٔ چهارم پیش از میلاد»
    place: string;                  // «آتن»
    lonlat: [number, number];
  }[];
  cta: string;                      // «برای کسی بفرست که …»
};

// «از کتاب»: a passage of the narrated book (no narrator; see above)
type BookProps = {
  format: "book";
  series: string;
  hook: { text: string; figure: string }; // the chapter's teaser, the section's heading, or a phrase of the passage in «»; «فصلِ سوم»
  source: string;                   // «منبع: از کتابِ روایتِ ایران، فصلِ سوم («…»)»
  foot: string;
  book: string;                     // «روایتِ ایران»
  chapter: { slug: string; num: string; name: string; title: string; heading: string | null };
  audioUrl: string;                 // the section's recording on the site
  from: number;                     // the cut, seconds of that file
  to: number;
  words: { w: string; t: number; p?: 1 }[]; // the passage, timed from `from`; p on a new paragraph's first word
  close: { line: string; url: string };     // «ادامه‌اش در کتاب», «bidar.ahura.cloud/book»
  beats: Beat[];                    // start, read, end
};

type CoverProps = { format: string; series: string; title: string; mark?: string; kicker?: string };
```

The confidence wording and colours of `MythProps.verdict` are Bidar's own
(`CONFIDENCE_META` in `lib/knowledge/types.ts`): FACT «واقعیت مستند» #3FBF7F,
CONTESTED «مورد مناقشه» #E8B54A, ALLEGATION «ادعای اثبات‌نشده» #E2685B.

The map data are copies of the site's `public/data/iran-eras.json` and
`public/data/countries-110m.json` (`src/data/`); after they change on the
site, copy them again (`node sync-data.mjs <path to bidar>`).

## What the site's side has to hold

Mirrors Divan's (`app/api/social/work/route.ts`, `lib/social/run.ts`,
`lib/social/store.ts`): a posts table with `status`
(`wanted → rendering → ready → publishing → published`, or `failed`,
`skipped`, `uncertain`), `render_started_at`, `tries`, `props`, `cover`,
`media_key`; a media table keyed by `(key, kind)` with `kind` in
`video | cover`; and the narrator made at claim time and kept per post, so a
render tried again pays ElevenLabs nothing.
