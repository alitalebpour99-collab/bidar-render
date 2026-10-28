// The Reel's clock comes from its narrator. The site sends the beats (each with
// what is said during it) and, usually, one take of the whole narration with
// ElevenLabs' character alignment (docs/contract.md). Every beat's picture
// starts where its first character is said, so picture and voice cannot drift
// apart; the captions are cut from the same alignment, word by word.
// A Reel without a voice is timed from its texts and still shows captions.
import { FPS, plain } from "./kit";
import type { Align, Beat, Timeline, VoiceIn, Word } from "./props";

/** the narrator starts this many frames after the first frame (the hook is on screen from frame 0) */
const VOICE_AT = 5;
/** a cut lands a few frames before the word that belongs to it */
const CUT_LEAD = 5;
/** between two separate lines (one call per beat) */
const GAP = 7;
/** after the last word: the close and the source line stand (the source line shows in the last 2.6 s) */
const TAIL = Math.round(2.8 * FPS);
/** no beat is shorter than this */
const MIN_BEAT = Math.round(1.2 * FPS);

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);
/** a silent beat: about three words a second and a breath */
const silentFrames = (b: Beat) => Math.max(Math.round((b.min ?? 0) * FPS), Math.round((words(b.say).length * 0.36 + 0.8) * FPS));

