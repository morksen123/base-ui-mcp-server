import { z } from "zod";
import dedent from "dedent";
import {
  BaseUIError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from "@/errors/registry-error";

/**
 * Centralized error handling for MCP tool calls
 * Inspired by shadcn's handleError utility
 *
 * Converts errors into MCP-compatible error responses with helpful messages
 */
export function handleError(error: unknown): {
  content: Array<{ type: "text"; text: string }>;
  isError: true;
} {
  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return {
      content: [
        {
          type: "text",
          text: dedent`
            Invalid input parameters:
            ${error.errors
              .map((err) => `- ${err.path.join(".")}: ${err.message}`)
              .join("\n")}
          `,
        },
      ],
      isError: true,
    };
  }

  // Handle custom BaseUI errors
  if (error instanceof BaseUIError) {
    let errorMessage = error.message;

    if (error.suggestion) {
      errorMessage += `\n\n💡 ${error.suggestion}`;
    }

    if (error.context) {
      errorMessage += `\n\nContext: ${JSON.stringify(error.context, null, 2)}`;
    }

    return {
      content: [
        {
          type: "text",
          text: dedent`
            Error (${error.code}): ${errorMessage}
          `,
        },
      ],
      isError: true,
    };
  }

  // Handle unknown errors
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error("Unexpected error:", error);

  return {
    content: [
      {
        type: "text",
        text: dedent`
          Error: ${errorMessage}

          💡 If this persists, try restarting the server or check your internet connection.
        `,
      },
    ],
    isError: true,
  };
}
