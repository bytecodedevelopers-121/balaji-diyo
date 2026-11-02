import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";
import { server } from "@/test/server";

const API_URL = "http://localhost:5000/api";
const initialState = useAuthStore.getInitialState();

afterEach(() => {
  useAuthStore.setState(initialState, true);
  window.history.replaceState({}, "", "/");
});

describe("admin API authentication", () => {
  it("attaches the current access token", async () => {
    useAuthStore.setState({ accessToken: "token-one" });
    let authorization: string | null = null;
    server.use(
      http.get(`${API_URL}/protected`, ({ request }) => {
        authorization = request.headers.get("authorization");
        return HttpResponse.json({ ok: true });
      }),
    );

    await api.get("/protected");

    expect(authorization).toBe("Bearer token-one");
  });

  it("performs one refresh for concurrent 401 responses and retries every request", async () => {
    useAuthStore.setState({ accessToken: "expired-token" });
    const refreshToken = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      useAuthStore.setState({ accessToken: "fresh-token" });
    });
    useAuthStore.setState({ refreshToken });

    let successfulRetries = 0;
    server.use(
      http.get(`${API_URL}/protected/:id`, ({ request }) => {
        if (request.headers.get("authorization") !== "Bearer fresh-token") {
          return new HttpResponse(null, { status: 401 });
        }
        successfulRetries += 1;
        return HttpResponse.json({ ok: true });
      }),
    );

    const responses = await Promise.all([
      api.get("/protected/one"),
      api.get("/protected/two"),
      api.get("/protected/three"),
    ]);

    expect(refreshToken).toHaveBeenCalledTimes(1);
    expect(successfulRetries).toBe(3);
    expect(responses.every((response) => response.status === 200)).toBe(true);
  });

  it("logs out when refresh is rejected by the server", async () => {
    window.history.replaceState({}, "", "/login");
    const refreshToken = vi.fn().mockRejectedValue(new Error("refresh rejected"));
    const logout = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState({ accessToken: "expired-token", refreshToken, logout });
    server.use(
      http.get(`${API_URL}/protected`, () => new HttpResponse(null, { status: 401 })),
    );

    await expect(api.get("/protected")).rejects.toThrow("refresh rejected");

    expect(logout).toHaveBeenCalledOnce();
  });

  it("preserves the session when token refresh fails because the network is unavailable", async () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
    const refreshToken = vi.fn().mockImplementation(async () => {
      Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
      throw new TypeError("Network request failed");
    });
    const logout = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState({ accessToken: "expired-token", refreshToken, logout });
    server.use(
      http.get(`${API_URL}/protected`, () => new HttpResponse(null, { status: 401 })),
    );

    await expect(api.get("/protected")).rejects.toThrow("Network request failed");

    expect(logout).not.toHaveBeenCalled();
  });
});
