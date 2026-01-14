<template>
	<UPage>
		<UPageHeader title="家計簿" class="p-4" />
		<UPageBody class="p-4">
			<UScrollArea orientation="horizontal">
				<UCheckbox
					v-for="column in table?.tableApi
						?.getAllColumns()
						.filter(column => column.getCanHide())"
					:key="column.id"
					:label="column.columnDef.header?.toString()"
					variant="card"
					indicator="hidden"
					color="neutral"
					:ui="{
						root: 'shrink-0 bg-muted opacity-50 has-data-[state=checked]:opacity-100 rounded-none border-none',
					}"
					:default-value="column.getIsVisible()"
					@update:model-value="
						value => {
							column.toggleVisibility(!!value)
						}
					"
				/>
			</UScrollArea>
			<UFieldGroup>
				<UButton
					icon="i-lucide-chevrons-left"
					variant="ghost"
					color="neutral"
					@click="
						() => {
							dateRange = {
								start: dateRange.start.subtract({ months: 1 }).set({ day: 1 }),
								end: dateRange.start.subtract({ months: 1 }).set({ day: 31 }),
							}
						}
					"
				/>
				<UInputDate
					v-model="dateRange"
					range
					@change="
						() => {
							refreshKakeiboData()
						}
					"
				/>
				<UButton
					icon="i-lucide-chevrons-right"
					variant="ghost"
					color="neutral"
					@click="
						() => {
							dateRange = {
								start: dateRange.end.add({ months: 1 }).set({ day: 1 }),
								end: dateRange.end.add({ months: 1 }).set({ day: 31 }),
							}
						}
					"
				/>
			</UFieldGroup>
			<UCheckboxGroup
				v-model="groupingColumns"
				orientation="horizontal"
				:items="[
					{
						label: '日付',
						value: 'date',
					},
					{
						label: 'カテゴリー',
						value: 'category',
					},
				]"
			/>
			<UTable
				ref="table"
				sticky
				:data="kakeiboData?.data ?? []"
				:columns="columns"
				:initial-state="{
					columnVisibility: {
						date: true,
						category: true,
						amount: true,
						currency: false,
						shop: true,
						note: false,
						actions: true,
					},
				}"
				:grouping-options="groupingOptions"
				:grouping="groupingColumns"
				class="flex-1 h-120"
			/>
			<UModal
				v-model:open="formModalOpen"
				:ui="{
					content: 'p-4',
				}"
			>
				<UButton
					icon="i-lucide-plus"
					size="lg"
					class="rounded-full fixed bottom-4 right-4 z-2000"
				/>
				<template #content>
					<UForm
						:schema="entrySchema"
						:state="entryState"
						class="space-y-4"
						@submit="submitEntry"
					>
						<UFormField name="date" label="日付">
							<UInputDate v-model="entryState.date" class="w-full" />
						</UFormField>
						<UFormField name="category" label="カテゴリー">
							<UDropdownMenu
								class="w-full"
								:items="categories"
								:content="{
									align: 'start',
								}"
							>
								<UButton variant="outline" :label="categoryLabel" />
							</UDropdownMenu>
						</UFormField>
						<UFormField name="amount" label="金額">
							<UInputNumber
								v-model="entryState.amount"
								class="w-full"
								:min="0"
							/>
						</UFormField>
						<UFormField name="shop" label="店舗">
							<UInputMenu
								v-model="entryState.shop"
								:items="shopItems"
								create-item
								class="w-full"
								@create="onCreateShopItem"
							/>
						</UFormField>
						<UFormField name="note" label="メモ">
							<UTextarea v-model="entryState.note" class="w-full" />
						</UFormField>
						<div class="flex justify-end">
							<UButton
								type="submit"
								:label="entryState.id === undefined ? '追加' : '修正'"
							/>
						</div>
					</UForm>
				</template>
			</UModal>
			<UForm
				:schema="categorySchema"
				:state="categoryState"
				class="space-y-4"
				@submit="submitCategory"
			>
				<UFormField name="label" label="カテゴリー名">
					<UInput v-model="categoryState.label" class="w-full" />
				</UFormField>
				<UFormField name="parent" label="親カテゴリー">
					<USelectMenu
						v-model="categoryState.parent"
						value-key="id"
						:items="categorySelectMenuItems"
						class="w-full"
					/>
				</UFormField>
				<UFormField name="order" label="表示順">
					<UInputNumber v-model="categoryState.order" :min="0" class="w-full" />
				</UFormField>
				<div class="flex justify-end">
					<UButton type="submit" label="カテゴリー追加" />
				</div>
			</UForm>
		</UPageBody>
	</UPage>
