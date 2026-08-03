import { slide01 } from "./slide-01.mjs";
import { slide02 } from "./slide-02.mjs";
import { slide03 } from "./slide-03.mjs";
import { slide04 } from "./slide-04.mjs";
import { slide05 } from "./slide-05.mjs";
import { slide06 } from "./slide-06.mjs";
import { slide07 } from "./slide-07.mjs";
import { slide08 } from "./slide-08.mjs";
import { slide09 } from "./slide-09.mjs";
import { slide10 } from "./slide-10.mjs";

export const SLIDE_TITLES = [
  "Cloud Email Analyzer",
  "Email evidence is fragmented before review.",
  "Normalize once, then analyze and review with context.",
  "AWS services separate ingestion, processing, state, and review.",
  "A normalized event moves through a short processing chain.",
  "The built system maps responsibilities to small modules.",
  "Separate artifacts from review state.",
  "Internal validation supports the packaged classifier.",
  "The architecture leaves room for stronger evidence sources.",
  "Cloud Email Analyzer turns inbound mail into traceable security evidence."
];

export const slides = [slide01, slide02, slide03, slide04, slide05, slide06, slide07, slide08, slide09, slide10];

export async function buildDeck(presentation, ctx) {
  await slide01(presentation, ctx);
  await slide02(presentation, ctx);
  await slide03(presentation, ctx);
  await slide04(presentation, ctx);
  await slide05(presentation, ctx);
  await slide06(presentation, ctx);
  await slide07(presentation, ctx);
  await slide08(presentation, ctx);
  await slide09(presentation, ctx);
  await slide10(presentation, ctx);
  return presentation;
}
