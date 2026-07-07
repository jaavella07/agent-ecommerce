import { readFileSync } from "node:fs";
import { tool } from "@langchain/core/tools";
import { z }    from "zod";
import { apiFetch } from "../../shared/apiClient.js";
import { CategoriesEnvelope, ProductsListEnvelope, parseOrThrow } from "../../shared/apiSchemas.js";

//  FAQ (políticas de la tienda), externalizado en faq.json

const FAQ_DATABASE: Record<string, string> = JSON.parse(
  readFileSync(new URL("./faq.json", import.meta.url), "utf-8"),
);

//  Tools 

export const searchFaqTool = tool(
  async ({ query }: { query: string }) => {
    const lowerQuery = query.toLowerCase();

    for (const [key, answer] of Object.entries(FAQ_DATABASE)) {
      if (lowerQuery.includes(key)) return answer;
    }

    for (const [key, answer] of Object.entries(FAQ_DATABASE)) {
      const keywords = key.split(" ").filter((kw) => kw.length >= 4);
      if (keywords.length > 0 && keywords.some((kw) => lowerQuery.includes(kw))) return answer;
    }

    return "No encontré información específica sobre eso. Te recomiendo contactar soporte en soporte@techsstore.com o llamar al 1-800-TECH.";
  },
  {
    name: "search_faq",
    description:
      "Busca en la base de preguntas frecuentes información sobre: historia y fundadores de la tienda, ubicación, valores, políticas de devolución, envíos, garantías, métodos de pago y procedimientos.",
    schema: z.object({
      query: z.string().describe("La pregunta o tema a buscar en las FAQ"),
    }),
  }
);

export const getCategoriesInfoTool = tool(
  async () => {
    try {
      const res  = await apiFetch(`/products/categories`);
      if (!res.ok) return JSON.stringify({ found: false, error: `HTTP ${res.status}` });
      const body = parseOrThrow(CategoriesEnvelope, await res.json(), "get_categories_info");
      const cats: any[] = body.data ?? [];
      if (cats.length === 0) {
        return JSON.stringify({ found: false, message: "No hay categorías disponibles en este momento." });
      }
      const formatted = cats.map((c: any) => ({
        id:          c.id,
        name:        c.name,
        slug:        c.slug,
        description: c.description ?? null,
        children:    (c.children ?? []).map((ch: any) => ({ id: ch.id, name: ch.name, slug: ch.slug })),
      }));
      return JSON.stringify({ found: true, categories: formatted, total: formatted.length });
    } catch (e: any) {
      return JSON.stringify({ found: false, error: e.message });
    }
  },
  {
    name: "get_categories_info",
    description:
      "Lista las categorías de productos disponibles en TechsStore con su nombre, slug, descripción e hijos. Útil cuando el usuario pregunta qué tipos de productos vende la tienda o quiere explorar el catálogo por categoría.",
    schema: z.object({}),
  }
);

export const searchProductInfoTool = tool(
  async ({ product_name }: { product_name: string }) => {
    try {
      const params = new URLSearchParams({ search: product_name, limit: "1" });
      const res    = await apiFetch(`/products?${params.toString()}`);
      if (!res.ok) return JSON.stringify({ found: false, error: `HTTP ${res.status}` });
      const body    = parseOrThrow(ProductsListEnvelope, await res.json(), "search_product_info");
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

export const agentQuestionTools = [searchFaqTool, getCategoriesInfoTool, searchProductInfoTool];
