import * as z from 'zod/v4'

export type Entry = {
	id: number
	date: string
	category: number | null
	amount: number
	currency: string
	shop: string | null
	note: string | null
}

export type CategoryMapItem = {
	id: number
	label: string
	order: number | null
	parent: number | null
	children: CategoryMapItem[]
}

export const categorySchema = z.object({
	id: z.number().optional(),
	label: z.string(),
	parent: z.number().optional(),
	order: z.number().optional(),
})
export type CategorySchema = z.output<typeof categorySchema>
