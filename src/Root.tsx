import React from "react";
import { Composition } from "remotion";
import bordersSample from "../samples/borders-1.json";
import mythSample from "../samples/myth-1.json";
import wordSample from "../samples/word-1.json";
import bookSample from "../samples/book-1.json";
import quoteSample from "../samples/quote-1.json";
import figureSample from "../samples/figure-1.json";
import quizSample from "../samples/quiz-1.json";
import coverSample from "../samples/borders-1.cover.json";
import flagSample from "../samples/flag-1.json";
import treatySample from "../samples/treaty-1.json";
import citySample from "../samples/city-1.json";
import trueFalseSample from "../samples/truefalse-1.json";
import fiveSample from "../samples/five-1.json";
import sweepSample from "../samples/sweep-1.json";
import storySample from "../samples/story.json";
import cardsSample from "../samples/cards.json";
import { Book } from "./Book";
import { Borders } from "./Borders";
import { City } from "./City";
import { Cover } from "./Cover";
import { Figure } from "./Figure";
import { Flag } from "./Flag";
import { Myth } from "./Myth";
import { Quiz } from "./Quiz";
import { Quote } from "./Quote";
import { Treaty } from "./Treaty";
import { Word } from "./Word";
import { TrueFalse, type TrueFalseProps } from "./TrueFalse";
import { Five, type FiveProps } from "./Five";
import { Sweep, type SweepProps } from "./Sweep";
import { Story, storyDuration, type StoryProps } from "./Story";
import { CARD_H, CARD_W, Cards, cardsLength, type CardsProps } from "./Cards";
import type { Base, BookProps, BordersProps, CityProps, CoverProps, FigureProps, FlagProps, MythProps, QuizProps, QuoteProps, ReelProps, TreatyProps, WordProps } from "./props";
import { timeline } from "./timeline";
import { adapt } from "./adapt";
import { Hall } from "./set/Hall";
import { CoverSet, coverWords } from "./set/CoverSet";
import { HOLD_CAP, isSetFormat, planOf, type SetFormat } from "./set/plans";
import { fit, ready } from "./set/fit";
import type { Plan } from "./set/space";

// One composition per format (the id is the format the site names in a job,
// docs/contract.md), all 1080 × 1920 at 30 fps, plus the still grid tile.
// The samples are only what the studio shows when no content is passed; a
// render always gets its content from the site (or from samples/ by hand).
const frame = { width: 1080, height: 1920, fps: 30 };

/** A Reel's clock: its beats and captions from its narrator (timeline.ts), its length from the last word. */
const timed = <P extends Pick<Base, "beats" | "voiceIn">>({ props: given }: { props: P }) => {
  // the site's own shape (lib/social/props.ts of bidar) or the samples' (src/props.ts)
  const props = adapt<P & ReelProps>(given) as P;
  const tl = timeline(props.beats, props.voiceIn);
  return { durationInFrames: tl.total, props: { ...props, tl } as P };
};
const as = <T,>(x: unknown) => x as T;

/**
 * The set style (owner, 2026-11-13: the approved new style, in Bidar's own
 * look): «حدس بزن», «درست یا غلط؟» and «پنج‌تایی» are drawn in the hall of
 * arches (src/set/). `style: "classic"` in the props (the worker's
 * BIDAR_STYLE=classic) draws them as before; `badge: false` (BIDAR_BADGE=off)
 * leaves the channel badge out. The silent holds are shortened (HOLD_CAP) and
 * the plan, with every text already measured, travels in the props, so the
 * gate (gate.mjs) checks what was drawn.
 */
type Switches = { style?: string; badge?: boolean };
const styled = (format: SetFormat) => async ({ props: given }: { props: Base & Switches }) => {
  if (given.style === "classic") return timed({ props: given });
  const props = adapt<ReelProps>(given as never) as unknown as Base & Switches & { count?: number };
  const last = props.beats.length - 1;
  const beats = props.beats.map((b, i) => (i > 0 && i < last && !b.say.trim() && b.min ? { ...b, min: Math.min(b.min, HOLD_CAP[format]) } : b));
  const count = format === "quiz" ? Math.min(Number(props.count) || HOLD_CAP.quiz, HOLD_CAP.quiz) : props.count;
  const tl = timeline(beats, props.voiceIn);
  await ready();
  const plan = planOf(format, { ...props, beats, count }, tl, { badge: given.badge !== false });
  return { durationInFrames: tl.total, props: { ...props, beats, count, tl, plan } };
};
/** A format of the set style: the hall when there is a plan, the classic look when there is not. */
const either = <P,>(Classic: React.FC<P>) => {
  const Comp: React.FC<P & { plan?: Plan; tl?: Base["tl"]; music?: string }> = (p) => (p.plan && p.tl ? <Hall plan={p.plan} tl={p.tl} music={p.music} /> : <Classic {...(p as P & React.JSX.IntrinsicAttributes)} />);
  return Comp;
};
const QuizAny = either(Quiz);
const TrueFalseAny = either(TrueFalse);
const FiveAny = either(Five);
/** The tile: a set format's tile is one object and its big words, measured to fit. */
const CoverAny: React.FC<CoverProps & { fitted?: unknown; style?: string; big?: string }> = (c) => (c.fitted ? <CoverSet {...(c as never)} /> : <Cover {...c} />);
const coverMeta = async ({ props }: { props: CoverProps & { style?: string; big?: string } }) => {
  if (!isSetFormat(props.format) || props.style === "classic") return { props };
  await ready();
  const fitted = fit({ text: coverWords(props), width: 900, maxLines: 2, size: 132, min: 84, weight: 900, height: 360, lead: 1.3 }).lines;
  return { props: { ...props, fitted } };
};

