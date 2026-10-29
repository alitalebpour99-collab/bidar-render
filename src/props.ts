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
  voice: { file: string; from: number }[];
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

export type ReelProps = BordersProps | MythProps | WordProps | BookProps;

/** the site sends `kicker` (the series' name) beside `series` («بیدار · حقیقت، با سند»); the tile shows the kicker when there is one */
export type CoverProps = { format: string; series: string; title: string; mark?: string; kicker?: string };
