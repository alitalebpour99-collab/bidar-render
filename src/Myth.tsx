// «باور یا سند؟»: a popular claim in quotes, three pieces of evidence from
// Bidar's own records, then Bidar's confidence stamp comes down (FACT,
// CONTESTED or ALLEGATION, in the site's words and colours, CONFIDENCE_META).
// Its own look: parchment, brown ink, a sealing-wax red, cards that turn like
// pages. Nothing here is the owner's or the renderer's opinion: every word is in the props.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { DESIGN_BOTTOM, DESIGN_TOP, FPS, Mark, SIDE, Sfx, SourceLine, VAZIR, W, clamped, during, ease, fade, grow, leave, rise, shake, slam } from "./kit";
import type { Confidence, MythProps } from "./props";
import { Captions, Stage, beatAt } from "./Safe";

export const PARCH = { paper: "#F1E6CC", paper2: "#E3CFA4", card: "#F8F1DF", ink: "#2B1E12", ink2: "#5A4632", ink3: "#8A7356", red: "#9E3B26", line: "rgba(43,30,18,.14)", clay: "#C49A69", clayDark: "#8E6A43" };
/** Bidar's confidence colours (app/globals.css: --color-verified, --color-contested, --color-allegation). */
export const CONFIDENCE: Record<Confidence, string> = { FACT: "#3FBF7F", CONTESTED: "#E8B54A", ALLEGATION: "#E2685B" };

