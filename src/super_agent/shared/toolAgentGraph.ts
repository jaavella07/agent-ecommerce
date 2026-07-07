import { END, START, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import type { AIMessage } from "@langchain/core/messages";

import { EcommerceStateAnnotation } from "../state.js";
import type { EcommerceState } from "../state.js";

export type ToolAgentRouterOutput = "tools" | "end";

export function toolOrEndRouter(state: EcommerceState): ToolAgentRouterOutput {
  const lastMessage = state.messages.at(-1) as AIMessage;
  return lastMessage?.tool_calls && lastMessage.tool_calls.length > 0 ? "tools" : "end";
}

export function createToolAgentGraph(
  nodeFn: (state: EcommerceState) => Promise<Partial<EcommerceState>>,
  tools: ConstructorParameters<typeof ToolNode>[0],
) {
  const toolNode = new ToolNode(tools);

  return new StateGraph(EcommerceStateAnnotation)
    .addNode("agent", nodeFn)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", toolOrEndRouter, { tools: "tools", end: END })
    .addEdge("tools", "agent")
    .compile();
}
