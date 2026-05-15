import { END, START, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { agentTrackingNode, agentTrackingTools } from "./nodes/index.js";
import { EcommerceStateAnnotation } from "../state.js";
import { agentTrackingRouter } from "./router/index.js";

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

const toolNode = new ToolNode(agentTrackingTools);

export const agentTrackingGraph = new StateGraph(EcommerceStateAnnotation)
  .addNode("agent", agentTrackingNode)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", agentTrackingRouter, {
    tools: "tools",
    end: END,
  })
  .addEdge("tools", "agent")
  .compile();
