import { END, START, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { agentQuestionNode, agentQuestionTools } from "./nodes/index.js";
import { EcommerceStateAnnotation } from "../state.js";
import { agentQuestionRouter } from "./router/index.js";

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

const toolNode = new ToolNode(agentQuestionTools);

export const agentQuestionGraph = new StateGraph(EcommerceStateAnnotation)
  .addNode("agent", agentQuestionNode)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", agentQuestionRouter, {
    tools: "tools",
    end: END,
  })
  .addEdge("tools", "agent")
  .compile();
