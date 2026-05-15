import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

// ============================================================
// Este estado es compartido por el super-agente y todos los
// sub-agentes. Cada campo tiene un reducer que define cómo
// se actualiza cuando un nodo retorna valores parciales.
// ============================================================

export const EcommerceStateAnnotation = Annotation.Root({
  // Mensajes de conversación (acumula historia)
  ...MessagesAnnotation.spec,

  // Input del usuario (reemplaza en cada turno)
  user_input: Annotation<string | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),

  intent: Annotation<string | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),

  products: Annotation<any[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),

  recommendations: Annotation<any[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),

  current_order: Annotation<any | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),

  order_status: Annotation<string | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),

  tracking_number: Annotation<string | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),

  response: Annotation<string | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),

  next_step: Annotation<string | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),

  steps: Annotation<number>({
    reducer: (prev, next) => prev + next,
    default: () => 0,
  }),
});


export type EcommerceState = typeof EcommerceStateAnnotation.State;
