const puppeteer = require("puppeteer-core");

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto("http://localhost:4102/", { waitUntil: "load", timeout: 45000 });
  await new Promise((r) => setTimeout(r, 800));

  const info = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Menu"]');
    const wrap = btn ? btn.closest(".nav_link") : null;
    const cs = wrap ? getComputedStyle(wrap) : null;
    const rect = wrap ? wrap.getBoundingClientRect() : null;
    return {
      wrapClass: wrap ? wrap.className : null,
      wrapTransform: cs ? cs.transform : null,
      wrapInlineStyle: wrap ? wrap.getAttribute("style") : null,
      wrapRect: rect ? { x: rect.x, y: rect.y, w: rect.width, h: rect.height } : null,
    };
  });
  console.log(JSON.stringify(info, null, 2));

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