</template>
<script setup lang="ts">
import { z } from 'zod/v4'
import { h, resolveComponent } from 'vue'
import {
	CalendarDate,
	today,
	parseDate,
	getLocalTimeZone,
} from '@internationalized/date'
import type { DropdownMenuItem, FormSubmitEvent, TableColumn } from '@nuxt/ui'
import type { Row, GroupingOptions } from '@tanstack/vue-table'
import shops from '~/assets/json/kakeiboShops.json'
import { getGroupedRowModel } from '@tanstack/vue-table'

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const formModalOpen = ref(false)

const shopItems = ref(shops)
const onCreateShopItem = (item: string) => {
	shopItems.value.push(item)
	entryState.shop = item
}

const entrySchema = z.object({
	id: z.number().optional(),
	date: z.instanceof(CalendarDate),
	category: z.number().optional(),
	amount: z.number().min(0, '金額は0以上で入力してください'),
	currency: z.string(),
	shop: z.string().optional(),
	note: z.string().optional(),
})

type EntrySchema = z.output<typeof entrySchema>

const entryState = reactive<Partial<EntrySchema>>({
	date: today(getLocalTimeZone()),
	amount: 0,
	currency: 'JPY',
})

const categorySchema = z.object({
	id: z.number().optional(),
	label: z.string(),
	parent: z.number().optional(),
	order: z.number().optional(),
})
type CategorySchema = z.output<typeof categorySchema>
const categoryState = reactive<Partial<CategorySchema>>({})

const { data: categoryData, refresh: refreshCategoryData } = useAsyncData(
	async () => await supabase.from('kakeibo_categories').select('*').order('id'),
	{
		server: false,
	},
)
const categoryLabel = computed(() => {
	const category = (categoryData.value?.data || []).find(
		cat => cat.id === entryState.category,
	)
	return category ? category.label! : 'カテゴリーを選択'
})
const categories = computed(() => {
	const orderMaxValue = Number.MAX_SAFE_INTEGER
	const categoryMap = new Map<number, DropdownMenuItem>()
	const rootItems: DropdownMenuItem[] = [
		{
			label: '未分類',
			order: orderMaxValue,
			children: [],
			onSelect() {
				entryState.category = undefined
			},
		},
	]
	// First pass: create all items
	;(categoryData.value?.data || []).forEach(cat => {
		const item: DropdownMenuItem = {
			label: cat.label,
			order: cat.order ?? orderMaxValue,
			children: [
				{
					label: cat.label,
					order: 0,
					onSelect() {
						entryState.category = cat.id
					},
				},
			],
			onSelect() {
				entryState.category = cat.id
			},
		}
		categoryMap.set(cat.id, item)
	})
	// Second pass: organize hierarchy
	;(categoryData.value?.data || []).forEach(cat => {
		const item = categoryMap.get(cat.id)!
		if (cat.parent && categoryMap.has(cat.parent)) {
			;(categoryMap.get(cat.parent)!.children as DropdownMenuItem[]).push(item)
		} else {
			rootItems.push(item)
		}
	})
	categoryMap.forEach(item => {
		if (item.children) {
			if (item.children.length <= 1) {
				delete item.children
			} else {
				item.children.sort(
					(a: DropdownMenuItem, b: DropdownMenuItem) => a.order - b.order,
				)
			}
		}
	})
	rootItems.sort(
		(a: DropdownMenuItem, b: DropdownMenuItem) => a.order - b.order,
	)
	return rootItems
})
const categorySelectMenuItems = computed(() =>
	(categoryData.value?.data || []).map(cat => {
		return {
			label: cat.label,
			id: cat.id,
		}
	}),
)
const { data: kakeiboData, refresh: refreshKakeiboData } = useAsyncData(
	async () =>
		await supabase
			.from('kakeibo')
			.select('*')
			.gte('date', dateRange.value.start.toString())
			.lte('date', dateRange.value.end.toString())
			.order('date', { ascending: false }),
	{
		server: false,
	},
)

