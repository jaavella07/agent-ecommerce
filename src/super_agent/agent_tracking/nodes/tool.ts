import { tool } from "@langchain/core/tools";
import { z }    from "zod";
import { apiFetch } from "../../shared/apiClient.js";

export const getTrackingInfoTool = tool(
  async ({ tracking_number }: { tracking_number: string }) => {
    try {
      const normalized = tracking_number.trim().toUpperCase();
      const res  = await apiFetch(`/orders?trackingNumber=${encodeURIComponent(normalized)}&limit=1`);
      if (!res.ok) return JSON.stringify({ found: false, error: `HTTP ${res.status}` });
      const body  = await res.json();
      const order = body.data?.data?.[0];
      if (!order) {
        return JSON.stringify({
          found: false,
          message: `No encontré información para el número de rastreo "${tracking_number}". Verifica que sea correcto o proporciona tu número de orden.`,
        });
      }
      return JSON.stringify({
        found: true,
        tracking: {
          trackingNumber:  order.trackingNumber,
          orderNumber:     order.orderNumber,
          status:          order.status,
          shippingAddress: order.shippingAddress,
          updatedAt:       order.updatedAt,
        },
      });
    } catch (e: any) {
      return JSON.stringify({ found: false, error: e.message });
    }
  },
  {
    name: "get_tracking_info",
    description:
      "Obtiene información detallada de rastreo usando el número de seguimiento del transportista. Incluye estado del pedido, dirección de entrega y última actualización.",
    schema: z.object({
      tracking_number: z.string().describe("Número de seguimiento del transportista (ej: MX-DHL-12345)"),
    }),
  }
);

export const getTrackingByOrderTool = tool(
  async ({ order_id }: { order_id: string }) => {
    try {
      const normalized = order_id.trim().toUpperCase();
      const res  = await apiFetch(`/orders?orderNumber=${encodeURIComponent(normalized)}&limit=1`);
      if (!res.ok) return JSON.stringify({ found: false, error: `HTTP ${res.status}` });
      const body  = await res.json();
      const order = body.data?.data?.[0];
      if (!order) {
        return JSON.stringify({
          found: false,
          message: `La orden "${order_id}" no fue encontrada. Verifica el número de orden.`,
        });
      }
      if (!order.trackingNumber) {
        return JSON.stringify({
          found: true,
          trackingNumber: null,
          status:  order.status,
          message: "La orden aún no tiene número de rastreo asignado. Es posible que el pedido aún no haya sido enviado.",
        });
      }
      return JSON.stringify({ found: true, trackingNumber: order.trackingNumber, status: order.status });
    } catch (e: any) {
      return JSON.stringify({ found: false, error: e.message });
    }
  },
  {
    name: "get_tracking_by_order",
    description:
      "Obtiene el número de rastreo usando el número de orden de compra. Útil cuando el cliente no tiene el número de seguimiento a mano.",
    schema: z.object({
      order_id: z.string().describe("Número de orden de compra (ej: ORD-20240515-A3K9)"),
    }),
  }
);

export const agentTrackingTools = [getTrackingInfoTool, getTrackingByOrderTool];
