import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const c = await b.newContext({ viewport: { width: 1512, height: 900 } });
const p = await c.newPage();
await p.goto("http://localhost:3000", { waitUntil: "networkidle" });
// Sample a few points in the loop so the scrim is judged against bright and dark frames.
for (const [i, t] of [3, 12, 30].entries()) {
  await p.evaluate((sec) => { const v = document.querySelector("video"); if (v) v.currentTime = sec; }, t);
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `.screenshots/hero-frame-${i + 1}.png` });
}
await b.close();
