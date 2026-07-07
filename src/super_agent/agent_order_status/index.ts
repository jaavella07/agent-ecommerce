import { createToolAgentGraph } from "../shared/toolAgentGraph.js";
import { agentOrderStatusNode, agentOrderStatusTools } from "./nodes/index.js";

// ============================================================
// Agent Order Status — Sub-Grafo Compilado
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

export const agentOrderStatusGraph = createToolAgentGraph(agentOrderStatusNode, agentOrderStatusTools);