type Entry = {
	id: number
	date: string
	category: number | null
	amount: number
	currency: string
	shop: string | null
	note: string | null
}
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
function getRowItems(row: Row<Entry>): DropdownMenuItem[] {
	return [
		{
			label: '編集',
			onSelect: () => {
				entryState.id = row.original.id
				entryState.date = parseDate(row.original.date)
				entryState.amount = row.original.amount
				entryState.currency = row.original.currency
				entryState.category = row.original.category ?? undefined
				entryState.note = row.original.note ?? undefined
				entryState.shop = row.original.shop ?? undefined
				formModalOpen.value = true
			},
		},
		{
			label: '削除',
			onSelect: async () => {
				const { error } = await supabase
					.from('kakeibo')
					.delete()
					.eq('id', row.original.id)
				if (error) {
					console.error('エントリの削除に失敗しました:', error)
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
			},
		},
	]
}
const columns: TableColumn<Entry>[] = [
	{
		accessorKey: 'date',
		header: '日付',
	},
	{
		accessorKey: 'category',
		header: 'カテゴリー',
		cell({ row }) {
			return (
				categoryData.value?.data?.find(cat => cat.id === row.original.category)
					?.label ?? '未分類'
			)
		},
	},
	{
		accessorKey: 'amount',
		header: '金額',
		aggregationFn: 'sum',
		footer({ column }) {
			const total = column
				.getFacetedRowModel()
				.rows.reduce((sum, row) => sum + (row.original.amount || 0), 0)
			return total
		},
	},
	{
		accessorKey: 'currency',
		header: '通貨',
	},
	{
		accessorKey: 'shop',
		header: '店舗',
	},
	{
		accessorKey: 'note',
		header: 'メモ',
	},
	{
		id: 'actions',
		enableHiding: false,
		cell: ({ row }) => {
			return h(
				UDropdownMenu,
				{
					content: {
						align: 'end',
					},
					items: getRowItems(row),
				},
				() =>
					h(UButton, {
						icon: 'i-lucide-ellipsis-vertical',
						color: 'neutral',
						variant: 'ghost',
						'aria-label': 'Actions dropdown',
					}),
			)
		},
	},
]

const toast = useToast()

const submitEntry = async (event: FormSubmitEvent<EntrySchema>) => {
	event.preventDefault()
	const entryData = event.data
	if (!user.value) {
		alert('ログインが必要です。')
		return
	}
	const { error } = await supabase
		.from('kakeibo')
		.upsert({
			id: entryData.id,
			date: entryData.date.toString(),
			category: entryData.category,
			amount: entryData.amount,
			currency: entryData.currency,
			shop: entryData.shop,
			note: entryData.note,
		})
		.select()

	if (error) {
		console.error('エントリの追加に失敗しました:', error)
		alert('エントリの追加に失敗しました。')
	} else {
		toast.add({
			title: '成功',
			description: 'エントリが追加されました。',
			color: 'success',
		})
		formModalOpen.value = false
		// フォームをリセット
		entryState.date = today(getLocalTimeZone())
		entryState.amount = 0
		entryState.currency = 'JPY'
		entryState.category = undefined
		entryState.note = undefined
		entryState.shop = undefined
		entryState.id = undefined
		// データを再取得
		refreshKakeiboData()
	}
}

const submitCategory = async (event: FormSubmitEvent<CategorySchema>) => {
	event.preventDefault()
	const categoryData = event.data
	if (!user.value) {
		alert('ログインが必要です。')
		return
	}
	const { error } = await supabase
		.from('kakeibo_categories')
		.upsert({
			id: categoryData.id,
			label: categoryData.label,
			parent: categoryData.parent,
			order: categoryData.order,
		})
		.select()
	if (error) {
		console.error('カテゴリーの追加に失敗しました:', error)
		alert('カテゴリーの追加に失敗しました。')
	} else {
		toast.add({
			title: '成功',
			description: 'カテゴリーが追加されました。',
			color: 'success',
		})
		// フォームをリセット
		categoryState.label = undefined
		categoryState.parent = undefined
		categoryState.order = undefined
		// データを再取得
		refreshCategoryData()
	}
}

// Table
const table = useTemplateRef('table')
// Filter
// Date range
const dateRange = shallowRef({
	start: today(getLocalTimeZone()).set({ day: 1 }),
	end: today(getLocalTimeZone()),
})
// Grouping
const groupingOptions = ref<GroupingOptions>({
	groupedColumnMode: 'reorder',
	getGroupedRowModel: getGroupedRowModel(),
})
const groupingColumns = shallowRef<string[]>([])

onMounted(() => {
	refreshKakeiboData()
})
</script>
