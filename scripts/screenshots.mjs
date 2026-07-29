/**
 * Visual check across the header's two states, desktop and mobile.
 *
 * Run the dev server, then: node scripts/screenshots.mjs
 * Output lands in .screenshots/ (gitignored).
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const OUT = ".screenshots";
const URL = process.env.URL ?? "http://localhost:3000";

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

const desktop = await browser.newContext({
  viewport: { width: 1512, height: 900 },
});
const page = await desktop.newPage();
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/1-header-rest.png` });

await page.evaluate(() => window.scrollTo({ top: 700, behavior: "instant" }));
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/2-header-pinned.png` });

await page.evaluate(() =>
  document.querySelector("dl")?.scrollIntoView({ block: "center", behavior: "instant" })
);
await page.waitForTimeout(1800);
await page.screenshot({ path: `${OUT}/3-impact.png` });
await page.screenshot({ path: `${OUT}/4-full.png`, fullPage: true });

const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const m = await mobile.newPage();
await m.goto(URL, { waitUntil: "networkidle" });
await m.waitForTimeout(600);
await m.screenshot({ path: `${OUT}/5-mobile-rest.png` });

await m.getByLabel("Open menu").click();
await m.waitForTimeout(500);
await m.screenshot({ path: `${OUT}/6-mobile-drawer.png` });

await browser.close();
console.log(`Screenshots written to ${OUT}/`);
