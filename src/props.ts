// What the site hands the renderer for one Reel (docs/contract.md). Types only:
// the site builds these objects from its own data, and every composition draws
// nothing that is not in them.

/** ElevenLabs' character alignment, as /with-timestamps returns it. */
export type Align = { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] };

/** A narrator's line as the renderer hands it in (voice.mjs): its file in the public folder, its cue, its length. */
export type VoiceIn = { file: string; cue: string; frames: number; text?: string; alignment?: Align | null };

/** One beat of a Reel: what the narrator says during it. The first beat is the hook, the last the close. */
export type Beat = { id: string; say: string; min?: number };

/** A word of the narration on the film's clock (frames), and the beat it belongs to. */
export type Word = { text: string; from: number; to: number; beat: string };

/** Set by the composition's metadata from the beats and the voice (timeline.ts), never by the site. */
export type Timeline = {
  total: number;
  beats: Record<string, { from: number; to: number }>;
  order: string[];
  words: Word[];
  /** the narrator's file, where it starts on the film, and for a take cut at a hold: where in the file the piece starts and how long it plays (frames) */
  voice: { file: string; from: number; trim?: number; frames?: number }[];
  speechEnd: number;
  duck: [number, number][];
};

export type Base = {
  format: "borders" | "myth" | "word" | "book";
  /** the series' name, small beside the mark */
  series: string;
  episode: number;
  /** the line on screen from the very first frame */
  hook: string;
  beats: Beat[];
  /** the source line, on screen in the last seconds */
  source: string;
  /** the full references, for the caption and the record (not drawn) */
  sources?: string[];
  /** the last card's line (borders, myth; the word has its cta) */
  close?: string;
  /** the address under the source line (the site sends «bidar.ahura.cloud») */
  foot?: string;
  /** set by the renderer */
  music?: string;
  voiceIn?: VoiceIn[];
  /** set by calculateMetadata */
  tl?: Timeline;
};

export type BordersStop = {
  /** the beat that shows it */
  at: string;
  /** a key of src/data/iran-eras.json, or "today" */
  era: string;
  /** the extent itself, when the site sends it (GeoJSON); else the era key is drawn */
  geometry?: unknown;
  name: string;
  years: string;
  line?: string;
  /** its short mark on the line of time, e.g. «۵۵۰ پ.م» */
  tick: string;
  /** a capital to mark on the map */
  capital?: { name: string; lonlat: [number, number] };
};
export type BordersProps = Base & { format: "borders"; stamp: string; stops: BordersStop[] };

export type Confidence = "FACT" | "CONTESTED" | "ALLEGATION";
export type MythProps = Base & {
  format: "myth";
  subject: string;
  claim: string;
  evidence: { at: string; n: string; title: string; text: string; chip?: string }[];
  verdict: { at: string; level: Confidence; label: string; line: string };
};

export type WordStop = {
  at: string;
  lang: string;
  form: string;
  script: "avestan" | "greek" | "latin" | "persian";
  roman?: string;
  gloss: string;
  when: string;
  place: string;
  lonlat: [number, number];
};
export type WordProps = Base & {
  format: "word";
  word: string;
  /** the word the hook shows big from the first frame, e.g. "paradise" */
  hookWord?: string;
  /** where the camera starts while the hook is said (the hook word's home) */
  hookAt?: [number, number];
  stops: WordStop[];
  cta: string;
};

/** A word of the book's passage: as the book writes it, its start in seconds after the cut's `from`, `p` on a new paragraph's first word. */
export type BookWord = { w: string; t: number; p?: 1 };
/**
 * «از کتاب»: a passage of the narrated book «روایتِ ایران», read by the book's
 * own recording (no narrator). voice.mjs `bookVoice` fetches `audioUrl`, cuts it
 * between `from` and `to` and times the words for the karaoke; the beats are
 * `start` (the hook, silent), `read` (the passage) and `end` (the close, silent).
 */
export type BookProps = Omit<Base, "close"> & {
  format: "book";
  /** «فصلِ سوم», shown with the hook */
  hookFigure?: string;
  /** «روایتِ ایران» */
  book: string;
  chapter: { slug: string; num: string; name: string; title: string; heading: string | null };
  audioUrl: string;
  from: number;
  to: number;
  words: BookWord[];
  /** the close: «ادامه‌اش در کتاب» and the book's address */
  closeLine: string;
  closeUrl: string;
};

