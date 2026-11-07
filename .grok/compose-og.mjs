import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const b64 = (path) => readFileSync(path).toString("base64");

const hero = b64("/workspace/public/dishes/hero-kitchen.jpg");
const bold = b64("/workspace/.grok/fonts/CormorantGaramond-Bold.ttf");
const medium = b64("/workspace/.grok/fonts/CormorantGaramond-Medium.ttf");

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
@font-face {
  font-family: "Cormorant";
  font-weight: 700;
  src: url("data:font/ttf;base64,${bold}") format("truetype");
}
@font-face {
  font-family: "Cormorant";
  font-weight: 500;
  src: url("data:font/ttf;base64,${medium}") format("truetype");
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  width: 1200px;
  height: 630px;
  overflow: hidden;
  background: #1C1410;
}
.stage { position: relative; width: 1200px; height: 630px; }
.bg {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  object-position: center 58%;
}
.veil {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse at 50% 48%, rgba(28,20,16,0.08) 0%, rgba(28,20,16,0.22) 70%, rgba(28,20,16,0.38) 100%);
}
.plate {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 620px;
  padding: 42px 40px 36px;
  background: #FBF7F2;
  text-align: center;
  border: 1px solid rgba(154, 59, 36, 0.28);
  box-shadow: 0 22px 60px rgba(28,20,16,0.32);
}
.grove { width: 34px; height: 34px; margin: 0 auto 14px; display: block; }
.word {
  font-family: "Cormorant", "Liberation Serif", serif;
  font-weight: 700;
  color: #1C1410;
  font-size: 64px;
  line-height: 0.92;
  letter-spacing: 0.16em;
  text-indent: 0.16em;
  text-transform: uppercase;
}
.word .line2 {
  display: block;
  margin-top: 4px;
  font-size: 48px;
  letter-spacing: 0.42em;
  text-indent: 0.42em;
  color: #9A3B24;
}
.rule {
  width: 64px;
  height: 1px;
  margin: 18px auto 14px;
  background: #9A3B24;
}
.tag {
  font-family: "Cormorant", "Liberation Serif", serif;
  font-weight: 500;
  font-size: 16px;
  letter-spacing: 0.42em;
  text-indent: 0.42em;
  text-transform: uppercase;
  color: #2F4A3C;
}
</style>
</head>
<body>
  <div class="stage">
    <img class="bg" src="data:image/jpeg;base64,${hero}" alt="" />
    <div class="veil"></div>
    <div class="plate">
      <svg class="grove" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="10" r="4.4" fill="#2F4A3C"/>
        <circle cx="10.4" cy="13.2" r="3.7" fill="#2F4A3C"/>
        <circle cx="21.6" cy="13.2" r="3.7" fill="#2F4A3C"/>
        <path d="M8 20c0 6.2 3.5 9.6 8 9.6S24 26.2 24 20Z" fill="#9A3B24"/>
      </svg>
      <div class="word">Trendgrove<span class="line2">Kitchen</span></div>
      <div class="rule"></div>
      <div class="tag">from our hearth</div>
    </div>
  </div>
</body>
</html>`;

writeFileSync("/workspace/.grok/og-card.html", html);

const browser = await chromium.launch({ args: ["--disable-web-security"] });
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(async () => {
  await document.fonts.ready;
  const img = document.querySelector("img.bg");
  if (img && !img.complete) {
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
    });
  }
});
await page.waitForTimeout(80);
await page.screenshot({
  path: "/workspace/.grok/card-raw.png",
  type: "png",
  clip: { x: 0, y: 0, width: 1200, height: 630 },
});
await browser.close();
console.log("wrote /workspace/.grok/card-raw.png");
