import "dotenv/config";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://agent_user:agent_pass@localhost:5432/ecommerce_agent";

export const checkpointer = PostgresSaver.fromConnString(connectionString);
