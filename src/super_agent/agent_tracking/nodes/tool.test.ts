import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiFetchMock } = vi.hoisted(() => ({ apiFetchMock: vi.fn() }));

vi.mock("../../shared/apiClient.js", () => ({
  apiFetch: apiFetchMock,
}));

import { getTrackingInfoTool, getTrackingByOrderTool } from "./tool.js";

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body };
}

describe("agent_tracking tools", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it("get_tracking_info normaliza el trackingNumber anidado bajo 'tracking'", async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse({
        data: {
          data: [{ trackingNumber: "MX-DHL-12345", orderNumber: "ORD-1", status: "SHIPPED", createdAt: "2026-01-01" }],
        },
      }),
    );

    const raw = await getTrackingInfoTool.invoke({ tracking_number: "mx-dhl-12345" });
    const parsed = JSON.parse(raw as string);

    expect(parsed.found).toBe(true);
    expect(parsed.tracking.trackingNumber).toBe("MX-DHL-12345");
  });

  it("get_tracking_by_order devuelve tracking.trackingNumber=null cuando la orden no tiene número asignado", async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse({ data: { data: [{ status: "PROCESSING" }] } }),
    );

    const raw = await getTrackingByOrderTool.invoke({ order_id: "ORD-1" });
    const parsed = JSON.parse(raw as string);

    expect(parsed.found).toBe(true);
    expect(parsed.tracking.trackingNumber).toBeNull();
  });

  it("captura un payload que no cumple el schema Zod y retorna found:false en vez de lanzar", async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse({ data: { data: [{ trackingNumber: "X", orderNumber: 12345 }] } }),
    );

    const raw = await getTrackingInfoTool.invoke({ tracking_number: "X" });
    const parsed = JSON.parse(raw as string);

    expect(parsed.found).toBe(false);
    expect(parsed.error).toMatch(/Respuesta inesperada del API/);
  });
});
