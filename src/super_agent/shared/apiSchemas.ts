import { z } from "zod";

export const ProductSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    priceFormatted: z.string().optional(),
    brand: z.string().optional(),
    attributes: z.array(z.any()).optional(),
    isActive: z.boolean().optional(),
  })
  .loose();

export const OrderSchema = z
  .object({
    orderNumber: z.string().optional(),
    status: z.string(),
    trackingNumber: z.string().nullable().optional(),
    createdAt: z.string().optional(),
  })
  .loose();

export const CategorySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable().optional(),
    children: z
      .array(z.object({ id: z.string(), name: z.string(), slug: z.string() }))
      .optional(),
  })
  .loose();

export const ProductsListEnvelope = z.object({
  data: z
    .object({ data: z.array(ProductSchema).optional(), total: z.number().optional() })
    .loose(),
});

export const OrdersListEnvelope = z.object({
  data: z
    .object({ data: z.array(OrderSchema).optional(), total: z.number().optional() })
    .loose(),
});

export const CategoriesEnvelope = z.object({
  data: z.array(CategorySchema).optional(),
});

export const ProductEnvelope = z.object({
  data: ProductSchema.nullable().optional(),
});

export function parseOrThrow<T>(schema: z.ZodType<T>, payload: unknown, context: string): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    console.error(`[schema:${context}]`, z.flattenError(result.error));
    throw new Error(`Respuesta inesperada del API (${context})`);
  }
  return result.data;
}
