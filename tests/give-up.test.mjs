// A hung render never blocks a day (ported from Divan's worker, 6 November
// 2026): on 1 and 2 November the «مرزها» map Reel hung six runs of 90 minutes
// each. After RENDER_MAX_MS (15 minutes unless set) the render is cancelled,
// the site is told why (and that it will be tried again), and the worker goes
// on to the next post. Node only, like the other tests here.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const worker = fs.readFileSync(new URL("../worker.mjs", import.meta.url), "utf8");
const render = worker.slice(worker.indexOf("async function render(job)"), worker.indexOf("/** One pass"));

test("fifteen minutes unless RENDER_MAX_MS says otherwise", () => {
  assert.match(worker, /const RENDER_MAX_MS = Number\(process\.env\.RENDER_MAX_MS\) \|\| 15 \* 60_000;/);
});

test("the render is cancelled at the limit, and the timer never outlives it", () => {
  assert.match(render, /const tooLong = setTimeout\(\(\) => \{\n {4}slow = true;\n.*\n {4}cancel\(\);\n {2}\}, RENDER_MAX_MS\);/, "the limit cancels the render");
  assert.match(render, /finally \{\n {4}clearInterval\(watch\);\n {4}clearTimeout\(tooLong\);/, "and is cleared whatever happens");
  // the cancel reaches the tile and the video alike
  assert.match(render, /renderStill\(\{ composition: tile,[^\n]*cancelSignal \}\)/);
  assert.match(render, /renderMedia\(\{[^\n]*cancelSignal, timeoutInMilliseconds, onProgress \}\)/);
});

test("the site hears why, and tries again: a slow render is never «final»", () => {
  assert.match(render, /slow \? `drawing took longer than \$\{Math\.round\(RENDER_MAX_MS \/ 60_000\)\} minutes \(\$\{reached\}\); it will be tried again`/);
  assert.match(render, /const final = !gaveUp && !slow && Boolean\(e\?\.final\);/);
  // what it reached is logged at each stage and every tenth of the frames, never the content
  assert.match(render, /step\("tile drawn"\)/);
  assert.match(render, /step\(`frame \$\{renderedFrames\} of \$\{composition\.durationInFrames\}`\)/);
});

test("a give-up ends the pass cleanly; the next look tries again, and the site stops after three tries", () => {
  const pass = worker.slice(worker.indexOf("async function pass()"));
  assert.match(pass, /const ok = await render\(jobs\[0\]\);[\s\S]*if \(!ok\) return taken;/, "the pass ends on a failure, so the run ends long before GitHub's 90 minutes");
  assert.match(render, /\?id=\$\{job\.id\}&failed=1/, "the site is told, and puts the post back in its queue");
  assert.match(render, /return false;\n {2}\} finally/, "a failed render returns, it never throws out of the pass");
  assert.doesNotMatch(render, /process\.exit/);
});
