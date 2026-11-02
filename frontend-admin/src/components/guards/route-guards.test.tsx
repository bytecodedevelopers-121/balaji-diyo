import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PrivateRoute } from "./PrivateRoute";
import { PermissionRoute } from "./PermissionRoute";
import { PublicRoute } from "./PublicRoute";
import { useAuthStore } from "@/store/auth.store";

const initialState = useAuthStore.getInitialState();

afterEach(() => useAuthStore.setState(initialState, true));

function renderRoutes(initialPath: string) {
  const router = createMemoryRouter(
    [
      {
        element: <PublicRoute />,
        children: [{ path: "/login", element: <div>Login screen</div> }],
      },
      {
        element: <PrivateRoute />,
        children: [
          { path: "/dashboard", element: <div>Dashboard screen</div> },
          {
            element: <PermissionRoute permission="read:payment" />,
            children: [{ path: "/payments", element: <div>Payments screen</div> }],
          },
        ],
      },
      { path: "/403", element: <div>Forbidden screen</div> },
    ],
    { initialEntries: [initialPath] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe("route guards", () => {
  it("redirects signed-out users to login", async () => {
    useAuthStore.setState({ isLoading: false, isAuthenticated: false });
    const router = renderRoutes("/dashboard");

    expect(await screen.findByText("Login screen")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
  });

  it("redirects an authenticated user away from the login page", async () => {
    useAuthStore.setState({ isLoading: false, isAuthenticated: true });
    const router = renderRoutes("/login");

    expect(await screen.findByText("Dashboard screen")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/dashboard");
  });

  it("blocks users who lack a required permission", async () => {
    useAuthStore.setState({
      isLoading: false,
      isAuthenticated: true,
      user: { userId: "1", email: "editor@example.com", role: "Editor", isSuperAdmin: false, permissions: [] },
    });
    const router = renderRoutes("/payments");

    expect(await screen.findByText("Forbidden screen")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/403");
  });

  it.each([
    { isSuperAdmin: false, permissions: ["read:payment"] },
    { isSuperAdmin: true, permissions: [] },
  ])("allows an authorized user (%o)", async ({ isSuperAdmin, permissions }) => {
    useAuthStore.setState({
      isLoading: false,
      isAuthenticated: true,
      user: { userId: "1", email: "admin@example.com", role: "Admin", isSuperAdmin, permissions },
    });
    renderRoutes("/payments");

    expect(await screen.findByText("Payments screen")).toBeInTheDocument();
  });
});
