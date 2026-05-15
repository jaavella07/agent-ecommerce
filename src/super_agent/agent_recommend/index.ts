import { END, START, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { EcommerceStateAnnotation } from "../state.js";
import { agentRecommendNode, agentRecommendTools } from "./nodes/index.js";
import { agentRecommendRouter } from "./router/index.js";

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

const toolNode = new ToolNode(agentRecommendTools);

export const agentRecommendGraph = new StateGraph(EcommerceStateAnnotation)
  .addNode("agent", agentRecommendNode)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", agentRecommendRouter, {
    tools: "tools",
    end: END,
  })
  .addEdge("tools", "agent")
  .compile();
