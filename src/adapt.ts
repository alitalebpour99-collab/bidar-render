// The site's props (bidar, lib/social/props.ts, docs/social.md) as the
// compositions read them (src/props.ts). The site sends its own shape: borders
// as `frames`, a myth as `claim` and `reality[]`, a word as `chain[]`, a passage
// of the book as `words[]` with its recording's cut, and a hook as {text, figure}. This turns that into beats (what is said, or shown as
// captions when the Reel has no narrator) and the stops each layout draws. It
// adds no fact: every text comes from the props; only the map places of a
// word's languages and the scripts are the renderer's (LANG_PLACE below).
// Props that already carry `beats` (samples/*.json) pass through unchanged,
// as do the site's own `beats` when it sends them (docs/contract.md).
// The flag, the treaty and the city keep the site's shape as it comes; only
// their beats are made here when the site sends none (flagBeats, treatyBeats,
// cityBeats: bidar lib/social/beats.ts line by line).
import { ERAS } from "./geo";
import { faDigits } from "./kit";
import type { Beat, BookProps, BookWord, BordersProps, BordersStop, MythProps, ReelProps, WordProps, WordStop } from "./props";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Site = Record<string, any>;

const hookText = (p: Site, fallback: string) => (typeof p.hook === "string" ? p.hook : (p.hook?.text ?? fallback)) as string;
const sourceText = (s: unknown) => String(s ?? "").replace(/^\s*منبع\s*[:：]\s*/, "");
const end = (s: string) => (/[.؟!…»]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);
/** the site's own beats, when it sends them, else the ones made here */
const beatsOr = (p: Site, made: Beat[]): Beat[] => (Array.isArray(p.beats) && p.beats.length ? p.beats : made);

/** «۵۵۰–۳۳۰ پ.م» → «۵۵۰ پ.م»; «۲۴۷ پ.م – ۲۲۴ م» → «۲۴۷ پ.م»; «۱۵۰۱–۱۷۳۶ م» → «۱۵۰۱ م» */
function tickOf(years: string): string {
  const first = years.split(/\s*[–—-]\s*/)[0].replace(/^[≈~]/, "").trim();
  if (/پ\.?\s*م|م$/.test(first)) return first;
  const era = /پ\.?\s*م/.test(years) && !/[–—-].*\sم$/.test(years) ? "پ.م" : "م";
  return `${first} ${era}`;
}

function borders(p: Site): BordersProps {
  const frames: Site[] = p.frames ?? [];
  const stops: BordersStop[] = frames.map((f) => ({
    at: String(f.id),
    era: ERAS[f.id] ? String(f.id) : `geo:${f.id}`,
    geometry: f.geometry ?? null,
    name: String(f.name),
    years: String(f.years),
    line: f.extent ?? f.government ?? undefined,
    tick: tickOf(String(f.years)),
    capital: f.capitals?.[0] ? { name: String(f.capitals[0].name), lonlat: [Number(f.capitals[0].lon), Number(f.capitals[0].lat)] } : undefined,
  }));
  // today's outline closes the Reel in gold, as the reference the site draws faint
  stops.push({ at: "today", era: "today", name: String(p.today?.label ?? "مرزهای امروز"), years: "", tick: "امروز" });
  const made: Beat[] = [
    { id: "start", say: end(hookText(p, p.title ?? "")) },
    ...frames.map((f) => ({ id: String(f.id), say: end(`${f.name}، ${f.years}. ${f.extent ?? ""}`) })),
    { id: "today", say: end(String(p.today?.label ?? "مرزهای امروز")), min: 2.4 },
    { id: "end", say: p.caveat ? end(String(p.caveat)) : "", min: 3 },
  ];
  return { format: "borders", series: String(p.series ?? ""), episode: 0, hook: hookText(p, p.title ?? ""), beats: beatsOr(p, made), source: sourceText(p.source), stamp: "گسترهٔ تقریبی", stops, close: p.caveat ?? p.title, foot: p.foot } as BordersProps;
}

function myth(p: Site): MythProps {
  const reality: string[] = (p.reality ?? []).slice(0, 3);
  const evidence = reality.map((text, i) => ({ at: `e${i + 1}`, n: faDigits(i + 1), title: i === 0 ? String(p.realityLabel ?? "") : "", text: String(text) }));
  const made: Beat[] = [
    { id: "start", say: end(String(p.claim ?? hookText(p, ""))) },
    ...evidence.map((e) => ({ id: e.at, say: e.text })),
    { id: "verdict", say: end(String(p.verdict?.label ?? "")), min: 2.6 },
    { id: "end", say: "", min: 3 },
  ];
  return {
    format: "myth",
    series: String(p.series ?? ""),
    episode: 0,
    hook: String(p.claimLabel ?? "باور رایج"),
    beats: beatsOr(p, made),
    source: sourceText(p.source),
    subject: String(p.topic ?? ""),
    claim: String(p.claim ?? ""),
    evidence,
    verdict: { at: "verdict", level: p.verdict?.tier ?? "CONTESTED", label: String(p.verdict?.label ?? ""), line: "" },
    foot: p.foot,
  } as MythProps;
}

