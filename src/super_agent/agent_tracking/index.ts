import { createToolAgentGraph } from "../shared/toolAgentGraph.js";
import { agentTrackingNode, agentTrackingTools } from "./nodes/index.js";

// ============================================================
// Agent Tracking — Sub-Grafo Compilado
// ============================================================
//
//   START
//     |
//     v
//   [agent] --tool_calls?--> [tools] --> [agent]
//     |
//   no tool_calls
//     |
//     v
//    END
//
// ============================================================

export const agentTrackingGraph = createToolAgentGraph(agentTrackingNode, agentTrackingTools);
