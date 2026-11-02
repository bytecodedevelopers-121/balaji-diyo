import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BookingsPage from "./bookings/BookingsPage";
import PaymentsPage from "./payments/PaymentsPage";
import { useAuthStore } from "@/store/auth.store";
import { renderWithQuery } from "@/test/render";
import { server } from "@/test/server";
import type { Booking, CreateInvoiceDto } from "@/types/booking";
import type { Payment, UpdatePaymentStatusDto } from "@/types/payment";

const API_URL = "http://localhost:5000/api";
const initialAuthState = useAuthStore.getInitialState();

const booking: Booking = {
  id: "booking-1",
  bookingNumber: 1444,
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
  pickupDetails: "Thamel hotel",
  paymentOptions: "full",
  totalPrice: "2400",
  payablePercentage: 100,
  ipAddress: null,
  travellers: [],
  invoice: null,
  payments: [],
  createdAt: "2026-08-20T00:00:00.000Z",
  updatedAt: "2026-08-20T00:00:00.000Z",
};

const payment: Payment = {
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
  deletedAt: null,
};

function response<T>(data: T, statusCode = 200) {
  return HttpResponse.json({
    status: statusCode >= 400 ? "error" : "success",
    statusCode,
    message: statusCode >= 400 ? "Request failed" : "OK",
    data,
    timestamp: "2026-08-25T00:00:00.000Z",
  }, { status: statusCode });
}

function paginated<T>(items: T[]) {
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

function useFinancialHandlers() {
  server.use(
    http.get(`${API_URL}/bookings`, () => response(paginated([booking]))),
    http.get(`${API_URL}/payments`, () => response(paginated([payment]))),
    http.get(`${API_URL}/packages/admin/all`, () => response(paginated([]))),
  );
}

beforeEach(() => {
  Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  useAuthStore.setState({
    isLoading: false,
    isAuthenticated: true,
    user: {
      userId: "admin-1",
      email: "admin@example.com",
      role: "Admin",
      isSuperAdmin: false,
      permissions: ["read:booking", "create:booking", "read:payment", "create:payment", "update:payment"],
    },
  });
  useFinancialHandlers();
});

afterEach(() => useAuthStore.setState(initialAuthState, true));

describe("booking workflow", () => {
  it("submits a validated invoice payload for an existing booking", async () => {
    const user = userEvent.setup();
    let submitted: CreateInvoiceDto | undefined;
    server.use(
      http.post(`${API_URL}/bookings/booking-1/invoice`, async ({ request }) => {
        submitted = await request.json() as CreateInvoiceDto;
        return response({ id: "invoice-1", ...submitted });
      }),
    );
    renderWithQuery(<BookingsPage />);

    expect(await screen.findByText("Asha Rai")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "View" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Generate Invoice" }));

    const amount = within(dialog).getByRole("spinbutton");
    const [payType, transactionCode, note] = within(dialog).getAllByRole("textbox");
    await user.clear(amount);
    await user.type(amount, "1200");
    await user.clear(payType);
    await user.type(payType, "partial");
    await user.selectOptions(within(dialog).getByRole("combobox"), "1");
    await user.type(transactionCode, "TXN-1001");
    await user.type(note, "Verified manually");
    await user.click(within(dialog).getByRole("button", { name: "Generate Invoice" }));

    await waitFor(() => expect(submitted).toEqual({
      invoiceAmount: 1200,
      invoicePayType: "partial",
      invoiceStatus: 1,
      transactionCode: "TXN-1001",
      invoiceNote: "Verified manually",
    }));
  });
});

describe("payment workflow", () => {
  it("updates status with the gateway identifiers and closes on success", async () => {
    const user = userEvent.setup();
    let submitted: UpdatePaymentStatusDto | undefined;
    server.use(
      http.patch(`${API_URL}/payments/payment-1/status`, async ({ request }) => {
        submitted = await request.json() as UpdatePaymentStatusDto;
        return response({ ...payment, ...submitted });
      }),
    );
    renderWithQuery(<PaymentsPage />);

    expect(await screen.findByText("Asha Rai")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "View" }));
    const dialog = await screen.findByRole("dialog");
    await user.selectOptions(within(dialog).getByRole("combobox"), "SUCCESS");
    const [gatewayReference, transactionId] = within(dialog).getAllByRole("textbox");
    await user.type(gatewayReference, "ORDER-1001");
    await user.type(transactionId, "PACO-9001");
    await user.click(within(dialog).getByRole("button", { name: "Save Status" }));

    await waitFor(() => expect(submitted).toEqual({
      status: "SUCCESS",
      gatewayReference: "ORDER-1001",
      gatewayTransactionId: "PACO-9001",
    }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("hides payment mutations from users without write permissions", async () => {
    const user = userEvent.setup();
    useAuthStore.setState((state) => ({
      user: state.user ? { ...state.user, permissions: ["read:payment"] } : null,
    }));
    renderWithQuery(<PaymentsPage />);

    expect(await screen.findByText("Asha Rai")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Record Payment" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "View" }));
    expect(within(await screen.findByRole("dialog")).queryByText("Update Status")).not.toBeInTheDocument();
  });

  it("keeps the create form open and shows the API error", async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${API_URL}/payments`, () => HttpResponse.json(
        { status: "error", statusCode: 409, message: "Payment reference already exists", data: null },
        { status: 409 },
      )),
    );
    renderWithQuery(<PaymentsPage />);

    await screen.findByText("Asha Rai");
    await user.click(screen.getByRole("button", { name: "Record Payment" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Record Payment" }));

    expect(await within(dialog).findByText("Payment reference already exists")).toBeInTheDocument();
    expect(dialog).toBeInTheDocument();
  });

  it("blocks invalid email before making a create request", async () => {
    const user = userEvent.setup();
    let requestCount = 0;
    server.use(
      http.post(`${API_URL}/payments`, () => {
        requestCount += 1;
        return response(payment, 201);
      }),
    );
    renderWithQuery(<PaymentsPage />);

    await screen.findByText("Asha Rai");
    await user.click(screen.getByRole("button", { name: "Record Payment" }));
    const dialog = await screen.findByRole("dialog");
    const email = dialog.querySelector<HTMLInputElement>('input[type="email"]');
    expect(email).not.toBeNull();
    await user.type(email!, "not-an-email");
    await user.click(within(dialog).getByRole("button", { name: "Record Payment" }));

    expect(await within(dialog).findByText("Invalid email")).toBeInTheDocument();
    expect(requestCount).toBe(0);
  });
});
