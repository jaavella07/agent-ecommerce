export const AGENT_ORDER_STATUS_ROUTER_PROMPT = `
Determina si el agente de estado de órdenes tiene la información
necesaria para responder o necesita consultar más datos.

- "tools" → si necesita buscar una orden o email
- "end"   → si ya tiene el estado del pedido y puede responder
`.trim();
