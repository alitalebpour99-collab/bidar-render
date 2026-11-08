// The site's own shape is read before the sample's (8 November 2026). Remotion hands
// calculateMetadata the composition's sample (defaultProps) merged under the job's props,
// so a «مرزها» job of the site also carries the sample's `stops`: when the check for a
// sample (beats with stops or evidence) came first, the site's `frames` were never read,
// and every narrated map Reel drew the sample's three maps under the site's periods.
// Node only, like the other tests here: the order of adapt()'s checks, and the maps' file.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const src = fs.readFileSync(new URL("../src/adapt.ts", import.meta.url), "utf8");
const body = src.slice(src.indexOf("export function adapt"));

test("adapt reads the site's frames, reality and chain before it passes a sample through", () => {
  const sample = body.indexOf("if (Array.isArray(s.beats) && s.beats.length && (s.stops || s.evidence))");
  assert.ok(sample > 0, "the pass-through of a sample is still there, for samples/*.json");
  for (const site of ['s.format === "borders" && Array.isArray(s.frames)', 's.format === "myth" && Array.isArray(s.reality)', 's.format === "word" && Array.isArray(s.chain)']) {
    const at = body.indexOf(site);
    assert.ok(at > 0 && at < sample, `${site} comes before the sample's pass-through`);
  }
});

test("the renderer's maps are the site's checked ones (bidar public/data/iran-eras.json)", () => {
  const eras = JSON.parse(fs.readFileSync(new URL("../src/data/iran-eras.json", import.meta.url), "utf8"));
  assert.deepEqual(Object.keys(eras).sort(), ["achaemenid", "caliphate", "ilkhanate", "islamic-republic", "pahlavi", "safavid", "sasanian", "timurid"]);
  assert.equal(eras.sasanian.year, "600");
});
