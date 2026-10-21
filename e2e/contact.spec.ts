import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/contact");
  await page.waitForLoadState("networkidle");
});

test("shows validation errors and requires an email for non-feedback topics", async ({ page }) => {
  await page.getByLabel("What's this about?").selectOption("project");
  await page.getByRole("button", { name: /send message/i }).click();
  await expect(page.getByText("Add your email so I can reply")).toBeVisible();
  await expect(page.getByText(/add a little more detail/i)).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
});

test("defaults the topic from the audience picked on the slider", async ({ page }) => {
  await page.evaluate(() => localStorage.setItem("portfolio:audience", "partner"));
  await page.reload();
  await expect(page.getByLabel("What's this about?")).toHaveValue("project");
});

test("the message placeholder follows the topic", async ({ page }) => {
  const topic = page.getByLabel("What's this about?");
  const message = page.getByLabel("Message");
  await topic.selectOption("hello");
  await expect(message).toHaveAttribute("placeholder", "Hi, how are you? :)");
  await topic.selectOption("role");
  await expect(message).toHaveAttribute("placeholder", "A little context helps me reply properly.");
  await topic.selectOption("feedback");
  await expect(message).toHaveAttribute("placeholder", /What worked/);
});

test("sends anonymous site feedback", async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, "would send a real email on a deployed site");
  await page.getByLabel("What's this about?").selectOption("feedback");
  await expect(page.getByText("(optional for feedback)")).toBeVisible();
  await page.getByLabel("Message").fill("Love the slider. The wipe is a nice touch.");
  // The server ignores submissions made within a few seconds of page load (bot check).
  await page.waitForTimeout(3200);
  await page.getByRole("button", { name: /send message/i }).click();
  await expect(page.getByTestId("contact-sent")).toBeVisible();
});

test("is reachable from the header", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Contact" })
    .filter({ visible: true })
    .click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole("heading", { name: "Get in touch" })).toBeVisible();
});
