import { createToolAgentGraph } from "../shared/toolAgentGraph.js";
import { agentQuestionNode, agentQuestionTools } from "./nodes/index.js";

// ============================================================
// Agent Question — Sub-Grafo Compilado
// ============================================================
//
//   START
//     │
//     ▼
//   [agent] ──tool_calls?──► [tools] ──► [agent]
//     │                                       │
//   no tool_calls                        (loop)
//     │
//     ▼
//    END
//
// ============================================================

export const agentQuestionGraph = createToolAgentGraph(agentQuestionNode, agentQuestionTools);
