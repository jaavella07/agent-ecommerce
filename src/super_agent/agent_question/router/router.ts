import type { AIMessage } from "@langchain/core/messages";

import type { EcommerceState } from "../../state.js";

// ============================================================
// Decide el siguiente paso dentro del sub-grafo:
//   - "tools" → ejecutar las herramientas solicitadas por el LLM
//   - "end"   → el agente terminó, ir al END del sub-grafo
// ============================================================

export type AgentQuestionRouterOutput = "tools" | "end";

export function agentQuestionRouter(
  state: EcommerceState
): AgentQuestionRouterOutput {
  const lastMessage = state.messages.at(-1) as AIMessage;

  // Si el último mensaje tiene tool_calls → ejecutar herramientas
  if (lastMessage?.tool_calls && lastMessage.tool_calls.length > 0) {
    return "tools";
  }

  return "end";
}
