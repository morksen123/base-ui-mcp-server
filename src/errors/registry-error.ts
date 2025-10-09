export class BaseUIError extends Error {
  public readonly code: string;
  public readonly suggestion?: string;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    options?: {
      code?: string;
      suggestion?: string;
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = "BaseUIError";
    this.code = options?.code || "UNKNOWN_ERROR";
    this.suggestion = options?.suggestion;
    this.context = options?.context;

    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

export class ComponentNotFoundError extends BaseUIError {
  constructor(componentName: string, options?: { suggestion?: string }) {
    super(`Component "${componentName}" not found`, {
      code: "COMPONENT_NOT_FOUND",
      suggestion:
        options?.suggestion ||
        `Try searching for the component first using search_components, or check the component name spelling.`,
      context: { componentName },
    });
    this.name = "ComponentNotFoundError";
  }
}

export class FetchError extends BaseUIError {
  constructor(url: string, status?: number, messageFromServer?: string) {
    const message = messageFromServer
      ? `Failed to fetch from GitHub: ${messageFromServer}`
      : `Failed to fetch from GitHub: ${url}`;

    super(message, {
      code: "FETCH_ERROR",
      suggestion: "Check your internet connection and try again.",
      context: { url, status },
    });
    this.name = "FetchError";
  }
}

export class UnauthorizedError extends BaseUIError {
  constructor(url: string, messageFromServer?: string) {
    const message = messageFromServer
      ? `Unauthorized: ${messageFromServer}`
      : `Unauthorized access to: ${url}`;

    super(message, {
      code: "UNAUTHORIZED",
      suggestion: "Check your authentication credentials (e.g., GITHUB_TOKEN).",
      context: { url, status: 401 },
    });
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends BaseUIError {
  constructor(url: string, messageFromServer?: string) {
    const message = messageFromServer
      ? `Forbidden: ${messageFromServer}`
      : `Access forbidden to: ${url}`;

    super(message, {
      code: "FORBIDDEN",
      suggestion:
        "You do not have permission to access this resource. Check your access rights.",
      context: { url, status: 403 },
    });
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends BaseUIError {
  constructor(url: string, messageFromServer?: string) {
    const message = messageFromServer
      ? `Not found: ${messageFromServer}`
      : `Resource not found: ${url}`;

    super(message, {
      code: "NOT_FOUND",
      suggestion:
        "The requested resource does not exist. Check the URL or component name.",
      context: { url, status: 404 },
    });
    this.name = "NotFoundError";
  }
}

export class ValidationError extends BaseUIError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(`Validation error: ${message}`, {
      code: "VALIDATION_ERROR",
      suggestion:
        "The component data from GitHub may be malformed. Try again later.",
      context,
    });
    this.name = "ValidationError";
  }
}

export class CacheError extends BaseUIError {
  constructor(message: string, cause?: Error) {
    super(`Cache error: ${message}`, {
      code: "CACHE_ERROR",
      suggestion: "Try clearing the cache or restarting the server.",
      cause,
    });
    this.name = "CacheError";
  }
}

export class SearchError extends BaseUIError {
  constructor(query: string, cause?: Error) {
    super(`Search error for query: "${query}"`, {
      code: "SEARCH_ERROR",
      suggestion: "Try a different search query or check the component list.",
      context: { query },
      cause,
    });
    this.name = "SearchError";
  }
}
