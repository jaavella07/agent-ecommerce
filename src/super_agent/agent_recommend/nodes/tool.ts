import { tool } from "@langchain/core/tools";
import { z }    from "zod";
import { BASE_URL } from "../../shared/apiClient.js";

async function resolveCategoryId(categoryName: string): Promise<string | undefined> {
  const res = await fetch(`${BASE_URL}/products/categories`);
  if (!res.ok) return undefined;
  const body = await res.json();
  const cats: any[] = body.data ?? [];
  return cats.find(
    (c) =>
      c.name.toLowerCase().includes(categoryName.toLowerCase()) ||
      c.slug.toLowerCase().includes(categoryName.toLowerCase()),
  )?.id;
}

export const searchProductsByCategoryTool = tool(
  async ({
    category,
    max_price,
    use_case,
    limit = 3,
  }: {
    category?: string;
    max_price?: number;
    use_case?: string;
    limit?: number;
  }) => {
    try {
      const params = new URLSearchParams({ limit: String(limit) });

      if (category) {
        const categoryId = await resolveCategoryId(category);
        if (categoryId) params.set("category", categoryId);
      }
      if (max_price != null) params.set("maxPrice", String(Math.round(max_price * 100)));
      if (use_case)          params.set("search", use_case);

      const res = await fetch(`${BASE_URL}/products?${params.toString()}`);
      if (!res.ok) {
        return JSON.stringify({
          found: false,
          message: `Error al consultar productos (HTTP ${res.status}). Intenta de nuevo.`,
        });
      }
      const body = await res.json();
      return JSON.stringify({ products: body.data?.data ?? [] });
    } catch (e: any) {
      return JSON.stringify({ products: [], error: e.message });
    }
  },
  {
    name: "search_products_by_category",
    description:
      "Busca productos en el catálogo filtrando por categoría, precio máximo en USD y caso de uso. Útil para generar recomendaciones personalizadas.",
    schema: z.object({
      category:  z.string().optional().describe("Categoría: laptops, smartphones, audio, tablets"),
      max_price: z.number().optional().describe("Precio máximo en USD"),
      use_case:  z.string().optional().describe("Uso principal: trabajo, gaming, estudio, fotografía, música, etc."),
      limit:     z.number().optional().default(3).describe("Número máximo de resultados (default: 3)"),
    }),
  }
);

export const getProductComparisonTool = tool(
  async ({ product_ids }: { product_ids: string[] }) => {
    try {
      const results = await Promise.all(
        product_ids.map(async (id) => {
          const res = await fetch(`${BASE_URL}/products/${id}`);
          if (!res.ok) return null;
          const body = await res.json();
          return body.data ?? null;
        }),
      );
      return JSON.stringify({ products: results.filter(Boolean) });
    } catch (e: any) {
      return JSON.stringify({ products: [], error: e.message });
    }
  },
  {
    name: "get_product_comparison",
    description:
      "Compara dos o más productos lado a lado. Requiere los UUIDs de los productos.",
    schema: z.object({
      product_ids: z.array(z.string()).min(2).describe("Lista de UUIDs de productos a comparar"),
    }),
  }
);

export const agentRecommendTools = [
  searchProductsByCategoryTool,
  getProductComparisonTool,
];
