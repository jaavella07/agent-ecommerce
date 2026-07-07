import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EcommerceState } from "../state.js";

const { invokeMock } = vi.hoisted(() => ({ invokeMock: vi.fn() }));

vi.mock("../shared/llm.js", () => ({
  routerLlm: {
    withStructuredOutput: () => ({ invoke: invokeMock }),
  },
}));

import { intentRouterNode } from "./router.js";

function state(user_input: string): EcommerceState {
  return { messages: [], user_input } as unknown as EcommerceState;
}

describe("intentRouterNode", () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it("conserva el intent detectado cuando la confianza es alta", async () => {
    invokeMock.mockResolvedValue({ intent: "tracking", confidence: 0.9, reason: "solicitud clara de rastreo" });

    const result = await intentRouterNode(state("¿dónde está mi pedido?"));

    expect(result.intent).toBe("tracking");
    expect(result.next_step).toBe("tracking");
    expect(result.confidence).toBe(0.9);
  });

  it("hace fallback a question cuando la confianza está bajo el umbral", async () => {
    invokeMock.mockResolvedValue({ intent: "tracking", confidence: 0.2, reason: "ambiguo" });

    const result = await intentRouterNode(state("algo confuso"));

    expect(result.intent).toBe("question");
    expect(result.next_step).toBe("question");
    expect(result.confidence).toBe(0.2);
  });

  it("retorna end sin invocar al LLM cuando el input está vacío", async () => {
    const result = await intentRouterNode(state("   "));

    expect(result).toEqual({ intent: "end", next_step: "end", steps: 1 });
    expect(invokeMock).not.toHaveBeenCalled();
  });
});
