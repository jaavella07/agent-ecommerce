export const AGENT_RECOMMEND_ROUTER_PROMPT = `
Determina si el agente de recomendaciones necesita buscar más 
productos o ya tiene suficiente información para responder.

- "tools" → si necesita buscar o comparar más productos
- "end"   → si las recomendaciones están listas para presentar
`.trim();
