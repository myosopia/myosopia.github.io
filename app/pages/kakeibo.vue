<template>
	<div>
		<h1>家計簿</h1>
		<UPageBody class="p-4">
			<UTable
				:data="kakeiboData?.data ?? []"
				:columns="columns"
				class="flex-1 h-40"
			/>
			<UForm
				:schema="entrySchema"
				:state="entryState"
				class="space-y-4"
				@submit="submitEntry"
			>
				<UFormField name="date" label="日付">
					<UInputDate v-model="entryState.date" />
				</UFormField>
				<UFormField name="category" label="カテゴリー">
					<UDropdownMenu :items="categories">
						<UButton variant="outline" :label="categoryLabel" />
					</UDropdownMenu>
				</UFormField>
				<UFormField name="amount" label="金額">
					<UInputNumber v-model="entryState.amount" :min="0" />
				</UFormField>
				<UFormField name="shop" label="店舗">
					<UInputMenu
						v-model="entryState.shop"
						:items="shopItems"
						create-item
						@create="onCreateShopItem"
					/>
				</UFormField>
				<UFormField name="note" label="メモ">
					<UTextarea v-model="entryState.note" />
				</UFormField>
				<UButton
					type="submit"
					:label="entryState.id === undefined ? '追加' : '修正'"
				/>
			</UForm>
		</UPageBody>
	</div>
</template>
<script setup lang="ts">
import { z } from 'zod/v4'
import { h, resolveComponent } from 'vue'
import {
	type CalendarDate,
	today,
	parseDate,
	getLocalTimeZone,
} from '@internationalized/date'
import type {
	DropdownMenuItem,
	FormSubmitEvent,
	InputMenuItem,
	TableColumn,
} from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import shops from '~/assets/json/kakeiboShops.json'

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const shopItems = ref(shops)
const onCreateShopItem = (item: string) => {
	shopItems.value.push(item)
	entryState.shop = item
}

const entrySchema = z.object({
	id: z.number().optional(),
	date: z.custom<Omit<CalendarDate, '#private' | 'hour' | 'minute'>>(),
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
const categories = computed(() =>
	(categoryData.value?.data || []).map(cat => {
		return {
			label: cat.label,
			onSelect() {
				entryState.category = cat.id
			},
		} as DropdownMenuItem
	}),
)

const { data: kakeiboData, refresh: refreshKakeiboData } = useAsyncData(
	async () =>
		await supabase
			.from('kakeibo')
			.select('*')
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
	const { data, error } = await supabase
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
</script>
