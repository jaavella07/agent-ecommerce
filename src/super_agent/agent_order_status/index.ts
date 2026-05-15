import { END, START, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { EcommerceStateAnnotation } from "../state.js";
import { agentOrderStatusNode, agentOrderStatusTools } from "./nodes/index.js";
import { agentOrderStatusRouter } from "./router/index.js";

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

const toolNode = new ToolNode(agentOrderStatusTools);

export const agentOrderStatusGraph = new StateGraph(EcommerceStateAnnotation)
  .addNode("agent", agentOrderStatusNode)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", agentOrderStatusRouter, {
    tools: "tools",
    end: END,
  })
  .addEdge("tools", "agent")
  .compile();
