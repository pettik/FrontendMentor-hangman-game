import { test, expect } from "@playwright/test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const fixture = { categories: {
  Movies: [{ name: "The Silence of the Lambs" }],
  "TV Shows": [{ name: "Orange Is the New Black" }],
  Countries: [{ name: "United Kingdom" }, { name: "Canada" }],
  "Capital Cities": [{ name: "Buenos Aires" }],
  Animals: [{ name: "Hippopotamus" }],
  Sports: [{ name: "American Football" }],
} };

async function load(page, data = fixture) {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.route("**/data.json", (route) => route.fulfill({ json: data }));
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Play game", exact: true })).toBeEnabled();
}

async function start(page, category = "Countries") {
  await page.getByRole("button", { name: "Play game", exact: true }).click();
  await page.getByRole("button", { name: category, exact: true }).click();
  await expect(page.getByRole("heading", { name: category, exact: true })).toBeVisible();
}

async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test("main menu, instructions and categories are fully keyboard navigable", async ({ page }) => {
  await load(page);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Play game", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "How to Play", exact: true })).toBeFocused();
  await expect(page.locator(".instruction-card")).toHaveCount(3);
  await noOverflow(page);
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Play game", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Pick a Category", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Movies", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Movies", exact: true })).toBeFocused();
});

test("correct guesses reveal every occurrence; repeated and modified keys do not cost health", async ({ page }) => {
  await load(page);
  await start(page);
  await page.keyboard.press("i");
  await expect(page.locator(".letter-tile.is-revealed")).toHaveCount(2);
  await page.keyboard.press("z");
  await page.keyboard.press("z");
  await page.keyboard.press("Control+x");
  await expect(page.getByRole("meter")).toHaveAttribute("aria-valuenow", "7");
  await expect(page.locator('[data-letter="Z"]')).toHaveAttribute("aria-disabled", "true");
  await page.locator('[data-letter="U"]').click();
  await expect(page.locator('[data-letter="U"]')).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("meter")).toHaveAttribute("aria-valuenow", "7");
  await expect(page.locator("#game-announcement")).toContainText("U is correct");
});

test("pause blocks guesses, traps focus, and Escape resumes without changing the board", async ({ page }) => {
  await load(page);
  await start(page);
  await page.keyboard.press("u");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Paused", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeFocused();
  await page.keyboard.press("z");
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Quit game", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Pause game", exact: true })).toBeFocused();
  await expect(page.getByRole("meter")).toHaveAttribute("aria-valuenow", "8");
  await expect(page.locator(".letter-tile.is-revealed")).toHaveCount(1);
});

test("eight incorrect guesses lose, reveal the answer, and replay selects a different word", async ({ page }) => {
  await load(page);
  await start(page);
  await page.keyboard.type("abcfhjp");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("meter")).toHaveAttribute("aria-valuenow", "1");
  await page.keyboard.press("q");
  await expect(page.getByRole("dialog", { name: "You Lose", exact: true })).toBeVisible();
  await expect(page.locator("#dialog-description")).toHaveText("The answer was United Kingdom.");
  await expect(page.locator(".letter-tile.is-revealed")).toHaveCount(13);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Play again!", exact: true }).click();
  await expect(page.locator(".letter-tile")).toHaveCount(6);
  await expect(page.getByRole("meter")).toHaveAttribute("aria-valuenow", "8");
});

