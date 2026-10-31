// «از کتاب»: a passage of the narrated book «روایتِ ایران», played by the book's
// own recording (voice.mjs bookVoice cuts it; no narrator, no music). Its look is
// the site's reader (components/book of bidar): a parchment leaf with a double
// gold jadval on a lapis night, the book's Naskh, the section's heading in
// Gulzar, and the word being read lit as a gold pill (the reader's .bw-active).
// The hook stands on the chapter's title page; the leaf turns on its spine (on
// the right, as a Persian book) into the passage, again between its pages, and
// once more onto the closed lapis cover: «ادامه‌اش در کتاب».
// Kept light for GitHub's software GL: no map, no blur, no filter; gradients,
// a few 3D turns and text.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { loadFont as loadNaskh } from "@remotion/google-fonts/NotoNaskhArabic";
import { DESIGN_TOP, FPS, GULZAR, Mark, Sfx, SourceLine, VAZIR, clamped, ease, fade, rise } from "./kit";
import type { BookProps, BookWord, Word } from "./props";
import { Stage, beatAt } from "./Safe";

export const { fontFamily: NASKH } = loadNaskh("normal", { weights: ["400", "700"], subsets: ["arabic", "latin"] });

/** The reader's palette (bidar app/globals.css: .book-parchment, BookCover3D's leather, .bw-active). */
export const LEAF = {
  night: "#0b1738",
  night2: "#060d20",
  leather: "radial-gradient(120% 90% at 30% 15%, #1c3372 0%, #122250 42%, #0b1738 78%, #081128 100%)",
  gold: "#e8c56a",
  gold2: "#c9a24d",
  goldDeep: "#9a6a14",
  heading: "#8a5e12",
  paper: "#ecdcbb",
  ink: "#2a2118",
  ink2: "#5a4a2e",
  lapis: "#0a1a3f",
  cream: "#f3e7c8",
};

/** The leaf on the design frame: the spine on its right edge. */
const PAGE = { x: 96, y: 214, w: 888, h: 1280 };
/** A turn of the leaf, in frames. */
const TURN = 18;
/** A page of the passage holds about this many words before it is cut at a sentence's end. */
const PAGE_WORDS = 46;

// ---------- pages ----------
type PageWords = { from: number; to: number };
const endsSentence = (w: string) => /[.؟!؛][»)"]?$/.test(w) && !/^(?:[؀-ۿ]|پ\.م)\.$/.test(w);
const endsClause = (w: string) => /[،:؛.؟!][»)"]?$/.test(w);

/** The passage's words cut into pages: as few as hold PAGE_WORDS each, each cut on the sentence end nearest its share (else a clause's, else a word). */
export function paginate(words: BookWord[]): PageWords[] {
  const n = words.length;
  const count = Math.max(1, Math.ceil(n / PAGE_WORDS));
  const cuts: number[] = [];
  for (let k = 1; k < count; k += 1) {
    const aim = Math.round((k * n) / count);
    const lo = (cuts[cuts.length - 1] ?? 0) + 10;
    const hi = n - 10;
    const near = (test: (w: string) => boolean) => {
      let best = -1;
      for (let i = lo; i < hi; i += 1) if (test(words[i - 1].w) && (best < 0 || Math.abs(i - aim) < Math.abs(best - aim))) best = i;
      return best >= 0 && Math.abs(best - aim) <= n / count / 1.6 ? best : -1;
    };
    const at = [near(endsSentence), near(endsClause)].find((i) => i > 0) ?? Math.min(hi, Math.max(lo, aim));
    if (at > lo - 10 && at < n) cuts.push(at);
  }
  const edges = [0, ...cuts, n];
  return edges.slice(0, -1).map((a, i) => ({ from: a, to: edges[i + 1] }));
}

/** The text's size for a page of `n` words, so that it fills the leaf without spilling. */
const sizeFor = (n: number) => (n <= 34 ? 52 : n <= 42 ? 49 : n <= 50 ? 45 : n <= 60 ? 41 : 38);

// ---------- the pieces ----------
const Ground: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [0, total], [42, 52]);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1150px 1350px at 50% ${y}%, #15295e 0%, ${LEAF.night} 56%, ${LEAF.night2} 100%)` }}>
      {/* the reading lamp: the book is the brightest thing on screen */}
      <AbsoluteFill style={{ background: "radial-gradient(closest-side at 50% 47%, rgba(232,197,106,.14), rgba(10,26,63,0) 72%)" }} />
      {/* a faint lattice in gold, like a tooled endpaper */}
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(232,197,106,.03) 0 2px, transparent 2px 72px), repeating-linear-gradient(-45deg, rgba(232,197,106,.03) 0 2px, transparent 2px 72px)" }} />
    </AbsoluteFill>
  );
};

