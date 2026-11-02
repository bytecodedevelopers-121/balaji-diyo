import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/types/api.types";
import type { AuthResponse, LoginCredentials, User } from "@/types/auth";

/**
 * Authenticates with email/password. The backend sets the httpOnly refresh
 * token cookie as a side effect. Only the access token is returned — the
 * full user (with permissions) is always fetched separately via getMe().
 */
export async function login(credentials: LoginCredentials): Promise<{ accessToken: string }> {
  const { data } = await axiosInstance.post<ApiResponse<AuthResponse>>(
    "/auth/login",
    credentials,
  );
  return { accessToken: data.data.accessToken };
}

/**
 * Clears the httpOnly refresh token cookie server-side.
 */
export async function logout(): Promise<void> {
  await axiosInstance.post("/auth/logout");
}

/**
 * Exchanges the httpOnly refresh token cookie for a new access token.
 */
export async function refresh(): Promise<{ accessToken: string }> {
  const { data } = await axiosInstance.post<ApiResponse<AuthResponse>>("/auth/refresh");
  return { accessToken: data.data.accessToken };
}

/**
 * Fetches the full current user, including permissions.
 */
export async function getMe(): Promise<User> {
  const { data } = await axiosInstance.get<ApiResponse<User>>("/auth/me");
  return data.data;
}