test("winning offers replay, exhausted categories are unavailable, and quit returns home", async ({ page }) => {
  await load(page);
  await start(page);
  await page.keyboard.type("unitedkgom");
  await expect(page.getByRole("dialog", { name: "You Win", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Play again!", exact: true }).click();
  await page.keyboard.type("cand");
  await expect(page.getByRole("dialog", { name: "You Win", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Play again!", exact: true })).not.toBeVisible();
  await page.getByRole("button", { name: "New category", exact: true }).click();
  await expect(page.getByRole("button", { name: "Countries All words played" })).toBeDisabled();
  await page.getByRole("button", { name: "Animals", exact: true }).click();
  await page.getByRole("button", { name: "Pause game", exact: true }).click();
  await page.getByRole("button", { name: "Quit game", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play game", exact: true })).toBeFocused();
});

test("failed word loading is recoverable", async ({ page }) => {
  let requests = 0;
  await page.route("**/data.json", (route) => ++requests === 1
    ? route.fulfill({ status: 503, body: "Unavailable" })
    : route.fulfill({ json: fixture }));
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Play game", exact: true })).toBeDisabled();
  await expect(page.getByRole("status").filter({ hasText: "couldn’t load" })).toBeVisible();
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play game", exact: true })).toBeEnabled();
  await start(page);
});

test("every screen and modal passes automated WCAG 2.2 AA checks", async ({ page }) => {
  await load(page);
  const audit = async () => {
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    const results = await page.evaluate(() => window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] },
    }));
    expect(results.violations).toEqual([]);
  };
  await audit();
  await page.getByRole("button", { name: "How to play", exact: true }).click();
  await audit();
  await page.getByRole("button", { name: "Back to main menu", exact: true }).click();
  await page.getByRole("button", { name: "Play game", exact: true }).click();
  await audit();
  await page.getByRole("button", { name: "Countries", exact: true }).click();
  await audit();
  await page.keyboard.press("Escape");
  await audit();
});

test("long titles, long words, and all category headings fit narrow viewports", async ({ page }, testInfo) => {
  await load(page);
  await page.getByRole("button", { name: "How to play", exact: true }).click();
  await noOverflow(page);
  await page.getByRole("button", { name: "Back to main menu", exact: true }).click();
  for (const category of Object.keys(fixture.categories)) {
    await start(page, category);
    await noOverflow(page);
    for (const word of await page.locator(".word").all()) {
      const box = await word.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width + 1);
    }
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Quit game", exact: true }).click();
  }
  if (testInfo.project.name === "mobile") {
    for (const width of [320, 360, 425, 600, 640, 767, 900, 1100]) {
      await page.setViewportSize({ width, height: 812 });
      await page.reload();
      await expect(page.getByRole("button", { name: "Play game", exact: true })).toBeEnabled();
      await noOverflow(page);
      await page.getByRole("button", { name: "How to play", exact: true }).click();
      await noOverflow(page);
      await page.getByRole("button", { name: "Back to main menu", exact: true }).click();
      await page.getByRole("button", { name: "Play game", exact: true }).click();
      await noOverflow(page);
      await page.getByRole("button", { name: "Countries", exact: true }).click();
      await noOverflow(page);
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Quit game", exact: true }).click();
    }
  }
});

test("reference board screenshots and reduced motion", async ({ page }, testInfo) => {
  await load(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.screenshot({ path: `coverage/screenshots/${testInfo.project.name}-home.png`, fullPage: true });
  await page.getByRole("button", { name: "How to play", exact: true }).click();
  await page.screenshot({ path: `coverage/screenshots/${testInfo.project.name}-instructions.png`, fullPage: true });
  await page.getByRole("button", { name: "Back to main menu", exact: true }).click();
  await page.getByRole("button", { name: "Play game", exact: true }).click();
  await page.screenshot({ path: `coverage/screenshots/${testInfo.project.name}-categories.png`, fullPage: true });
  await page.getByRole("button", { name: "Countries", exact: true }).click();
  await page.keyboard.type("unidoabcf");
  await expect(page.getByRole("meter")).toHaveAttribute("aria-valuenow", "4");
  await expect(page.locator(".letter-tile.is-revealed").first()).toHaveCSS("animation-name", "none");
  await noOverflow(page);
  await page.screenshot({ path: `coverage/screenshots/${testInfo.project.name}-game.png`, fullPage: true });
  await page.keyboard.press("Escape");
  await page.screenshot({ path: `coverage/screenshots/${testInfo.project.name}-paused.png`, fullPage: true });
});