const Ground: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame, [0, total], [-40, 140]);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1200px 1500px at 52% 44%, ${PARCH.paper} 0%, #EADBB7 62%, ${PARCH.paper2} 100%)` }}>
      {/* the paper's fibres and a ledger's ruling */}
      <AbsoluteFill style={{ backgroundImage: `repeating-linear-gradient(0deg, ${PARCH.line} 0 1.5px, transparent 1.5px 76px)`, backgroundPosition: `0 ${30 + frame * 0.15}px`, opacity: 0.5 }} />
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(83deg, rgba(120,85,40,.05) 0 1px, transparent 1px 9px), repeating-linear-gradient(-71deg, rgba(120,85,40,.04) 0 1px, transparent 1px 13px)" }} />
      {/* a margin line in red ink down the reading edge */}
      <div style={{ position: "absolute", top: 0, bottom: 0, right: 118, width: 2.5, background: "rgba(158,59,38,.35)" }} />
      {/* old stains */}
      <AbsoluteFill style={{ background: "radial-gradient(260px 200px at 18% 22%, rgba(150,105,50,.12), transparent 70%), radial-gradient(340px 260px at 84% 78%, rgba(150,105,50,.10), transparent 70%), radial-gradient(200px 160px at 70% 12%, rgba(150,105,50,.08), transparent 70%)" }} />
      {/* a slow band of light across the page */}
      <AbsoluteFill style={{ background: `linear-gradient(115deg, transparent ${sweep - 30}%, rgba(255,250,235,.32) ${sweep}%, transparent ${sweep + 30}%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(1300px 1700px at 50% 48%, transparent 58%, rgba(90,60,25,.38) 100%)" }} />
    </AbsoluteFill>
  );
};

/** A clay cylinder turning slowly, rows of wedges running round it (decorative). */
const Cylinder: React.FC<{ w: number; turn: number }> = ({ w, turn }) => {
  const h = w * 0.46;
  const rows = 6;
  const marks: React.ReactNode[] = [];
  for (let r = 0; r < rows; r += 1) {
    const y = h * 0.2 + (r * h * 0.62) / (rows - 1);
    for (let k = 0; k < 18; k += 1) {
      // a mark's place around the cylinder: it moves with the turn, thinner toward the edges
      const a = (((k / 18 + turn + r * 0.037) % 1) + 1) % 1;
      const x = w * 0.5 - Math.cos(a * Math.PI) * w * 0.4;
      const squeeze = Math.sin(a * Math.PI);
      if (squeeze < 0.12) continue;
      const s = 11 * squeeze;
      marks.push(<path key={`${r}-${k}`} d={`M${x} ${y - 9} l${s} 6 l${-s} 6 z M${x + s * 1.2} ${y - 1} h${s * 1.4}`} fill={PARCH.clayDark} stroke={PARCH.clayDark} strokeWidth="1.6" opacity={0.35 + 0.55 * squeeze} />);
    }
  }
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="clay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D8B585" />
          <stop offset="0.45" stopColor={PARCH.clay} />
          <stop offset="1" stopColor="#7E5A35" />
        </linearGradient>
      </defs>
      <ellipse cx={w / 2} cy={h * 0.96} rx={w * 0.44} ry={h * 0.08} fill="rgba(60,35,10,.22)" />
      <path d={`M${w * 0.1} ${h * 0.1} Q${w * 0.5} ${-h * 0.02} ${w * 0.9} ${h * 0.1} L${w * 0.9} ${h * 0.88} Q${w * 0.5} ${h * 1.0} ${w * 0.1} ${h * 0.88} Z`} fill="url(#clay)" stroke="#6E4E2C" strokeWidth="3" />
      <ellipse cx={w * 0.1} cy={h * 0.49} rx={w * 0.05} ry={h * 0.39} fill="#B88E5E" stroke="#6E4E2C" strokeWidth="3" />
      {marks}
      <path d={`M${w * 0.62} ${h * 0.12} l-14 40 l18 30 l-10 44`} fill="none" stroke="#5E4024" strokeWidth="2.4" opacity=".6" />
    </svg>
  );
};

/** Bidar's confidence stamp, slammed down. */
const Verdict: React.FC<{ level: Confidence; label: string; at: number; scale?: number; kicker: string }> = ({ level, label, at, scale = 1, kicker }) => {
  const frame = useCurrentFrame();
  const color = CONFIDENCE[level];
  const s = slam(frame, at, 2.6) * scale;
  const size = 540;
  return (
    <div style={{ width: size, height: size, position: "relative", opacity: fade(frame, at, 2), transform: `rotate(-9deg) scale(${s})` }}>
      <svg width={size} height={size} viewBox="0 0 470 470" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {/* ink splashed by the blow */}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const a = i * 0.9 + 0.4;
          const r = 250 + (i % 3) * 22;
          return <circle key={i} cx={235 + Math.cos(a) * r} cy={235 + Math.sin(a) * r} r={4 + (i % 3) * 3} fill={color} opacity={0.7 * fade(frame, at + 6, 4)} />;
        })}
        <circle cx="235" cy="235" r="226" fill={color} />
        <circle cx="235" cy="235" r="204" fill="none" stroke={PARCH.ink} strokeWidth="3" opacity=".55" />
        <circle cx="235" cy="235" r="192" fill="none" stroke={PARCH.ink} strokeWidth="1.5" strokeDasharray="6 7" opacity=".45" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", direction: "rtl", color: PARCH.ink }}>
        <div style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 32, opacity: 0.8 }}>{kicker}</div>
        <span style={{ width: 26, height: 26, borderRadius: 13, background: PARCH.ink, opacity: 0.8, marginTop: 16 }} />
        <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: label.length > 12 ? 50 : 62, lineHeight: 1.3, marginTop: 10, textAlign: "center", maxWidth: 400 }}>{label}</div>
      </div>
    </div>
  );
};

export const Myth: React.FC<MythProps> = (p) => {
  const frame = useCurrentFrame();
  const tl = p.tl!;
  const hook = beatAt(tl, p.beats[0].id);
  const v = beatAt(tl, p.verdict.at);
  const closeId = p.beats[p.beats.length - 1].id;
  const close = beatAt(tl, closeId);
  const firstCard = beatAt(tl, p.evidence[0].at).from;
  const slamAt = v.from + 6;
  const sh = shake(frame, slamAt + 5, 14);
  const sourceFrom = tl.total - Math.round(2.6 * FPS);
  const flip = Math.floor(frame / 14) % 2;
  return (
    <Stage ground={<Ground total={tl.total} />} tl={tl} music={p.music} offset={sh}>
      <Sfx at={0} name="paper" />
      <Sfx at={2} name="hit" volume={0.35} />
      {p.evidence.map((e) => (
        <React.Fragment key={e.at}>
          <Sfx at={beatAt(tl, e.at).from - 3} name="paper" />
          {e.chip ? <Sfx at={beatAt(tl, e.at).from + 58} name="pop" /> : null}
        </React.Fragment>
      ))}
      <Sfx at={slamAt - 34} name="rise" />
      <Sfx at={slamAt} name="stamp" />
      <Sfx at={close.from - 3} name="swish" />

      <Mark color={PARCH.ink} sub={p.series} subColor={PARCH.red} />

      {/* the claim, big, from the first frame */}
      <div style={{ position: "absolute", top: DESIGN_TOP + 140, right: SIDE + 40, left: SIDE, direction: "rtl", opacity: leave(frame, hook.to + 6, 10), transform: `translateY(${-interpolate(frame, [hook.to - 6, hook.to + 6], [0, 80], clamped)}px)` }}>
        <div style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 46, color: PARCH.red }}>{p.subject}</div>
        <div style={{ position: "relative", marginTop: 10 }}>
          <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 112, lineHeight: 1.28, color: PARCH.ink, transform: `scale(${interpolate(frame, [0, hook.to], [1.04, 1], clamped)})`, transformOrigin: "right top" }}>«{p.claim}»</div>
        </div>
        {/* the question flickers between its two words: which is it? */}
        <div style={{ marginTop: 34, display: "inline-flex", alignItems: "center", gap: 18, padding: "10px 34px 16px", borderRadius: 50, border: `3px solid ${PARCH.ink}`, fontFamily: VAZIR, fontWeight: 900, fontSize: 64, color: PARCH.ink }}>
          {p.hook.split(/\s+/).map((w, i) => (
            <span key={i} style={{ color: (w.includes("باور") && flip === 0) || (w.includes("سند") && flip === 1) ? PARCH.red : PARCH.ink, transform: `scale(${(w.includes("باور") && flip === 0) || (w.includes("سند") && flip === 1) ? 1.08 : 1})`, display: "inline-block" }}>
              {w}
            </span>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", top: 860, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: leave(frame, hook.to + 6, 10), transform: `translateY(${interpolate(frame, [0, hook.to], [0, -30], clamped)}px) rotate(${interpolate(frame, [0, hook.to], [-4, 2], clamped)}deg)` }}>
        <Cylinder w={700} turn={frame / 160} />
      </div>

      {/* the claim as a header while the evidence is read */}
      <div style={{ position: "absolute", top: DESIGN_TOP + 130, right: SIDE + 40, left: SIDE, direction: "rtl", opacity: Math.min(fade(frame, firstCard, 12), leave(frame, slamAt + 2, 6)) }}>
        <div style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 36, color: PARCH.red }}>{p.subject} · ادعا</div>
        <div style={{ fontFamily: VAZIR, fontWeight: 800, fontSize: 60, lineHeight: 1.35, color: PARCH.ink }}>«{p.claim}»</div>
      </div>

      {/* the evidence, one card a beat, turning in like a page */}
      {p.evidence.map((e, i) => {
        const { from, to } = beatAt(tl, e.at);
        const o = during(frame, from, to + 4, 8);
        if (o <= 0) return null;
        const turn = interpolate(frame, [from, from + 16], [38, 0], { ...clamped, easing: ease });
        const out = interpolate(frame, [to - 8, to + 4], [0, 1], clamped);
        const tilt = i % 2 ? 1.4 : -1.2;
        return (
          <div key={e.at} style={{ position: "absolute", top: 420, right: SIDE + 30, left: SIDE + 10, perspective: 1400, opacity: o }}>
            <div style={{ transform: `rotateY(${turn}deg) rotate(${tilt}deg) translateX(${-out * 120}px) translateY(${rise(frame, from, 30, 14)}px)`, transformOrigin: "right center", background: PARCH.card, borderRadius: 18, border: `2px solid rgba(43,30,18,.22)`, boxShadow: "0 24px 60px rgba(70,45,15,.28)", padding: "40px 52px 46px", direction: "rtl", minHeight: 560 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
                <span style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 150, lineHeight: 1, color: PARCH.red }}>{e.n}</span>
                <span style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 70, lineHeight: 1.25, color: PARCH.ink }}>{e.title}</span>
              </div>
              <div style={{ height: 3, background: PARCH.red, opacity: 0.5, width: `${100 * grow(frame, from + 10, 30)}%`, margin: "22px 0 26px" }} />
              <div style={{ fontFamily: VAZIR, fontWeight: 500, fontSize: 48, lineHeight: 1.65, color: PARCH.ink2, opacity: fade(frame, from + 14, 12) }}>{e.text}</div>
              {e.chip ? (
                <div style={{ marginTop: 30, display: "inline-block", padding: "8px 28px 12px", borderRadius: 40, background: PARCH.ink, color: PARCH.card, fontFamily: VAZIR, fontWeight: 700, fontSize: 36, opacity: fade(frame, from + 58, 6), transform: `scale(${slam(frame, from + 58, 1.5)})`, transformOrigin: "right center" }}>{e.chip}</div>
              ) : null}
            </div>
          </div>
        );
      })}

      {/* how far the evidence has come: three tabs */}
      <div style={{ position: "absolute", top: 1150, right: SIDE + 30, display: "flex", gap: 16, direction: "rtl", opacity: Math.min(fade(frame, firstCard, 10), leave(frame, slamAt + 2, 6)) }}>
        {p.evidence.map((e) => {
          const done = frame >= beatAt(tl, e.at).from;
          return (
            <span key={e.at} style={{ width: 92, height: 58, borderRadius: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: VAZIR, fontWeight: 900, fontSize: 34, background: done ? PARCH.red : "transparent", color: done ? PARCH.card : PARCH.ink3, border: `2.5px solid ${done ? PARCH.red : PARCH.ink3}` }}>
              {e.n}
            </span>
          );
        })}
      </div>

      {/* the stamp's shadow, coming down before the blow */}
      {frame >= v.from - 8 && frame < slamAt + 3 ? (
        <div style={{ position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <div style={{ width: 540, height: 540, borderRadius: 270, background: "rgba(60,35,10,.5)", filter: "blur(28px)", opacity: interpolate(frame, [v.from - 8, slamAt], [0, 0.55], clamped), transform: `scale(${interpolate(frame, [v.from - 8, slamAt], [1.7, 1], clamped)})` }} />
        </div>
      ) : null}
      {/* the stamp: Bidar's word on the claim */}
      {frame >= slamAt ? (
        <div style={{ position: "absolute", top: interpolate(frame, [close.from, close.from + 20], [300, 210], { ...clamped, easing: ease }), left: 0, right: 0, display: "flex", justifyContent: "center", transform: `scale(${interpolate(frame, [close.from, close.from + 20], [1, 0.72], { ...clamped, easing: ease })})` }}>
          <Verdict level={p.verdict.level} label={p.verdict.label} at={slamAt} kicker="سنجشِ بیدار" />
        </div>
      ) : null}
      {frame >= v.from ? (
        <div style={{ position: "absolute", top: 950, right: SIDE + 30, left: SIDE + 10, direction: "rtl", textAlign: "center", opacity: Math.min(fade(frame, slamAt + 30, 12), leave(frame, close.from + 4, 10)), transform: `translateY(${rise(frame, slamAt + 30, 30, 14)}px)` }}>
          <div style={{ fontFamily: VAZIR, fontWeight: 800, fontSize: 54, lineHeight: 1.6, color: PARCH.ink }}>{p.verdict.line}</div>
        </div>
      ) : null}

      {/* the close, with Bidar's three levels */}
      {frame >= close.from ? (
        <div style={{ position: "absolute", top: 760, right: SIDE + 30, left: SIDE + 10, direction: "rtl", opacity: fade(frame, close.from + 8, 10), transform: `translateY(${rise(frame, close.from + 8, 40, 14)}px)` }}>
          <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 66, lineHeight: 1.4, color: PARCH.ink, textAlign: "center" }}>{p.close}</div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 18, marginTop: 34 }}>
            {(["FACT", "CONTESTED", "ALLEGATION"] as Confidence[]).map((lv, i) => (
              <span key={lv} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 20px 12px", borderRadius: 30, border: `2.5px solid ${lv === p.verdict.level ? PARCH.ink : "rgba(43,30,18,.25)"}`, background: lv === p.verdict.level ? "rgba(255,255,255,.35)" : "transparent", fontFamily: VAZIR, fontWeight: 700, fontSize: 30, color: PARCH.ink, opacity: fade(frame, close.from + 22 + i * 6, 8) }}>
                <span style={{ width: 22, height: 22, borderRadius: 11, background: CONFIDENCE[lv] }} />
                {LEVEL_FA[lv]}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <Captions tl={tl} look={{ ink: PARCH.ink, now: PARCH.red, band: "rgba(248,241,223,.9)", border: "2px solid rgba(43,30,18,.2)", shadow: "none" }} bottom={DESIGN_BOTTOM - 168} />
      <SourceLine text={p.source} opacity={fade(frame, sourceFrom, 12)} color={PARCH.ink2} strong={PARCH.ink} />
    </Stage>
  );
};

/** Bidar's wording of the three levels (lib/knowledge/types.ts, CONFIDENCE_META). */
export const LEVEL_FA: Record<Confidence, string> = { FACT: "واقعیت مستند", CONTESTED: "مورد مناقشه", ALLEGATION: "ادعای اثبات‌نشده" };
export { W };
