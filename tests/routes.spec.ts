import { test, expect, type Page } from "@playwright/test";

const BASE_URL = "http://localhost:3099";

// ──────────────────────────────────────────────
// Helper: visit a page and assert it's not a 404
// ──────────────────────────────────────────────
async function assertPageOk(page: Page, path: string) {
  const response = await page.goto(path, { waitUntil: "networkidle" });

  // Next.js SPA redirect pages (useEffect‑based) do a client‑side
  // redirect.  The initial response status is the page itself (200),
  // and the final URL after the redirect is different.
  if (response) {
    expect(
      response.status(),
      `GET ${path} — expected 200 but got ${response.status()}`,
    ).toBe(200);
  }

  // The Next.js default 404 page body always contains this text.
  // Fail fast if we ever land on one.
  await expect(
    page.locator("body"),
    `GET ${path} — page body contains Next.js 404 text`,
  ).not.toContainText("This page could not be found");
}

// ──────────────────────────────────────────────
// Helper: hit an API route and assert not 404
// ──────────────────────────────────────────────
async function assertApiOk(page: Page, path: string) {
  const response = await page.request.get(path);
  expect(
    response.status(),
    `GET ${path} — expected non‑404 but got ${response.status()}`,
  ).not.toBe(404);
}

// ──────────────────────────────────────────────
// Page routes
// ──────────────────────────────────────────────
test.describe("Page routes", () => {
  test("/  — Landing page", async ({ page }) => {
    await assertPageOk(page, "/");
  });

  test("/login  — Client‑side redirect → /auth/login", async ({ page }) => {
    const response = await page.goto("/login", { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page).not.toHaveURL(/404/);
  });

  test("/register  — Client‑side redirect → /auth/register", async ({ page }) => {
    const response = await page.goto("/register", { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page).not.toHaveURL(/404/);
  });

  test("/auth/login  — Auth sign‑in", async ({ page }) => {
    await assertPageOk(page, "/auth/login");
  });

  test("/auth/register  — Auth sign‑up", async ({ page }) => {
    await assertPageOk(page, "/auth/register");
  });

  test("/admin  — Admin dashboard", async ({ page }) => {
    await assertPageOk(page, "/admin");
  });

  test("/admin/patients  — Manage patients", async ({ page }) => {
    await assertPageOk(page, "/admin/patients");
  });

  test("/admin/appointments  — Manage appointments", async ({ page }) => {
    await assertPageOk(page, "/admin/appointments");
  });

  test("/admin/doctors  — Manage doctors", async ({ page }) => {
    await assertPageOk(page, "/admin/doctors");
  });

  test("/admin/departments  — Manage departments", async ({ page }) => {
    await assertPageOk(page, "/admin/departments");
  });

  test("/admin/beds  — Manage beds", async ({ page }) => {
    await assertPageOk(page, "/admin/beds");
  });

  test("/admin/billing  — Billing & invoices", async ({ page }) => {
    await assertPageOk(page, "/admin/billing");
  });

  test("/admin/reports  — Reports & analytics", async ({ page }) => {
    await assertPageOk(page, "/admin/reports");
  });

  test("/admin/settings  — System settings", async ({ page }) => {
    await assertPageOk(page, "/admin/settings");
  });

  test("/doctor  — Client‑side redirect → /doctor/dashboard", async ({ page }) => {
    const response = await page.goto("/doctor", { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page).not.toHaveURL(/404/);
  });

  test("/doctor/dashboard  — Doctor dashboard", async ({ page }) => {
    await assertPageOk(page, "/doctor/dashboard");
  });

  test("/doctor/appointments  — Doctor appointments", async ({ page }) => {
    await assertPageOk(page, "/doctor/appointments");
  });

  test("/doctor/patients  — Doctor patients", async ({ page }) => {
    await assertPageOk(page, "/doctor/patients");
  });

  test("/doctor/prescriptions  — Doctor prescriptions", async ({ page }) => {
    await assertPageOk(page, "/doctor/prescriptions");
  });

  test("/doctor/records  — Medical records", async ({ page }) => {
    await assertPageOk(page, "/doctor/records");
  });

  test("/doctor/schedule  — Doctor schedule", async ({ page }) => {
    await assertPageOk(page, "/doctor/schedule");
  });

  test("/patient  — Client‑side redirect → /patient/dashboard", async ({ page }) => {
    const response = await page.goto("/patient", { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page).not.toHaveURL(/404/);
  });

  test("/patient/dashboard  — Patient dashboard", async ({ page }) => {
    await assertPageOk(page, "/patient/dashboard");
  });

  test("/patient/appointments  — My appointments", async ({ page }) => {
    await assertPageOk(page, "/patient/appointments");
  });

  test("/patient/billing  — My billing", async ({ page }) => {
    await assertPageOk(page, "/patient/billing");
  });

  test("/patient/book  — Book appointment", async ({ page }) => {
    await assertPageOk(page, "/patient/book");
  });

  test("/patient/doctors  — Find doctors", async ({ page }) => {
    await assertPageOk(page, "/patient/doctors");
  });

  test("/patient/profile  — My profile", async ({ page }) => {
    await assertPageOk(page, "/patient/profile");
  });

  test("/patient/records  — My medical records", async ({ page }) => {
    await assertPageOk(page, "/patient/records");
  });
});

// ──────────────────────────────────────────────
// API routes
// ──────────────────────────────────────────────
test.describe("API routes", () => {
  test("/api/auth/me", async ({ page }) => {
    await assertApiOk(page, "/api/auth/me");
  });

  test("/api/auth/login", async ({ page }) => {
    await assertApiOk(page, "/api/auth/login");
  });

  test("/api/auth/register", async ({ page }) => {
    await assertApiOk(page, "/api/auth/register");
  });

  test("/api/auth/logout", async ({ page }) => {
    await assertApiOk(page, "/api/auth/logout");
  });

  test("/api/appointments", async ({ page }) => {
    await assertApiOk(page, "/api/appointments");
  });

  test("/api/doctors", async ({ page }) => {
    await assertApiOk(page, "/api/doctors");
  });

  test("/api/doctors/:id  — Dynamic [id] route", async ({ page }) => {
    await assertApiOk(page, "/api/doctors/1");
  });

  test("/api/medical-records", async ({ page }) => {
    await assertApiOk(page, "/api/medical-records");
  });

  test("/api/notifications  — Notifications feed", async ({ page }) => {
    await assertApiOk(page, "/api/notifications");
  });

  test("/api/search  — Search API", async ({ page }) => {
    await assertApiOk(page, "/api/search");
  });

  test("/search  — Search results page", async ({ page }) => {
    await assertPageOk(page, "/search");
  });
});

// ──────────────────────────────────────────────
// 404 — verify non‑existent routes return 404
// ──────────────────────────────────────────────
test.describe("404 handling", () => {
  test("A non‑existent page returns 404", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist", {
      waitUntil: "networkidle",
    });
    expect(response?.status()).toBe(404);
  });

  test("A non‑existent API route returns 404", async ({ page }) => {
    const response = await page.request.get("/api/nonexistent");
    expect(response.status()).toBe(404);
  });
});
