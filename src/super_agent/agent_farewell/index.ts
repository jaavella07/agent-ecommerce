import { END, START, StateGraph } from "@langchain/langgraph";

import { agentFarewellNode } from "./nodes/index.js";
import { EcommerceStateAnnotation } from "../state.js";

// ============================================================
// Agent Farewell — Sub-Grafo Compilado
// ============================================================
//
//   START
//     │
//     ▼
//   [agent]  (genera despedida, sin tools)
//     │
//    END
//
// ============================================================

export const agentFarewellGraph = new StateGraph(EcommerceStateAnnotation)
  .addNode("agent", agentFarewellNode)
  .addEdge(START, "agent")
  .addEdge("agent", END)
  .compile();
