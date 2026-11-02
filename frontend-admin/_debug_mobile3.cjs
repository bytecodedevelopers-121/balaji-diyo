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

  const before = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    docWidth: document.documentElement.clientWidth,
    bodyOverflowX: getComputedStyle(document.body).overflowX,
    htmlOverflowX: getComputedStyle(document.documentElement).overflowX,
  }));
  console.log("before open:", JSON.stringify(before));

  await page.evaluate(() => {
    document.querySelector('button[aria-label="Menu"]').click();
  });
  await new Promise((r) => setTimeout(r, 800));

  const after = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    docWidth: document.documentElement.clientWidth,
    bodyOverflowX: getComputedStyle(document.body).overflowX,
    bodyOverflow: document.body.style.overflow,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  console.log("after open:", JSON.stringify(after));

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