/** An eight-pointed shamseh, drawn (no glyph that a font may lack). */
const Shamseh: React.FC<{ size: number; color: string; fill?: string }> = ({ size, color, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
    <rect x="21" y="21" width="58" height="58" fill={fill} stroke={color} strokeWidth="3.2" />
    <rect x="21" y="21" width="58" height="58" fill={fill} stroke={color} strokeWidth="3.2" transform="rotate(45 50 50)" />
    <circle cx="50" cy="50" r="13" fill="none" stroke={color} strokeWidth="3" />
    <circle cx="50" cy="50" r="4" fill={color} />
  </svg>
);

/** The illuminated band (سرلوح) that opens a leaf. */
const Sarlowh: React.FC<{ width: number }> = ({ width }) => (
  <div style={{ width, height: 9, margin: "0 auto", borderRadius: 99, background: "linear-gradient(90deg, transparent, rgba(154,106,20,.55), rgba(232,197,106,.85), rgba(154,106,20,.55), transparent)" }} />
);

/** A parchment leaf: the reader's paper, its double gold jadval, the gutter's shadow at the spine. */
const Paper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      borderRadius: 12,
      overflow: "hidden",
      background: `radial-gradient(130% 120% at 50% -10%, rgba(255,251,238,.75), rgba(0,0,0,0) 55%), radial-gradient(90% 70% at 0% 110%, rgba(120,86,40,.16), rgba(0,0,0,0) 60%), radial-gradient(90% 70% at 100% 110%, rgba(120,86,40,.16), rgba(0,0,0,0) 60%), ${LEAF.paper}`,
      boxShadow: "inset 0 0 0 16px rgba(196,154,46,.10), inset 0 0 0 18px rgba(154,106,20,.62), inset 0 0 0 24px rgba(196,154,46,.16), inset 0 0 0 25px rgba(154,106,20,.42), inset 0 0 110px rgba(120,86,40,.26)",
    }}
  >
    {/* the paper's fibres */}
    <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(83deg, rgba(120,85,40,.035) 0 1px, transparent 1px 9px), repeating-linear-gradient(-71deg, rgba(120,85,40,.03) 0 1px, transparent 1px 13px)" }} />
    {/* the gutter: pages are never lit evenly near the spine */}
    <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: 90, background: "linear-gradient(to left, rgba(60,40,10,.30), rgba(60,40,10,0))" }} />
    {children}
  </div>
);

/** A leaf that turns on the spine (its right edge): the free edge lifts and swings over to the right. */
const Leaf: React.FC<{ turnAt: number | null; z: number; children: React.ReactNode }> = ({ turnAt, z, children }) => {
  const frame = useCurrentFrame();
  const a = turnAt === null ? 0 : interpolate(frame, [turnAt, turnAt + TURN], [0, 180], { ...clamped, easing: ease });
  if (a >= 179) return null;
  const lift = Math.sin((a * Math.PI) / 180);
  return (
    <div style={{ position: "absolute", left: PAGE.x, top: PAGE.y, width: PAGE.w, height: PAGE.h, zIndex: z, perspective: 2600, perspectiveOrigin: "100% 50%" }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: "right center", transform: `rotateY(${a}deg)`, backfaceVisibility: "hidden" }}>
        {children}
        {/* the turning leaf darkens as it rises, and a gloss runs over it */}
        {a > 0 ? <div style={{ position: "absolute", inset: 0, borderRadius: 12, background: `linear-gradient(105deg, rgba(40,25,5,${0.32 * lift}) 0%, rgba(255,248,225,${0.35 * lift}) ${30 + a / 3}%, rgba(40,25,5,${0.12 * lift}) 100%)` }} /> : null}
      </div>
    </div>
  );
};

/** The pages under the leaf: the book's thickness, the fore-edge on the left, the lapis board below. */
const Block: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: PAGE.x - 30, top: PAGE.y + 18, width: PAGE.w + 44, height: PAGE.h + 4, borderRadius: 16, background: LEAF.leather, boxShadow: "0 40px 80px rgba(0,0,0,.55), inset 0 0 0 2px rgba(214,176,92,.35)" }} />
    {[14, 8].map((d, i) => (
      <div key={d} style={{ position: "absolute", left: PAGE.x - d, top: PAGE.y + d * 0.7, width: PAGE.w, height: PAGE.h, borderRadius: 12, background: i ? "#e3d1aa" : "#d9c597", boxShadow: "inset 0 0 30px rgba(120,86,40,.3)" }} />
    ))}
  </>
);

