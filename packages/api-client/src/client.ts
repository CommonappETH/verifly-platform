import { ApiError, NetworkError } from "./errors";
import type { ApiErrorBody } from "./errors";

export interface ClientOptions {
  baseUrl: string;
  credentials?: RequestCredentials;
  /**
   * Called when a non-auth-route response returns 401. Use this to clear
   * client-side auth state and redirect to a login screen. The interceptor
   * intentionally skips paths under `/auth/*` so a wrong-password 401 on
   * `/auth/login` doesn't trigger a redirect loop.
   */
  onUnauthorized?: () => void;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Per-call escape hatch — set true to skip the global 401 interceptor. */
  skipUnauthorizedHandler?: boolean;
}

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

function readCsrfCookie(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith("csrf="));
  return match?.split("=")[1];
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    if (!res.ok) {
      throw new ApiError(res.status, {
        error: {
          code: "internal_error",
          message: `unexpected response: ${res.status} ${res.statusText}`,
        },
      });
    }
    return undefined as T;
  }

  const body = (await res.json()) as T | ApiErrorBody;
  if (!res.ok) {
    throw new ApiError(res.status, body as ApiErrorBody);
  }
  return body as T;
}

function buildUrl(base: string, path: string, query?: QueryParams): string {
  const url = new URL(path, base);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v != null && v !== "") url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export interface ApiClient {
  get<T>(path: string, opts?: RequestOptions & { query?: QueryParams }): Promise<T>;
  post<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T>;
  patch<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T>;
  put<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T>;
  del<T>(path: string, opts?: RequestOptions): Promise<T>;
  /**
   * Replace or unset the 401 interceptor at runtime. Used by AuthProvider so
   * the singleton client can hook into per-app auth state without a circular
   * import at module load.
   */
  setOnUnauthorized(fn: (() => void) | undefined): void;
}

export function createClient(options: ClientOptions): ApiClient {
  const { baseUrl, credentials = "include" } = options;
  let onUnauthorized = options.onUnauthorized;

  async function request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    opts?: RequestOptions & { query?: QueryParams },
  ): Promise<T> {
    const url = buildUrl(baseUrl, path, opts?.query);
    const headers: Record<string, string> = {
      accept: "application/json",
      ...opts?.headers,
    };

    if (body !== undefined) {
      headers["content-type"] = "application/json";
    }

    const needsCsrf = method !== "GET";
    if (needsCsrf) {
      const csrf = readCsrfCookie();
      if (csrf) headers["x-csrf-token"] = csrf;
    }

    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        credentials,
        signal: opts?.signal,
      });
    } catch (err) {
      throw new NetworkError(err);
    }

    if (
      res.status === 401 &&
      onUnauthorized &&
      !opts?.skipUnauthorizedHandler &&
      !path.startsWith("/auth/")
    ) {
      try {
        onUnauthorized();
      } catch {
        // Never let an interceptor failure mask the original 401.
      }
    }

    return handleResponse<T>(res);
  }

  return {
    get<T>(path: string, opts?: RequestOptions & { query?: Record<string, string | number | boolean | null | undefined> }) {
      return request<T>("GET", path, undefined, opts);
    },
    post<T>(path: string, body?: unknown, opts?: RequestOptions) {
      return request<T>("POST", path, body, opts);
    },
    patch<T>(path: string, body?: unknown, opts?: RequestOptions) {
      return request<T>("PATCH", path, body, opts);
    },
    put<T>(path: string, body?: unknown, opts?: RequestOptions) {
      return request<T>("PUT", path, body, opts);
    },
    del<T>(path: string, opts?: RequestOptions) {
      return request<T>("DELETE", path, undefined, opts);
    },
    setOnUnauthorized(fn: (() => void) | undefined) {
      onUnauthorized = fn;
    },
  };
}
