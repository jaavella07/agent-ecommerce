// ============================================================
// src/index.ts — Entry Point / Demo
// ============================================================
// Ejecutar: npm run dev
// ============================================================

import { runSuperAgent } from "./super_agent/index.js";

// ─── Colores para consola ────────────────────────────────────
const c = {
  cyan:   (s: string) => `\x1b[36m${s}\x1b[0m`,
  green:  (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  gray:   (s: string) => `\x1b[90m${s}\x1b[0m`,
  bold:   (s: string) => `\x1b[1m${s}\x1b[0m`,
  reset:  "\x1b[0m",
};

async function demo() {
//   console.log(c.bold("\n🛒 Super Agente E-commerce — Demo\n"));
//   console.log(c.gray("=".repeat(55)));

  const scenarios = [
    {
      label: "📋 Pregunta general",
      message: "¿Cuál es la política de devoluciones?",
    },
    {
      label: "💡 Recomendación de producto",
      message: "Busco una laptop para trabajar con un presupuesto de $1500",
    },
    {
      label: "📦 Estado de pedido",
      message: "¿En qué estado está mi pedido ORD-2024-002?",
    },
    {
      label: "🚚 Rastreo de envío",
      message: "¿Dónde está mi paquete? El número es TRK-789456123",
    },
    {
      label: "👋 Despedida",
      message: "Gracias, eso es todo por ahora",
    },
  ];

  for (const scenario of scenarios) {
    // console.log(`\n${c.bold(scenario.label)}`);
    // console.log(c.cyan(`Usuario: "${scenario.message}"`));
    // console.log(c.gray("-".repeat(55)));

    try {
      const start = Date.now();
      const result = await runSuperAgent(scenario.message);
      const elapsed = ((Date.now() - start) / 1000).toFixed(2);

    //   console.log(c.gray(`Intent detectado: ${result.intent}`));
    //   console.log(c.gray(`Pasos ejecutados: ${result.steps} | Tiempo: ${elapsed}s`));
    //   console.log(c.green(`\nAgente: ${result.response}`));

    } catch (err) {
    //   console.error(c.yellow(`Error: ${(err as Error).message}`));
    }

    // console.log(c.gray("=".repeat(55)));
  }
}

// demo().catch(console.error);
