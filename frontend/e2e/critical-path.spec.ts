import { test, expect } from "@playwright/test";

test.describe("Critical Path: Login → Search → View Compliance → Buy", () => {
  test("guest can browse asset page and view compliance", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder("Search assets").click();
    await page.getByLabel("Search assets").fill("AAPL");
    await page.getByRole("option", { name: /AAPL/i }).first().click();

    await expect(page.getByText("Key Stats")).toBeVisible();
    await expect(page.getByText("Compliance")).toBeVisible();

    const complianceCard = page.getByText("Verdict");
    await expect(complianceCard).toBeVisible({ timeout: 10000 });
  });

  test("guest buy triggers auth modal", async ({ page }) => {
    await page.goto("/asset/AAPL");

    const buyButton = page.getByRole("button", { name: /buy/i });
    await buyButton.click();

    await page.getByLabel("Quantity").fill("10");
    await buyButton.click();

    await expect(page.getByText("Sign in to trade")).toBeVisible();
  });

  test("login page renders and accepts credentials", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByText("Welcome back")).toBeVisible();

    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();
  });

  test("register page validates confirm password", async ({ page }) => {
    await page.goto("/register");

    await page.getByLabel("Name").fill("Test User");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByLabel("Confirm Password").fill("different");

    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page.getByText("Passwords do not match")).toBeVisible();
  });

  test("portfolio page redirects to login for guests", async ({ page }) => {
    await page.goto("/portfolio");
    await expect(page).toHaveURL(/\/login/);
  });
});
