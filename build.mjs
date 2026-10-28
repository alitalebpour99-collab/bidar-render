// Bundles the Remotion project once; render.mjs and worker.mjs then render from the bundle.
//   node build.mjs            every composition (src/index.ts), into bundle/
//   node build.mjs seat       one composition alone (src/entries/seat.tsx), into bundle-seat/:
//                             for working on one format without waiting for, or breaking on, the others
import { bundle } from "@remotion/bundler";
import fs from "node:fs";
import path from "node:path";

const only = process.argv[2];
fs.mkdirSync("public", { recursive: true });
const out = await bundle({
  entryPoint: path.resolve(only ? `src/entries/${only}.tsx` : "src/index.ts"),
  outDir: path.resolve(only ? `bundle-${only}` : "bundle"),
  publicDir: path.resolve("public"),
});
console.log("bundled to", out);
