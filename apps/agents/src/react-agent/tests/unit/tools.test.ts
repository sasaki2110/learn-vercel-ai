import { describe, it, expect } from "@jest/globals";
// setup.ts sets TAVILY_API_KEY, so we can import tools.ts without errors
import { TOOLS } from "../../tools.js";

describe("Tools", () => {
  describe("TOOLS array", () => {
    it("should be defined", () => {
      expect(TOOLS).toBeDefined();
    });

    it("should be an array", () => {
      expect(Array.isArray(TOOLS)).toBe(true);
    });

    it("should contain at least one tool", () => {
      expect(TOOLS.length).toBeGreaterThan(0);
    });
  });

  describe("TavilySearchResults tool", () => {
    it("should be the first tool in TOOLS array", () => {
      expect(TOOLS[0]).toBeDefined();
    });

    it("should have a name property", () => {
      const tool = TOOLS[0];
      expect(tool).toHaveProperty("name");
      expect(typeof tool.name).toBe("string");
    });

    it("should have a description property", () => {
      const tool = TOOLS[0];
      expect(tool).toHaveProperty("description");
      expect(typeof tool.description).toBe("string");
    });

    it("should have an invoke method", () => {
      const tool = TOOLS[0];
      expect(tool).toHaveProperty("invoke");
      expect(typeof tool.invoke).toBe("function");
    });
  });
});

