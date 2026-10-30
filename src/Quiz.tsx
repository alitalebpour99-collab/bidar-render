// «حدس بزن»: a question of Bidar's own data as a modern game show. A dark stage
// under two slow spotlights; the question in a panel with a bright edge (a flag
// question shows the site's own drawing of the flag); three option pills that
// pop in as the narrator reads them; a ring that counts five silent seconds down
// with a soft tick each second; then the reveal: the right pill turns green with
// a check and a burst, the others step back, the answer and one line of context
// come up, and the call to answer in the comments closes it. Every word is in
// the props (lib/social/quiz.ts of the site builds them from its data).
import React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import { DESIGN_BOTTOM, DESIGN_TOP, FPS, Mark, RAIL, SIDE, Sfx, VAZIR, W, clamped, ease, fade, faDigits, grow, leave, rise, slam } from "./kit";
import type { QuizProps } from "./props";
import { Stage, beatAt } from "./Safe";
import { SourceBlock } from "./cite";

export const SHOW = {
  night: "#060a17",
  night2: "#0d1533",
  panel: "#111a3a",
  panel2: "#17224a",
  ink: "#f4f6ff",
  muted: "#a3aed0",
  teal: "#17d4a4",
  yellow: "#ffd23f",
  pink: "#ff4d8d",
  violet: "#7b61ff",
  right: "#22e39b",
  dark: "#071021",
};

/** Only the site's own flag drawings are shown. */
const FLAG_URL = /^https:\/\/bidar\.ahura\.cloud\/flags\/[a-z0-9_]+\.svg$/;

const Ground: React.FC<{ total: number; pulse: number }> = ({ total, pulse }) => {
  const frame = useCurrentFrame();
  const a = 30 + 14 * Math.sin(frame / 52);
  const b = 70 + 12 * Math.cos(frame / 61);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${SHOW.night2} 0%, ${SHOW.night} 62%, #04060f 100%)` }}>
      {/* two spotlights sweeping slowly */}
      <AbsoluteFill style={{ background: `radial-gradient(700px 900px at ${a}% 18%, rgba(23,212,164,${0.16 + 0.08 * pulse}), rgba(23,212,164,0) 70%), radial-gradient(760px 980px at ${b}% 26%, rgba(123,97,255,.18), rgba(123,97,255,0) 70%)` }} />
      {/* the studio floor: a faint grid in perspective */}
      <AbsoluteFill style={{ top: "68%", background: "repeating-linear-gradient(90deg, rgba(244,246,255,.045) 0 2px, transparent 2px 90px), repeating-linear-gradient(0deg, rgba(244,246,255,.04) 0 2px, transparent 2px 60px)", transform: "perspective(600px) rotateX(58deg)", transformOrigin: "50% 0%", opacity: 0.8 }} />
      <AbsoluteFill style={{ background: `radial-gradient(closest-side at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,.5) 100%)`, opacity: interpolate(frame, [0, total], [0.9, 1]) }} />
    </AbsoluteFill>
  );
};

/** A check mark drawn on. */
const Check: React.FC<{ size: number; p: number; color: string }> = ({ size, p, color }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <path d="M9 21 L17 29 L32 12" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
  </svg>
);

