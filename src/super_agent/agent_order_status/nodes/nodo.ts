import { SystemMessage } from "@langchain/core/messages";
import { llm } from "../../shared/llm.js";
import type { EcommerceState } from "../../state.js";
import { AGENT_ORDER_STATUS_SYSTEM_PROMPT } from "./prompt.js";
import { agentOrderStatusTools } from "./tool.js";

// ============================================================
// Agent Order Status — Nodo Principal
// ============================================================

const modelWithTools = llm.bindTools(agentOrderStatusTools);

export async function agentOrderStatusNode(
  state: EcommerceState
): Promise<Partial<EcommerceState>> {
  const systemMessage = new SystemMessage(AGENT_ORDER_STATUS_SYSTEM_PROMPT);
  const messages = [systemMessage, ...state.messages];

  const response = await modelWithTools.invoke(messages);

  const isFinalResponse =
    !response.tool_calls || response.tool_calls.length === 0;

  // Intentar extraer la orden del resultado si está disponible
  const lastToolResult = state.messages
    .slice()
    .reverse()
    .find((m) => m.getType() === "tool");

  let orderData: any = state.current_order;
  let orderStatus: string | undefined = state.order_status;

  if (lastToolResult) {
    try {
      const parsed = JSON.parse(lastToolResult.content as string);
      if (parsed.found && parsed.order) {
        orderData = parsed.order;
        orderStatus = parsed.order.status;
      }
    } catch {
      // No es JSON parseable, ignorar
    }
  }

  return {
    messages: [response],
    response: isFinalResponse ? (response.content as string) : state.response,
    current_order: orderData,
    order_status: orderStatus,
    steps: 1,
  };
}
