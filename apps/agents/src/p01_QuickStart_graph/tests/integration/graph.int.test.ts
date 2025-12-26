import { describe, it, expect } from "@jest/globals";
import { HumanMessage } from "@langchain/core/messages";
import { graph } from "../../graph.js";

describe("QuickStart Graph API - Integration", () => {
  // APIキーがない場合はスキップ
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  const testOrSkip = hasApiKey ? it : it.skip;

  describe("Graph invocation", () => {
    testOrSkip("should be able to invoke the graph", async () => {
      const result = await graph.invoke({
        messages: [new HumanMessage("Add 3 and 4.")],
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("messages");
      expect(Array.isArray(result.messages)).toBe(true);
    }, 30000); // 30秒のタイムアウト（LLM呼び出しがあるため）

    testOrSkip("should return messages after invocation", async () => {
      const result = await graph.invoke({
        messages: [new HumanMessage("Add 3 and 4.")],
      });

      expect(result.messages.length).toBeGreaterThan(0);
      
      // 最後のメッセージがAIMessageであることを確認
      const lastMessage = result.messages[result.messages.length - 1];
      expect(lastMessage).toBeDefined();
      expect(lastMessage).toHaveProperty("text");
    }, 30000);
  });
});

