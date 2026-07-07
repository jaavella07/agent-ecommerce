import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";

import { INTENT_ROUTER_SYSTEM_PROMPT, INTENT_ROUTER_HUMAN_TEMPLATE } from "./prompt.js";
import type { EcommerceState } from "../state.js";
import { routerLlm } from "../shared/llm.js";

// Clasifica la intención del usuario y actualiza `intent` y
// `next_step` en el estado. Usa un modelo rápido
// para minimizar latencia en el routing.


const IntentSchema = z.object({
  intent: z.enum(["question", "recommend", "order_status", "tracking", "end"]),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
});

type IntentResult = z.infer<typeof IntentSchema>;

const llmWithStructuredOutput = routerLlm.withStructuredOutput(IntentSchema);

// Umbral bajo el cual desconfiamos de la clasificación del modelo local
// y preferimos derivar a agent_question (más seguro que actuar sobre un intent incierto).
const CONFIDENCE_THRESHOLD = 0.55;

//Nodo del Router 

export async function intentRouterNode(
  state: EcommerceState
): Promise<Partial<EcommerceState>> {
  // Obtener el input del usuario (del campo user_input o último mensaje)
  const userInput =
    state.user_input ??
    (state.messages.at(-1)?.content as string) ??
    "";

  if (!userInput.trim()) {
    return { intent: "end", next_step: "end", steps: 1 };
  }

  const humanPrompt = INTENT_ROUTER_HUMAN_TEMPLATE.replace(
    "{user_input}",
    userInput
  );

  const result: IntentResult = await llmWithStructuredOutput.invoke([
    new SystemMessage(INTENT_ROUTER_SYSTEM_PROMPT),
    new HumanMessage(humanPrompt),
  ]);

  console.log(
    `[IntentRouter] intent="${result.intent}" confidence=${result.confidence} — ${result.reason}`
  );

  const finalIntent = result.confidence < CONFIDENCE_THRESHOLD ? "question" : result.intent;
  if (finalIntent !== result.intent) {
    console.log(
      `[IntentRouter] confidence=${result.confidence} < ${CONFIDENCE_THRESHOLD} → fallback a "question" (intent original: ${result.intent})`
    );
  }

  return {
    intent: finalIntent,
    next_step: finalIntent,
    confidence: result.confidence,
    steps: 1,
    messages: [new HumanMessage(userInput)],
  };
}

// Función para el Conditional Edge

export type IntentRouterOutput =
  | "agent_question"
  | "agent_recommend"
  | "agent_order_status"
  | "agent_tracking"
  | "agent_farewell"
  | "__end__";

export function intentRouterEdge(state: EcommerceState): IntentRouterOutput {
  const routeMap: Record<string, IntentRouterOutput> = {
    question:     "agent_question",
    recommend:    "agent_recommend",
    order_status: "agent_order_status",
    tracking:     "agent_tracking",
    end:          "agent_farewell",
  };

  return routeMap[state.next_step ?? "end"] ?? "__end__";
}
