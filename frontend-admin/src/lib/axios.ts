import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/auth.store";
import { PATHS } from "@/constants/PATHS";
import { isConnectionError } from "@/lib/connectionError";
import { toast } from "@/lib/toast";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// The request interceptor rejects offline requests with this plain object instead
// of a real AxiosError (see below) — the response interceptor has to recognize it
// before treating `error` as an AxiosError.
interface OfflineSkipError {
  message: string;
  isOfflineSkip: true;
  config: InternalAxiosRequestConfig;
}

function isOfflineSkipError(error: unknown): error is OfflineSkipError {
  return typeof error === "object" && error !== null && "isOfflineSkip" in error;
}

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ==================== REQUEST INTERCEPTOR ====================
axiosInstance.interceptors.request.use((config) => {
  const isRefresh = config.url?.includes("/auth/refresh") ?? false;
  const isProfile = config.url?.includes("/users/me/profile") ?? false;

  // Skip most requests when offline, except critical auth calls
  if (!navigator.onLine && !isRefresh && !isProfile) {
    return Promise.reject({
      message: "Offline - Request skipped",
      isOfflineSkip: true,
      config,
    });
  }

  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// ==================== RESPONSE INTERCEPTOR ====================
let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

function subscribeToRefresh(callback: (token: string | null) => void) {
  refreshSubscribers.push(callback);
}

function notifyRefreshSubscribers(token: string | null) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

// Requests that write but aren't a "save" the admin should be told about.
const SILENT_WRITE_URLS = ["/auth/", "/files/", "/media/upload"];

const WRITE_FALLBACK_MESSAGE: Record<string, string> = {
  post: "Created successfully",
  put: "Saved successfully",
  patch: "Updated successfully",
  delete: "Deleted successfully",
};

/** Toast for every successful create / save / update / delete, using the API's own message when it sends one. */
function announceWrite(response: AxiosResponse) {
  const method = response.config.method?.toLowerCase() ?? "get";
  const fallback = WRITE_FALLBACK_MESSAGE[method];
  if (!fallback) return;
  const url = response.config.url ?? "";
  if (SILENT_WRITE_URLS.some((silent) => url.includes(silent))) return;
  const apiMessage = (response.data as { message?: unknown } | undefined)?.message;
  toast.success(typeof apiMessage === "string" && apiMessage.trim() ? apiMessage : fallback);
}

axiosInstance.interceptors.response.use(
  (response) => {
    announceWrite(response);
    return response;
  },
  async (error: AxiosError | OfflineSkipError) => {
    // Handle skipped offline requests
    if (isOfflineSkipError(error)) {
      return Promise.reject(error); // Let the caller handle it gracefully
    }

    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const isUnauthorized = error.response?.status === 401;
    const isRefreshCall = originalRequest?.url?.includes("/auth/refresh");

    // Don't attempt refresh on refresh call itself or non-401 errors
    if (!isUnauthorized || !originalRequest || originalRequest._retry || isRefreshCall) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeToRefresh((token) => {
          if (!token) {
            reject(error);
            return;
          }
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(axiosInstance(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      await useAuthStore.getState().refreshToken();
      const { accessToken } = useAuthStore.getState();
      notifyRefreshSubscribers(accessToken);

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return axiosInstance(originalRequest);
    } catch (refreshError: unknown) {
      notifyRefreshSubscribers(null);

      // IMPORTANT: Do NOT logout on connection issues
      if (!isConnectionError(refreshError)) {
        await useAuthStore.getState().logout();

        if (window.location.pathname !== PATHS.LOGIN) {
          window.location.href = PATHS.LOGIN;
        }
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;