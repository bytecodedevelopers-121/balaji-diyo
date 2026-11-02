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

  await page.evaluate(() => {
    document.querySelector('button[aria-label="Menu"]').click();
  });
  await new Promise((r) => setTimeout(r, 800));

  const info = await page.evaluate(() => {
    const header = document.getElementById("site-header");
    const cs = header ? getComputedStyle(header) : null;
    const rect = header ? header.getBoundingClientRect() : null;
    return {
      headerInlineStyle: header ? header.getAttribute("style") : null,
      headerTransform: cs ? cs.transform : null,
      headerWidth: cs ? cs.width : null,
      headerRect: rect ? { x: rect.x, y: rect.y, w: rect.width, h: rect.height } : null,
      headerClass: header ? header.className : null,
    };
  });
  console.log(JSON.stringify(info, null, 2));

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