export const Quiz: React.FC<QuizProps> = (p) => {
  const frame = useCurrentFrame();
  const tl = p.tl!;
  const opts = p.options.map((_, i) => beatAt(tl, `o${i + 1}`));
  const count = beatAt(tl, "count");
  const answer = beatAt(tl, "answer");
  const why = beatAt(tl, "why");
  const close = beatAt(tl, "end");
  const flag = p.flag && FLAG_URL.test(p.flag.svg) ? p.flag : null;
  // the layout: a flag question shows the drawing above a shorter question
  const Q = flag ? { top: 226, flagH: 330, qTop: 584, qH: 150 } : { top: 240, flagH: 0, qTop: 240, qH: 360 };
  const pillTop = flag ? 768 : 668;
  const PILL = flag ? 118 : 130;
  const GAP = flag ? 24 : 28;
  const ringY = pillTop + 3 * (PILL + GAP) + (flag ? 150 : 168);
  // the countdown: seconds left, a pulse on each
  const secs = p.count || 5;
  const inCount = frame >= count.from && frame < answer.from;
  const left = inCount ? Math.max(1, secs - Math.floor((frame - count.from) / FPS)) : secs;
  const sinceTick = inCount ? (frame - count.from) % FPS : 99;
  const pulse = inCount ? interpolate(sinceTick, [0, 10], [1, 0], clamped) : 0;
  const ringP = interpolate(frame, [count.from, count.from + secs * FPS], [1, 0], clamped);
  const ringColor = left >= 4 ? SHOW.teal : left >= 2 ? SHOW.yellow : SHOW.pink;
  const revealed = frame >= answer.from - 2;
  const qSize = p.question.length <= 22 ? 84 : p.question.length <= 32 ? 74 : p.question.length <= 42 ? 66 : 58;
  const sourceFrom = tl.total - Math.round(2.6 * FPS);
  return (
    <Stage ground={<Ground total={tl.total} pulse={pulse} />} tl={tl} music={p.music}>
      <Sfx at={0} name="whoosh" volume={0.22} />
      {opts.map((o, i) => (
        <Sfx key={i} at={o.from - 2} name="pop" volume={0.28} />
      ))}
      {Array.from({ length: secs }, (_, i) => (
        <Sfx key={`t${i}`} at={count.from + i * FPS} name="tick" volume={0.22} />
      ))}
      <Sfx at={answer.from - 2} name="chime" volume={0.32} />
      <Sfx at={answer.from - 2} name="hit" volume={0.22} />
      <Sfx at={close.from - 2} name="pop" volume={0.24} />

      <Mark color={SHOW.ink} sub={p.series} subColor={SHOW.muted} />
      {/* the show's name */}
      <div style={{ position: "absolute", top: DESIGN_TOP + 24, left: SIDE, display: "flex", alignItems: "center", gap: 14, direction: "rtl", padding: "8px 26px 12px 18px", borderRadius: 40, background: SHOW.teal, color: SHOW.dark, fontFamily: VAZIR, fontWeight: 900, fontSize: 40, transform: `scale(${slam(frame, 2, 1.3)})`, transformOrigin: "0% 50%" }}>
        <span style={{ width: 46, height: 46, borderRadius: 23, background: SHOW.dark, color: SHOW.teal, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 34 }}>؟</span>
        {p.kicker}
      </div>

      {/* the flag, the site's own drawing */}
      {flag ? (
        <div style={{ position: "absolute", top: Q.top, left: 0, right: 0, display: "flex", justifyContent: "center", perspective: 1400 }}>
          <div style={{ padding: 14, borderRadius: 22, background: "#fff", boxShadow: "0 30px 70px rgba(0,0,0,.55)", transform: `rotateY(${6 * Math.sin(frame / 40)}deg) rotateX(${2 * Math.cos(frame / 47)}deg) scale(${interpolate(frame, [0, 12], [0.94, 1], { ...clamped, easing: ease })})` }}>
            <Img src={flag.svg} style={{ display: "block", height: Q.flagH - 28, width: "auto", borderRadius: 8 }} />
          </div>
        </div>
      ) : null}

      {/* the question */}
      <div style={{ position: "absolute", top: Q.qTop, left: SIDE + 10, right: SIDE + 10, height: Q.qH, borderRadius: 40, padding: 4, background: flag ? "transparent" : `linear-gradient(120deg, ${SHOW.teal}, ${SHOW.violet} 55%, ${SHOW.pink})`, transform: `scale(${interpolate(frame, [0, 10], [0.97, 1], { ...clamped, easing: ease })})` }}>
        <div style={{ width: "100%", height: "100%", borderRadius: 36, background: flag ? "transparent" : SHOW.panel, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 46px", direction: "rtl", textAlign: "center" }}>
          <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: flag ? 64 : qSize, lineHeight: 1.45, color: SHOW.ink, textWrap: "balance" } as React.CSSProperties}>{p.question}</div>
        </div>
      </div>

      {/* the options, popping in as they are read */}
      {p.options.map((o, i) => {
        const at = opts[i].from - 3;
        if (frame < at) return null;
        const right = i === p.answer;
        const r = revealed ? grow(frame, answer.from - 2, 10) : 0;
        const back = revealed && !right ? r : 0;
        const bg = right && revealed ? SHOW.right : SHOW.panel2;
        const ink = right && revealed ? SHOW.dark : SHOW.ink;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: pillTop + i * (PILL + GAP),
              left: SIDE + 20,
              right: RAIL,
              height: PILL,
              borderRadius: PILL / 2,
              background: bg,
              border: `3px solid ${right && revealed ? SHOW.right : "rgba(244,246,255,.16)"}`,
              boxShadow: right && revealed ? `0 0 ${40 * r}px rgba(34,227,155,${0.55 * r})` : "0 14px 30px rgba(0,0,0,.35)",
              display: "flex",
              alignItems: "center",
              gap: 26,
              padding: "0 14px 0 34px",
              direction: "rtl",
              opacity: (1 - 0.62 * back) * fade(frame, at, 3),
              transform: `scale(${slam(frame, at, 1.22) * (right && revealed ? 1 + 0.04 * r : 1 - 0.03 * back)}) translateX(${-14 * back}px)`,
              transformOrigin: "100% 50%",
            }}
          >
            <span style={{ width: 84, height: 84, borderRadius: 42, flex: "0 0 auto", display: "inline-flex", alignItems: "center", justifyContent: "center", background: right && revealed ? SHOW.dark : [SHOW.teal, SHOW.yellow, SHOW.pink][i], color: right && revealed ? SHOW.right : SHOW.dark, fontFamily: VAZIR, fontWeight: 900, fontSize: 46 }}>
              {right && revealed ? <Check size={56} p={grow(frame, answer.from, 10)} color={SHOW.right} /> : faDigits(i + 1)}
            </span>
            <span style={{ fontFamily: VAZIR, fontWeight: 800, fontSize: o.length > 18 ? 46 : 54, color: ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "clip" }}>{o}</span>
          </div>
        );
      })}

      {/* a burst from the right one */}
      {revealed
        ? Array.from({ length: 16 }, (_, k) => {
            const t = frame - (answer.from - 2);
            if (t > 26) return null;
            const ang = (k / 16) * Math.PI * 2;
            const d = 40 + 260 * grow(frame, answer.from - 2, 22);
            const cx = W - RAIL - 60;
            const cy = pillTop + p.answer * (PILL + GAP) + PILL / 2;
            return <div key={k} style={{ position: "absolute", left: cx + Math.cos(ang) * d - 7, top: cy + Math.sin(ang) * d * 0.7 - 7, width: 14, height: 14, borderRadius: k % 2 ? 7 : 2, background: [SHOW.right, SHOW.yellow, SHOW.teal, SHOW.pink][k % 4], opacity: interpolate(t, [14, 26], [1, 0], clamped) }} />;
          })
        : null}

      {/* the countdown ring: five silent seconds */}
      {frame >= count.from - 6 && frame < answer.from + 8 ? (
        <div style={{ position: "absolute", top: ringY - 120, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: Math.min(fade(frame, count.from - 6, 6), leave(frame, answer.from + 8, 8)) }}>
          <div style={{ position: "relative", width: 240, height: 240, transform: `scale(${1 + 0.08 * pulse})` }}>
            <svg width={240} height={240} viewBox="0 0 240 240" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
              <circle cx={120} cy={120} r={100} fill={SHOW.panel} stroke="rgba(244,246,255,.12)" strokeWidth={18} />
              <circle cx={120} cy={120} r={100} fill="none" stroke={ringColor} strokeWidth={18} strokeLinecap="round" pathLength={1} strokeDasharray={`${ringP} 1`} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: VAZIR, fontWeight: 900, fontSize: 120, color: ringColor, lineHeight: 1 }}>{faDigits(left)}</div>
          </div>
        </div>
      ) : null}

      {/* the answer and its line of context */}
      {frame >= answer.from ? (
        <div style={{ position: "absolute", top: ringY - 130, left: SIDE + 20, right: RAIL, direction: "rtl", opacity: Math.min(fade(frame, answer.from + 4, 8), leave(frame, close.from + 2, 10)), transform: `translateY(${rise(frame, answer.from + 4, 30, 14)}px)` }}>
          <div style={{ borderRadius: 30, background: SHOW.panel, borderRight: `10px solid ${SHOW.right}`, padding: "26px 36px 30px" }}>
            <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 50, color: SHOW.right }}>پاسخ: {p.options[p.answer]}</div>
            <div style={{ fontFamily: VAZIR, fontWeight: 500, fontSize: p.reveal.length > 90 ? 32 : 36, lineHeight: 1.6, color: SHOW.ink, marginTop: 12, opacity: fade(frame, why.from - 2, 10) }}>{p.reveal}</div>
          </div>
        </div>
      ) : null}

      {/* the call to answer in the comments */}
      {frame >= close.from - 2 ? (
        <div style={{ position: "absolute", top: ringY - 140, left: 0, right: 0, display: "flex", justifyContent: "center", direction: "rtl" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 22, padding: "26px 46px 32px", borderRadius: 60, background: SHOW.yellow, color: SHOW.dark, fontFamily: VAZIR, fontWeight: 900, fontSize: 50, boxShadow: "0 20px 50px rgba(0,0,0,.45)", transform: `scale(${slam(frame, close.from - 2, 1.35)}) rotate(${-1.5 + 1.5 * Math.sin(frame / 9)}deg)` }}>
            <svg width={58} height={58} viewBox="0 0 40 40">
              <path d="M6 8 H34 A3 3 0 0 1 37 11 V26 A3 3 0 0 1 34 29 H18 L10 35 V29 H6 A3 3 0 0 1 3 26 V11 A3 3 0 0 1 6 8 Z" fill={SHOW.dark} />
              <circle cx={13} cy={18.5} r={2.6} fill={SHOW.yellow} />
              <circle cx={20} cy={18.5} r={2.6} fill={SHOW.yellow} />
              <circle cx={27} cy={18.5} r={2.6} fill={SHOW.yellow} />
            </svg>
            {p.cta}
          </div>
        </div>
      ) : null}

      <SourceBlock text={p.source} font={VAZIR} color={SHOW.muted} strong={SHOW.ink} style={{ position: "absolute", top: DESIGN_BOTTOM - 126, left: SIDE, right: RAIL, opacity: fade(frame, sourceFrom, 12) }} />
    </Stage>
  );
};

