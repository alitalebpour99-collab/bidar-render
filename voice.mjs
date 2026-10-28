// The narrator's lines of one Reel, as the site hands them in (docs/contract.md,
// VoiceLine). They are written beside the score in the bundle's public folder;
// where each one goes, and when every beat starts, is the composition's own
// work (src/timeline.ts).
import fs from "node:fs";
import path from "node:path";

/**
 * Writes the lines' MP3s into the public folder, named after the Reel, and
 * returns them as the composition takes them in: file, cue, length in frames,
 * the text and ElevenLabs' alignment when there is one.
 * A line may also name a local MP3 (`file`, relative to `baseDir`) instead of
 * carrying it as base64: the samples in samples/ do that.
 */
export function voiceFiles(lines, publicDir, name, { fps = 30, baseDir = "." } = {}) {
  if (!Array.isArray(lines) || !lines.length) return [];
  return lines.map((line, i) => {
    const file = `voice-${name}-${i}.mp3`;
    const bytes = line.b64 ? Buffer.from(line.b64, "base64") : fs.readFileSync(path.resolve(baseDir, line.file));
    fs.writeFileSync(path.join(publicDir, file), bytes);
    const ends = line.alignment?.character_end_times_seconds ?? [];
    const seconds = Number(line.seconds) || (ends.length ? ends[ends.length - 1] : 0);
    return { file, cue: line.cue ?? "all", frames: Math.ceil(seconds * fps), text: line.text, alignment: line.alignment ?? null };
  });
}

/** The narrator's files of one Reel, taken away after its render. */
export function dropVoice(publicDir, name) {
  if (!fs.existsSync(publicDir)) return;
  for (const f of fs.readdirSync(publicDir).filter((x) => x.startsWith(`voice-${name}-`))) fs.rmSync(path.join(publicDir, f), { force: true });
}

/** The stretches (seconds) under which the score steps back: where the composition says words are said. */
export const duckOf = (composition) => (composition.props?.tl?.duck ?? []).map(([a, b]) => [a / composition.fps, b / composition.fps]);
