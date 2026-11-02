import { test, expect } from "@playwright/test";

test("an unknown route renders the 404 page", async ({ page }) => {
  const response = await page.goto("/this-route-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByText(/page not found/i)).toBeVisible();
});
