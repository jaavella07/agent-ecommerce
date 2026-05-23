import { tool } from "@langchain/core/tools";
import { z }    from "zod";
import { apiFetch } from "../../shared/apiClient.js";

//  FAQ hardcodeado (políticas de la tienda) 

const FAQ_DATABASE: Record<string, string> = {
  //  Historia y empresa 
  "historia": "TechsStore nació hace 10 años como tienda física en Zipaquirá, Prados del Mirador, Colombia, fundada por Miguel Avella. En enero de 2026, Jorge Avella lanzó el ecommerce virtual para llevar nuestros productos a todo el país.",
  "quiénes somos": "Somos TechsStore, una tienda de tecnología con 10 años de experiencia. Fundada por Miguel Avella en Zipaquirá y expandida al mundo digital en 2026 por Jorge Avella. Nos especializamos en laptops, smartphones, audio y accesorios con calidad garantizada.",
  "who are we": "We are TechsStore, a technology store with 10 years of experience, founded by Miguel Avella in Zipaquirá, Colombia. Our online store launched in 2026 under Jorge Avella's leadership.",
  "ubicación": "Nuestra tienda física está ubicada en Zipaquirá, Prados del Mirador, Colombia. También puedes comprarnos en línea desde cualquier parte del país a través de nuestro ecommerce.",
  "location": "Our physical store is located in Zipaquirá, Prados del Mirador, Colombia. You can also shop online from anywhere in the country.",
  "fundador": "TechsStore fue fundada por Miguel Avella. El ecommerce virtual fue creado y es liderado por Jorge Avella desde inicios de 2026.",
  "ecommerce": "Nuestro ecommerce virtual fue lanzado a principios de 2026, aunque como tienda física llevamos más de 10 años ofreciendo tecnología de calidad en Zipaquirá, Colombia.",
  "valores": "En TechsStore nos guiamos por tres pilares: calidad en cada producto que ofrecemos, rapidez en la atención y entregas, y servicio personalizado para cada cliente.",

  //  Políticas 
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
      const body = await res.json() as any;
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
      const body    = await res.json() as any;
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
