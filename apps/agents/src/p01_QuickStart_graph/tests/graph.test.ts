import { describe, it, expect } from "@jest/globals";
import { graph } from "../graph.js";

describe("QuickStart Graph API", () => {
  describe("Graph compilation", () => {
    it("should compile the graph", () => {
      expect(graph).toBeDefined();
    });

    it("should have an invoke method", () => {
      expect(graph).toHaveProperty("invoke");
      expect(typeof graph.invoke).toBe("function");
    });
  });
});

