// Narrates a sample Reel with ElevenLabs, as the site does for a real one
// (docs/contract.md): one take of all its beats, eleven_v3, voice Shahram
// (the voice of Bidar's narrated book), with the character alignment the
// captions and the beats are timed from.
//
//   node scripts/narrate.mjs samples/borders-1.json [more.json …] [--force] [--budget 3000]
//
// Writes samples/<name>.mp3 and samples/<name>.voice.json (a VoiceLine whose
// audio is that file instead of base64). A sample whose text has not changed
// is not narrated again unless --force. Every call is counted in
// samples/narration-ledger.json, and nothing is sent once the ledger would
// pass --budget characters.
//
// The key is read from ~/.elevenlabs_key (or ELEVENLABS_API_KEY) and is never
// printed, written or passed on a command line.
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const VOICE = process.env.BIDAR_VOICE ?? "rNb3hdSf0n4ROIbYC8Bl"; // Shahram
const MODEL = process.env.BIDAR_TTS_MODEL ?? "eleven_v3";
const args = process.argv.slice(2);
const force = args.includes("--force");
const budget = Number(args.includes("--budget") ? args[args.indexOf("--budget") + 1] : 3000);
const files = args.filter((a, i) => a.endsWith(".json") && args[i - 1] !== "--budget");

function key() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim();
  const file = path.join(os.homedir(), ".elevenlabs_key");
  if (!fs.existsSync(file)) throw new Error("no key: ~/.elevenlabs_key is missing");
  return fs.readFileSync(file, "utf8").trim();
}

const ledgerFile = path.resolve("samples/narration-ledger.json");
const ledger = fs.existsSync(ledgerFile) ? JSON.parse(fs.readFileSync(ledgerFile, "utf8")) : { characters: 0, calls: [] };

for (const file of files) {
  const props = JSON.parse(fs.readFileSync(file, "utf8"));
  const name = path.basename(file).replace(/\.json$/, "");
  const dir = path.dirname(file);
  const text = props.beats.map((b) => b.say).join("\n");
  const hash = crypto.createHash("sha1").update(JSON.stringify([VOICE, MODEL, text])).digest("hex").slice(0, 12);
  const out = path.join(dir, `${name}.voice.json`);
  if (!force && fs.existsSync(out) && JSON.parse(fs.readFileSync(out, "utf8")).hash === hash) {
    console.log(`${name}: unchanged, not narrated again`);
    continue;
  }
  if (ledger.characters + text.length > budget) {
    console.log(`${name}: ${text.length} characters would pass the budget (${ledger.characters} of ${budget} used); stopped`);
    process.exitCode = 1;
    break;
  }
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key(), "content-type": "application/json" },
    body: JSON.stringify({ text, model_id: MODEL, language_code: "fa" }),
    signal: AbortSignal.timeout(180_000),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.audio_base64) {
    // the answer's detail may say why (quota, voice); it never holds the key
    console.log(`${name}: ElevenLabs answered ${res.status} ${JSON.stringify(body?.detail ?? "").slice(0, 200)}`);
    process.exitCode = 1;
    break;
  }
  const alignment = body.alignment;
  const ends = alignment?.character_end_times_seconds ?? [];
  const seconds = ends.length ? ends[ends.length - 1] : 0;
  fs.writeFileSync(path.join(dir, `${name}.mp3`), Buffer.from(body.audio_base64, "base64"));
  const same = alignment?.characters?.join("") === text;
  fs.writeFileSync(out, JSON.stringify({ cue: "all", text, seconds, file: `${name}.mp3`, voice: VOICE, model: MODEL, characters: text.length, hash, alignment }, null, 1) + "\n");
  ledger.characters += text.length;
  ledger.calls.push({ name, characters: text.length, at: new Date().toISOString(), model: MODEL, voice: VOICE });
  fs.writeFileSync(ledgerFile, JSON.stringify(ledger, null, 2) + "\n");
  console.log(`${name}: ${text.length} characters, ${seconds.toFixed(1)} s of voice, alignment ${same ? "matches the text" : "differs from the text"}; ${ledger.characters} of ${budget} used`);
}
