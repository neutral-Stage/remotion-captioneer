import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "../fixtures");

test.describe("preview server smoke", () => {
  test("preview shell loads with upload zone", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Captioneer/i })).toBeVisible();
    await expect(page.getByText("Drop audio, video, or caption JSON")).toBeVisible();
    await expect(page.getByLabel("Caption style")).toBeVisible();
  });

  test("api/meta returns style catalog", async ({ request }) => {
    const res = await request.get("/api/meta");
    expect(res.ok()).toBeTruthy();
    const meta = await res.json();
    expect(meta.styles?.length).toBe(14);
    expect(meta.presets?.length).toBeGreaterThan(20);
  });

  test("api/config responds with defaultStyle", async ({ request }) => {
    const res = await request.get("/api/config");
    expect(res.ok()).toBeTruthy();
    const cfg = await res.json();
    expect(cfg.defaultStyle).toBeTruthy();
  });

  test("api/hosting/resolve returns YouTube metadata", async ({ request }) => {
    const res = await request.get(
      "/api/hosting/resolve?url=" +
        encodeURIComponent("https://youtu.be/dQw4w9WgXcQ")
    );
    expect(res.ok()).toBeTruthy();
    const info = await res.json();
    expect(info.provider).toBe("youtube");
    expect(info.videoId).toBe("dQw4w9WgXcQ");
    expect(info.thumbnailUrl).toContain("dQw4w9WgXcQ");
  });

  test("hosting resolve UI shows metadata card", async ({ page }) => {
    await page.goto("/");
    await page.locator("#hosting-url-input").fill("https://youtu.be/dQw4w9WgXcQ");
    await page.locator("#hosting-resolve-btn").click();
    await expect(page.locator("#hosting-card")).not.toHaveClass(/hidden/);
    await expect(page.locator("#hosting-provider")).toHaveText("YouTube");
    await expect(page.locator("#hosting-title")).toContainText("dQw4w9WgXcQ");
    await expect(page.locator("#hosting-link")).toHaveAttribute(
      "href",
      /youtube\.com/
    );
  });

  test("api/meta includes installed marketplace presets", async ({ request }) => {
    const res = await request.get("/api/meta");
    expect(res.ok()).toBeTruthy();
    const meta = await res.json();
    expect(meta.marketplacePresetCount).toBeGreaterThan(0);
    const marketplace = meta.presets?.find(
      (p: { key: string }) => p.key === "marketplace:sample-neon-pulse"
    );
    expect(marketplace).toBeTruthy();
    expect(marketplace.name).toContain("installed");
  });

  test("marketplace preset appears in preset selector", async ({ page }) => {
    await page.goto("/");
    const option = page.locator("#preset-select option[value='marketplace:sample-neon-pulse']");
    await expect(option).toHaveCount(1);
    await expect(page.locator("#marketplace-count")).toContainText("1 installed");
  });

  test("upload caption JSON enables editor and export controls", async ({ page }) => {
    await page.goto("/");
    const captions = readFileSync(join(fixturesDir, "captions-smoke.json"));

    await page.locator("#file-input").setInputFiles({
      name: "captions-smoke.json",
      mimeType: "application/json",
      buffer: captions,
    });

    await expect(page.locator("#upload-zone")).toHaveClass(/hidden/);
    await expect(page.locator("#remotion-mount")).toHaveClass(/active/);
    await expect(page.locator("#stat-segments")).toHaveText("1");
    await expect(page.getByRole("button", { name: /↓ SRT/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /↓ VTT/i })).toBeVisible();
    await expect(page.locator(".word-chip-inner").first()).toContainText("Smoke");
  });
});
