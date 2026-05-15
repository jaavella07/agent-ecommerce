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
        └─→ END (despedida)
```

Cada sub-agente sigue el loop: `agente → ¿tool_calls? → tools → agente → END`

### Sub-agentes y tools

| Sub-agente | Tools | Endpoint TechsStore |
|---|---|---|
| `agent_question` | `search_faq` | — (FAQ hardcodeado) |
| `agent_question` | `search_product_info` | `GET /products?search=` |
| `agent_recommend` | `search_products_by_category` | `GET /products?category=&maxPrice=&search=` |
| `agent_recommend` | `get_product_comparison` | N × `GET /products/:id` |
| `agent_order_status` | `get_order_status` | `GET /orders?orderNumber=` (admin) |
| `agent_order_status` | `get_orders_by_email` | `GET /orders?email=` (admin) |
| `agent_tracking` | `get_tracking_info` | `GET /orders?trackingNumber=` (admin) |
| `agent_tracking` | `get_tracking_by_order` | `GET /orders?orderNumber=` (admin) |

### Autenticación con TechsStore

Las tools de `agent_order_status` y `agent_tracking` requieren rol ADMIN. El módulo `src/super_agent/shared/apiClient.ts` gestiona la autenticación automáticamente:

1. Primer request → `POST /auth/login` con credenciales admin del `.env`
2. Cachea el `accessToken` en memoria
3. Si recibe `401` → `POST /auth/refresh` y reintenta
4. Expone `apiFetch(path, options?)` — añade `Authorization: Bearer` en cada llamada

Las tools de `agent_recommend` y `agent_question` usan endpoints públicos (`fetch` directo, sin auth).

---

## Variables de entorno

Copia `.env.template` a `.env` y completa:

```env
# LLM
OPENAI_API_KEY=sk-...

# LangSmith (opcional, para trazabilidad)
LANGCHAIN_API_KEY=lsv2_...
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=agent-ecommerce

# PostgreSQL — persistencia de interacciones
DATABASE_URL=postgresql://agent_user:agent_pass@localhost:5432/ecommerce_agent

# TechsStore API
API_BASE_URL=http://localhost:3000/api/v1
API_ADMIN_EMAIL=admin@techsstore.com
API_ADMIN_PASSWORD=Admin1234
```

> `API_BASE_URL` debe incluir `/api/v1`. Las credenciales admin deben existir en TechsStore antes de arrancar el agente.

---

## Comandos

```bash
npm run dev          # Ejecuta directamente con tsx (sin compilar)
npm run build        # Compila TypeScript a dist/
npm start            # Ejecuta código compilado
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