/** A page's running head: the book and the chapter, and the section's heading under the band. */
const Head: React.FC<{ p: BookProps; heading: boolean }> = ({ p, heading }) => (
  <div style={{ position: "absolute", top: 64, left: 80, right: 100, textAlign: "center", direction: "rtl" }}>
    <div style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 30, color: LEAF.goldDeep, marginBottom: 14 }}>
      {p.book}، {p.chapter.name}
    </div>
    <Sarlowh width={420} />
    {heading && p.chapter.heading ? (
      <div style={{ fontFamily: GULZAR, fontSize: p.chapter.heading.length > 30 ? 44 : 52, lineHeight: 1.7, color: LEAF.heading, marginTop: 16, textWrap: "balance" } as React.CSSProperties}>{p.chapter.heading}</div>
    ) : null}
  </div>
);

/** The title page: the chapter's number in a shamseh, its title, and the hook. */
const TitlePage: React.FC<{ p: BookProps }> = ({ p }) => {
  const frame = useCurrentFrame();
  const words = p.hook.split(/\s+/).filter(Boolean);
  const size = p.hook.length > 44 ? 66 : p.hook.length > 30 ? 76 : 88;
  const prologue = p.chapter.slug === "prologue";
  return (
    <Paper>
      <div style={{ position: "absolute", top: 70, left: 80, right: 100, display: "flex", flexDirection: "column", alignItems: "center", direction: "rtl", textAlign: "center" }}>
        <div style={{ fontFamily: GULZAR, fontSize: 64, lineHeight: 1.6, color: LEAF.goldDeep }}>{p.book}</div>
        <Sarlowh width={480} />
        <div style={{ position: "relative", width: 210, height: 210, marginTop: 40 }}>
          <div style={{ position: "absolute", inset: 0, transform: `rotate(${frame * 0.25}deg)` }}>
            <Shamseh size={210} color={LEAF.goldDeep} fill="rgba(232,197,106,.12)" />
          </div>
          {prologue ? null : (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: VAZIR, fontWeight: 900, fontSize: 92, color: LEAF.heading, background: "radial-gradient(closest-side, rgba(236,220,187,1) 62%, rgba(236,220,187,0) 64%)" }}>{p.chapter.num}</div>
          )}
        </div>
        <div style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 40, color: LEAF.ink2, marginTop: 30 }}>{p.chapter.name}</div>
        {prologue ? null : <div style={{ fontFamily: NASKH, fontWeight: 700, fontSize: 44, lineHeight: 1.6, color: LEAF.ink, marginTop: 8, textWrap: "balance" } as React.CSSProperties}>{p.chapter.title}</div>}
        <div style={{ width: 140, height: 3, background: LEAF.goldDeep, opacity: 0.55, margin: "44px 0 40px" }} />
        {/* the hook: readable from the first frame; its words settle one after another */}
        <div style={{ fontFamily: NASKH, fontWeight: 700, fontSize: size, lineHeight: 1.65, color: LEAF.ink, textWrap: "balance", maxWidth: 700 } as React.CSSProperties}>
          {words.map((w, i) => (
            <span key={i} style={{ display: "inline-block", marginInline: "0.13em", opacity: interpolate(frame, [i * 2, i * 2 + 8], [0.92, 1], clamped), transform: `translateY(${interpolate(frame, [i * 2, i * 2 + 10], [8, 0], { ...clamped, easing: ease })}px)` }}>
              {w}
            </span>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 64, left: 0, right: 20, display: "flex", justifyContent: "center", opacity: 0.8 }}>
        <Shamseh size={44} color={LEAF.goldDeep} />
      </div>
    </Paper>
  );
};

