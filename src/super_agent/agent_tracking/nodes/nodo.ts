import { SystemMessage } from "@langchain/core/messages";
import { llm } from "../../shared/llm.js";
import { normalizeContent } from "../../shared/content.js";
import type { EcommerceState } from "../../state.js";
import { AGENT_TRACKING_SYSTEM_PROMPT } from "./prompt.js";
import { agentTrackingTools } from "./tool.js";

// Agent Tracking — Nodo Principal

const modelWithTools = llm.bindTools(agentTrackingTools);

export async function agentTrackingNode(
  state: EcommerceState
): Promise<Partial<EcommerceState>> {
  const systemMessage = new SystemMessage(AGENT_TRACKING_SYSTEM_PROMPT);
  const messages = [systemMessage, ...state.messages];

  const response = await modelWithTools.invoke(messages);

  const isFinalResponse =
    !response.tool_calls || response.tool_calls.length === 0;

  // Extraer número de tracking del resultado de la herramienta si aplica
  let trackingNumber = state.tracking_number;
  const lastToolResult = state.messages
    .slice()
    .reverse()
    .find((m) => m.getType() === "tool");

  if (lastToolResult) {
    try {
      const parsed = JSON.parse(normalizeContent(lastToolResult.content));
      const extracted = parsed.found
        ? (parsed.tracking?.trackingNumber ?? parsed.trackingNumber)
        : undefined;
      if (extracted) {
        trackingNumber = extracted;
      }
    } catch {
      // ignorar
    }
  }

  return {
    messages: [response],
    response: isFinalResponse ? normalizeContent(response.content) : state.response,
    tracking_number: trackingNumber,
    steps: 1,
  };
}
