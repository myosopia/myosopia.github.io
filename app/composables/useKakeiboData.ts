import { today, getLocalTimeZone } from '@internationalized/date'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Entry, CategorySchema } from '~/types/kakeibo'
import { categorySchema } from '~/types/kakeibo'

export function useKakeiboData(options?: { onCategorySuccess?: () => void }) {
	const supabase = useSupabaseClient()
	const user = useSupabaseUser()
	const toast = useToast()

	const dateRange = shallowRef({
		start: today(getLocalTimeZone()).set({ day: 1 }),
		end: today(getLocalTimeZone()),
	})

	const { data: categoryData, refresh: refreshCategoryData } = useAsyncData(
		'kakeibo-cateogries',
		async () =>
			await supabase.from('kakeibo_categories').select('*').order('id'),
		{
			server: false,
			transform: res => res.data,
		},
	)

	const { data: kakeiboData, refresh: refreshKakeiboData } = useAsyncData(
		'kakeibo',
		async () =>
			await supabase
				.from('kakeibo')
				.select('*')
				.gte('date', dateRange.value.start.toString())
				.lte('date', dateRange.value.end.toString())
				.order('date', { ascending: false }),
		{
			server: false,
			transform: res => res.data as Entry[],
			watch: [user, dateRange],
		},
	)

	const deleteEntry = async (id: number) => {
		const { error } = await supabase.from('kakeibo').delete().eq('id', id)
		if (error) {
			toast.add({
				title: 'エラー',
				description: 'エントリの削除に失敗しました。',
				color: 'error',
			})
		} else {
			toast.add({
				title: '成功',
				description: 'エントリが削除されました。',
				color: 'success',
			})
			refreshKakeiboData()
		}
	}

	const categoryState = reactive<Partial<CategorySchema>>({})

	const submitCategory = async (event: FormSubmitEvent<CategorySchema>) => {
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
		const { error } = await supabase
			.from('kakeibo_categories')
			.upsert({
				id: data.id,
				label: data.label,
				parent: data.parent,
				order: data.order,
			})
			.select()
		if (error) {
			toast.add({
				title: 'エラー',
				description: 'カテゴリーの追加に失敗しました。',
				color: 'error',
			})
		} else {
			toast.add({
				title: '成功',
				description: 'カテゴリーが追加されました。',
				color: 'success',
			})
			categoryState.label = undefined
			categoryState.parent = undefined
			categoryState.order = undefined
			refreshCategoryData()
			options?.onCategorySuccess?.()
		}
	}

	return {
		dateRange,
		kakeiboData,
		refreshKakeiboData,
		categoryData,
		refreshCategoryData,
		deleteEntry,
		categoryState,
		categorySchema,
		submitCategory,
	}
}
