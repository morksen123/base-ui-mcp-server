import {
  SearchComponentsSchema,
  GetComponentExamplesSchema,
  GetInstallationGuideSchema,
  GetSetupChecklistSchema,
} from "@/types";
import { searchComponentsWithPagination } from "@/tools/component-tools";
import { getExamples } from "@/tools/examples-tools";
import {
  getInstallationGuide,
  getSetupChecklist,
} from "@/tools/installation-tools";
import {
  formatSearchResults,
  formatComponentExamples,
  formatInstallationGuide,
  formatSetupChecklist,
  formatNoResultsFound,
  formatNoExamplesFound,
} from "./utils";

export async function handleSearchComponents(args: unknown) {
  const parsedArgs = SearchComponentsSchema.parse(args);

  const searchResults = await searchComponentsWithPagination(
    parsedArgs.query,
    parsedArgs.limit,
    {
      offset: parsedArgs.offset,
      minScore: parsedArgs.minScore,
      includeProps: parsedArgs.includeProps,
      includeDataAttributes: parsedArgs.includeDataAttributes,
    }
  );

  if (searchResults.items.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: formatNoResultsFound(parsedArgs.query),
        },
      ],
    };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: formatSearchResults(searchResults, parsedArgs.query),
      },
    ],
  };
}

export async function handleGetComponentExamples(args: unknown) {
  const parsedArgs = GetComponentExamplesSchema.parse(args);

  const examples = await getExamples(parsedArgs.name, parsedArgs.variant);

  if (examples.demos.length === 0 && examples.inlineExamples.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: formatNoExamplesFound(parsedArgs.name),
        },
      ],
    };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: formatComponentExamples(examples),
      },
    ],
  };
}

export async function handleGetInstallationGuide(args: unknown) {
  const parsedArgs = GetInstallationGuideSchema.parse(args);

  const guide = await getInstallationGuide(parsedArgs.componentNames);

  return {
    content: [
      {
        type: "text" as const,
        text: formatInstallationGuide(guide),
      },
    ],
  };
}

export async function handleGetSetupChecklist(args: unknown) {
  GetSetupChecklistSchema.parse(args);

  const checklist = await getSetupChecklist();

  return {
    content: [
      {
        type: "text" as const,
        text: formatSetupChecklist(checklist),
      },
    ],
  };
}
