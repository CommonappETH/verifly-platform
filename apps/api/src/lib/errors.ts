export type ErrorDetails = Record<string, unknown> | undefined;

export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ErrorDetails;

  constructor(status: number, code: string, message: string, details?: ErrorDetails) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, details?: ErrorDetails) {
    super(404, "not_found", `${resource} not found`, details);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "validation failed", details?: ErrorDetails) {
    super(400, "validation_error", message, details);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "unauthorized", details?: ErrorDetails) {
    super(401, "unauthorized", message, details);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "forbidden", details?: ErrorDetails) {
    super(403, "forbidden", message, details);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "conflict", details?: ErrorDetails) {
    super(409, "conflict", message, details);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(message = "rate limit exceeded", details?: ErrorDetails) {
    super(429, "rate_limited", message, details);
    this.name = "RateLimitError";
  }
}
