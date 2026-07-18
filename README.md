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

El grafo se compila con `PostgresSaver` (`@langchain/langgraph-checkpoint-postgres`) — el historial de mensajes se persiste en Postgres por `thread_id` (ver `src/super_agent/shared/checkpointer.ts`, conectado vía `DATABASE_URL`). A diferencia de `MemorySaver`, el contexto de cada conversación sobrevive a un reinicio del proceso. **Postgres debe estar corriendo (`docker compose up -d`) para que el agente arranque en cualquier modo**, ya que `checkpointer.setup()` se ejecuta al importar `super_agent.ts`.

### LLM activo: Ollama

El proyecto usa [Ollama](https://ollama.com) (no OpenAI) como proveedor del LLM — ver `src/super_agent/shared/llm.ts`. Variables de entorno relevantes:

- `OLLAMA_BASE_URL` — URL del servidor Ollama (local o remoto), default `http://localhost:11434`.
- `OLLAMA_MODEL` — modelo a usar, debe soportar tool-calling (ej. `llama3.1:latest`, `qwen2.5:7b`), default `llama3.1:latest`.
- `OLLAMA_X_API_KEY` / `OLLAMA_MY_KEY` — headers opcionales de autenticación si el servidor Ollama es remoto y los requiere (`X-API-Key` / `My-Key`).

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

Configurable con `CORS_ORIGINS` en `.env` (lista separada por comas). Por defecto acepta `http://localhost:5173` (Vite dev) y `http://localhost:4173` (Vite preview).

### Puerto

Configurable con `AGENT_PORT` en `.env`. Por defecto: `3500`.

---

### Autenticación con TechsStore

Todas las tools (incluidas `agent_recommend` y `agent_question`) usan `apiFetch` para autenticar contra la API de TechsStore. El módulo `src/super_agent/shared/apiClient.ts` gestiona la autenticación automáticamente:

1. Primer request → `POST /auth/login` con las credenciales del usuario `AGENT` (rol read-only, generado por `POST /api/v1/seed/run` en TechsStore) definidas en `API_AGENT_EMAIL` / `API_AGENT_PASSWORD`
2. Cachea el `accessToken` en memoria (login perezoso — solo se dispara con la primera llamada, y las concurrentes esperan el mismo login en curso)
3. Si recibe `401` → `POST /auth/refresh` y reintenta; si el refresh también falla, vuelve a hacer login
4. Reintentos con backoff exponencial ante `5xx` o errores de red, hasta `API_MAX_RETRIES` (default `2`), con timeout por request vía `API_REQUEST_TIMEOUT_MS` (default `10000` ms)
5. Expone `apiFetch(path, options?)` — añade `Authorization: Bearer` en cada llamada

> `API_BASE_URL` debe incluir `/api/v1`. Las credenciales del usuario `AGENT` deben existir en TechsStore antes de arrancar el agente. Por compatibilidad, `API_ADMIN_EMAIL` / `API_ADMIN_PASSWORD` siguen funcionando como fallback si `API_AGENT_EMAIL` / `API_AGENT_PASSWORD` no están definidas.

---

## Variables de entorno

Ver `.env.template` para la lista completa. Las más relevantes:

| Variable | Descripción | Default |
|---|---|---|
| `OLLAMA_BASE_URL` | URL del servidor Ollama | `http://localhost:11434` |
| `OLLAMA_MODEL` | Modelo con soporte tool-calling | `llama3.1:latest` |
| `OLLAMA_X_API_KEY` / `OLLAMA_MY_KEY` | Headers de auth si Ollama es remoto | — |
| `DATABASE_URL` | Conexión Postgres (checkpointer + auditoría) | `postgresql://agent_user:agent_pass@localhost:5432/ecommerce_agent` |
| `API_BASE_URL` | Base de la API de TechsStore (debe incluir `/api/v1`) | `http://localhost:3000/api/v1` |
| `API_AGENT_EMAIL` / `API_AGENT_PASSWORD` | Credenciales del usuario `AGENT` (read-only) | — (obligatorias) |
| `API_REQUEST_TIMEOUT_MS` | Timeout por request en `apiFetch` | `10000` |
| `API_MAX_RETRIES` | Reintentos con backoff en `apiFetch` | `2` |
| `AGENT_PORT` | Puerto del servidor HTTP | `3500` |
| `CORS_ORIGINS` | Orígenes permitidos (separados por coma) | `http://localhost:5173,http://localhost:4173` |
| `LANGCHAIN_API_KEY` / `LANGCHAIN_TRACING_V2` / `LANGCHAIN_PROJECT` | Trazado opcional vía LangSmith | `LANGCHAIN_TRACING_V2=false` |

---

## Comandos

```bash
docker compose up -d # Levanta Postgres (requerido antes de cualquier comando de abajo)
npm run dev          # Ejecuta directamente con tsx (sin compilar)
npm run build        # Compila TypeScript a dist/
npm run dev:server   # Servidor HTTP en localhost:3500 (integración con frontend)
npm run studio       # LangGraph Studio (puerto por defecto)
npm run studio:port  # LangGraph Studio en puerto 2024
npm run lint         # ESLint
npm run lint:fix     # ESLint --fix
npm run format       # Prettier --write
npm test             # Vitest (11 tests: apiClient, intent_router, agent_tracking)
npm run test:watch   # Vitest en modo watch
```

El grafo expuesto en Studio es `src/super_agent/super_agent.ts:superAgentGraph`.

---

## Requisitos mínimos para un agente en TypeScript (referencia)

> ⚠️ Esta sección es un tutorial genérico de referencia para montar un agente LangGraph desde cero — **no describe el stack real de este proyecto**. Este proyecto usa Ollama (no OpenAI/GPT-4o) y no depende de Nunjucks ni de `@langchain/langgraph-supervisor`; ver las secciones anteriores para la configuración real.

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