/** A page of the passage: the words lit as the recording reaches them, like the reader's karaoke. */
const TextPage: React.FC<{ p: BookProps; page: PageWords; timed: Word[]; first: boolean }> = ({ p, page, timed, first }) => {
  const frame = useCurrentFrame();
  const words = p.words.slice(page.from, page.to);
  const size = sizeFor(words.length);
  // the page's paragraphs: a new one at each word marked `p`
  const paras: { at: number; list: BookWord[] }[] = [];
  words.forEach((w, k) => {
    if (k === 0 || w.p) paras.push({ at: page.from + k, list: [] });
    paras[paras.length - 1].list.push(w);
  });
  const top = first && p.chapter.heading ? 300 : 210;
  return (
    <Paper>
      <Head p={p} heading={first} />
      <div style={{ position: "absolute", top, left: 84, right: 104, bottom: 150, display: "flex", flexDirection: "column", justifyContent: "center", direction: "rtl" }}>
        {paras.map((para, j) => (
          <p key={para.at} style={{ margin: 0, textIndent: j === 0 && (first || !p.words[para.at]?.p) ? 0 : "1.6em", textAlign: "justify", fontFamily: NASKH, fontWeight: 400, fontSize: size, lineHeight: 1.95, color: LEAF.ink }}>
            {para.list.map((w, k) => {
              const i = para.at + k;
              const t = timed[i];
              const now = t ? frame >= t.from - 1 && frame < t.to - 1 : false;
              const past = t ? frame >= t.to - 1 : false;
              return (
                <React.Fragment key={i}>
                  <span style={{ borderRadius: 8, padding: "0 0.02em", background: now ? LEAF.gold : "transparent", color: now ? LEAF.lapis : LEAF.ink, boxShadow: now ? `0 0 0 4px ${LEAF.gold}, 0 0 18px rgba(232,197,106,.45)` : "none", opacity: now || past ? 1 : 0.74 }}>{w.w}</span>{" "}
                </React.Fragment>
              );
            })}
          </p>
        ))}
      </div>
      {/* the running foot: the chapter's title and a small shamseh */}
      <div style={{ position: "absolute", bottom: 58, left: 80, right: 100, display: "flex", alignItems: "center", justifyContent: "center", gap: 18, direction: "rtl", opacity: 0.85 }}>
        <Shamseh size={34} color={LEAF.goldDeep} />
        <span style={{ fontFamily: VAZIR, fontWeight: 500, fontSize: 26, color: LEAF.ink2 }}>{p.chapter.slug === "prologue" ? p.chapter.name : p.chapter.title}</span>
      </div>
    </Paper>
  );
};

/** The inside of the back board: lapis leather in a gold frame, what the last page uncovers before the book closes. */
const Endpaper: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, borderRadius: 12, overflow: "hidden", background: LEAF.leather, boxShadow: "inset 0 0 0 2px rgba(214,176,92,.35), inset 0 0 120px rgba(0,0,0,.45)" }}>
    <div style={{ position: "absolute", inset: 34, borderRadius: 6, border: "3px solid rgba(214,176,92,.7)" }} />
    <div style={{ position: "absolute", inset: 50, borderRadius: 4, border: "2px solid rgba(201,162,77,.35)" }} />
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.85 }}>
      <Shamseh size={200} color={LEAF.gold2} />
    </div>
    <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: 90, background: "linear-gradient(to left, rgba(0,0,0,.45), rgba(0,0,0,0))" }} />
  </div>
);

