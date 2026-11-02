const puppeteer = require("puppeteer-core");

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1400,900"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto("http://localhost:4102/", { waitUntil: "load", timeout: 45000 });

  // --- Desktop dropdown ---
  const box = await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll("a")).find(
      (a) => a.textContent.trim() === "About",
    );
    if (!link) return null;
    const r = link.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (!box) throw new Error("About link not found");
  await page.mouse.move(box.x, box.y);
  await new Promise((r) => setTimeout(r, 400));

  const menuVisible = await page.evaluate(() => {
    const menu = document.querySelector('[role="menu"]');
    if (!menu) return { found: false };
    const rect = menu.getBoundingClientRect();
    const labels = Array.from(menu.querySelectorAll("a")).map((a) => a.textContent.trim());
    return { found: true, visible: rect.width > 0 && rect.height > 0, labels };
  });
  console.log("Desktop dropdown:", JSON.stringify(menuVisible));

  await page.screenshot({ path: "/tmp/claude-1000/-home-mingtindu-Bytecode-boundless/f4f6044a-9d2a-448d-9753-e01ed5ee6e27/scratchpad/desktop-dropdown.png" });

  // --- Mobile accordion --- (fresh page/tab, not a reload of the same
  // one — a second page.goto on the same page object hung here, same
  // "second navigation hangs" gotcha this project's memory already
  // documents for the admin app's smoke tests)
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844 });
  await mobilePage.goto("http://localhost:4102/", { waitUntil: "load", timeout: 45000 });
  await mobilePage.click('button[aria-label="Menu"]');
  await new Promise((r) => setTimeout(r, 300));

  const clicked = await mobilePage.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent.includes("About"),
    );
    if (!btn) return false;
    btn.click();
    return true;
  });
  if (!clicked) throw new Error("Mobile About accordion trigger not found");
  await new Promise((r) => setTimeout(r, 400));

  const mobileAccordion = await mobilePage.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent.includes("About"),
    );
    const expanded = btn ? btn.getAttribute("aria-expanded") : null;
    const panelId = btn ? btn.getAttribute("aria-controls") : null;
    const panel = panelId ? document.getElementById(panelId) : null;
    const labels = panel
      ? Array.from(panel.querySelectorAll("a")).map((a) => a.textContent.trim())
      : [];
    return { expanded, labels };
  });
  console.log("Mobile accordion:", JSON.stringify(mobileAccordion));

  await mobilePage.screenshot({ path: "/tmp/claude-1000/-home-mingtindu-Bytecode-boundless/f4f6044a-9d2a-448d-9753-e01ed5ee6e27/scratchpad/mobile-accordion.png" });

  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
