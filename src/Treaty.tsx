// «آنچه از دست رفت»: one treaty of the atlas's losses (bidar lib/atlas/losses.ts).
// First an archive document: a parchment unrolls between two rollers, the
// treaty's name, its year and the party it went to are written on it, and a
// wax seal is pressed under them. Then the document rolls up and a light
// regional map comes in: each lost place pins in with a soft halo (the
// atlas's own way: never a hard border), its old name beside it, and in the
// beat «امروز» each label turns to the country that holds it today. Iran's
// border today is the gold dashed line, the fixed reference of the atlas.
// The map is light on purpose (GitHub's software GL): only the countries of
// the region from Natural Earth 1:110m, projected once per Reel (no camera
// move, no blur, no filter), the slow push is a CSS scale.
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { geoGraticule, geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { feature } from "topojson-client";
import topoJson from "./data/countries-110m.json";
import { NASKH } from "./Book";
import { CONFIDENCE } from "./Myth";
import { DESIGN_TOP, FPS, Mark, SIDE, Sfx, SourceLine, VAZIR, W, clamped, ease, fade, glide, grow, leave, rise, shake, slam } from "./kit";
import type { Confidence, TreatyProps } from "./props";
import { Captions, Stage, beatAt } from "./Safe";

/** The archive (hue 10 of lib/social/hues.ts: a sealing-wax red). */
export const ARCH = {
  desk: "#24120e",
  desk2: "#100706",
  paper: "#efe3c5",
  paper2: "#dfcba0",
  ink: "#2c1c12",
  ink2: "#5f4832",
  wax: "#8e1d14",
  wax2: "#c4392a",
  waxDark: "#5a0f09",
  sea: "#cbd2c2",
  land: "#f1e7cd",
  border: "rgba(92,70,48,.5)",
  gold: "#b07b17",
  cream: "#f6eedb",
};

// ---------- the light map ----------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const topo = topoJson as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WORLD = (feature(topo, topo.objects.countries) as any).features as any[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IRAN_TODAY = WORLD.find((f: any) => f.properties?.name === "Iran");

/** The countries whose box meets the region of the losses (the Caucasus, Central Asia, the Gulf): the rest of the world is never drawn. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function regionOf(lon0: number, lat0: number, lon1: number, lat1: number): any[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return WORLD.filter((f: any) => {
    let a = 180;
    let b = -180;
    let c = 90;
    let d = -90;
    const walk = (x: unknown) => {
      if (Array.isArray(x) && typeof x[0] === "number") {
        a = Math.min(a, x[0] as number);
        b = Math.max(b, x[0] as number);
        c = Math.min(c, x[1] as number);
        d = Math.max(d, x[1] as number);
      } else if (Array.isArray(x)) x.forEach(walk);
    };
    walk(f.geometry?.coordinates);
    return b >= lon0 && a <= lon1 && d >= lat0 && c <= lat1;
  });
}

/** The card the map is drawn in, on the design frame. */
const CARD = { x: 56, y: 372, w: 968, h: 924 };
const INSET = 22;

/** The view of a Reel: the places, with room around them and a strip of Iran to the south, at least 9° by 7°. */
export function viewOf(places: { lon: number; lat: number }[]) {
  const lons = places.map((p) => p.lon);
  const lats = places.map((p) => p.lat);
  const pad = (a: number, b: number, min: number): [number, number] => {
    const m = (a + b) / 2;
    const s = Math.max(b - a, min);
    return [m - s / 2, m + s / 2];
  };
  const [lon0, lon1] = pad(Math.min(...lons) - 1.4, Math.max(...lons) + 1.4, 9);
  const [lat0, lat1] = pad(Math.min(...lats) - 2.6, Math.max(...lats) + 1.3, 7);
  const box = { type: "MultiPoint", coordinates: [[lon0, lat0], [lon1, lat1], [lon0, lat1], [lon1, lat0]] } as GeoPermissibleObjects;
  const projection = geoMercator().fitExtent([[CARD.x + INSET + 20, CARD.y + INSET + 20], [CARD.x + CARD.w - INSET - 20, CARD.y + CARD.h - INSET - 20]], box);
  return { projection, lon0, lon1, lat0, lat1 };
}

type Label = { x: number; y: number; w: number; h: number; px: number; py: number; lead: boolean };
/** the labels' type: a line of 31 px, and the height kept for the turned label (the old name at 24 px above it) */
export const LABEL = 31;
export const LABEL_H = 86;

/** About how wide a line of Vazirmatn 800 is (measured: 0.36–0.42 em a letter in Persian): the labels are placed before the text is drawn. */
const textW = (s: string, size: number) => s.length * size * 0.45;

type Box = { x: number; y: number; w: number; h: number };
const overlaps = (a: Box, b: Box, m: number) => a.x < b.x + b.w + m && a.x + a.w + m > b.x && a.y < b.y + b.h + m && a.y + a.h + m > b.y;
/** Whether the segment p–q crosses box b (a few samples along it are enough at this scale). */
const crosses = (px: number, py: number, qx: number, qy: number, b: Box) => {
  for (let i = 1; i < 12; i += 1) {
    const x = px + ((qx - px) * i) / 12;
    const y = py + ((qy - py) * i) / 12;
    if (x > b.x - 4 && x < b.x + b.w + 4 && y > b.y - 4 && y < b.y + b.h + 4) return true;
  }
  return false;
};
/** The point of a box nearest to (x, y): where a leader line meets it. */
export const nearest = (b: Box, x: number, y: number): [number, number] => [Math.max(b.x, Math.min(b.x + b.w, x)), Math.max(b.y, Math.min(b.y + b.h, y))];

/**
 * Where each place's label goes. Every spot round every pin is tried (beside
 * it, above, below, the corners; near first, then further out with a leader
 * line) and the one is kept that stays in the card, touches no other label and
 * no pin, and whose leader line crosses no label. The most crowded pins are
 * placed first. Sized for the longer of its two texts (the old name, then
 * «امروز: …»), so the turn never collides.
 */
export function placeLabels(pins: { x: number; y: number; texts: string[] }[], size: number, h = size * 1.62, card = CARD): Label[] {
  const out: (Label | null)[] = pins.map(() => null);
  const inside = (b: Box) => b.x >= card.x + INSET + 8 && b.y >= card.y + INSET + 8 && b.x + b.w <= card.x + card.w - INSET - 8 && b.y + b.h <= card.y + card.h - INSET - 8;
  const crowd = (i: number) => pins.filter((q, j) => j !== i && Math.hypot(q.x - pins[i].x, q.y - pins[i].y) < 260).length;
  const order = pins.map((_, i) => i).sort((a, b) => crowd(b) - crowd(a) || a - b);
  for (const i of order) {
    const pin = pins[i];
    const w = Math.max(...pin.texts.map((t) => textW(t, size))) + 30;
    const placed = out.filter((x): x is Label => Boolean(x));
    let best: Label | null = null;
    let bestCost = Infinity;
    for (const g of [20, 48, 84, 130, 190]) {
      const spots: [number, number][] = [
        [g, -h / 2],
        [-g - w, -h / 2],
        [-w / 2, -g - h],
        [-w / 2, g],
        [g * 0.7, -g * 0.7 - h],
        [-g * 0.7 - w, -g * 0.7 - h],
        [g * 0.7, g * 0.7],
        [-g * 0.7 - w, g * 0.7],
      ];
      for (const [dx, dy] of spots) {
        const b = { x: pin.x + dx, y: pin.y + dy, w, h };
        const [ex, ey] = nearest(b, pin.x, pin.y);
        const lead = g > 20;
        let cost = (inside(b) ? 0 : 100) + g / 60;
        for (const o of placed) {
          if (overlaps(b, o, 10)) cost += 40;
          if (lead && crosses(pin.x, pin.y, ex, ey, o)) cost += 25;
          if (o.lead && crosses(o.px, o.py, ...nearest(o, o.px, o.py), b)) cost += 25;
        }
        for (const [j, q] of pins.entries()) if (j !== i && q.x > b.x - 20 && q.x < b.x + b.w + 20 && q.y > b.y - 20 && q.y < b.y + b.h + 20) cost += 30;
        if (cost < bestCost) {
          bestCost = cost;
          best = { ...b, px: pin.x, py: pin.y, lead };
        }
      }
      if (bestCost < 10) break;
    }
    out[i] = best;
  }
  return out as Label[];
}

// ---------- the pieces ----------
const Ground: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [0, total], [40, 50]);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1200px 1500px at 50% ${y}%, #3a1d16 0%, ${ARCH.desk} 55%, ${ARCH.desk2} 100%)` }}>
      {/* the desk's grain */}
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(92deg, rgba(255,220,180,.025) 0 2px, transparent 2px 13px), repeating-linear-gradient(88deg, rgba(0,0,0,.06) 0 1px, transparent 1px 29px)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(closest-side at 50% 46%, rgba(255,214,150,.10), rgba(0,0,0,0) 74%)" }} />
    </AbsoluteFill>
  );
};

