import { tool } from "@langchain/core/tools";
import { z }    from "zod";
import { apiFetch } from "../../shared/apiClient.js";

export const getOrderStatusTool = tool(
  async ({ order_id }: { order_id: string }) => {
    try {
      const normalizedId = order_id.trim().toUpperCase();
      const res  = await apiFetch(`/orders?orderNumber=${encodeURIComponent(normalizedId)}&limit=1`);
      if (!res.ok) return JSON.stringify({ found: false, error: `HTTP ${res.status}` });
      const body  = await res.json();
      const order = body.data?.data?.[0];
      if (!order) {
        return JSON.stringify({
          found: false,
          message: `No encontré la orden "${order_id}". Verifica el número e intenta de nuevo, o proporciona tu email para buscar tus pedidos.`,
        });
      }
      return JSON.stringify({ found: true, order });
    } catch (e: any) {
      return JSON.stringify({ found: false, error: e.message });
    }
  },
  {
    name: "get_order_status",
    description:
      "Consulta el estado detallado de un pedido usando su número de orden (ej: ORD-20240515-A3K9). Retorna estado, items, fecha estimada de entrega y número de seguimiento.",
    schema: z.object({
      order_id: z.string().describe("Número de orden del cliente (ej: ORD-20240515-A3K9)"),
    }),
  }
);

export const getOrdersByEmailTool = tool(
  async ({ email }: { email: string }) => {
    try {
      const lowerEmail = email.toLowerCase().trim();
      const res    = await apiFetch(`/orders?email=${encodeURIComponent(lowerEmail)}&limit=5`);
      if (!res.ok) return JSON.stringify({ found: false, error: `HTTP ${res.status}` });
      const body   = await res.json();
      const orders = body.data?.data ?? [];
      if (orders.length === 0) {
        return JSON.stringify({
          found: false,
          message: `No encontré pedidos asociados al email "${email}". Verifica que sea el email con el que realizaste la compra.`,
        });
      }
      return JSON.stringify({ found: true, orders_count: orders.length, orders, total: body.data?.total ?? 0 });
    } catch (e: any) {
      return JSON.stringify({ found: false, error: e.message });
    }
  },
  {
    name: "get_orders_by_email",
    description:
      "Busca todos los pedidos de un cliente usando su dirección de email. Útil cuando el cliente no recuerda su número de orden.",
    schema: z.object({
      email: z.string().email().describe("Email del cliente registrado en la tienda"),
    }),
  }
);

export const agentOrderStatusTools = [getOrderStatusTool, getOrdersByEmailTool];
