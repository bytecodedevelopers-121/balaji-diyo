const puppeteer = require("puppeteer-core");

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));
  await page.setViewport({ width: 390, height: 844 });
  await page.goto("http://localhost:4102/", { waitUntil: "load", timeout: 45000 });
  await new Promise((r) => setTimeout(r, 800));

  await page.evaluate(() => {
    document.querySelector('button[aria-label="Menu"]').click();
  });
  await new Promise((r) => setTimeout(r, 800));

  const info = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const cs = dialog ? getComputedStyle(dialog) : null;
    const fixedWrap = dialog ? dialog.parentElement : null;
    const csWrap = fixedWrap ? getComputedStyle(fixedWrap) : null;
    return {
      dialogWidth: cs ? cs.width : null,
      dialogMaxWidth: cs ? cs.maxWidth : null,
      dialogPosition: cs ? cs.position : null,
      dialogDisplay: cs ? cs.display : null,
      wrapClass: fixedWrap ? fixedWrap.className : null,
      wrapWidth: csWrap ? csWrap.width : null,
      wrapPosition: csWrap ? csWrap.position : null,
      wrapDisplay: csWrap ? csWrap.display : null,
      htmlSnippet: dialog ? dialog.outerHTML.slice(0, 400) : null,
    };
  });
  console.log(JSON.stringify(info, null, 2));

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