/** An eight-pointed star, as pressed into the wax. */
const Star: React.FC<{ size: number; color: string; stroke?: string }> = ({ size, color, stroke }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
    <rect x="24" y="24" width="52" height="52" fill={color} stroke={stroke} strokeWidth={stroke ? 2.4 : 0} />
    <rect x="24" y="24" width="52" height="52" fill={color} stroke={stroke} strokeWidth={stroke ? 2.4 : 0} transform="rotate(45 50 50)" />
    <circle cx="50" cy="50" r="11" fill="none" stroke={stroke ?? "rgba(0,0,0,.3)"} strokeWidth="2.6" />
  </svg>
);

/** The wax seal: an uneven red disc, a raised rim, the star pressed in. */
export const Seal: React.FC<{ size: number }> = ({ size }) => {
  const blob = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    const r = 46 + Math.sin(i * 2.7) * 2.6 + Math.cos(i * 1.3) * 1.8;
    return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
  }).join(" ");
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <radialGradient id="wax" cx="38%" cy="34%" r="70%">
            <stop offset="0" stopColor={ARCH.wax2} />
            <stop offset=".6" stopColor={ARCH.wax} />
            <stop offset="1" stopColor={ARCH.waxDark} />
          </radialGradient>
        </defs>
        <ellipse cx="52" cy="56" rx="47" ry="44" fill="rgba(40,12,6,.35)" />
        <polygon points={blob} fill="url(#wax)" />
        <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(255,180,160,.35)" strokeWidth="2.4" />
        <circle cx="50" cy="50" r="31" fill="none" stroke="rgba(60,10,6,.55)" strokeWidth="2" />
      </svg>
      <div style={{ position: "absolute", inset: size * 0.26, opacity: 0.9 }}>
        <Star size={size * 0.48} color="rgba(120,22,14,.9)" stroke="rgba(255,170,150,.45)" />
      </div>
    </div>
  );
};

