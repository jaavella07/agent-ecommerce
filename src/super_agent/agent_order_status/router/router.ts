import type { AIMessage } from "@langchain/core/messages";
import type { EcommerceState } from "../../state.js";

export type AgentOrderStatusRouterOutput = "tools" | "end";

export function agentOrderStatusRouter(
  state: EcommerceState
): AgentOrderStatusRouterOutput {
  const lastMessage = state.messages.at(-1) as AIMessage;

  if (lastMessage?.tool_calls && lastMessage.tool_calls.length > 0) {
    return "tools";
  }

  return "end";
}
