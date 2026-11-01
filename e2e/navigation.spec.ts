import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "allow" });
test.skip(({ isMobile }) => isMobile, "Sidebar navigation is desktop-only.");

const routes = [
  { href: "/", nav: "Home", heading: /Music that turns into lyrics/i },
  { href: "/explore", nav: "Explore", heading: "Find your next soundtrack" },
  { href: "/search", nav: "Search", heading: "Search everything" },
  { href: "/online", nav: "Online Music", heading: "Royalty-free catalog" },
  { href: "/library", nav: "Your Library", heading: "Your music" },
  { href: "/library/local", nav: "Local Music", heading: "On this device" },
  { href: "/playlists", nav: "Playlists", heading: "Your sets" },
  { href: "/favorites", nav: "Favorites", heading: "Loved tracks" },
  { href: "/recent", nav: "Recently Played", heading: "Recently played" },
  { href: "/settings", nav: "Settings", heading: "Preferences" },
];

test("client navigates between every top-level page", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: routes[0].heading })).toBeVisible();

  for (const route of routes.slice(1)) {
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    const link =
      route.href === "/settings"
        ? page.getByRole("link", { name: route.nav, exact: true })
        : nav.getByRole("link", { name: route.nav, exact: true });
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${route.href}$`));
    await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
  }

  await page.goBack();
  await expect(page.getByRole("heading", { name: "Recently played" })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Loved tracks" })).toBeVisible();

  await page.getByRole("link", { name: "Playlists", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your sets" })).toBeVisible();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Preferences" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Preferences" })).toBeVisible();

  expect(errors.filter((error) => !error.includes("/_next/hmr"))).toEqual([]);
});

test("recovers when the router silently drops an RSC navigation", async ({ page }) => {
  let aborted = false;
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const isExploreRsc =
      url.pathname === "/explore" &&
      (url.searchParams.has("_rsc") || request.headers().rsc === "1");
    if (!aborted && isExploreRsc) {
      aborted = true;
      await route.abort();
      return;
    }
    await route.continue();
  });

  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Explore", exact: true })
    .click();

  await expect(page.getByRole("heading", { name: "Find your next soundtrack" })).toBeVisible({
    timeout: 12_000,
  });
  expect(aborted).toBe(true);
});

test("does not force a reload after a normal soft navigation", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    (window as Window & { __karNavigationSentinel?: boolean }).__karNavigationSentinel = true;
  });

  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Explore", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Find your next soundtrack" })).toBeVisible();
  await page.waitForTimeout(3500);

  const sentinel = await page.evaluate(
    () => (window as Window & { __karNavigationSentinel?: boolean }).__karNavigationSentinel,
  );
  expect(sentinel).toBe(true);
});
