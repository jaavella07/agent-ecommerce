import { pool } from "./db.js";

export interface InteractionData {
  user_input: string;
  intent: string;
  response?: string;
  metadata?: Record<string, unknown>;
}

export async function saveInteraction(data: InteractionData): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO interactions (user_input, intent, response, metadata)
       VALUES ($1, $2, $3, $4)`,
      [
        data.user_input,
        data.intent,
        data.response ?? null,
        JSON.stringify(data.metadata ?? {}),
      ]
    );
  } catch (err) {
    console.error("[repository] Error al guardar interacción:", err);
  }
}
