
export const AGENT_QUESTION_ROUTER_PROMPT = `
Determina si el agente tiene suficiente información para 
responder al usuario o necesita ejecutar más herramientas.

Responde con:
- "tools" → si se necesita buscar más información
- "end"   → si la respuesta está completa y lista para el usuario
`.trim();