/** Where a language is set on the map (lon, lat), and the name of that place. The renderer's, not a fact the Reel states. */
const LANG_PLACE: [RegExp, [number, number], string][] = [
  [/اوستا/, [54.5, 32.5], "فلات ایران"],
  [/پارسی|فارسی|پهلوی/, [51.39, 35.69], "ایران"],
  [/کتاب.?مقدس|هفتادتنان/, [29.92, 31.2], "اسکندریه"],
  [/یونان/, [23.73, 37.98], "آتن"],
  [/لاتین/, [12.5, 41.9], "رم"],
  [/ایتالیا/, [12.33, 45.44], "ونیز"],
  [/فرانس/, [2.35, 48.86], "پاریس"],
  [/انگلیس/, [-0.13, 51.51], "لندن"],
  [/آلمان/, [13.4, 52.52], "برلین"],
  [/عرب/, [44.37, 33.31], "بغداد"],
  [/ترک/, [28.98, 41.01], "استانبول"],
  [/ارمن/, [44.51, 40.18], "ایروان"],
  [/سغد/, [67.0, 39.65], "سمرقند"],
  [/هند|سنسکریت/, [77.2, 28.6], "دهلی"],
];
const placeOf = (lang: string): { lonlat: [number, number]; place: string } => {
  const hit = LANG_PLACE.find(([re]) => re.test(lang));
  return hit ? { lonlat: hit[1], place: hit[2] } : { lonlat: [51.39, 35.69], place: "ایران" };
};
const scriptOf = (form: string): WordStop["script"] => (/[\u{10B00}-\u{10B3F}]/u.test(form) ? "avestan" : /[Ͱ-Ͽἀ-῿]/.test(form) ? "greek" : /[؀-ۿ]/.test(form) ? "persian" : "latin");

function word(p: Site): WordProps {
  const chain: Site[] = p.chain ?? [];
  const stops: WordStop[] = chain.map((c, i) => ({ at: `s${i + 1}`, lang: String(c.lang), form: String(c.form), script: scriptOf(String(c.form)), gloss: String(c.meaning ?? ""), when: "", ...placeOf(String(c.lang)) }));
  // the word comes home: its Persian relative, with the line that ties it together
  if (p.persian && !(stops.length && stops[stops.length - 1].form === p.persian)) stops.push({ at: "home", lang: "فارسی", form: String(p.persian), script: "persian", gloss: String(p.note ?? ""), when: "", lonlat: [51.39, 35.69], place: "ایران" });
  const made: Beat[] = [
    { id: "start", say: end(hookText(p, p.word ?? "")) },
    ...stops.map((s) => ({ id: s.at, say: s.at === "home" ? end(s.gloss || s.form) : end(`${s.lang}: ${s.form}، ${s.gloss}`) })),
    { id: "end", say: "", min: 3 },
  ];
  return {
    format: "word",
    series: String(p.series ?? ""),
    episode: 0,
    hook: hookText(p, ""),
    hookWord: String(p.hook?.figure ?? p.word ?? ""),
    hookAt: stops.length ? stops[stops.length - (stops[stops.length - 1]?.at === "home" ? 2 : 1)].lonlat : undefined,
    word: String(p.persian ?? p.word ?? ""),
    beats: beatsOr(p, made),
    stops,
    cta: String(p.cta ?? ""),
    source: sourceText(p.source),
    foot: p.foot,
  } as WordProps;
}

/**
 * «از کتاب»: the passage as the site sends it (lib/social/props.ts BookProps).
 * Beats: the hook (silent), the passage's words joined by spaces (played by the
 * book's recording, voice.mjs bookVoice), the close (silent), exactly as the
 * site's lib/social/beats.ts makes them.
 */
function book(p: Site): BookProps {
  const words: BookWord[] = (p.words ?? []).map((w: Site) => ({ w: String(w.w), t: Number(w.t) || 0, ...(w.p ? { p: 1 as const } : {}) }));
  const made: Beat[] = [
    { id: "start", say: end(hookText(p, p.chapter?.title ?? "")), min: 3 },
    { id: "read", say: words.map((w) => w.w).join(" ") },
    { id: "end", say: "", min: 1.5 },
  ];
  return {
    format: "book",
    series: String(p.series ?? ""),
    episode: 0,
    hook: hookText(p, String(p.chapter?.title ?? "")),
    hookFigure: String(p.hook?.figure ?? p.chapter?.name ?? ""),
    beats: beatsOr(p, made),
    source: sourceText(p.source),
    foot: p.foot,
    book: String(p.book ?? "روایتِ ایران"),
    chapter: { slug: String(p.chapter?.slug ?? ""), num: String(p.chapter?.num ?? ""), name: String(p.chapter?.name ?? ""), title: String(p.chapter?.title ?? ""), heading: p.chapter?.heading ? String(p.chapter.heading) : null },
    audioUrl: String(p.audioUrl ?? ""),
    from: Number(p.from) || 0,
    to: Number(p.to) || 0,
    words,
    closeLine: String(p.close?.line ?? p.closeLine ?? "ادامه‌اش در کتاب"),
    closeUrl: String(p.close?.url ?? p.closeUrl ?? "bidar.ahura.cloud/book"),
  };
}

