import { describe, it, expect, beforeEach, vi } from "vitest";
import { listComponents } from "./component-tools";
import { ListComponentsSchema } from "@/types";
import type { BaseUIComponent } from "@/types";
import * as githubFetcher from "@/fetchers/github-fetcher";

// Mock the github fetcher
vi.mock("@/fetchers/github-fetcher", () => ({
  fetchAllComponents: vi.fn(),
  clearResourceCache: vi.fn(),
}));

describe("listComponents", () => {
  const mockComponents: BaseUIComponent[] = [
    {
      name: "AccordionRoot",
      description: "Groups all parts of the accordion.",
      renders: "<div>",
      props: { defaultValue: { type: "string" }, value: { type: "string" } },
      dataAttributes: {
        "data-state": { type: "open | closed" },
        "data-disabled": { type: "boolean" },
      },
      cssVariables: {},
    },
    {
      name: "AccordionItem",
      description: "Groups an accordion header with the corresponding panel.",
      renders: "<div>",
      props: { value: { type: "string" } },
      dataAttributes: { "data-state": { type: "open | closed" } },
      cssVariables: {},
    },
    {
      name: "DialogRoot",
      description: "Groups all parts of the dialog.",
      renders: null,
      props: {
        open: { type: "boolean" },
        onOpenChange: { type: "(open: boolean) => void" },
      },
      dataAttributes: {},
      cssVariables: {},
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(githubFetcher.fetchAllComponents).mockResolvedValue(
      new Map(mockComponents.map((c) => [c.name.toLowerCase(), c]))
    );
  });

  describe("Default behavior", () => {
    it("should return 50 components by default", async () => {
      // Create 100 mock components
      const manyComponents = Array.from({ length: 100 }, (_, i) => ({
        name: `Component${i}`,
        description: `Description ${i}`,
        renders: "<div>",
        props: {},
        dataAttributes: {},
        cssVariables: {},
      }));

      vi.mocked(githubFetcher.fetchAllComponents).mockResolvedValue(
        new Map(manyComponents.map((c) => [c.name.toLowerCase(), c]))
      );

      const result = await listComponents();

      expect(result).toHaveLength(50);
      expect(result[0].name).toBe("Component0");
      expect(result[49].name).toBe("Component49");
    });

    it("should return all components if total is less than default limit", async () => {
      const result = await listComponents();

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe("AccordionRoot");
      expect(result[1].name).toBe("AccordionItem");
      expect(result[2].name).toBe("DialogRoot");
    });
  });

  describe("Custom limits", () => {
    it("should respect custom limit of 1", async () => {
      const result = await listComponents(1);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("AccordionRoot");
    });

    it("should respect custom limit of 2", async () => {
      const result = await listComponents(2);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("AccordionRoot");
      expect(result[1].name).toBe("AccordionItem");
    });

    it("should handle limit of 10", async () => {
      const manyComponents = Array.from({ length: 20 }, (_, i) => ({
        name: `Component${i}`,
        description: `Description ${i}`,
        renders: "<div>",
        props: {},
        dataAttributes: {},
        cssVariables: {},
      }));

      vi.mocked(githubFetcher.fetchAllComponents).mockResolvedValue(
        new Map(manyComponents.map((c) => [c.name.toLowerCase(), c]))
      );

      const result = await listComponents(10);

      expect(result).toHaveLength(10);
      expect(result[0].name).toBe("Component0");
      expect(result[9].name).toBe("Component9");
    });

    it("should handle maximum limit of 100", async () => {
      const manyComponents = Array.from({ length: 150 }, (_, i) => ({
        name: `Component${i}`,
        description: `Description ${i}`,
        renders: "<div>",
        props: {},
        dataAttributes: {},
        cssVariables: {},
      }));

      vi.mocked(githubFetcher.fetchAllComponents).mockResolvedValue(
        new Map(manyComponents.map((c) => [c.name.toLowerCase(), c]))
      );

      const result = await listComponents(100);

      expect(result).toHaveLength(100);
      expect(result[0].name).toBe("Component0");
      expect(result[99].name).toBe("Component99");
    });
  });

  describe("Data structure validation", () => {
    it("should return components with correct structure", async () => {
      const result = await listComponents(3);

      expect(result).toHaveLength(3);

      // Validate first component structure
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("description");
      expect(result[0]).toHaveProperty("renders");
      expect(result[0]).toHaveProperty("props");
      expect(result[0]).toHaveProperty("dataAttributes");
      expect(result[0]).toHaveProperty("cssVariables");

      expect(typeof result[0].name).toBe("string");
      expect(typeof result[0].description).toBe("string");
      expect(typeof result[0].props).toBe("object");
      expect(typeof result[0].dataAttributes).toBe("object");
      expect(typeof result[0].cssVariables).toBe("object");
    });

    it("should include all component metadata", async () => {
      const result = await listComponents(1);

      expect(result[0].name).toBe("AccordionRoot");
      expect(result[0].description).toBe("Groups all parts of the accordion.");
      expect(result[0].renders).toBe("<div>");
      expect(Object.keys(result[0].props)).toHaveLength(2);
      expect(Object.keys(result[0].dataAttributes)).toHaveLength(2);
    });
  });

  describe("Edge cases", () => {
    it("should handle empty component list", async () => {
      vi.mocked(githubFetcher.fetchAllComponents).mockResolvedValue(new Map());

      const result = await listComponents(50);

      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle limit larger than available components", async () => {
      const result = await listComponents(100);

      // We only have 3 components, so should return all 3
      expect(result).toHaveLength(3);
    });

    it("should return components in consistent order", async () => {
      const result1 = await listComponents(3);
      const result2 = await listComponents(3);

      expect(result1[0].name).toBe(result2[0].name);
      expect(result1[1].name).toBe(result2[1].name);
      expect(result1[2].name).toBe(result2[2].name);
    });
  });

  describe("Caching behavior", () => {
    it("should use cached components on subsequent calls", async () => {
      await listComponents(2);
      await listComponents(3);

      // fetchAllComponents should only be called once due to caching
      expect(githubFetcher.fetchAllComponents).toHaveBeenCalledTimes(2);
    });
  });

  describe("Real-world scenarios", () => {
    it("should handle typical use case with 10 components", async () => {
      const typicalComponents = [
        "AccordionRoot",
        "DialogRoot",
        "PopoverRoot",
        "MenuRoot",
        "TabsRoot",
        "TooltipRoot",
        "SelectRoot",
        "CheckboxRoot",
        "SwitchRoot",
        "SliderRoot",
      ].map((name) => ({
        name,
        description: `${name} component`,
        renders: "<div>",
        props: {},
        dataAttributes: {},
        cssVariables: {},
      }));

      vi.mocked(githubFetcher.fetchAllComponents).mockResolvedValue(
        new Map(typicalComponents.map((c) => [c.name.toLowerCase(), c]))
      );

      const result = await listComponents(10);

      expect(result).toHaveLength(10);
      expect(result.every((c) => c.name.endsWith("Root"))).toBe(true);
    });

    it("should preserve component metadata integrity", async () => {
      const componentWithRichData: BaseUIComponent = {
        name: "RichComponent",
        description: "A component with lots of metadata",
        renders: "<button>",
        props: {
          onClick: {
            type: "() => void",
            description: "Click handler",
          },
          disabled: {
            type: "boolean",
            default: "false",
          },
          variant: {
            type: "'primary' | 'secondary'",
          },
        },
        dataAttributes: {
          "data-state": { type: "'open' | 'closed'" },
          "data-disabled": { type: "boolean" },
        },
        cssVariables: {
          "--button-bg": { description: "Background color" },
        },
      };

      vi.mocked(githubFetcher.fetchAllComponents).mockResolvedValue(
        new Map([["richcomponent", componentWithRichData]])
      );

      const result = await listComponents(1);

      expect(result[0]).toEqual(componentWithRichData);
      expect(result[0].props.onClick.type).toBe("() => void");
      expect(result[0].props.disabled.default).toBe("false");
    });
  });

  describe("Performance", () => {
    it("should handle large component lists efficiently", async () => {
      const largeComponentList = Array.from({ length: 1000 }, (_, i) => ({
        name: `Component${i}`,
        description: `Description ${i}`,
        renders: "<div>",
        props: {},
        dataAttributes: {},
        cssVariables: {},
      }));

      vi.mocked(githubFetcher.fetchAllComponents).mockResolvedValue(
        new Map(largeComponentList.map((c) => [c.name.toLowerCase(), c]))
      );

      const startTime = Date.now();
      const result = await listComponents(100);
      const endTime = Date.now();

      expect(result).toHaveLength(100);
      // Should complete in a reasonable time (< 100ms for slicing)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});

describe("ListComponentsSchema validation", () => {
  it("should accept valid limit of 50 (default)", () => {
    const result = ListComponentsSchema.safeParse({ limit: 50 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });

  it("should accept valid limit of 1", () => {
    const result = ListComponentsSchema.safeParse({ limit: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(1);
    }
  });

  it("should accept valid limit of 100 (maximum)", () => {
    const result = ListComponentsSchema.safeParse({ limit: 100 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(100);
    }
  });

  it("should reject limit > 100", () => {
    const result = ListComponentsSchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Limit cannot exceed 100");
    }
  });

  it("should reject limit > 100 with large number", () => {
    const result = ListComponentsSchema.safeParse({ limit: 1000 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Limit cannot exceed 100");
    }
  });

  it("should reject zero limit", () => {
    const result = ListComponentsSchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe(
        "Number must be greater than 0"
      );
    }
  });

  it("should reject negative limit", () => {
    const result = ListComponentsSchema.safeParse({ limit: -1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe(
        "Number must be greater than 0"
      );
    }
  });

  it("should reject non-integer limit", () => {
    const result = ListComponentsSchema.safeParse({ limit: 50.5 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("integer");
    }
  });

  it("should use default value of 50 when limit is not provided", () => {
    const result = ListComponentsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });

  it("should reject non-numeric limit", () => {
    const result = ListComponentsSchema.safeParse({ limit: "50" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("number");
    }
  });
});
