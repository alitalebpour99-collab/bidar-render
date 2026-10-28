// The map files the compositions draw on are copies of Bidar's own:
// public/data/iran-eras.json (period extents) and public/data/countries-110m.json
// (Natural Earth). Run this after they change on the site.
//   node sync-data.mjs <path to a clone of bidar> [--check]
import fs from "node:fs";
import path from "node:path";

const repo = process.argv[2];
if (!repo || repo.startsWith("--")) {
  console.error("usage: node sync-data.mjs <path to bidar> [--check]");
  process.exit(2);
}
let stale = 0;
for (const name of ["iran-eras.json", "countries-110m.json"]) {
  const from = path.join(repo, "public/data", name);
  const to = path.resolve(import.meta.dirname, "src/data", name);
  const text = fs.readFileSync(from, "utf8");
  if (fs.existsSync(to) && fs.readFileSync(to, "utf8") === text) continue;
  stale += 1;
  if (process.argv.includes("--check")) console.log(`${name} differs from the site's`);
  else {
    fs.writeFileSync(to, text);
    console.log(`${name} copied`);
  }
}
if (!stale) console.log("the map files match the site's");
else if (process.argv.includes("--check")) process.exitCode = 1;
