export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, string>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, string>,
  ) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class MissingConfigurationError extends HttpError {
  constructor(message = "This feature is temporarily unavailable.") {
    super(503, "service_unavailable", message);
    this.name = "MissingConfigurationError";
  }
}

export class CheckoutValidationError extends HttpError {
  constructor(
    code: string,
    message: string,
    details?: Record<string, string>,
  ) {
    super(400, code, message, details);
    this.name = "CheckoutValidationError";
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}
