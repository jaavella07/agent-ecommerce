import "dotenv/config";
import { ChatOllama } from "@langchain/ollama";

// ============================================================
// Centralizar la instancia del modelo evita inconsistencias
// entre agentes y facilita cambiar el modelo globalmente.
// ============================================================

// Configuración Ollama
// Soporta servidor local (localhost:11434) o remoto (Open WebUI / hosting).
// Variables de entorno: OLLAMA_BASE_URL, OLLAMA_MODEL,
//   OLLAMA_X_API_KEY (header X-API-Key),  OLLAMA_MY_KEY (header My-Key)
// El modelo debe soportar tool-calling (ej: qwen2.5:7b, llama3.1)

const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const model   = process.env.OLLAMA_MODEL ?? "llama3.1:latest";

const extraHeaders: Record<string, string> = {};
if (process.env.OLLAMA_X_API_KEY) extraHeaders["X-API-Key"] = process.env.OLLAMA_X_API_KEY;
if (process.env.OLLAMA_MY_KEY)    extraHeaders["My-Key"]    = process.env.OLLAMA_MY_KEY;
const headers = Object.keys(extraHeaders).length > 0 ? extraHeaders : undefined;

export const llm = new ChatOllama({
  baseUrl, model, temperature: 0.3, numPredict: 1024, headers,
});

// Versión con temperatura alta para recomendaciones creativas
export const creativeLlm = new ChatOllama({
  baseUrl, model, temperature: 0.7, numPredict: 1024, headers,
});

// Versión rápida para clasificación/routing (menor latencia)
export const routerLlm = new ChatOllama({
  baseUrl, model, temperature: 0.3, numPredict: 1024, headers,
});
