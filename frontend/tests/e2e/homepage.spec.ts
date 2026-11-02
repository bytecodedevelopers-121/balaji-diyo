import { test, expect } from "@playwright/test";

test("homepage renders the hero heading", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: /walk into wonder/i }),
  ).toBeVisible();
});

test("desktop header renders the logo, navigation and CTA", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1442, height: 900 });
  await page.goto("/");

  await expect(
    page.getByRole("link", { name: /boundless adventure — home/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("link", {
      name: "Contact",
    }),
  ).toBeVisible();
  // Scoped to the header — the homepage's Cta section (near the footer)
  // has its own "Plan with us" link to the same route.
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Plan with us" }),
  ).toBeVisible();
});

test.describe("mobile menu accessibility", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("opens/closes with aria-expanded, traps Escape, and restores focus", async ({
    page,
  }) => {
    await page.goto("/");

    // Playwright's role-name matching is substring-by-default (unlike
    // testing-library's exact-by-default) — "Menu" would otherwise also
    // match the panel's "Close menu"/"Close menu overlay" buttons.
    const trigger = page.getByRole("button", { name: "Menu", exact: true });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const dialog = page.getByRole("dialog", { name: "Menu" });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("link", { name: /destination/i }),
    ).toBeVisible();

    // Background scroll is locked while open.
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  });
});

test.describe("no horizontal overflow", () => {
  for (const width of [375, 768, 1024, 1442]) {
    test(`at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));

      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  }
});
