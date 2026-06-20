# agent-ecommerce — Asistente conversacional para TechsStore

Sistema multi-agente construido con LangGraph/TypeScript que actúa como asistente virtual del e-commerce TechsStore. Corre como proceso independiente y consulta la API real de TechsStore vía HTTP.

---

## Arquitectura

```
START
  └─→ intent_router (clasifica la intención del usuario)
        ├─→ agent_question      (FAQ, info de productos)
        ├─→ agent_recommend     (recomendaciones y comparación)
        ├─→ agent_order_status  (estado de pedidos)
        ├─→ agent_tracking      (rastreo de envíos)
        └─→ agent_farewell  (despedida)
```

La mayoría de sub-agentes sigue el loop: `agente → ¿tool_calls? → tools → agente → END`

`agent_farewell` es la excepción — responde directamente sin tools: `agente → END`

### Sub-agentes y tools

| Sub-agente | Tools | Endpoint TechsStore |
|---|---|---|
| `agent_question` | `search_faq` | — (FAQ hardcodeado) |
| `agent_question` | `get_categories_info` | `GET /products/categories` |
| `agent_question` | `search_product_info` | `GET /products?search=` |
| `agent_recommend` | `search_products_by_category` | `GET /products?category=&maxPrice=&search=` |
| `agent_recommend` | `get_product_comparison` | N × `GET /products/:id` |
| `agent_order_status` | `get_order_status` | `GET /orders?orderNumber=` (admin) |
| `agent_order_status` | `get_orders_by_email` | `GET /orders?email=` (admin) |
| `agent_tracking` | `get_tracking_info` | `GET /orders?trackingNumber=` (admin) |
| `agent_tracking` | `get_tracking_by_order` | `GET /orders?orderNumber=` (admin) |
| `agent_farewell` | — (sin tools) | — |

### Memoria de conversación

El grafo se compila con `MemorySaver` — el historial de mensajes se guarda en RAM por `thread_id`. Mientras el proceso esté corriendo, el agente recuerda el contexto de cada conversación. Si el proceso se reinicia, la memoria se pierde (comportamiento esperado en desarrollo).

---

## Servidor HTTP

`src/server.ts` expone el agente como una API REST para el frontend.

### Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/chat` | Envía un mensaje al agente y recibe la respuesta |
| `GET` | `/health` | Verifica que el servidor esté corriendo |

### `POST /chat`

**Request:**
```json
{ "message": "Busco una laptop para gaming", "thread_id": "uuid-opcional" }
```
- `thread_id` es opcional en el primer mensaje. El agente genera uno y lo devuelve. A partir del segundo mensaje, enviarlo mantiene el contexto de la conversación.

**Response:**
```json
{
  "thread_id": "uuid",
  "response": "Texto de respuesta del agente",
  "intent": "question | recommend | order_status | tracking",
  "recommendations": [],
  "order_status": null,
  "tracking_number": null
}
```

### CORS

Acepta requests desde `http://localhost:5173` (Vite dev) y `http://localhost:4173` (Vite preview).

### Puerto

Configurable con `AGENT_PORT` en `.env`. Por defecto: `3500`.

---

### Autenticación con TechsStore

Las tools de `agent_order_status` y `agent_tracking` requieren rol ADMIN. El módulo `src/super_agent/shared/apiClient.ts` gestiona la autenticación automáticamente:

1. Primer request → `POST /auth/login` con credenciales admin del `.env`
2. Cachea el `accessToken` en memoria
3. Si recibe `401` → `POST /auth/refresh` y reintenta
4. Expone `apiFetch(path, options?)` — añade `Authorization: Bearer` en cada llamada

Las tools de `agent_recommend` y `agent_question` usan endpoints públicos (`fetch` directo, sin auth).


> `API_BASE_URL` debe incluir `/api/v1`. Las credenciales admin deben existir en TechsStore antes de arrancar el agente.

---

## Comandos

```bash
npm run dev          # Ejecuta directamente con tsx (sin compilar)
npm run build        # Compila TypeScript a dist/
npm run dev:server   # Servidor HTTP en localhost:3500 (integración con frontend)
npm run studio       # LangGraph Studio (puerto por defecto)
npm run studio:port  # LangGraph Studio en puerto 2024
```

El grafo expuesto en Studio es `src/super_agent/super_agent.ts:superAgentGraph`.

---

## Requisitos mínimos para un agente en TypeScript (referencia)

### 1. Iniciar proyecto
```bash
mkdir mi-agente && cd mi-agente
npm init -y
```

### 2. TypeScript
```bash
npm install typescript tsx @types/node --save-dev
npx tsc --init
```
En `tsconfig.json`:
```json
{ "module": "NodeNext", "moduleResolution": "NodeNext", "target": "ES2020" }
```

### 3. Variables de entorno
```bash
npm install dotenv
```

### 4. Core de agentes
```bash
npm install @langchain/langgraph @langchain/core zod
```

### 5. Modelos LLM
```bash
npm install @langchain/openai        # GPT-4, GPT-4o
```

### 6. Prompts con Nunjucks
```bash
npm install nunjucks @types/nunjucks
```

### 7. Checkpointer — memoria entre conversaciones
```bash
npm install @langchain/langgraph-checkpoint           # MemorySaver (incluido en langgraph)
npm install @langchain/langgraph-checkpoint-postgres  # PostgresSaver (producción)
```

### 8. Multi-agente / Supervisor
```bash
npm install @langchain/langgraph-supervisor
```

### 9. LangGraph Studio / Dev Server
```bash
npx @langchain/langgraph-cli dev
```
