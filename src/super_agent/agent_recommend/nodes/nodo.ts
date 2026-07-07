import { SystemMessage } from "@langchain/core/messages";

import { AGENT_RECOMMEND_SYSTEM_PROMPT } from "./prompt.js";
import type { EcommerceState } from "../../state.js";
import { creativeLlm } from "../../shared/llm.js";
import { normalizeContent } from "../../shared/content.js";
import { agentRecommendTools } from "./tool.js";

// ============================================================
// Usa creativeLlm (temperatura 0.7) para generar
// recomendaciones más variadas y personalizadas.
// ============================================================

const modelWithTools = creativeLlm.bindTools(agentRecommendTools);

export async function agentRecommendNode(
  state: EcommerceState
): Promise<Partial<EcommerceState>> {
  const systemMessage = new SystemMessage(AGENT_RECOMMEND_SYSTEM_PROMPT);
  const messages = [systemMessage, ...state.messages];

  const response = await modelWithTools.invoke(messages);

  const isFinalResponse =
    !response.tool_calls || response.tool_calls.length === 0;

  // Extraer productos del resultado de la herramienta si aplica
  let products = state.products;
  let recommendations = state.recommendations;
  const lastToolResult = state.messages
    .slice()
    .reverse()
    .find((m) => m.getType() === "tool");

  if (lastToolResult) {
    try {
      const parsed = JSON.parse(normalizeContent(lastToolResult.content));
      if (Array.isArray(parsed.products)) {
        products = parsed.products;
        recommendations = parsed.products;
      }
    } catch {
      // ignorar
    }
  }

  return {
    messages: [response],
    response: isFinalResponse ? normalizeContent(response.content) : state.response,
    products,
    recommendations,
    steps: 1,
  };
}
