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

  const triggerRect = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Menu"]');
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height, visible: r.width > 0 && r.height > 0 };
  });
  console.log("trigger:", JSON.stringify(triggerRect));

  await page.evaluate(() => {
    document.querySelector('button[aria-label="Menu"]').click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  const info = await page.evaluate(() => {
    function rect(el) {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    }
    const dialog = document.querySelector('[role="dialog"]');
    const nav = dialog ? dialog.querySelector("nav") : null;
    const aboutBtn = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent.includes("About"),
    );
    return {
      dialog: rect(dialog),
      dialogClass: dialog ? dialog.className : null,
      nav: rect(nav),
      navClass: nav ? nav.className : null,
      aboutBtn: rect(aboutBtn),
      aboutBtnClass: aboutBtn ? aboutBtn.className : null,
    };
  });
  console.log(JSON.stringify(info, null, 2));

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
