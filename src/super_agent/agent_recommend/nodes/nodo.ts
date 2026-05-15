import { SystemMessage } from "@langchain/core/messages";

import { AGENT_RECOMMEND_SYSTEM_PROMPT } from "./prompt.js";
import type { EcommerceState } from "../../state.js";
import { creativeLlm } from "../../shared/llm.js";
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

  return {
    messages: [response],
    response: isFinalResponse ? (response.content as string) : state.response,
    steps: 1,
  };
}
