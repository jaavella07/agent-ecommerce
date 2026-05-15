import { tool } from "@langchain/core/tools";
import { z }    from "zod";
import { BASE_URL } from "../../shared/apiClient.js";

// ─── FAQ hardcodeado (políticas de la tienda — no vienen de la API) ──────────

const FAQ_DATABASE: Record<string, string> = {
  "política de devolución": "Aceptamos devoluciones dentro de 30 días desde la compra. El producto debe estar en condición original con empaque. Reembolso en 5-7 días hábiles.",
  "return policy": "Returns accepted within 30 days of purchase. Item must be in original condition. Refund processed in 5-7 business days.",
  "tiempo de envío": "Envío estándar: 3-5 días hábiles. Envío express: 1-2 días hábiles. Envío internacional: 7-14 días.",
  "shipping time": "Standard shipping: 3-5 business days. Express: 1-2 business days. International: 7-14 days.",
  "métodos de pago": "Aceptamos Visa, Mastercard, American Express, PayPal, transferencia bancaria y pago en cuotas.",
  "payment methods": "We accept Visa, Mastercard, Amex, PayPal, bank transfer, and installment payments.",
  "garantía": "Todos los productos tienen garantía de 1 año del fabricante. Extendemos garantía adicional de 6 meses.",
  "warranty": "All products have a 1-year manufacturer warranty. We extend an additional 6-month warranty.",
  "cancelar pedido": "Puedes cancelar tu pedido dentro de 2 horas desde la compra. Después, espera a recibirlo y realiza la devolución.",
};

// ─── Tools ──────────────────────────────────────────────────

export const searchFaqTool = tool(
  async ({ query }: { query: string }) => {
    const lowerQuery = query.toLowerCase();

    for (const [key, answer] of Object.entries(FAQ_DATABASE)) {
      if (lowerQuery.includes(key)) return answer;
    }

    for (const [key, answer] of Object.entries(FAQ_DATABASE)) {
      const keywords = key.split(" ");
      if (keywords.some((kw) => lowerQuery.includes(kw))) return answer;
    }

    return "No encontré información específica sobre eso. Te recomiendo contactar soporte en soporte@techsstore.com o llamar al 1-800-TECH.";
  },
  {
    name: "search_faq",
    description:
      "Busca en la base de preguntas frecuentes información sobre políticas de la tienda, envíos, devoluciones, garantías, métodos de pago y procedimientos.",
    schema: z.object({
      query: z.string().describe("La pregunta o tema a buscar en las FAQ"),
    }),
  }
);

export const searchProductInfoTool = tool(
  async ({ product_name }: { product_name: string }) => {
    try {
      const params = new URLSearchParams({ search: product_name, limit: "1" });
      const res    = await fetch(`${BASE_URL}/products?${params.toString()}`);
      if (!res.ok) return JSON.stringify({ found: false, error: `HTTP ${res.status}` });
      const body    = await res.json();
      const product = body.data?.data?.[0];
      if (!product) {
        return JSON.stringify({
          found: false,
          message: `No encontré el producto "${product_name}". Visita la tienda para ver el catálogo completo.`,
        });
      }
      return JSON.stringify({
        found: true,
        product: {
          id:             product.id,
          name:           product.name,
          description:    product.description,
          priceFormatted: product.priceFormatted,
          brand:          product.brand,
          attributes:     product.attributes ?? [],
          isActive:       product.isActive,
        },
      });
    } catch (e: any) {
      return JSON.stringify({ found: false, error: e.message });
    }
  },
  {
    name: "search_product_info",
    description:
      "Busca información detallada de un producto en TechsStore: especificaciones técnicas, precio, disponibilidad y marca.",
    schema: z.object({
      product_name: z.string().describe("Nombre o tipo de producto a buscar (ej: laptop, smartphone, auriculares)"),
    }),
  }
);

export const agentQuestionTools = [searchFaqTool, searchProductInfoTool];