/** The words of a text with their character ranges. */
function spans(text: string): { w: string; a: number; b: number }[] {
  const out: { w: string; a: number; b: number }[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push({ w: m[0], a: m.index, b: m.index + m[0].length });
  return out;
}

/** Start and end (seconds) of every character, from the alignment or, without one, spread evenly. */
function charTimes(text: string, seconds: number, al?: Align | null): { s: number[]; e: number[] } {
  if (al && al.characters?.length && al.characters.join("") === text) return { s: al.character_start_times_seconds, e: al.character_end_times_seconds };
  if (al && al.characters?.length === text.length) return { s: al.character_start_times_seconds, e: al.character_end_times_seconds };
  const n = Math.max(1, text.length);
  const s = Array.from({ length: n }, (_, i) => (seconds * i) / n);
  const e = Array.from({ length: n }, (_, i) => (seconds * (i + 1)) / n);
  return { s, e };
}

/** Words of a line on the film's clock (frames), from where the line starts. */
function lineWords(text: string, seconds: number, al: Align | null | undefined, at: number, beatOf: (charIndex: number) => string): Word[] {
  const t = charTimes(text, seconds, al);
  return spans(text).map(({ w, a, b }) => ({
    text: plain(w),
    from: at + Math.round((t.s[a] ?? 0) * FPS),
    to: at + Math.round((t.e[b - 1] ?? seconds) * FPS),
    beat: beatOf(a),
  }));
}

export function timeline(beats: Beat[], voiceIn: VoiceIn[] | undefined): Timeline {
  const lines = (voiceIn ?? []).filter((l) => l.frames > 0);
  const all = lines.find((l) => l.cue === "all");
  const from: Record<string, number> = {};
  let words: Word[] = [];
  const voice: { file: string; from: number }[] = [];
  let end = 0;

  if (all) {
    // one take: every beat begins where its first character is said
    const text = all.text ?? beats.map((b) => b.say).join("\n");
    const seconds = all.frames / FPS;
    const t = charTimes(text, seconds, all.alignment);
    const starts: number[] = [];
    let cursor = 0;
    for (const b of beats) {
      let i = text.indexOf(b.say, cursor);
      if (i < 0) i = text.indexOf(words(b.say)[0] ?? "", cursor);
      if (i < 0) i = cursor;
      starts.push(i);
      cursor = i + Math.max(1, b.say.length);
    }
    beats.forEach((b, k) => {
      from[b.id] = k === 0 ? 0 : Math.max(VOICE_AT + Math.round((t.s[starts[k]] ?? 0) * FPS) - CUT_LEAD, 0);
    });
    const beatOf = (c: number) => beats[Math.max(0, starts.findLastIndex((s) => s <= c))].id;
    words = lineWords(text, seconds, all.alignment, VOICE_AT, beatOf);
    voice.push({ file: all.file, from: VOICE_AT });
    end = VOICE_AT + all.frames;
  } else if (lines.length) {
    // one line per beat: each beat lasts as long as its line
    let at = VOICE_AT;
    beats.forEach((b, k) => {
      from[b.id] = k === 0 ? 0 : Math.max(0, at - CUT_LEAD);
      const line = lines.find((l) => l.cue === b.id);
      if (line) {
        voice.push({ file: line.file, from: at });
        words.push(...lineWords(line.text ?? b.say, line.frames / FPS, line.alignment, at, () => b.id));
        at += line.frames + GAP;
      } else {
        // a beat without its line: its text is shown as captions over its silent length
        const len = silentFrames(b);
        words.push(...lineWords(b.say, len / FPS, null, at, () => b.id));
        at += len;
      }
    });
    end = at - GAP;
  } else {
    // no voice: the texts set the pace; the captions still run
    let at = VOICE_AT;
    beats.forEach((b, k) => {
      from[b.id] = k === 0 ? 0 : Math.max(0, at - CUT_LEAD);
      const len = silentFrames(b);
      words.push(...lineWords(b.say, (len - 10) / FPS, null, at, () => b.id));
      at += len;
    });
    end = at;
  }

  // no beat shorter than MIN_BEAT: a late beat pushes the ones after it
  const order = beats.map((b) => b.id);
  for (let k = 1; k < order.length; k += 1) from[order[k]] = Math.max(from[order[k]], from[order[k - 1]] + MIN_BEAT);
  const total = Math.max(end + TAIL, from[order[order.length - 1]] + MIN_BEAT + TAIL);
  const span: Timeline["beats"] = {};
  order.forEach((id, k) => (span[id] = { from: from[id], to: k + 1 < order.length ? from[order[k + 1]] : total }));
  // the score steps back under the voice: the stretches where words are said, joined across short breaths
  const duck: [number, number][] = [];
  for (const w of words) {
    const last = duck[duck.length - 1];
    if (last && w.from - last[1] < 18) last[1] = Math.max(last[1], w.to);
    else duck.push([w.from, w.to]);
  }
  return { total, beats: span, order, words, voice, speechEnd: end, duck };
}

/**
 * The captions: a few words at a time. A clause (up to a punctuation mark) is
 * never mixed with the next one and never crosses a beat; a long clause is cut
 * into even pieces (five words: three and two), so no word is left alone.
 */
export type Chunk = { words: Word[]; from: number; to: number };
export function chunks(ws: Word[], maxWords = 4, maxChars = 26): Chunk[] {
  const clauses: Word[][] = [];
  let cur: Word[] = [];
  for (const w of ws) {
    if (cur.length && cur[0].beat !== w.beat) {
      clauses.push(cur);
      cur = [];
    }
    cur.push(w);
    if (/[.،؛؟!:…»]$/.test(w.text)) {
      clauses.push(cur);
      cur = [];
    }
  }
  if (cur.length) clauses.push(cur);
  const out: Chunk[] = [];
  const len = (g: Word[]) => g.map((x) => x.text).join(" ").length;
  for (const c of clauses) {
    // as few pieces as fit the limits, each about as long as the others
    let n = Math.max(1, Math.ceil(c.length / maxWords), Math.ceil(len(c) / maxChars));
    n = Math.min(n, c.length);
    let at = 0;
    for (let k = 0; k < n; k += 1) {
      const size = Math.round((c.length - at) / (n - k));
      const g = c.slice(at, at + size);
      at += size;
      out.push({ words: g, from: g[0].from, to: g[g.length - 1].to });
    }
  }
  // each chunk stays until the next one comes, unless the voice pauses long
  for (let i = 0; i < out.length; i += 1) {
    const next = out[i + 1];
    out[i].from = Math.max(0, out[i].from - 3);
    out[i].to = next && next.from - out[i].to < 24 ? next.from - 3 : out[i].to + 12;
  }
  return out;
}
