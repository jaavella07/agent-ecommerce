// ============================================================
// src/index.ts — Entry Point (CLI)
// ============================================================
// Ejecutar: npm run dev [-- "mensaje opcional"]
// ============================================================

import { runSuperAgent } from "./super_agent/index.js";

async function main() {
  const message = process.argv[2] ?? "¿Cuál es la política de devoluciones?";
  const result = await runSuperAgent(message);
  console.log(`[intent=${result.intent}] ${result.response}`);
}

main().catch((err) => {
  console.error("Error ejecutando el agente:", err);
  process.exit(1);
});
