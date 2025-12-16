import * as z from 'zod'

export const listingSchema = z.object({
    title: z.string().min(5, 'Mínimo 5 caracteres').max(80, 'Máximo 80 caracteres'),
    description: z.string().min(20, 'Describe un poco mejor el producto').max(1200, 'Descripción demasiado larga'),
    price: z.preprocess(
        (val) => Number(val),
        z.number().min(0, 'El precio no puede ser negativo')
    ),
    category: z.string().min(1, 'Selecciona una categoría'),
    brand: z.string().optional(),
    size: z.string().optional(),
    condition: z.string().optional(),
})

export type ListingSchemaType = z.infer<typeof listingSchema>

// Add format helper for price to cents
export const toCents = (price: number) => Math.round(price * 100)
