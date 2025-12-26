import { StateGraph, START, END, MessagesAnnotation, Annotation } from "@langchain/langgraph";
import { SystemMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { modelWithTools, toolsByName } from "./tools.js";

// 状態の定義
const MessagesState = Annotation.Root({
  ...MessagesAnnotation.spec,
  llmCalls: Annotation<number>({
    reducer: (x, y) => x + y,
    default: () => 0,
  }),
});

// 関数のシグネチャ用に状態型を抽出
type MessagesStateType = typeof MessagesState.State;

// モデルノードの定義
async function llmCall(state: MessagesStateType) {
  return {
    messages: [await modelWithTools.invoke([
      new SystemMessage(
        "You are a helpful assistant tasked with performing arithmetic on a set of inputs."
      ),
      ...state.messages,
    ])],
    llmCalls: 1,
  };
}

// ツールノードの定義
async function toolNode(state: MessagesStateType) {
  const lastMessage = state.messages.at(-1);

  if (lastMessage == null || !(lastMessage instanceof AIMessage)) {
    return { messages: [] };
  }

  const result: ToolMessage[] = [];
  for (const toolCall of lastMessage.tool_calls ?? []) {
    const tool = toolsByName[toolCall.name];
    const observation = await tool.invoke(toolCall);
    result.push(observation);
  }

  return { messages: result };
}

// 終了ロジックの定義
async function shouldContinue(state: MessagesStateType) {
  const lastMessage = state.messages.at(-1);
  
  // AIMessageかどうかを確認してからtool_callsにアクセス
  if (!lastMessage || !(lastMessage instanceof AIMessage)) {
    return END;
  }
  
  // LLMがツール呼び出しを行った場合、アクションを実行
  if (lastMessage.tool_calls?.length) {
    return "toolNode";
  }
  
  // それ以外の場合は停止（ユーザーに返信）
  return END;
}

// エージェントの構築とコンパイル
const workflow = new StateGraph(MessagesState)
  .addNode("llmCall", llmCall)
  .addNode("toolNode", toolNode)
  .addEdge(START, "llmCall")
  .addConditionalEdges("llmCall", shouldContinue, ["toolNode", END])
  .addEdge("toolNode", "llmCall");

// グラフをコンパイルしてエクスポート
export const graph = workflow.compile();