/** The trust stamp of the site, in its colour. */
const Verdict: React.FC<{ tier: Confidence; label: string; at: number }> = ({ tier, label, at }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const c = tier === "FACT" ? "#23885a" : tier === "CONTESTED" ? "#a8740f" : "#b2402f";
  return (
    <div style={{ width: 196, height: 196, position: "relative", opacity: fade(frame, at, 3), transform: `rotate(-10deg) scale(${slam(frame, at, 2.2)})` }}>
      <svg width="196" height="196" viewBox="0 0 200 200" style={{ position: "absolute", inset: 0 }}>
        <circle cx="100" cy="100" r="94" fill="rgba(246,238,219,.9)" stroke={c} strokeWidth="6" />
        <circle cx="100" cy="100" r="82" fill="none" stroke={c} strokeWidth="2" strokeDasharray="5 5" />
      </svg>
      <div style={{ position: "absolute", inset: 30, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, direction: "rtl", textAlign: "center", fontFamily: VAZIR, fontWeight: 900, fontSize: 32, lineHeight: 1.2, color: c }}>
        <span style={{ width: 16, height: 16, borderRadius: 8, background: CONFIDENCE[tier] }} />
        {label}
      </div>
    </div>
  );
};

// ---------- the Reel ----------
export const Treaty: React.FC<TreatyProps> = (p) => {
  const frame = useCurrentFrame();
  const tl = p.tl!;
  const t = p.treaty;
  const hook = beatAt(tl, "start");
  const doc = beatAt(tl, "doc");
  const bodyIds = tl.order.filter((id) => /^b\d$/.test(id));
  const body0 = beatAt(tl, bodyIds[0] ?? "doc").from;
  const today = beatAt(tl, "today");
  const closing = tl.order.find((id) => id === "verdict" || id === "n1") ?? "end";
  const verdictAt = beatAt(tl, closing).from + 6;
  const endB = beatAt(tl, "end");

  // the map, projected once
  const map = useMemo(() => {
    const v = viewOf(p.places);
    const path = geoPath(v.projection);
    const region = regionOf(v.lon0 - 8, v.lat0 - 8, v.lon1 + 8, v.lat1 + 8);
    const d = (o: unknown) => path(o as GeoPermissibleObjects) ?? "";
    const pins = p.places.map((x) => {
      const [px, py] = v.projection([x.lon, x.lat]) as [number, number];
      return { x: px, y: py, texts: [x.name, `${p.todayLabel}: ${x.today}`] };
    });
    return {
      land: region.map((f) => d(f)),
      iran: d(IRAN_TODAY),
      grid: d(geoGraticule().step([2, 2]).extent([[v.lon0 - 10, v.lat0 - 10], [v.lon1 + 10, v.lat1 + 10]])()),
      pins,
      // room for the turned label: the old name small above «امروز: …»
      labels: placeLabels(pins, LABEL, LABEL_H),
    };
  }, [p.places, p.todayLabel]);

  // the scroll: unrolled during the hook, written in the document's beat, rolled up when the map comes
  const PAPER = { x: 150, y: 420, w: 780, h: 760 };
  const rollUp = interpolate(frame, [body0 - 2, body0 + 14], [1, 0], { ...clamped, easing: ease });
  const open = interpolate(frame, [4, Math.max(30, hook.to - 4)], [0.06, 1], { ...clamped, easing: ease }) * rollUp;
  const scrollO = leave(frame, body0 + 12, 8);
  // the seal comes once the party is written, so it stays a while before the scroll rolls up
  const sealAt = Math.max(doc.from + 30, Math.min(doc.from + 40, doc.to - 24));
  const sh = shake(frame, sealAt + 5, 8);
  const mapIn = grow(frame, body0 + 2, 20);
  const pushK = interpolate(frame, [body0, tl.total], [1, 1.03], clamped);
  const n = map.pins.length;
  const pinAt = (k: number) => body0 + 14 + (k * Math.max(8, today.from - body0 - 34)) / Math.max(1, n);
  const flipAt = (k: number) => today.from + 6 + k * 7;
  const sourceFrom = tl.total - Math.round(2.6 * FPS);
  const nameSize = Math.min(88, Math.round(640 / Math.max(6, t.name.length * 0.48)));

  return (
    <Stage ground={<Ground total={tl.total} />} tl={tl} music={p.music} offset={sh}>
      <Sfx at={4} name="paper" />
      <Sfx at={doc.from + 2} name="draw" volume={0.2} />
      <Sfx at={sealAt} name="stamp" />
      <Sfx at={body0 - 2} name="paper" volume={0.26} />
      {map.pins.map((_, k) => (
        <Sfx key={`p${k}`} at={pinAt(k)} name="pop" volume={0.2} />
      ))}
      {map.pins.map((_, k) => (
        <Sfx key={`f${k}`} at={flipAt(k)} name="tick" volume={0.18} />
      ))}
      <Sfx at={verdictAt} name="stamp" volume={0.4} />

      <Mark color={ARCH.paper2} sub={p.series} subColor={ARCH.cream} />

      {/* the hook from the first frame, over the scroll that opens */}
      <div style={{ position: "absolute", top: DESIGN_TOP + 128, right: SIDE, left: SIDE, direction: "rtl", opacity: leave(frame, hook.to + 4, 10), transform: `translateY(${-interpolate(frame, [hook.to - 6, hook.to + 4], [0, 40], clamped)}px)` }}>
        <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: (p.hook?.text ?? "").length > 30 ? 74 : 86, lineHeight: 1.3, color: ARCH.cream, textWrap: "balance" } as React.CSSProperties}>{p.hook?.text ?? t.name}</div>
        <div style={{ height: 8, marginTop: 14, width: `${interpolate(frame, [0, hook.to], [14, 56], clamped)}%`, background: ARCH.wax2, borderRadius: 4 }} />
      </div>
      {/* the series' name while the document is written */}
      <div style={{ position: "absolute", top: DESIGN_TOP + 150, right: SIDE, left: SIDE, direction: "rtl", opacity: Math.min(fade(frame, doc.from, 10), leave(frame, body0, 8)), fontFamily: VAZIR, fontWeight: 800, fontSize: 46, color: ARCH.wax2 }}>{p.title}</div>

      {/* the document */}
      {scrollO > 0 ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 1400, opacity: scrollO }}>
          <div style={{ position: "absolute", left: PAPER.x, top: PAPER.y, width: PAPER.w, height: PAPER.h * open, overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,.45)" }}>
            <div style={{ position: "absolute", inset: 0, height: PAPER.h, background: `radial-gradient(120% 90% at 50% 0%, rgba(255,250,235,.7), rgba(0,0,0,0) 60%), linear-gradient(90deg, rgba(120,85,40,.22), rgba(0,0,0,0) 8%, rgba(0,0,0,0) 92%, rgba(120,85,40,.22)), ${ARCH.paper}` }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(83deg, rgba(120,85,40,.04) 0 1px, transparent 1px 9px), repeating-linear-gradient(-71deg, rgba(120,85,40,.035) 0 1px, transparent 1px 13px)" }} />
              <div style={{ position: "absolute", left: 34, right: 34, top: 34, bottom: 34, border: `2.5px solid rgba(142,29,20,.55)`, borderRadius: 4 }} />
              <div style={{ position: "absolute", left: 44, right: 44, top: 44, bottom: 44, border: `1.2px solid rgba(142,29,20,.35)`, borderRadius: 3 }} />
              <div style={{ position: "absolute", top: 86, left: 70, right: 70, display: "flex", flexDirection: "column", alignItems: "center", direction: "rtl", textAlign: "center" }}>
                <div style={{ display: "flex", gap: 18, alignItems: "center", opacity: 0.8 }}>
                  <div style={{ width: 120, height: 2, background: ARCH.wax }} />
                  <Star size={34} color="rgba(142,29,20,.75)" />
                  <div style={{ width: 120, height: 2, background: ARCH.wax }} />
                </div>
                <div style={{ fontFamily: NASKH, fontWeight: 700, fontSize: nameSize, lineHeight: 1.6, color: ARCH.ink, marginTop: 26 }}>
                  {t.name.split(/\s+/).map((wd, i) => (
                    <span key={i} style={{ display: "inline-block", marginInline: "0.14em", opacity: fade(frame, doc.from + 2 + i * 6, 8), transform: `translateY(${rise(frame, doc.from + 2 + i * 6, 14, 12)}px)` }}>
                      {wd}
                    </span>
                  ))}
                </div>
                <div style={{ width: 300, height: 2, background: "rgba(44,28,18,.4)", margin: "18px 0 22px", opacity: fade(frame, doc.from + 10, 10) }} />
                <div style={{ fontFamily: VAZIR, fontWeight: 800, fontSize: 60, color: ARCH.ink2, opacity: fade(frame, doc.from + 14, 10) }}>{t.year}</div>
                <div style={{ fontFamily: NASKH, fontWeight: 700, fontSize: 56, lineHeight: 1.5, color: ARCH.ink, marginTop: 10, opacity: fade(frame, doc.from + 24, 10) }}>
                  {t.sealed ? (
                    <>
                      <span style={{ color: ARCH.wax, fontFamily: VAZIR, fontWeight: 700, fontSize: 46 }}>{t.toLabel}: </span>
                      {t.to}
                    </>
                  ) : (
                    t.to
                  )}
                </div>
              </div>
              {t.sealed ? (
                <div style={{ position: "absolute", left: PAPER.w / 2 - 88, top: 536, opacity: fade(frame, sealAt, 2), transform: `scale(${slam(frame, sealAt, 1.9)}) rotate(-6deg)` }}>
                  {frame >= sealAt ? <Seal size={176} /> : null}
                </div>
              ) : null}
            </div>
          </div>
          {/* the two rollers */}
          {[PAPER.y - 22, PAPER.y + PAPER.h * open - 22].map((ry, i) => (
            <div key={i} style={{ position: "absolute", left: PAPER.x - 34, top: ry, width: PAPER.w + 68, height: 44, borderRadius: 22, background: "linear-gradient(180deg, #7a4a2a 0%, #b07a4a 30%, #5a321b 70%, #2e170b 100%)", boxShadow: "0 10px 20px rgba(0,0,0,.45)" }}>
              <div style={{ position: "absolute", left: -10, top: 4, width: 36, height: 36, borderRadius: 18, background: "radial-gradient(circle at 35% 35%, #f0d590, #9a7020 70%)" }} />
              <div style={{ position: "absolute", right: -10, top: 4, width: 36, height: 36, borderRadius: 18, background: "radial-gradient(circle at 35% 35%, #f0d590, #9a7020 70%)" }} />
            </div>
          ))}
        </div>
      ) : null}

      {/* the header over the map: the treaty, its year, the party; the seal small beside them */}
      {frame >= body0 ? (
        <div style={{ position: "absolute", top: DESIGN_TOP + 112, right: SIDE, left: SIDE, direction: "rtl", display: "flex", alignItems: "center", gap: 26, opacity: fade(frame, body0 + 8, 10), transform: `translateY(${rise(frame, body0 + 8, 30, 14)}px)` }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: NASKH, fontWeight: 700, fontSize: Math.min(70, nameSize), lineHeight: 1.5, color: ARCH.cream }}>{t.name}</div>
            {/* no «·» here: beside Persian figures it reads as a zero */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: VAZIR, fontWeight: 700, fontSize: 38, color: ARCH.paper2, marginTop: 2 }}>
              <span>{t.year}</span>
              <span style={{ width: 2.5, height: 30, background: ARCH.paper2, opacity: 0.55 }} />
              <span>{t.sealed ? `${t.toLabel}: ${t.to}` : t.to}</span>
            </div>
          </div>
          {t.sealed ? <Seal size={124} /> : null}
        </div>
      ) : null}

      {/* the map */}
      {mapIn > 0 ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 1400, opacity: mapIn, transform: `translateY(${(1 - mapIn) * 60}px)` }}>
          <div style={{ position: "absolute", left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, borderRadius: 14, background: ARCH.sea, boxShadow: "0 30px 70px rgba(0,0,0,.5)", overflow: "hidden" }}>
            <div style={{ position: "absolute", left: -CARD.x, top: -CARD.y, width: W, height: 1400, transform: `scale(${pushK})`, transformOrigin: `${CARD.x + CARD.w / 2}px ${CARD.y + CARD.h / 2}px` }}>
              <svg width={W} height={1400} style={{ position: "absolute", inset: 0 }}>
                <defs>
                  <radialGradient id="halo">
                    <stop offset="0" stopColor={ARCH.wax2} stopOpacity=".42" />
                    <stop offset=".55" stopColor={ARCH.wax2} stopOpacity=".18" />
                    <stop offset="1" stopColor={ARCH.wax2} stopOpacity="0" />
                  </radialGradient>
                </defs>
                <path d={map.grid} fill="none" stroke="rgba(92,70,48,.13)" strokeWidth="1.2" />
                {map.land.map((d, i) => (
                  <path key={i} d={d} fill={ARCH.land} stroke={ARCH.border} strokeWidth="1.4" strokeLinejoin="round" />
                ))}
                {/* Iran today: the gold dashed reference, drawn round once as the map comes */}
                <path d={map.iran} fill="rgba(216,168,69,.10)" stroke="none" />
                <path d={map.iran} fill="none" stroke={ARCH.gold} strokeWidth="4" strokeDasharray="12 8" strokeLinejoin="round" opacity={grow(frame, body0 + 12, 30)} />
                {map.pins.map((pin, k) => {
                  const at = pinAt(k);
                  if (frame < at) return null;
                  const g = grow(frame, at, 18);
                  const drop = interpolate(frame, [at, at + 8, at + 12, at + 15], [-44, 4, -3, 0], clamped);
                  const lb = map.labels[k];
                  return (
                    <g key={k}>
                      <circle cx={pin.x} cy={pin.y} r={78 * g} fill="url(#halo)" />
                      {lb.lead ? <path d={`M${pin.x} ${pin.y}L${nearest(lb, pin.x, pin.y).join(" ")}`} stroke={ARCH.wax} strokeWidth="2.4" opacity={fade(frame, at + 8, 8)} /> : null}
                      <ellipse cx={pin.x} cy={pin.y + 4} rx={10} ry={4} fill="rgba(40,12,6,.3)" opacity={g} />
                      <g transform={`translate(0 ${drop})`}>
                        <circle cx={pin.x} cy={pin.y} r={13} fill={ARCH.wax2} stroke={ARCH.cream} strokeWidth="4" />
                        <circle cx={pin.x} cy={pin.y} r={4} fill={ARCH.cream} />
                      </g>
                    </g>
                  );
                })}
              </svg>
              {/* the labels: the old name, turned to today's country in the beat «امروز» */}
              {map.pins.map((pin, k) => {
                const at = pinAt(k) + 6;
                if (frame < at) return null;
                const lb = map.labels[k];
                const flip = interpolate(frame, [flipAt(k), flipAt(k) + 10], [0, 1], clamped);
                const now = flip >= 0.5;
                const angle = now ? (1 - flip) * 90 : flip * 90;
                const place = p.places[k];
                return (
                  <div key={k} style={{ position: "absolute", left: lb.x, top: lb.y, width: lb.w, height: lb.h, display: "flex", alignItems: lb.py < lb.y ? "flex-start" : lb.py > lb.y + lb.h ? "flex-end" : "center", justifyContent: "center", direction: "rtl", opacity: fade(frame, at, 8), transform: `perspective(600px) rotateX(${angle}deg)` }}>
                    <div style={{ width: "100%", padding: now ? "6px 0 8px" : "5px 0 7px", display: "flex", flexDirection: "column", alignItems: "center", borderRadius: 10, whiteSpace: "nowrap", fontFamily: VAZIR, fontWeight: 800, fontSize: LABEL, lineHeight: 1.25, background: now ? ARCH.wax : "rgba(250,245,230,.96)", color: now ? ARCH.cream : ARCH.ink, border: `2px solid ${now ? ARCH.waxDark : "rgba(142,29,20,.6)"}`, boxShadow: "0 6px 14px rgba(40,20,10,.25)" }}>
                      {now ? (
                        <>
                          <span style={{ fontWeight: 700, fontSize: 24, opacity: 0.78 }}>{place.name}</span>
                          <span>
                            <span style={{ fontWeight: 600, opacity: 0.8, marginLeft: 8 }}>{p.todayLabel}:</span>
                            {place.today}
                          </span>
                        </>
                      ) : (
                        place.name
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* the neatline of an old map, and the legend of the gold line */}
            <div style={{ position: "absolute", inset: 10, border: `2px solid rgba(44,28,18,.5)`, borderRadius: 8, pointerEvents: "none" }} />
            <div style={{ position: "absolute", inset: 16, border: `1px solid rgba(44,28,18,.3)`, borderRadius: 6 }} />
            <div style={{ position: "absolute", left: 34, top: 30, display: "flex", alignItems: "center", gap: 14, direction: "rtl", padding: "6px 14px", borderRadius: 8, background: "rgba(246,238,219,.88)", opacity: fade(frame, body0 + 30, 10) }}>
              <svg width="56" height="10">
                <path d="M2 5H54" stroke={ARCH.gold} strokeWidth="4" strokeDasharray="12 8" />
              </svg>
              <span style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 26, color: ARCH.ink }}>{p.reference}</span>
            </div>
          </div>
          <div style={{ position: "absolute", left: CARD.x + 26, top: CARD.y + CARD.h - 222 }}>
            <Verdict tier={t.tier} label={t.tierLabel} at={verdictAt} />
          </div>
        </div>
      ) : null}

      <Captions tl={tl} look={{ ink: ARCH.cream, now: "#ffb39a", band: "rgba(36,18,14,.86)", border: "1.5px solid rgba(196,57,42,.5)" }} bottom={1440} until={endB.from + 4} />
      <SourceLine text={p.source} opacity={fade(frame, sourceFrom, 12)} color="rgba(246,238,219,.72)" strong={ARCH.wax2} />
    </Stage>
  );
};