/** The closed book: lapis leather, a double gold frame, the shamseh and the title in gold, a slow glint over the foil. */
const Cover: React.FC<{ title: string; w: number; h: number; glint: number }> = ({ title, w, h, glint }) => (
  <div style={{ position: "relative", width: w, height: h, borderRadius: 14, background: LEAF.leather, boxShadow: "0 50px 90px rgba(0,0,0,.6), inset 0 1px 0 rgba(120,150,220,.25), inset 0 0 0 2px rgba(0,0,0,.35)", overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 26, borderRadius: 6, border: "3px solid rgba(214,176,92,.85)" }} />
    <div style={{ position: "absolute", inset: 40, borderRadius: 4, border: "2px solid rgba(201,162,77,.45)", boxShadow: "inset 0 0 40px rgba(0,0,0,.35)" }} />
    {[
      { top: 18, left: 18 },
      { top: 18, right: 18 },
      { bottom: 18, left: 18 },
      { bottom: 18, right: 18 },
    ].map((c, i) => (
      <div key={i} style={{ position: "absolute", ...c, width: 18, height: 18, transform: "rotate(45deg)", border: "2px solid rgba(214,176,92,.8)" }} />
    ))}
    {/* the spine on the right, with its raised bands */}
    <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: 46, background: "linear-gradient(to left, rgba(0,0,0,.5), rgba(0,0,0,0))" }} />
    {[18, 34, 62, 78].map((y) => (
      <div key={y} style={{ position: "absolute", right: 8, top: `${y}%`, width: 26, height: 5, borderRadius: 3, opacity: 0.6, background: "linear-gradient(180deg, rgba(214,176,92,.55), rgba(90,60,20,.65))" }} />
    ))}
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 34 }}>
      <div style={{ width: 190, height: 190, borderRadius: 95, display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid rgba(214,176,92,.6)", background: "radial-gradient(circle, rgba(232,197,106,.14), rgba(232,197,106,.02) 70%)", boxShadow: "inset 0 4px 12px rgba(0,0,0,.5)" }}>
        <Shamseh size={120} color={LEAF.gold} />
      </div>
      <div style={{ fontFamily: GULZAR, fontSize: 96, lineHeight: 1.5, color: LEAF.gold, textShadow: "0 2px 4px rgba(0,0,0,.75)" }}>{title}</div>
      <div style={{ fontFamily: VAZIR, fontWeight: 500, fontSize: 24, letterSpacing: "0.34em", color: LEAF.gold2, direction: "ltr", display: "flex", gap: "1.2em" }}>
        <span>BIDAR</span>
        <span>بیدار</span>
      </div>
    </div>
    {/* the foil catches the light */}
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(105deg, transparent ${glint - 10}%, rgba(255,240,190,.28) ${glint}%, transparent ${glint + 10}%)` }} />
  </div>
);

// ---------- the Reel ----------
export const Book: React.FC<BookProps> = (p) => {
  const frame = useCurrentFrame();
  const tl = p.tl!;
  const read = beatAt(tl, "read");
  const close = beatAt(tl, "end");
  const timed = tl.words.filter((w) => w.beat === "read");
  const pages = paginate(p.words);
  // the leaf turns: the title page just before the first word, each page just before the first word of the next, the last onto the cover
  const firstWord = (pg: PageWords) => timed[pg.from]?.from ?? read.from;
  const turns: number[] = [Math.max(6, read.from - 8), ...pages.slice(1).map((pg) => firstWord(pg) - 12), close.from - 4];
  const leaves: React.ReactNode[] = [<TitlePage key="title" p={p} />, ...pages.map((pg, i) => <TextPage key={`page-${pg.from}`} p={p} page={pg} timed={timed} first={i === 0} />), <Endpaper key="end" />];
  const shut = turns[turns.length - 1];
  // the leaf on top: the first one not yet turned over
  const current = turns.filter((t) => frame >= t + TURN).length;
  // the last page uncovers the back board; the book leaves the stage and the closed cover comes up
  const bookOut = interpolate(frame, [shut + TURN + 2, shut + TURN + 12], [1, 0], clamped);
  const coverIn = fade(frame, shut + TURN + 4, 12);
  const sourceFrom = tl.total - Math.round(2.6 * FPS);
  return (
    <Stage ground={<Ground total={tl.total} />} tl={tl} music={p.music}>
      <Sfx at={0} name="paper" volume={0.18} />
      {turns.map((t, i) => (
        <Sfx key={i} at={t} name="paper" volume={0.24} />
      ))}

      <Mark color={LEAF.gold} sub={p.series} subColor={LEAF.gold2} />

      {bookOut > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: bookOut, transform: `translateY(${rise(frame, 0, 30, 18)}px) scale(${interpolate(bookOut, [0, 1], [0.95, 1])})`, transformOrigin: "50% 45%" }}>
          <Block />
          {leaves.map((leaf, i) =>
            // only the leaf on top and the one under it are drawn
            i === current || i === current + 1 ? (
              <Leaf key={i} turnAt={turns[i] ?? null} z={100 - i}>
                {leaf}
              </Leaf>
            ) : null,
          )}
        </div>
      ) : null}

      {/* the close: the closed book, and where the rest of it is */}
      {coverIn > 0 ? (
        <div style={{ position: "absolute", top: DESIGN_TOP + 190, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", direction: "rtl", opacity: coverIn }}>
          <div style={{ perspective: 2200 }}>
            <div style={{ transform: `rotateY(${interpolate(frame, [shut + TURN + 4, tl.total], [-16, -6], clamped)}deg) scale(${interpolate(frame, [shut + TURN + 4, shut + TURN + 26], [0.92, 1], { ...clamped, easing: ease })})` }}>
              <Cover title={p.book} w={520} h={720} glint={interpolate(frame, [shut, tl.total], [-20, 130], clamped)} />
            </div>
          </div>
          <div style={{ fontFamily: VAZIR, fontWeight: 800, fontSize: 74, color: LEAF.cream, marginTop: 64, opacity: fade(frame, shut + TURN + 10, 10), transform: `translateY(${rise(frame, shut + TURN + 10, 24, 14)}px)` }}>{p.closeLine}</div>
          <div style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 44, color: LEAF.gold, direction: "ltr", marginTop: 12, opacity: fade(frame, shut + TURN + 18, 10) }}>{p.closeUrl}</div>
        </div>
      ) : null}

      <SourceLine text={p.source} opacity={fade(frame, sourceFrom, 12)} color="rgba(243,231,200,.72)" strong={LEAF.gold} />
    </Stage>
  );
};

