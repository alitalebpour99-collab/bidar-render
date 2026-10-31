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
import trueFalseSample from "../samples/round/truefalse-1.json";
import fiveSample from "../samples/round/five-1.json";
import sweepSample from "../samples/round/sweep-1.json";
import book2Sample from "../samples/round/book2-1.json";
import type { Base, BookProps, BordersProps, CityProps, CoverProps, FigureProps, FlagProps, MythProps, QuizProps, QuoteProps, ReelProps, TreatyProps, WordProps } from "./props";
import { timeline } from "./timeline";
import { adapt } from "./adapt";

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

export const Root: React.FC = () => (
  <>
    <Composition id="borders" component={Borders} {...frame} durationInFrames={900} defaultProps={as<BordersProps>(bordersSample)} calculateMetadata={(x: { props: BordersProps }) => timed(x)} />
    <Composition id="myth" component={Myth} {...frame} durationInFrames={900} defaultProps={as<MythProps>(mythSample)} calculateMetadata={(x: { props: MythProps }) => timed(x)} />
    <Composition id="word" component={Word} {...frame} durationInFrames={900} defaultProps={as<WordProps>(wordSample)} calculateMetadata={(x: { props: WordProps }) => timed(x)} />
    <Composition id="book" component={Book} {...frame} durationInFrames={1200} defaultProps={as<BookProps>(bookSample)} calculateMetadata={(x: { props: BookProps }) => timed(x)} />
    <Composition id="quote" component={Quote} {...frame} durationInFrames={600} defaultProps={as<QuoteProps>(quoteSample)} calculateMetadata={(x: { props: QuoteProps }) => timed(x)} />
    <Composition id="figure" component={Figure} {...frame} durationInFrames={1050} defaultProps={as<FigureProps>(figureSample)} calculateMetadata={(x: { props: FigureProps }) => timed(x)} />
    <Composition id="quiz" component={Quiz} {...frame} durationInFrames={690} defaultProps={as<QuizProps>(quizSample)} calculateMetadata={(x: { props: QuizProps }) => timed(x)} />
    <Composition id="flag" component={Flag} {...frame} durationInFrames={1050} defaultProps={as<FlagProps>(flagSample)} calculateMetadata={(x: { props: FlagProps }) => timed(x)} />
    <Composition id="treaty" component={Treaty} {...frame} durationInFrames={1050} defaultProps={as<TreatyProps>(treatySample)} calculateMetadata={(x: { props: TreatyProps }) => timed(x)} />
    <Composition id="city" component={City} {...frame} durationInFrames={1050} defaultProps={as<CityProps>(citySample)} calculateMetadata={(x: { props: CityProps }) => timed(x)} />
    {/* the round of 2026-10-31 (proposal, samples only): «درست یا غلط؟», «پنج‌تایی», «تاریخ ایران در یک دقیقه», and the book's v2 */}
    <Composition id="truefalse" component={TrueFalse} {...frame} durationInFrames={1500} defaultProps={as<TrueFalseProps>(trueFalseSample)} calculateMetadata={(x: { props: TrueFalseProps }) => timed(x)} />
    <Composition id="five" component={Five} {...frame} durationInFrames={1350} defaultProps={as<FiveProps>(fiveSample)} calculateMetadata={(x: { props: FiveProps }) => timed(x)} />
    <Composition id="sweep" component={Sweep} {...frame} durationInFrames={1800} defaultProps={as<SweepProps>(sweepSample)} calculateMetadata={(x: { props: SweepProps }) => timed(x)} />
    <Composition id="book2" component={Book} {...frame} durationInFrames={1200} defaultProps={as<BookProps>(book2Sample)} calculateMetadata={(x: { props: BookProps }) => timed(x)} />
    <Composition id="cover" component={Cover} {...frame} durationInFrames={1} defaultProps={as<CoverProps>(coverSample)} />
  </>
);
