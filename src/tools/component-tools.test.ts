import { describe, it, expect, vi, beforeEach } from "vitest";
import { BaseUIComponent } from "@/types";

// Mock the github-fetcher module
vi.mock("@/fetchers/github-fetcher", () => ({
  fetchAllComponents: vi.fn(),
  fetchComponent: vi.fn(),
}));

describe("getComponent", () => {
  let getComponent: any;
  let fetchAllComponents: any;
  let fetchComponent: any;

  beforeEach(async () => {
    // Reset all mocks and modules to clear cache
    vi.clearAllMocks();
    vi.resetModules();

    // Re-import mocked modules
    const fetcher = await import("@/fetchers/github-fetcher");
    fetchAllComponents = fetcher.fetchAllComponents;
    fetchComponent = fetcher.fetchComponent;

    // Re-import getComponent function (with cleared cache)
    const tools = await import("./component-tools");
    getComponent = tools.getComponent;
  });

  describe("Basic functionality", () => {
    it("should fetch and return a component by name", async () => {
      const mockComponent: BaseUIComponent = {
        name: "Input",
        description: "A text input field",
        props: {
          value: {
            type: "string",
            description: "The value of the input",
            required: false,
          },
        },
        dataAttributes: {},
        cssVariables: {},
      };

      fetchAllComponents.mockResolvedValue(new Map([["input", mockComponent]]));

      const result = await getComponent("Input");

      expect(result).toBeDefined();
      expect(result?.name).toBe("Input");
      expect(result?.props).toHaveProperty("value");
    });

    it("should return null for non-existent component", async () => {
      fetchAllComponents.mockResolvedValue(new Map());
      fetchComponent.mockResolvedValue(null);

      const result = await getComponent("NonExistent");

      expect(result).toBeNull();
    });

    it("should handle case-insensitive names", async () => {
      const mockComponent: BaseUIComponent = {
        name: "Input",
        description: "Input field",
        props: {},
        dataAttributes: {},
        cssVariables: {},
      };

      fetchAllComponents.mockResolvedValue(new Map([["input", mockComponent]]));

      const result1 = await getComponent("input");
      const result2 = await getComponent("INPUT");
      const result3 = await getComponent("Input");

      expect(result1?.name).toBe("Input");
      expect(result2?.name).toBe("Input");
      expect(result3?.name).toBe("Input");
    });

    it("should handle kebab-case component names", async () => {
      const mockComponent: BaseUIComponent = {
        name: "DialogRoot",
        description: "Dialog root",
        props: {},
        dataAttributes: {},
        cssVariables: {},
      };

      fetchAllComponents.mockResolvedValue(
        new Map([["dialog-root", mockComponent]])
      );

      const result = await getComponent("dialog-root");

      expect(result).toBeDefined();
      expect(result?.name).toBe("DialogRoot");
    });
  });

  describe("Component structure", () => {
    it("should return all component properties", async () => {
      const mockComponent: BaseUIComponent = {
        name: "AvatarRoot",
        description: "Avatar component",
        props: {
          src: {
            type: "string",
            description: "Image URL",
            required: false,
          },
        },
        dataAttributes: {
          "data-state": {
            type: "string",
            description: "State",
          },
        },
        cssVariables: {
          "--size": {
            description: "Size",
          },
        },
      };

      fetchAllComponents.mockResolvedValue(
        new Map([["avatar-root", mockComponent]])
      );

      const result = await getComponent("AvatarRoot");

      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("description");
      expect(result).toHaveProperty("props");
      expect(result).toHaveProperty("dataAttributes");
      expect(result).toHaveProperty("cssVariables");
    });

    it("should handle components with props", async () => {
      const mockComponent: BaseUIComponent = {
        name: "Button",
        description: "Button",
        props: {
          disabled: {
            type: "boolean",
            description: "Disabled",
            required: false,
          },
          onClick: {
            type: "function",
            description: "Click handler",
            required: false,
          },
        },
        dataAttributes: {},
        cssVariables: {},
      };

      fetchAllComponents.mockResolvedValue(
        new Map([["button", mockComponent]])
      );

      const result = await getComponent("Button");

      expect(result).toBeDefined();
      expect(Object.keys(result?.props || {}).length).toBe(2);
      expect(result?.props).toHaveProperty("disabled");
      expect(result?.props).toHaveProperty("onClick");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty component name", async () => {
      fetchAllComponents.mockResolvedValue(new Map());
      fetchComponent.mockResolvedValue(null);

      const result = await getComponent("");

      expect(result).toBeNull();
    });

    it("should handle component with special characters", async () => {
      fetchAllComponents.mockResolvedValue(new Map());
      fetchComponent.mockResolvedValue(null);

      const result = await getComponent("Invalid@Component!");

      expect(result).toBeNull();
    });

    it("should fallback to direct fetch when not in cache", async () => {
      const mockComponent: BaseUIComponent = {
        name: "NewComponent",
        description: "New",
        props: {},
        dataAttributes: {},
        cssVariables: {},
      };

      fetchAllComponents.mockResolvedValue(new Map());
      fetchComponent.mockResolvedValue(mockComponent);

      const result = await getComponent("NewComponent");

      expect(result).toBeDefined();
      expect(result?.name).toBe("NewComponent");
      expect(fetchComponent).toHaveBeenCalledWith("newcomponent");
    });
  });

  describe("Multiple components", () => {
    it("should correctly fetch different components", async () => {
      const components = new Map([
        [
          "dialog-root",
          {
            name: "DialogRoot",
            description: "Dialog root",
            props: {},
            dataAttributes: {},
            cssVariables: {},
          } as BaseUIComponent,
        ],
        [
          "dialog-trigger",
          {
            name: "DialogTrigger",
            description: "Dialog trigger",
            props: {},
            dataAttributes: {},
            cssVariables: {},
          } as BaseUIComponent,
        ],
      ]);

      fetchAllComponents.mockResolvedValue(components);

      const dialogRoot = await getComponent("DialogRoot");
      const dialogTrigger = await getComponent("DialogTrigger");

      expect(dialogRoot?.name).toBe("DialogRoot");
      expect(dialogTrigger?.name).toBe("DialogTrigger");
    });
  });
});