// ---------- the three formats that keep the site's own shape ----------
// (bidar lib/social/beats.ts flagBeats, treatyBeats, cityBeats, line by line)

/** «پرچم‌های ایران»: the hook, the name and years (the field), the colours (the stripes), the emblem, the meaning, the stamp or trust label, a silent close (the flag waves). */
export function flagBeats(p: Site): Beat[] {
  const f = p.flag ?? {};
  const basis = f.approx?.basis ? `${f.approx.basisLabel} ${f.approx.basis}` : "";
  return [
    { id: "start", say: end(hookText(p, f.name ?? "")) },
    { id: "field", say: end(`${f.name}، ${f.years}`) },
    { id: "colors", say: end(`رنگ‌ها: ${(f.colors ?? []).map((c: Site) => c.label).join("، ")}`) },
    { id: "emblem", say: end(`نشان: ${f.symbols}`) },
    ...((f.meaning ?? []) as string[]).slice(0, 3).map((text, i) => ({ id: `m${i + 1}`, say: String(text) })),
    { id: "stamp", say: f.approx ? end([f.approx.stamp, basis].filter(Boolean).join("؛ ")) : end(String(f.tierLabel ?? "")), min: 2.6 },
    { id: "end", say: "", min: 3.5 },
  ];
}

/** «آنچه از دست رفت»: the hook, the document, the record, today's countries, the note or the trust label, a silent close. */
export function treatyBeats(p: Site): Beat[] {
  const t = p.treaty ?? {};
  const todays = [...new Set(((p.places ?? []) as Site[]).map((x) => String(x.today)))];
  const note = ((t.note ?? []) as string[]).slice(0, 2);
  return [
    { id: "start", say: end(hookText(p, t.name ?? "")) },
    { id: "doc", say: end(`${t.name}، ${t.year}. ${t.sealed ? `${t.toLabel} ${t.to}` : t.to}`) },
    ...((t.body ?? []) as string[]).slice(0, 4).map((text, i) => ({ id: `b${i + 1}`, say: String(text) })),
    { id: "today", say: end(`${p.todayLabel}: ${todays.join("، ")}`) },
    ...(note.length ? note.map((text, i) => ({ id: `n${i + 1}`, say: String(text) })) : [{ id: "verdict", say: end(String(t.tierLabel ?? "")), min: 2.4 }]),
    { id: "end", say: "", min: 3 },
  ];
}

/** Where a span of years begins, with its era: «۵۵۰–۳۳۰ پ.م» → «۵۵۰ پ.م», «≈۸۲۰–۱۲۱۹ م» → «≈۸۲۰ م». */
export function startOf(years: string): string {
  const first = years.split(/\s*[–—-]\s*/)[0].trim();
  if (/پ\.?\s*م$|\sم$/.test(first)) return first;
  const era = /پ\.?\s*م/.test(years) && !/[–—-].*\sم$/.test(years) ? "پ.م" : "م";
  return `${first} ${era}`;
}

/** «شهرها در گذرِ دوره‌ها»: the hook, one beat per period that held the city, where it is, a silent close. */
export function cityBeats(p: Site): Beat[] {
  const c = p.city ?? {};
  return [
    { id: "start", say: end(hookText(p, c.name ?? "")) },
    ...((p.periods ?? []) as Site[]).filter((x) => x.held).map((x) => ({ id: String(x.id), say: end(`${x.name}، از ${startOf(String(x.years))}${x.capital ? `. ${p.capitalLabel}` : ""}`) })),
    { id: "note", say: end([`${c.name}، ${c.note}`, c.outside].filter(Boolean).join(". ")) },
    { id: "end", say: "", min: 3 },
  ];
}

/** Props in either shape → the compositions' own. */
export function adapt<P extends ReelProps>(p: P | Site): P {
  const s = p as Site;
  // the site's own shape, its beats (or the same ones made here)
  if (s.format === "flag" && s.flag) return { ...s, beats: beatsOr(s, flagBeats(s)) } as P;
  if (s.format === "treaty" && s.treaty && Array.isArray(s.places)) return { ...s, beats: beatsOr(s, treatyBeats(s)) } as P;
  if (s.format === "city" && s.city && Array.isArray(s.periods)) return { ...s, beats: beatsOr(s, cityBeats(s)) } as P;
  if (s.format === "book" && Array.isArray(s.words)) return { ...book(s), music: s.music, voiceIn: s.voiceIn } as unknown as P;
  if (Array.isArray(s.beats) && s.beats.length && (s.stops || s.evidence)) return { ...s, source: sourceText(s.source) } as P;
  if (s.format === "borders" && Array.isArray(s.frames)) return { ...borders(s), music: s.music, voiceIn: s.voiceIn } as unknown as P;
  if (s.format === "myth" && Array.isArray(s.reality)) return { ...myth(s), music: s.music, voiceIn: s.voiceIn } as unknown as P;
  if (s.format === "word" && Array.isArray(s.chain)) return { ...word(s), music: s.music, voiceIn: s.voiceIn } as unknown as P;
  return p as P;
}
