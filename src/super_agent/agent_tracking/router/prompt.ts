export const AGENT_TRACKING_ROUTER_PROMPT = `
Determina si el agente de rastreo necesita consultar más datos
o ya tiene la información de ubicación del paquete.

- "tools" -> si necesita buscar el tracking o la orden
- "end"   -> si ya tiene el historial y puede responder
`.trim();
