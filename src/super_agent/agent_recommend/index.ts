import { createToolAgentGraph } from "../shared/toolAgentGraph.js";
import { agentRecommendNode, agentRecommendTools } from "./nodes/index.js";

// ============================================================
// Agent Recommend — Sub-Grafo Compilado
// ============================================================
//
//   START
//     │
//     ▼
//   [agent] ──tool_calls?──► [tools] ──► [agent]
//     │
//   no tool_calls
//     │
//     ▼
//    END
//
// ============================================================

export const agentRecommendGraph = createToolAgentGraph(agentRecommendNode, agentRecommendTools);
