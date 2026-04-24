/**
 * Client-side mirror of the server's error envelope.
 * Shape: `{ error: { code, message, details? }, request_id }`.
 */

export type ErrorCode =
  | "not_found"
  | "validation_error"
  | "unauthorized"
  | "forbidden"
  | "conflict"
  | "rate_limited"
  | "internal_error";

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
  request_id?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: Record<string, unknown>;
  readonly requestId?: string;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.error.code;
    this.details = body.error.details;
    this.requestId = body.request_id;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isConflict(): boolean {
    return this.status === 409;
  }

  get isValidation(): boolean {
    return this.status === 400;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }
}

export class NetworkError extends Error {
  constructor(cause: unknown) {
    super("network request failed");
    this.name = "NetworkError";
    this.cause = cause;
  }
}
