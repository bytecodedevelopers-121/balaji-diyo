const puppeteer = require("puppeteer-core");
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  const resp = await page.goto("http://localhost:4102/", { waitUntil: "load", timeout: 45000 });
  console.log("status:", resp.status());
  const anchors = await page.evaluate(() =>
    Array.from(document.querySelectorAll("nav a")).map((a) => JSON.stringify(a.textContent))
  );
  console.log(anchors);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
