import { test, expect } from "@playwright/test";

const PAGES = [
  { path: "/about-us", heading: /built by a community/i },
  { path: "/why-boundless-adventure", heading: /why travel with us/i },
];

for (const { path, heading } of PAGES) {
  test(`${path} renders its hero heading and light header`, async ({
    page,
  }) => {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { level: 1, name: heading }),
    ).toBeVisible();
    // Light Header variant: opaque, in normal flow — the logo link
    // should be visible without needing to scroll/overlay assumptions.
    await expect(
      page.getByRole("link", { name: /boundless adventure — home/i }),
    ).toBeVisible();
  });

  test.describe(`${path} no horizontal overflow`, () => {
    for (const width of [375, 768, 1024, 1442]) {
      test(`at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);

        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));

        expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
      });
    }
  });
}
