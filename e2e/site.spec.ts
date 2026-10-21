import { expect, test } from "@playwright/test";

test("every case study page renders and its PDF downloads", async ({ page, request }) => {
  await page.goto("/case-studies");
  const hrefs = await page
    .getByTestId("case-study-card")
    .getByRole("link")
    .evaluateAll((links) => links.map((a) => a.getAttribute("href")!));
  expect(hrefs.length).toBeGreaterThanOrEqual(2);

  for (const href of hrefs) {
    await page.goto(href);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const pdf = page.getByTestId("pdf-download");
    await expect(pdf).toHaveAttribute("download", "");
    const response = await request.get((await pdf.getAttribute("href"))!);
    expect(response.status(), href).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/pdf");
  }
});

test("the story toggle switches between the 30-second and full versions", async ({ page }) => {
  await page.goto("/case-studies/placeholder-alpha");
  await expect(page.getByTestId("story-quick")).toBeVisible();
  await page.getByRole("button", { name: "Full story" }).click();
  await expect(page.getByRole("heading", { name: "Approach" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Full story" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("unknown case studies show the not-found page and aren't indexed", async ({ page }) => {
  // The status can be 200 on a first hit (streamed from the route's shell), so assert
  // what users and crawlers actually get: the not-found UI plus noindex.
  await page.goto(`/case-studies/does-not-exist-${Date.now()}`);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.locator('head meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("theme toggle switches and remembers the theme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "light");

  await page.getByTestId("theme-toggle").click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(darkBg).toBe("rgb(28, 6, 50)");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
});

for (const path of ["/", "/case-studies", "/case-studies/placeholder-alpha"]) {
  test(`no horizontal overflow at 360px: ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
}
