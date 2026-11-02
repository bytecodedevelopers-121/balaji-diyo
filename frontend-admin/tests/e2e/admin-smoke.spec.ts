import { expect, test, type Page, type Route } from "@playwright/test";

const adminUser = {
  userId: "admin-1",
  email: "admin@example.com",
  role: "Admin",
  isSuperAdmin: false,
  permissions: ["read:booking", "create:booking", "read:payment", "create:payment", "update:payment"],
};

const booking = {
  id: "booking-1",
  packageId: "package-1",
  package: { id: "package-1", title: "Everest Base Camp" },
  startDate: "2026-10-01T00:00:00.000Z",
  endDate: "2026-10-14T00:00:00.000Z",
  numberOfTraveller: 2,
  fullName: "Asha Rai",
  email: "asha@example.com",
  dateOfBirth: null,
  nationality: "Nepali",
  countryCode: "NP",
  mobileNumber: "+9779800000000",
  pickupDetails: null,
  paymentOptions: "full",
  totalPrice: "2400",
  payablePercentage: 100,
  ipAddress: null,
  travellers: [],
  invoice: null,
  createdAt: "2026-08-20T00:00:00.000Z",
  updatedAt: "2026-08-20T00:00:00.000Z",
};

const payment = {
  id: "payment-1",
  gateway: "PACO",
  packageId: "package-1",
  package: { id: "package-1", title: "Everest Base Camp" },
  customTitle: null,
  customerName: "Asha Rai",
  customerEmail: "asha@example.com",
  description: "Everest deposit",
  percentage: 30,
  totalAmount: "720",
  status: "PENDING",
  gatewayReference: null,
  gatewayTransactionId: null,
  gatewaySignature: null,
  gatewaySessionId: null,
  requestPayload: null,
  responsePayload: null,
  createdAt: "2026-08-20T00:00:00.000Z",
  updatedAt: "2026-08-20T00:00:00.000Z",
};

function apiResponse(data: unknown, statusCode = 200) {
  return {
    status: statusCode >= 400 ? "error" : "success",
    statusCode,
    message: statusCode >= 400 ? "Request failed" : "OK",
    data,
    timestamp: "2026-08-25T00:00:00.000Z",
  };
}

function paginated(items: unknown[]) {
  return {
    items,
    meta: {
      currentPage: 1,
      perPage: 15,
      total: items.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
}

async function fulfill(route: Route, data: unknown, status = 200) {
  await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });
}

async function mockAdminApi(page: Page, options?: { authenticated?: boolean; permissions?: string[] }) {
  const authenticated = options?.authenticated ?? true;
  const user = { ...adminUser, permissions: options?.permissions ?? adminUser.permissions };

  await page.route("**/*", async (route) => {
    const request = route.request();
    if (!(["xhr", "fetch"] as string[]).includes(request.resourceType())) {
      await route.continue();
      return;
    }

    const path = new URL(request.url()).pathname;
    if (path.endsWith("/auth/refresh")) {
      if (!authenticated) {
        await fulfill(route, apiResponse(null, 401), 401);
        return;
      }
      await fulfill(route, apiResponse({ accessToken: "smoke-access-token" }));
      return;
    }
    if (path.endsWith("/auth/login")) {
      await fulfill(route, apiResponse({ accessToken: "login-access-token" }));
      return;
    }
    if (path.endsWith("/auth/me")) {
      await fulfill(route, apiResponse(user));
      return;
    }
    if (path.endsWith("/analytics/dashboard")) {
      await fulfill(route, apiResponse({
        configured: false,
        topBrowsers: [],
        dailyPageViews: [],
        usersByDate: [],
        usersByCountry: [],
        usersBySource: [],
        topPages: [],
      }));
      return;
    }
    if (path.endsWith("/bookings")) {
      await fulfill(route, apiResponse(paginated([booking])));
      return;
    }
    if (path.endsWith("/payments")) {
      await fulfill(route, apiResponse(paginated([payment])));
      return;
    }
    if (path.endsWith("/packages/admin/all")) {
      await fulfill(route, apiResponse(paginated([])));
      return;
    }

    await fulfill(route, apiResponse(null, 404), 404);
  });
}

test("signs in and reaches the dashboard", async ({ page }) => {
  await mockAdminApi(page, { authenticated: false });
  await page.goto("/login");

  await page.getByLabel("Email address").fill("admin@example.com");
  await page.locator("#password").fill("correct-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
});

test("navigates through the high-risk booking and payment screens", async ({ page }) => {
  await mockAdminApi(page);
  await page.goto("/bookings");

  await expect(page.getByRole("heading", { name: "Bookings", exact: true })).toBeVisible();
  await expect(page.getByText("Asha Rai")).toBeVisible();

  await page.getByRole("link", { name: "Payments", exact: true }).click();
  await expect(page).toHaveURL(/\/payments$/);
  await expect(page.getByRole("heading", { name: "Payments", exact: true })).toBeVisible();
  await expect(page.getByText("$720.00")).toBeVisible();
  await page.getByRole("button", { name: "View" }).click();
  await expect(page.getByRole("dialog").getByText("Everest deposit")).toBeVisible();
});

test("prevents a restricted user from opening payments", async ({ page }) => {
  await mockAdminApi(page, { permissions: ["read:booking"] });
  await page.goto("/payments");

  await expect(page).toHaveURL(/\/403$/);
  await expect(page.getByRole("heading", { name: "403" })).toBeVisible();
  await expect(page.getByText("You don't have permission to view this page.")).toBeVisible();
});
