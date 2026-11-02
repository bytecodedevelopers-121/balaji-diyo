const puppeteer = require("puppeteer-core");
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  page.on("console", (msg) => console.log("CONSOLE:", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.log("PAGEERROR:", err.message));
  page.on("requestfailed", (req) => console.log("REQFAILED:", req.url(), req.failure()?.errorText));
  await page.setViewport({ width: 1400, height: 900 });
  const resp = await page.goto("http://localhost:4102/", { waitUntil: "load", timeout: 45000 });
  console.log("status:", resp.status());
  const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
  console.log("bodyLen:", bodyLen);
  const html = await page.content();
  require("fs").writeFileSync("/tmp/claude-1000/-home-mingtindu-Bytecode-boundless/f4f6044a-9d2a-448d-9753-e01ed5ee6e27/scratchpad/rendered.html", html);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
