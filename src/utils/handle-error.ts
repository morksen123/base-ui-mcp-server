import { z } from "zod";
import dedent from "dedent";
import { BaseUIError } from "@/errors/registry-error";

export function handleError(error: unknown): {
  content: Array<{ type: "text"; text: string }>;
  isError: true;
} {
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
