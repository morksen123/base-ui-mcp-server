import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  handleSearchComponents,
  handleGetComponentExamples,
  handleGetInstallationGuide,
  handleGetSetupChecklist,
} from "./handlers";
import * as componentTools from "@/tools/component-tools";
import * as examplesTools from "@/tools/examples-tools";
import * as installationTools from "@/tools/installation-tools";

// Mock the tool modules
vi.mock("@/tools/component-tools");
vi.mock("@/tools/examples-tools");
vi.mock("@/tools/installation-tools");

describe("MCP Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handleSearchComponents", () => {
    it("should search components with valid query", async () => {
      const mockResults = {
        items: [
          {
            name: "DialogRoot",
            description: "Groups all parts of the dialog",
            renders: null,
            props: {},
            dataAttributes: {},
            cssVariables: {},
          },
          {
            name: "DialogPopup",
            description: "A container for the dialog contents",
            renders: "<div>",
            props: {},
            dataAttributes: {},
            cssVariables: {},
          },
        ],
        pagination: {
          total: 2,
          limit: 10,
          offset: 0,
          hasMore: false,
        },
      };

      vi.spyOn(
        componentTools,
        "searchComponentsWithPagination"
      ).mockResolvedValueOnce(mockResults);

      const result = await handleSearchComponents({
        query: "dialog",
        limit: 10,
        offset: 0,
        minScore: 0.7,
      });

      expect(
        componentTools.searchComponentsWithPagination
      ).toHaveBeenCalledWith("dialog", 10, {
        offset: 0,
        minScore: 0.7,
        includeProps: undefined,
        includeDataAttributes: undefined,
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain("dialog");
      expect(result.content[0].text).toContain("DialogRoot");
      expect(result.content[0].text).toContain("DialogPopup");
    });

    it("should handle no results found", async () => {
      vi.spyOn(
        componentTools,
        "searchComponentsWithPagination"
      ).mockResolvedValueOnce({
        items: [],
        pagination: {
          total: 0,
          limit: 10,
          offset: 0,
          hasMore: false,
        },
      });

      const result = await handleSearchComponents({
        query: "nonexistent",
        limit: 10,
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain("No components found");
      expect(result.content[0].text).toContain("nonexistent");
    });

    it("should use default values for optional parameters", async () => {
      vi.spyOn(
        componentTools,
        "searchComponentsWithPagination"
      ).mockResolvedValueOnce({
        items: [],
        pagination: {
          total: 0,
          limit: 10,
          offset: 0,
          hasMore: false,
        },
      });

      await handleSearchComponents({ query: "test" });

      expect(
        componentTools.searchComponentsWithPagination
      ).toHaveBeenCalledWith(
        "test",
        10, // default limit
        {
          offset: 0, // default offset
          minScore: 0.7, // default minScore
          includeProps: undefined,
          includeDataAttributes: undefined,
        }
      );
    });

    it("should include props and data attributes when specified", async () => {
      vi.spyOn(
        componentTools,
        "searchComponentsWithPagination"
      ).mockResolvedValueOnce({
        items: [],
        pagination: {
          total: 0,
          limit: 10,
          offset: 0,
          hasMore: false,
        },
      });

      await handleSearchComponents({
        query: "test",
        includeProps: true,
        includeDataAttributes: true,
      });

      expect(
        componentTools.searchComponentsWithPagination
      ).toHaveBeenCalledWith("test", 10, {
        offset: 0,
        minScore: 0.7,
        includeProps: true,
        includeDataAttributes: true,
      });
    });

    it("should throw validation error for invalid query", async () => {
      await expect(handleSearchComponents({ query: "" })).rejects.toThrow(
        /Query must not be empty/
      );
    });

    it("should throw validation error for limit > 100", async () => {
      await expect(
        handleSearchComponents({ query: "test", limit: 150 })
      ).rejects.toThrow(/Limit cannot exceed 100/);
    });

    it("should throw validation error for negative offset", async () => {
      await expect(
        handleSearchComponents({ query: "test", offset: -1 })
      ).rejects.toThrow();
    });

    it("should throw validation error for minScore out of range", async () => {
      await expect(
        handleSearchComponents({ query: "test", minScore: 1.5 })
      ).rejects.toThrow();

      await expect(
        handleSearchComponents({ query: "test", minScore: -0.1 })
      ).rejects.toThrow();
    });
  });

  describe("handleGetComponentExamples", () => {
    it("should get examples for valid component", async () => {
      const mockExamples = {
        componentName: "DialogRoot",
        anatomy: "Dialog anatomy description",
        component: {
          name: "DialogRoot",
          description: "Groups all parts of the dialog",
          renders: null,
          props: {
            open: {
              type: "boolean",
              description: "Whether the dialog is open",
            },
          },
          dataAttributes: {},
          cssVariables: {},
        },
        demos: [
          {
            name: "hero",
            description: "A simple dialog example",
            code: "export default function App() { return <div>Dialog</div>; }",
            language: "tsx" as const,
            variant: "css-modules" as const,
          },
        ],
        inlineExamples: [],
      };

      vi.spyOn(examplesTools, "getExamples").mockResolvedValueOnce(
        mockExamples
      );

      const result = await handleGetComponentExamples({ name: "DialogRoot" });

      expect(examplesTools.getExamples).toHaveBeenCalledWith(
        "DialogRoot",
        undefined
      );

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain("DialogRoot");
      expect(result.content[0].text).toContain("Interactive Demos");
      expect(result.content[0].text).toContain("A simple dialog example");
    });

    it("should filter examples by variant", async () => {
      const mockExamples = {
        componentName: "DialogRoot",
        anatomy: "Dialog anatomy",
        component: {
          name: "DialogRoot",
          description: "Groups all parts of the dialog",
          renders: null,
          props: {},
          dataAttributes: {},
          cssVariables: {},
        },
        demos: [
          {
            name: "tailwind-demo",
            description: "Dialog with Tailwind CSS",
            code: "export default function App() { return <div className='p-4'>Dialog</div>; }",
            language: "tsx" as const,
            variant: "tailwind" as const,
          },
        ],
        inlineExamples: [],
      };

      vi.spyOn(examplesTools, "getExamples").mockResolvedValueOnce(
        mockExamples
      );

      const result = await handleGetComponentExamples({
        name: "DialogRoot",
        variant: "tailwind",
      });

      expect(examplesTools.getExamples).toHaveBeenCalledWith(
        "DialogRoot",
        "tailwind"
      );

      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain("tailwind");
    });

    it("should handle component with no examples", async () => {
      vi.spyOn(examplesTools, "getExamples").mockResolvedValueOnce({
        componentName: "ObscureComponent",
        anatomy: "",
        component: {
          name: "ObscureComponent",
          description: "An obscure component",
          renders: null,
          props: {},
          dataAttributes: {},
          cssVariables: {},
        },
        demos: [],
        inlineExamples: [],
      });

      const result = await handleGetComponentExamples({
        name: "ObscureComponent",
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain("No examples found");
      expect(result.content[0].text).toContain("ObscureComponent");
    });

    it("should throw validation error for empty name", async () => {
      await expect(handleGetComponentExamples({ name: "" })).rejects.toThrow(
        /Component name must not be empty/
      );
    });

    it("should throw validation error for invalid variant", async () => {
      await expect(
        handleGetComponentExamples({ name: "Dialog", variant: "invalid" })
      ).rejects.toThrow();
    });
  });

  describe("handleGetInstallationGuide", () => {
    it("should generate installation guide for single component", async () => {
      const mockGuide = {
        packageName: "@base-ui-components/react",
        installCommand: {
          npm: "npm install @base-ui-components/react",
          yarn: "yarn add @base-ui-components/react",
          pnpm: "pnpm add @base-ui-components/react",
        },
        peerDependencies: {
          react: "^18.0.0",
          reactDom: "^18.0.0",
        },
        imports: ['import { Dialog } from "@base-ui-components/react/Dialog";'],
        basicUsage: "See component documentation for usage examples.",
        relatedComponents: ["DialogPopup", "DialogTrigger"],
        cssSetup: "Import styles.css",
      };

      vi.spyOn(installationTools, "getInstallationGuide").mockResolvedValueOnce(
        mockGuide
      );

      const result = await handleGetInstallationGuide({
        componentNames: ["DialogRoot"],
      });

      expect(installationTools.getInstallationGuide).toHaveBeenCalledWith([
        "DialogRoot",
      ]);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain("Installation Guide");
      expect(result.content[0].text).toContain("npm install");
      expect(result.content[0].text).toContain("@base-ui-components/react");
    });

    it("should generate installation guide for multiple components", async () => {
      const mockGuide = {
        packageName: "@base-ui-components/react",
        installCommand: {
          npm: "npm install @base-ui-components/react",
          yarn: "yarn add @base-ui-components/react",
          pnpm: "pnpm add @base-ui-components/react",
        },
        peerDependencies: {
          react: "^18.0.0",
          reactDom: "^18.0.0",
        },
        imports: ['import { Dialog } from "@base-ui-components/react/Dialog";'],
        basicUsage: "See component documentation for usage examples.",
        relatedComponents: ["DialogRoot", "DialogPopup", "DialogTrigger"],
      };

      vi.spyOn(installationTools, "getInstallationGuide").mockResolvedValueOnce(
        mockGuide
      );

      const result = await handleGetInstallationGuide({
        componentNames: ["DialogRoot", "DialogPopup", "DialogTrigger"],
      });

      expect(installationTools.getInstallationGuide).toHaveBeenCalledWith([
        "DialogRoot",
        "DialogPopup",
        "DialogTrigger",
      ]);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain("@base-ui-components/react");
      expect(result.content[0].text).toContain("npm install");
    });

    it("should throw validation error for empty array", async () => {
      await expect(
        handleGetInstallationGuide({ componentNames: [] })
      ).rejects.toThrow(/At least one component name is required/);
    });

    it("should throw validation error for non-array input", async () => {
      await expect(
        handleGetInstallationGuide({ componentNames: "DialogRoot" })
      ).rejects.toThrow();
    });
  });

  describe("handleGetSetupChecklist", () => {
    it("should return setup checklist", async () => {
      const mockChecklist = {
        items: [
          {
            id: "install",
            title: "Install Base UI",
            description: "Install @base-ui-components/react package",
            required: true,
            checkCommand: "npm install @base-ui-components/react",
          },
          {
            id: "react-version",
            title: "Verify React Version",
            description: "Ensure React 18+ is installed",
            required: true,
            checkCommand: "npm list react",
          },
        ],
        troubleshooting: [
          {
            issue: "Module not found",
            solution: "Restart your dev server after installing",
          },
        ],
      };

      vi.spyOn(installationTools, "getSetupChecklist").mockResolvedValueOnce(
        mockChecklist
      );

      const result = await handleGetSetupChecklist({});

      expect(installationTools.getSetupChecklist).toHaveBeenCalled();

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain("Install Base UI");
      expect(result.content[0].text).toContain("Verify React Version");
    });

    it("should accept empty object as args", async () => {
      vi.spyOn(installationTools, "getSetupChecklist").mockResolvedValueOnce({
        items: [],
        troubleshooting: [],
      });

      const result = await handleGetSetupChecklist({});

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
    });

    it("should validate args schema (even if empty)", async () => {
      vi.spyOn(installationTools, "getSetupChecklist").mockResolvedValueOnce({
        items: [],
        troubleshooting: [],
      });

      // Should not throw even with empty object
      await expect(handleGetSetupChecklist({})).resolves.toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should propagate errors from searchComponentsWithPagination", async () => {
      const error = new Error("Search failed");
      vi.spyOn(
        componentTools,
        "searchComponentsWithPagination"
      ).mockRejectedValueOnce(error);

      await expect(handleSearchComponents({ query: "test" })).rejects.toThrow(
        "Search failed"
      );
    });

    it("should propagate errors from getExamples", async () => {
      const error = new Error("Examples fetch failed");
      vi.spyOn(examplesTools, "getExamples").mockRejectedValueOnce(error);

      await expect(
        handleGetComponentExamples({ name: "Dialog" })
      ).rejects.toThrow("Examples fetch failed");
    });

    it("should propagate errors from getInstallationGuide", async () => {
      const error = new Error("Installation guide failed");
      vi.spyOn(installationTools, "getInstallationGuide").mockRejectedValueOnce(
        error
      );

      await expect(
        handleGetInstallationGuide({ componentNames: ["Dialog"] })
      ).rejects.toThrow("Installation guide failed");
    });

    it("should propagate errors from getSetupChecklist", async () => {
      const error = new Error("Checklist fetch failed");
      vi.spyOn(installationTools, "getSetupChecklist").mockRejectedValueOnce(
        error
      );

      await expect(handleGetSetupChecklist({})).rejects.toThrow(
        "Checklist fetch failed"
      );
    });
  });

  describe("Response Format", () => {
    it("should return MCP-compatible response structure", async () => {
      vi.spyOn(
        componentTools,
        "searchComponentsWithPagination"
      ).mockResolvedValueOnce({
        items: [],
        pagination: {
          total: 0,
          limit: 10,
          offset: 0,
          hasMore: false,
        },
      });

      const result = await handleSearchComponents({ query: "test" });

      expect(result).toHaveProperty("content");
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content[0]).toHaveProperty("type");
      expect(result.content[0]).toHaveProperty("text");
      expect(result.content[0].type).toBe("text");
    });

    it("should always return text content type", async () => {
      vi.spyOn(examplesTools, "getExamples").mockResolvedValueOnce({
        componentName: "Dialog",
        anatomy: "",
        component: {
          name: "Dialog",
          description: "Test",
          renders: null,
          props: {},
          dataAttributes: {},
          cssVariables: {},
        },
        demos: [],
        inlineExamples: [],
      });

      const result = await handleGetComponentExamples({ name: "Dialog" });

      expect(result.content[0].type).toBe("text");
      expect(typeof result.content[0].text).toBe("string");
    });
  });
});