export const Root: React.FC = () => (
  <>
    <Composition id="borders" component={Borders} {...frame} durationInFrames={900} defaultProps={as<BordersProps>(bordersSample)} calculateMetadata={(x: { props: BordersProps }) => timed(x)} />
    <Composition id="myth" component={Myth} {...frame} durationInFrames={900} defaultProps={as<MythProps>(mythSample)} calculateMetadata={(x: { props: MythProps }) => timed(x)} />
    <Composition id="word" component={Word} {...frame} durationInFrames={900} defaultProps={as<WordProps>(wordSample)} calculateMetadata={(x: { props: WordProps }) => timed(x)} />
    <Composition id="book" component={Book} {...frame} durationInFrames={1200} defaultProps={as<BookProps>(bookSample)} calculateMetadata={(x: { props: BookProps }) => timed(x)} />
    <Composition id="quote" component={Quote} {...frame} durationInFrames={600} defaultProps={as<QuoteProps>(quoteSample)} calculateMetadata={(x: { props: QuoteProps }) => timed(x)} />
    <Composition id="figure" component={Figure} {...frame} durationInFrames={1050} defaultProps={as<FigureProps>(figureSample)} calculateMetadata={(x: { props: FigureProps }) => timed(x)} />
    <Composition id="quiz" component={QuizAny} {...frame} durationInFrames={690} defaultProps={as<QuizProps>(quizSample)} calculateMetadata={styled("quiz") as never} />
    <Composition id="flag" component={Flag} {...frame} durationInFrames={1050} defaultProps={as<FlagProps>(flagSample)} calculateMetadata={(x: { props: FlagProps }) => timed(x)} />
    <Composition id="treaty" component={Treaty} {...frame} durationInFrames={1050} defaultProps={as<TreatyProps>(treatySample)} calculateMetadata={(x: { props: TreatyProps }) => timed(x)} />
    <Composition id="city" component={City} {...frame} durationInFrames={1050} defaultProps={as<CityProps>(citySample)} calculateMetadata={(x: { props: CityProps }) => timed(x)} />
    {/* the round of 2026-10-31: «درست یا غلط؟», «پنج‌تایی», «تاریخِ ایران در یک دقیقه» (the book's v2 is the «book» above) */}
    <Composition id="truefalse" component={TrueFalseAny} {...frame} durationInFrames={1500} defaultProps={as<TrueFalseProps>(trueFalseSample)} calculateMetadata={styled("truefalse") as never} />
    <Composition id="five" component={FiveAny} {...frame} durationInFrames={1350} defaultProps={as<FiveProps>(fiveSample)} calculateMetadata={styled("five") as never} />
    <Composition id="sweep" component={Sweep} {...frame} durationInFrames={1800} defaultProps={as<SweepProps>(sweepSample)} calculateMetadata={(x: { props: SweepProps }) => timed(x)} />
    <Composition id="cover" component={CoverAny} {...frame} durationInFrames={1} defaultProps={as<CoverProps>(coverSample)} calculateMetadata={coverMeta as never} />
    {/* the Story that follows a Reel onto the page (ported from Divan's), and the carousel: one picture per frame, saved as stills (worker.mjs) */}
    <Composition id="story" component={Story} {...frame} durationInFrames={storyDuration()} defaultProps={as<StoryProps>(storySample)} />
    <Composition id="cards" component={Cards} width={CARD_W} height={CARD_H} fps={30} durationInFrames={4} defaultProps={as<CardsProps>(cardsSample)} calculateMetadata={({ props }: { props: CardsProps }) => ({ durationInFrames: cardsLength(props) })} />
  </>
);