/**
 * The site's own shape, as the formats of 2026-10-29 (quote, figure, quiz;
 * flag, treaty, city) send it (bidar lib/social/props.ts): the compositions read it as it comes,
 * with the beats the site sends (or the ones adapt.ts makes the same way).
 */
export type SiteBase = {
  series: string;
  lang?: "fa";
  hook: { text: string; figure: string | null } | null;
  /** the source line, «منبع: …» (adapt or SourceLine takes the word off) */
  source: string;
  foot?: string;
  beats: Beat[];
  music?: string;
  voiceIn?: VoiceIn[];
  tl?: Timeline;
};
/** A person of the site's dictionary: its id, its term, the profile's epithet, its years in Persian («ح. ۹۴۰–۱۰۲۰ م»). */
export type Who = { id: string; name: string; epithet: string; life: string };

/** «سخنِ ماندگار»: one sourced saying on an illuminated page. Beats: start, l1…, rest (a hold), seal, end. */
export type QuoteProps = SiteBase & {
  format: "quote";
  kicker: string;
  who: Who;
  /** a verse's halves or prose's sentences, as the site writes them */
  lines: string[];
  verse: boolean;
  /** where the saying is written, as the site holds it (English) */
  cite: string;
};

/** «چهره‌ها»: one person as an editorial poster of type (no face, no picture). Beats: start, life (a hold), def, f1…, q1…, end. */
export type FigureProps = SiteBase & {
  format: "figure";
  kicker: string;
  who: Who;
  def: string;
  /** their years; before the common era negative */
  span: { from: number; to: number; about: boolean };
  ruler: { from: number; to: number; end: string };
  eras: { id: string; name: string; from: number; to: number }[];
  /** label "" for a sentence of the profile */
  facts: { label: string; value: string }[];
  quote: { lines: string[]; verse: boolean; cite: string } | null;
};

/** «حدس بزن»: a question with three options and a silent countdown. Beats: start, o1–o3, count (a hold), answer, why, end. */
export type QuizProps = SiteBase & {
  format: "quiz";
  kind: "capital" | "country" | "treaty" | "flag";
  kicker: string;
  question: string;
  options: string[];
  answer: number;
  count: number;
  reveal: string;
  /** the site's own drawing of a flag (https://bidar.ahura.cloud/flags/….svg) */
  flag: { svg: string; name: string } | null;
  cta: string;
};


/** «پرچم‌های ایران»: one flag of the site's /iran/flags, built layer by layer from the site's own picture (src/data/flags.json). */
export type FlagProps = SiteBase & {
  format: "flag";
  title: string;
  flag: {
    id: string;
    name: string;
    years: string;
    /** the site's file, «/flags/flag_04_safavid.svg»: its layers are in src/data/flags.json under its name */
    file: string;
    colors: { hex: string; label: string }[];
    symbols: string;
    meaning: string[];
    tier: Confidence;
    tierLabel: string;
    approx: { stamp: string; basisLabel: string; basis: string | null } | null;
    tricolor: string | null;
  };
  sheet: string;
};

/** «آنچه از دست رفت»: a treaty of the atlas as a document, then its places on a light regional map. */
export type TreatyProps = SiteBase & {
  format: "treaty";
  title: string;
  treaty: { id: string; name: string; year: string; toLabel: string; to: string; sealed: boolean; body: string[]; tier: Confidence; tierLabel: string; note: string[] | null };
  places: { id: string; name: string; today: string; lat: number; lon: number }[];
  todayLabel: string;
  reference: string;
};

/** «شهرها در گذرِ دوره‌ها»: a city of the atlas on a brass astrolabe, the periods before 1979 on its rim. */
export type CityProps = SiteBase & {
  format: "city";
  city: { id: string; name: string; note: string; outside: string | null };
  periods: { id: string; name: string; years: string; held: boolean; capital: boolean }[];
  label: string;
  count: string;
  capitalLabel: string;
};

export type ReelProps = BordersProps | MythProps | WordProps | BookProps | QuoteProps | FigureProps | QuizProps | FlagProps | TreatyProps | CityProps;

/** the site sends `kicker` (the series' name) beside `series` («بیدار · حقیقت، با سند»); the tile shows the kicker when there is one */
export type CoverProps = { format: string; series: string; title: string; mark?: string; kicker?: string };
