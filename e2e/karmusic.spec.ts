import { expect, test, type Page } from "@playwright/test";
import type { Track } from "@/types/track";

const MOCK_TRACK: Track = {
  id: "freetouse:mock-signal",
  source: "online",
  provider: "freetouse",
  providerTrackId: "mock-signal",
  title: "Mock Signal",
  artist: "Test Artist",
  album: "Free To Use",
  genre: "Ambient",
  duration: 24,
  playbackUrl: "/demo/karmusic-demo.wav",
  licenseName: "Free To Use License",
  licenseUrl: "https://freetouse.com/license",
  attribution: "Test Artist — via Free To Use",
  sourceUrl: "https://freetouse.com",
  addedAt: 1_700_000_000_000,
};

async function mockCatalog(page: Page) {
  await page.route("**/api/providers/status", (route) =>
    route.fulfill({
      json: {
        providers: [
          {
            id: "freetouse",
            name: "Free To Use",
            available: true,
            requiresKey: false,
            licenseName: "Free To Use License",
            licenseUrl: "https://freetouse.com/license",
            supportsFullStreaming: true,
            website: "https://freetouse.com",
          },
          {
            id: "jamendo",
            name: "Jamendo",
            available: false,
            requiresKey: true,
            reason: "Set JAMENDO_CLIENT_ID to enable this optional catalog.",
            supportsFullStreaming: true,
          },
        ],
      },
    }),
  );

  await page.route("**/api/freetouse/**", (route) =>
    route.fulfill({
      json: {
        tracks: [MOCK_TRACK],
        offset: 0,
        limit: 24,
        total: 1,
        hasMore: false,
      },
    }),
  );
}

test.beforeEach(async ({ page }) => {
  await mockCatalog(page);
});

test("imports the demo track, plays it and shows synced lyrics", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Music that turns into lyrics/i }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Import demo" }).first().click();
  await expect(page.getByRole("button", { name: "Play KarMusic Demo" })).toBeVisible({
    timeout: 20_000,
  });

  await page.getByRole("button", { name: "Play KarMusic Demo" }).click();
  await expect(page.getByRole("link", { name: "Open Now Playing" })).toBeVisible();

  await page.getByRole("link", { name: "Open Now Playing" }).click();
  await expect(page.getByRole("heading", { name: "Full player" })).toBeVisible();

  await page.getByRole("button", { name: "Lyrics Mode", exact: true }).click();
  const lyricsMode = page.getByRole("dialog", { name: "Lyrics Mode" });
  await expect(lyricsMode).toBeVisible();
  await expect(
    lyricsMode.getByText("The screen turns sideways and the room goes quiet"),
  ).toBeVisible();
  await expect(lyricsMode.getByText("Synced LRC")).toBeVisible();

  await lyricsMode.getByRole("button", { name: "Exit Lyrics Mode" }).click();
  await expect(lyricsMode).toBeHidden();

  await page.goto("/library/local");
  await expect(page.getByRole("heading", { name: "On this device" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Play KarMusic Demo" })).toBeVisible();
});

test("streams a mocked online track and searches both sources", async ({ page }) => {
  await page.goto("/online");
  await expect(page.getByRole("heading", { name: "Royalty-free catalog" })).toBeVisible();
  await expect(page.getByText("Mock Signal").first()).toBeVisible();

  await page.getByRole("button", { name: "Play Mock Signal" }).click();
  await expect(page.getByRole("link", { name: "Open Now Playing" })).toBeVisible();

  await page.getByRole("link", { name: "Open Now Playing" }).click();
  await expect(page.getByRole("heading", { name: "Full player" })).toBeVisible();
  await expect(page.getByText("Test Artist").first()).toBeVisible();

  await page.goto("/search");
  await page.getByLabel("Search music").fill("Mock");
  await expect(page.getByRole("heading", { name: "Online results" })).toBeVisible();
  await expect(page.getByText("Mock Signal").first()).toBeVisible();
});

test("creates a playlist, mixes sources, reorders and persists the order", async ({ page }) => {
  await page.goto("/playlists");
  await expect(page.getByRole("heading", { name: "Your sets" })).toBeVisible();

  await page.getByRole("button", { name: "New playlist" }).click();
  const createDialog = page.getByRole("dialog", { name: "New playlist" });
  await createDialog.getByLabel("Playlist name").fill("Road test");
  await createDialog.getByRole("button", { name: "Create playlist" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Created" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Road test/ })).toBeVisible();

  await page.goto("/library/local");
  await page.getByRole("button", { name: "Import the demo track" }).click();
  await expect(page.getByRole("button", { name: "Play KarMusic Demo" })).toBeVisible({
    timeout: 20_000,
  });
  await page.getByRole("button", { name: "More options for KarMusic Demo" }).click();
  let   optionsDialog = page.getByRole("dialog", { name: "Track options" });
  await optionsDialog.getByRole("button", { name: /Road test/ }).click();
  await expect(page.getByRole("status").filter({ hasText: "Added to" })).toBeVisible();

  await page.goto("/online");
  await expect(page.getByText("Mock Signal").first()).toBeVisible();
  await page.getByRole("button", { name: "More options for Mock Signal" }).click();
  optionsDialog = page.getByRole("dialog", { name: "Track options" });
  await optionsDialog.getByRole("button", { name: /Road test/ }).click();
  await expect(page.getByRole("status").filter({ hasText: "Added to" })).toBeVisible();

  await page.goto("/playlists");
  await page.getByRole("link", { name: /Road test/ }).click();
  await expect(page.getByRole("heading", { name: "Road test" })).toBeVisible();

  const rows = page.getByRole("list", { name: "Tracks" }).getByRole("listitem");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText("KarMusic Demo");

  await page.getByRole("button", { name: "Move Mock Signal up" }).click();
  await expect(rows.nth(0)).toContainText("Mock Signal");

  await page.reload();
  await expect(page.getByRole("heading", { name: "Road test" })).toBeVisible();
  await expect(
    page.getByRole("list", { name: "Tracks" }).getByRole("listitem").nth(0),
  ).toContainText("Mock Signal");
});
