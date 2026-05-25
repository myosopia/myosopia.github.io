import * as z from 'zod/v4'
import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date'
import type { FormSubmitEvent, ListboxItem } from '@nuxt/ui'
import shops from '~/assets/json/kakeiboShops.json'

export const entrySchema = z.object({
	id: z.number().optional(),
	date: z.date(),
	category: z.number().optional(),
	amount: z.number().min(0, '金額は0以上で入力してください'),
	currency: z.string(),
	shop: z.string().optional(),
	note: z.string().optional(),
})
export type EntrySchema = z.output<typeof entrySchema>

export function useKakeiboEntryForm(options: { onSuccess: () => void }) {
	const { onSuccess } = options

	const supabase = useSupabaseClient()
	const user = useSupabaseUser()
	const toast = useToast()

	const entryState = reactive<Partial<EntrySchema>>({
		date: new Date(),
		amount: undefined,
		currency: 'JPY',
	})

	const entryDate = computed({
		get() {
			if (!entryState.date) return today(getLocalTimeZone())
			return new CalendarDate(
				entryState.date.getFullYear(),
				entryState.date.getMonth() + 1,
				entryState.date.getDate(),
			)
		},
		set(value: CalendarDate) {
			entryState.date = value.toDate(getLocalTimeZone())
		},
	})

	const initializeEntryState = () => {
		entryState.id = undefined
		entryState.amount = undefined
		entryState.currency = 'JPY'
		entryState.category = undefined
		entryState.note = undefined
		entryState.shop = undefined
	}

	const shopItems: ListboxItem[] = shops.map(shop => ({
		label: shop,
		onSelect() {
			entryState.shop = shop
		},
	}))

	const submitEntry = async (event: FormSubmitEvent<EntrySchema>) => {
		event.preventDefault()
		const data = event.data
		if (!user.value) {
			toast.add({
				title: 'エラー',
				description: 'ログインが必要です。',
				color: 'error',
			})
			return
		}
		const row = {
			id: data.id,
			date: `${data.date.getFullYear()}-${String(data.date.getMonth() + 1).padStart(2, '0')}-${String(data.date.getDate()).padStart(2, '0')}`,
			category: data.category,
			amount: data.amount,
			currency: data.currency,
			shop: data.shop,
			note: data.note,
		}
		const { error } = await supabase.from('kakeibo').upsert(row).select()
		if (error) {
			toast.add({
				title: 'エラー',
				description: 'エントリの追加に失敗しました。',
				color: 'error',
			})
		} else {
			toast.add({
				title: '成功',
				description: 'エントリが追加されました。',
				color: 'success',
				duration: 300,
			})
			initializeEntryState()
			onSuccess()
		}
	}

	return {
		entryState,
		entryDate,
		entrySchema,
		initializeEntryState,
		shopItems,
		submitEntry,
	}
}
