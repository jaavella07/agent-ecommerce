import { SystemMessage } from "@langchain/core/messages";

import { AGENT_FAREWELL_SYSTEM_PROMPT } from "./prompt.js";
import type { EcommerceState } from "../../state.js";
import { llm } from "../../shared/llm.js";

export async function agentFarewellNode(
  state: EcommerceState
): Promise<Partial<EcommerceState>> {
  const systemMessage = new SystemMessage(AGENT_FAREWELL_SYSTEM_PROMPT);
  const messages = [systemMessage, ...state.messages];

  const response = await llm.invoke(messages);

  return {
    messages: [response],
    response: response.content as string,
    steps: 1,
  };
}
