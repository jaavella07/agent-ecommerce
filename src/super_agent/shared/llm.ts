import { ChatOpenAI } from "@langchain/openai";

// ============================================================
// Centralizar la instancia del modelo evita inconsistencias
// entre agentes y facilita cambiar el modelo globalmente.
// ============================================================

export const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0.3, 
  maxTokens: 1024,
});

// Versión con temperatura alta para recomendaciones creativas
export const creativeLlm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 1024,
});

// Versión rápida para clasificación/routing (menor latencia)
export const routerLlm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0.3, 
  maxTokens: 1024,
});

