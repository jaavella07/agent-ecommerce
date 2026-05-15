import { SystemMessage } from "@langchain/core/messages";

import { AGENT_QUESTION_SYSTEM_PROMPT } from "./prompt.js";
import type { EcommerceState } from "../../state.js";
import { agentQuestionTools } from "./tool.js";
import { llm } from "../../shared/llm.js";

// ============================================================
// Llama al LLM con las herramientas disponibles.
// Si el LLM decide usar una herramienta, el router lo enviará
// al ToolNode; si no, irá al END con la respuesta final.
// ============================================================

// Modelo con herramientas vinculadas (se crea una sola vez)
const modelWithTools = llm.bindTools(agentQuestionTools);

export async function agentQuestionNode(
  state: EcommerceState
): Promise<Partial<EcommerceState>> {
  const systemMessage = new SystemMessage(AGENT_QUESTION_SYSTEM_PROMPT);

  // Combinar system prompt con el historial de mensajes
  const messages = [systemMessage, ...state.messages];

  const response = await modelWithTools.invoke(messages);

  // Extraer respuesta final si no hay tool_calls
  const isFinalResponse =
    !response.tool_calls || response.tool_calls.length === 0;

  return {
    messages: [response],
    response: isFinalResponse
      ? (response.content as string)
      : state.response,
    steps: 1,
  };
}
