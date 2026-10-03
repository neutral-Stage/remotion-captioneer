import { test, expect } from "@playwright/test";

test.describe("docs site smoke", () => {
  test("landing page loads with hero and live demo", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Remotion Captioneer/i);
    await expect(page.getByRole("heading", { name: /Remotion Captioneer/i, level: 1 })).toBeVisible();
    await expect(page.getByRole("region", { name: /Caption style demo player/i })).toBeVisible();
  });

  test("style toolbar and configurator are interactive", async ({ page }) => {
    await page.goto("/#demo");
    const toolbar = page.getByRole("toolbar", { name: /Caption styles/i });
    await expect(toolbar).toBeVisible();
    const karaoke = toolbar.getByRole("button", { name: "Karaoke" });
    await karaoke.click();
    await expect(karaoke).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#cfg-style")).toHaveValue("karaoke");
  });

  test("ui-meta.json exposes 14 styles", async ({ request }) => {
    const res = await request.get("/ui-meta.json");
    expect(res.ok()).toBeTruthy();
    const meta = await res.json();
    expect(meta.styleCount).toBe(14);
    expect(meta.styles).toHaveLength(14);
    expect(Object.keys(meta.categories ?? {}).length).toBeGreaterThanOrEqual(5);
  });
});
