// The maps: Bidar's own base map (Natural Earth 1:110m, public/data/countries-110m.json
// of the site) and its period extents (public/data/iran-eras.json, from
// aourednik/historical-basemaps, simplified), copied into src/data/.
// A view is a Mercator camera: a centre and a scale, eased between beats.
import { geoArea, geoGraticule, geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { feature, mesh } from "topojson-client";
import topoJson from "./data/countries-110m.json";
import erasJson from "./data/iran-eras.json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const topo = topoJson as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ERAS = erasJson as any as Record<string, { year: string; names: string[]; geometry: any }>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const countries = (feature(topo, topo.objects.countries) as any).features as any[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const LAND = feature(topo, topo.objects.land) as any;
export const BORDERS = mesh(topo, topo.objects.countries, (a: unknown, b: unknown) => a !== b);
export const IRAN = countries.find((f) => f.properties?.name === "Iran");
export const GRATICULE = geoGraticule().step([5, 5])();

export type View = { lon: number; lat: number; scale: number };

/** The projection of a view, centred on the screen point (cx, cy). */
export const projection = (v: View, cx: number, cy: number) => geoMercator().center([v.lon, v.lat]).scale(v.scale).translate([cx, cy]);

/** The view that fits a shape into a box of w × h pixels around the screen point (cx, cy). */
export function fit(shape: GeoPermissibleObjects, w: number, h: number): View {
  const p = geoMercator().fitSize([w, h], shape);
  const [lon, lat] = p.invert!([w / 2, h / 2]) as [number, number];
  return { lon, lat, scale: p.scale() };
}

/** The view of a box of longitudes and latitudes. */
export const fitBox = (lon0: number, lat0: number, lon1: number, lat1: number, w: number, h: number) =>
  fit({ type: "MultiPoint", coordinates: [[lon0, lat0], [lon1, lat1], [lon0, lat1], [lon1, lat0]] } as GeoPermissibleObjects, w, h);

/** Between two views: the centre straight, the scale on a log scale (so a zoom feels even). */
export const mix = (a: View, b: View, t: number): View => ({ lon: a.lon + (b.lon - a.lon) * t, lat: a.lat + (b.lat - a.lat) * t, scale: Math.exp(Math.log(a.scale) + (Math.log(b.scale) - Math.log(a.scale)) * t) });

/** A view pushed in by a factor (the slow drift inside a beat). */
export const push = (v: View, k: number): View => ({ ...v, scale: v.scale * k });

/** An era's outline, or today's Iran. */
export const shapeOf = (era: string) => (era === "today" ? IRAN : ERAS[era] ? { type: "Feature", properties: {}, geometry: ERAS[era].geometry } : IRAN);

export function draw(v: View, cx: number, cy: number) {
  const p = projection(v, cx, cy);
  const path = geoPath(p);
  return { d: (o: GeoPermissibleObjects) => path(o as GeoPermissibleObjects) ?? "", at: (lon: number, lat: number) => (p([lon, lat]) as [number, number]) ?? [0, 0], p };
}

/** The area of a shape in square kilometres (for checks; the Reels do not print it). */
export const areaKm2 = (shape: GeoPermissibleObjects) => geoArea(shape) * 6371.0088 ** 2;