/** The treaty's tile: the parchment, the wax seal, the treaty's name and year. */
export const TreatyTile: React.FC<{ title: string; mark?: string; kicker?: string; series: string }> = ({ title, mark, kicker, series }) => {
  const top = (1920 - 1080) / 2;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1100px 1200px at 50% 50%, #3a1d16, ${ARCH.desk2})`, direction: "rtl" }}>
      <div style={{ position: "absolute", top: top + 60, left: 70, right: 70, height: 960, borderRadius: 10, background: ARCH.paper, boxShadow: "0 30px 60px rgba(0,0,0,.5)" }}>
        <div style={{ position: "absolute", inset: 24, border: "3px solid rgba(142,29,20,.55)", borderRadius: 4 }} />
        <div style={{ position: "absolute", top: 60, right: 70, left: 70, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 42, color: ARCH.wax }}>{kicker ?? series}</span>
          <span style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 30, color: ARCH.ink2, direction: "ltr" }}>bidar.ahura.cloud</span>
        </div>
        <div style={{ position: "absolute", top: 210, right: 80, left: 80, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 18 }}>
          <div style={{ fontFamily: NASKH, fontWeight: 700, fontSize: title.length > 16 ? 92 : 108, lineHeight: 1.5, color: ARCH.ink, textWrap: "balance" } as React.CSSProperties}>{title}</div>
          {mark ? <div style={{ fontFamily: VAZIR, fontWeight: 800, fontSize: 60, color: ARCH.ink2 }}>{mark}</div> : null}
        </div>
        <div style={{ position: "absolute", left: 380, top: 620 }}>
          <Seal size={220} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
