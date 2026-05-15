import { END, START, StateGraph } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";

import { intentRouterNode, intentRouterEdge } from "./intent_router/index.js";
import { agentOrderStatusGraph } from "./agent_order_status/index.js";
import { agentRecommendGraph } from "./agent_recommend/index.js";
import { agentQuestionGraph } from "./agent_question/index.js";
import { agentTrackingGraph } from "./agent_tracking/index.js";
import { EcommerceStateAnnotation } from "./state.js";
import { saveInteraction } from "./shared/repository.js";
import type { EcommerceState } from "./state.js";

// ============================================================
// Super Agent E-commerce — Grafo Principal
// ============================================================
//
//                         ┌─────────────────┐
//                         │   intent_router  │
//                         └────────┬────────┘
//                                  │
//           ┌──────────────────────┼──────────────────────┐
//           │                      │                       │
//           ▼                      ▼                       ▼
//   [agent_question]    [agent_recommend]        [agent_order_status]
//           │                      │                       │
//           └──────────────────────┴───────────────────────┘
//                    [agent_tracking]       │
//                          │               │
//                          └───────────────┘
//                                  ▼
//                        [save_interaction]
//                                  │
//                                 END
//
// ============================================================

async function saveInteractionNode(
  state: EcommerceState
): Promise<Partial<EcommerceState>> {
  await saveInteraction({
    user_input: state.user_input ?? "",
    intent: state.intent ?? "unknown",
    response: state.response,
    metadata: buildMetadata(state),
  });
  return {};
}

function buildMetadata(state: EcommerceState): Record<string, unknown> {
  switch (state.intent) {
    case "recommend":
      return { recommendations: state.recommendations };
    case "order_status":
      return {
        order_id: state.current_order?.id,
        order_status: state.order_status,
      };
    case "tracking":
      return {
        tracking_number: state.tracking_number,
        order_status: state.order_status,
      };
    default:
      return {};
  }
}

export const superAgentGraph = new StateGraph(EcommerceStateAnnotation)
  // Nodos
  .addNode("intent_router", intentRouterNode)
  .addNode("agent_question", agentQuestionGraph)
  .addNode("agent_recommend", agentRecommendGraph)
  .addNode("agent_order_status", agentOrderStatusGraph)
  .addNode("agent_tracking", agentTrackingGraph)
  .addNode("save_interaction", saveInteractionNode)

  // Flujo
  .addEdge(START, "intent_router")

  .addConditionalEdges("intent_router", intentRouterEdge, {
    agent_question: "agent_question",
    agent_recommend: "agent_recommend",
    agent_order_status: "agent_order_status",
    agent_tracking: "agent_tracking",
    __end__: END,
  })

  // Todos los sub-agentes pasan por save_interaction antes de END
  .addEdge("agent_question", "save_interaction")
  .addEdge("agent_recommend", "save_interaction")
  .addEdge("agent_order_status", "save_interaction")
  .addEdge("agent_tracking", "save_interaction")
  .addEdge("save_interaction", END)

  .compile();

export async function runSuperAgent(userMessage: string) {
  const result = await superAgentGraph.invoke({
    user_input: userMessage,
    messages: [new HumanMessage(userMessage)],
  });

  return {
    response: result.response,
    intent: result.intent,
    steps: result.steps,
    order_status: result.order_status,
    tracking_number: result.tracking_number,
    recommendations: result.recommendations,
  };
}
