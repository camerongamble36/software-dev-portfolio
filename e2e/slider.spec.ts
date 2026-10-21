import { expect, test, type Page } from "@playwright/test";

const hero = (page: Page) => page.getByTestId("audience-hero");
const thumb = (page: Page) => page.getByRole("slider", { name: /who's visiting/i });
const divider = (page: Page) => page.getByTestId("audience-divider");

async function dividerLeft(page: Page) {
  return divider(page).evaluate((el) => parseFloat((el as HTMLElement).style.left || "0"));
}

async function railGeometry(page: Page) {
  const thumbBox = (await thumb(page).boundingBox())!;
  const trackBox = (await page.getByTestId("audience-track").boundingBox())!;
  // Each stop sits at the centre of an equal-width label column, so stops are one column apart.
  const stops = Number(await thumb(page).getAttribute("aria-valuemax")) + 1;
  return {
    x: thumbBox.x + thumbBox.width / 2,
    y: thumbBox.y + thumbBox.height / 2,
    stop: trackBox.width / stops,
  };
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(hero(page)).toHaveAttribute("data-audience", "recruiter");
});

test("dragging sweeps the divider across the full width for each stop", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "mouse drag is a desktop interaction");
  const { x, y, stop } = await railGeometry(page);

  await page.mouse.move(x, y);
  await page.mouse.down();

  // Halfway to the next stop: the divider is halfway across the hero.
  await page.mouse.move(x + stop * 0.5, y, { steps: 6 });
  await expect(divider(page)).toHaveAttribute("data-active", "true");
  await expect(page.getByTestId("audience-reveal")).toBeVisible();
  expect(await dividerLeft(page)).toBeCloseTo(50, -1);

  // Nearly at the next stop: nearly the full width.
  await page.mouse.move(x + stop * 0.95, y, { steps: 4 });
  expect(await dividerLeft(page)).toBeGreaterThan(85);

  // Past it, towards the third stop: a new sweep starts again from the left edge.
  await page.mouse.move(x + stop * 1.2, y, { steps: 4 });
  expect(await dividerLeft(page)).toBeLessThan(30);

  await page.mouse.move(x + stop * 2.1, y, { steps: 8 });
  await expect(thumb(page)).toHaveAttribute("aria-valuetext", "Fellow developer");

  await page.mouse.up();
  await expect(hero(page)).toHaveAttribute("data-audience", "peer");
  await expect(divider(page)).toHaveAttribute("data-active", "false");

  // The choice persists across reloads and reorders the featured case studies.
  await page.reload();
  await expect(hero(page)).toHaveAttribute("data-audience", "peer");
  await expect(page.getByText("Picked for: Fellow developer").first()).toBeVisible();
});

test("arrow keys, Home and End move between stops", async ({ page }) => {
  await thumb(page).focus();
  await expect(thumb(page)).toBeFocused();

  // Works for however many audiences are configured: read the last stop from the slider.
  const last = Number(await thumb(page).getAttribute("aria-valuemax"));
  const first = await hero(page).getAttribute("data-audience");

  await page.keyboard.press("ArrowRight");
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "1");
  await expect(thumb(page)).toHaveAttribute("aria-valuetext", "Hiring manager");
  await expect(hero(page)).toHaveAttribute("data-audience", "manager");

  await page.keyboard.press("End");
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", String(last));
  await expect(hero(page)).not.toHaveAttribute("data-audience", "manager");

  await page.keyboard.press("ArrowLeft");
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", String(last - 1));

  await page.keyboard.press("Home");
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "0");
  await expect(hero(page)).toHaveAttribute("data-audience", first!);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("clicking a stop label jumps to it", async ({ page }) => {
  await page.getByTestId("audience-track").getByText("Business partner").click();
  await expect(hero(page)).toHaveAttribute("data-audience", "partner");
});

test("reduced motion swaps instantly without the sweep", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.waitForLoadState("networkidle");

  await thumb(page).focus();
  await page.keyboard.press("ArrowRight");
  await expect(hero(page)).toHaveAttribute("data-audience", "manager", { timeout: 200 });
  await expect(divider(page)).toHaveAttribute("data-active", "false");
});

test("touch drag moves the slider on a phone", async ({ page, isMobile, browserName }) => {
  test.skip(!isMobile || browserName !== "chromium", "touch emulation via CDP (Chromium mobile)");
  const { x, y, stop } = await railGeometry(page);

  // Playwright has no touch-drag helper, so dispatch raw touch events through CDP.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let i = 1; i <= 10; i++) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x + (stop * 1.1 * i) / 10, y }],
    });
  }
  await expect(divider(page)).toHaveAttribute("data-active", "true");
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });

  await expect(hero(page)).toHaveAttribute("data-audience", "manager");
});

test("the thumb is a 44px+ touch target with a visible focus ring", async ({ page }) => {
  const box = (await thumb(page).boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);

  await page.keyboard.press("Tab"); // move focus into the page, then to the thumb
  await thumb(page).focus();
  const outline = await thumb(page).evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe("none");
});
