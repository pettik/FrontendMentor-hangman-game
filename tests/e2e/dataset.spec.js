import { test, expect } from "@playwright/test";

test("real JSON and local assets load and a complete round can be played", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`);
  });
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto("/");
  await page.getByRole("button", { name: "Play game", exact: true }).click();
  await expect(page.locator(".category-button")).toHaveCount(6);
  await page.getByRole("button", { name: "Countries", exact: true }).click();
  await expect(page.locator(".letter-tile")).toHaveCount(9);
  await page.keyboard.type("austrli");
  await expect(page.getByRole("dialog", { name: "You Win", exact: true })).toBeVisible();
  await expect(page.locator("#dialog-description")).toHaveText("The answer was Australia.");
  await page.getByRole("button", { name: "Play again!", exact: true }).click();
  await page.keyboard.type("brazil");
  await expect(page.getByRole("dialog", { name: "You Win", exact: true })).toBeVisible();
  await expect(page.locator("#dialog-description")).toHaveText("The answer was Brazil.");
  expect(errors).toEqual([]);
});
