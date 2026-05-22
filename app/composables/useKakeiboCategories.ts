import type { ComputedRef, Ref } from 'vue'
import type { DropdownMenuItem } from '@nuxt/ui'
import type { CategoryMapItem } from '~/types/kakeibo'

type RawCategory = {
	id: number
	label: string | null
	order: number | null
	parent: number | null
}

export function useKakeiboCategories(
	categoryData: Ref<RawCategory[] | null | undefined>,
	onSelectCategory: (id: number | undefined) => void,
) {
	const categoryMap: ComputedRef<Map<number, CategoryMapItem>> = computed(() => {
		const m = new Map<number, CategoryMapItem>()
		categoryData.value?.forEach(cat => {
			m.set(cat.id, { ...cat, label: cat.label ?? '', children: [] })
		})
		m.forEach(item => {
			if (item.parent && m.has(item.parent)) {
				m.get(item.parent)?.children.push(item)
			}
		})
		return m
	})

	const categories: ComputedRef<DropdownMenuItem[]> = computed(() => {
		const orderMaxValue = Number.MAX_SAFE_INTEGER
		const rootItems: DropdownMenuItem[] = [
			{
				label: '未分類',
				order: orderMaxValue,
				children: [],
				onSelect() {
					onSelectCategory(undefined)
				},
			},
		]
		const buildCategoryItem = (cat: CategoryMapItem): DropdownMenuItem => ({
			label: cat.label,
			order: cat.order ?? orderMaxValue,
			onSelect() {
				if (cat.children.length < 1) {
					onSelectCategory(cat.id)
				}
			},
			...(cat.children.length > 0 && {
				children: [
					{
						label: cat.label,
						order: orderMaxValue,
						onSelect() {
							onSelectCategory(cat.id)
						},
					},
					...cat.children.map(buildCategoryItem),
				].toSorted(
					(a: DropdownMenuItem, b: DropdownMenuItem) => a.order - b.order,
				),
			}),
		})
		categoryMap.value.forEach(cat => {
			if (!cat.parent) {
				rootItems.push(buildCategoryItem(cat))
			}
		})
		rootItems.sort(
			(a: DropdownMenuItem, b: DropdownMenuItem) => a.order - b.order,
		)
		return rootItems
	})

	const categorySelectMenuItems = computed(() =>
		(categoryData.value ?? []).map(cat => ({
			label: cat.label ?? '',
			id: cat.id,
		})),
	)

	const getCategoryLabel = (id: number | undefined): string => {
		const category = (categoryData.value ?? []).find(cat => cat.id === id)
		return category?.label ?? 'カテゴリーを選択'
	}

	return { categoryMap, categories, categorySelectMenuItems, getCategoryLabel }
}
