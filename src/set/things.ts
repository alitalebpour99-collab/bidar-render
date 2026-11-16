// The real thing a sentence of Bidar is about, among the set's objects
// (models.tsx): the Cyrus Cylinder, a coin of the period, a column of
// Persepolis, a clay tablet, a ziggurat, a manuscript, a dome, a tower. The
// owner's review of 2026-11-16: «حدس بزن», «درست یا غلط؟» and «پنج‌تایی» were
// words and numbered circles only. The first rule that matches the words
// decides; a manuscript when none does (Bidar's subject is the written
// record). Never a person.
import type { Emblem, Model } from "./space";

export type Thing = { model: Model; emblem?: Emblem };

const RULES: [RegExp, Thing][] = [
  [/کوروش|منشور|استوانه/, { model: "cylinder" }],
  [/چغازنبیل|زیگورات|عیلام|شوش/, { model: "ziggurat" }],
  [/تخت[ ‌]?جمشید|پرسپولیس|پاسارگاد|هخامنش|داریوش|خشایارشا|ستون/, { model: "column" }],
  [/لوح|گل[ ‌]?نوشته|میخی|قانون/, { model: "tablet" }],
  [/آزادی|برج|میل|گنبد[ ‌]?قابوس/, { model: "tower" }],
  [/سمرقند|بخارا|هرات|اصفهان|مسجد|گنبد|شهر|پایتخت|کاشی|مشهد|صفوی|یخچال|بادگیر|کاروانسرا/, { model: "dome" }],
  [/ساسانی|خسرو|شاپور|تیسفون|اردشیر/, { model: "coin", emblem: "altar" }],
  [/اشکانی|پارت/, { model: "coin", emblem: "bow" }],
  [/سلوکی|اسکندر/, { model: "coin", emblem: "anchor" }],
  [/قاجار|پهلوی|سکه|ریال|تومان/, { model: "coin", emblem: "sun" }],
  [/افشار|نادر|زند/, { model: "coin", emblem: "script" }],
  [/خوارزمی|رازی|ابن[ ‌]?سینا|بیرونی|طوسی|خیام|فردوسی|حافظ|سعدی|مولوی|دانشمند|شاعر|کتاب|شاهنامه|نسخه|جبر|پزشک|ریاضی/, { model: "book" }],
];

export function thingFor(...texts: (string | null | undefined)[]): Thing {
  const t = texts.filter(Boolean).join(" ");
  for (const [re, thing] of RULES) if (re.test(t)) return thing;
  return { model: "book" };
}
