import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
const count = await page.getByText("View photos").count();
console.log("View photos count:", count);
const boxes = await page.getByText("View photos").all();
for (const b of boxes) {
  console.log(await b.boundingBox());
}
await browser.close();
