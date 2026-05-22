<template>
	<UPage>
		<UPageHeader title="家計簿" />
		<UPageBody>
			<UContainer>
				<UScrollArea orientation="horizontal">
					<UCheckbox
						v-for="column in table?.tableApi
							?.getAllColumns()
							.filter(column => column.getCanHide() && columnLabels[column.id])"
						:key="column.id"
						:label="columnLabels[column.id]"
						variant="card"
						indicator="hidden"
						color="neutral"
						:ui="{
							root: 'shrink-0 bg-muted opacity-50 has-data-[state=checked]:opacity-100 rounded-none border-none',
						}"
						:default-value="column.getIsVisible()"
						@update:model-value="value => column.toggleVisibility(!!value)"
					/>
				</UScrollArea>
			</UContainer>
			<UContainer>
				<UFieldGroup>
					<UButton
						icon="i-lucide-chevrons-left"
						variant="ghost"
						color="neutral"
						@click="
							() => {
								dateRange = {
									start: dateRange.start
										.subtract({ months: 1 })
										.set({ day: 1 }),
									end: dateRange.start.subtract({ months: 1 }).set({ day: 31 }),
								}
							}
						"
					/>
					<UInputDate
						ref="inputDateRange"
						v-model="dateRange"
						:locale="locale"
						range
					>
						<template #trailing>
							<UPopover :reference="inputDateRange?.inputsRef[0]?.$el">
								<UButton
									color="neutral"
									variant="link"
									size="sm"
									icon="i-lucide-calendar"
									aria-label="Select a date range"
									class="px-0"
								/>
								<template #content>
									<UCalendar
										v-model="dateRange"
										range
										:locale="locale"
										variant="soft"
										class="p-2"
									/>
								</template>
							</UPopover>
						</template>
					</UInputDate>
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
			</UContainer>
			<UContainer>
				<UFormField
					orientation="horizontal"
					label="グループ化"
					:ui="{ root: 'justify-start items-center gap-4' }"
				>
					<UCheckboxGroup
						v-model="groupingColumns"
						orientation="horizontal"
						:items="[
							{ label: '日付', value: 'date' },
							{ label: 'カテゴリー', value: 'category' },
						]"
						@change="
							() => {
								const visible = groupingColumns.length > 0
								table?.tableApi.getColumn('expand')?.toggleVisibility(visible)
							}
						"
					/>
				</UFormField>
			</UContainer>
			<UContainer>
				<UTable
					ref="table"
					sticky
					:data="kakeiboData ?? []"
					:columns="columns"
					:initial-state="{
						columnVisibility: {
							expand: false,
							date: true,
							category: true,
							amount: true,
							currency: false,
							shop: true,
							note: false,
							actions: true,
						},
						columnPinning: { left: ['expand'] },
						sorting: [{ id: 'date', desc: true }],
					}"
					:grouping-options="groupingOptions"
					:grouping="groupingColumns"
					class="flex-1 max-h-[calc(100vh-var(--ui-header-height))]"
					:ui="{
						root: 'min-w-full',
						td: 'empty:p-0',
					}"
				/>
			</UContainer>
			<UContainer>
				<UFormField label="通貨">
					<USelect
						v-model="currency"
						:items="[
							{ label: 'JPY', value: 'jpy' },
							{ label: 'CNY', value: 'cny' },
							{ label: 'USD', value: 'usd' },
						]"
						@update:model-value="handleCurrencyChange"
					/>
				</UFormField>
			</UContainer>
			<KakeiboEntryModal
				ref="entryModal"
				v-model:open="formModalOpen"
				v-model:entry-state="entryState"
				:entry-date="entryDate"
				:categories="categories"
				:category-label="getCategoryLabel(entryState.category)"
				:shop-items="shopItems"
				:is-edit="entryState.id !== undefined"
				@update:open="
					value => {
						if (!value && entryState.id !== undefined) {
							initializeEntryState()
							entryState.date = new Date()
						}
					}
				"
				@update-entry-date="value => (entryDate = value as CalendarDate)"
				@submit="submitEntry"
				@reset="initializeEntryState"
				@create-shop="onCreateShopItem"
				@open-category-modal="categoryFormModalOpen = true"
			/>
			<KakeiboAddCategoryModal
				v-model:open="categoryFormModalOpen"
				v-model:category-state="categoryState"
				:category-select-menu-items="categorySelectMenuItems"
				@submit="submitCategory"
			/>
		</UPageBody>
	</UPage>
</template>
<script setup lang="ts">
import { resolveComponent } from 'vue'
import type { CalendarDate } from '@internationalized/date'
import type { DropdownMenuItem } from '@nuxt/ui'
import type { GroupingOptions, Row } from '@tanstack/vue-table'
import { getGroupedRowModel } from '@tanstack/vue-table'
import type { Entry } from '~/types/kakeibo'
import {
	columnLabels,
	useKakeiboColumns,
} from '~/composables/useKakeiboColumns'

definePageMeta({ title: '家計簿' })

const { locale } = useI18n()

// Template refs
const inputDateRange = useTemplateRef('inputDateRange')
const table = useTemplateRef('table')
const entryModal = useTemplateRef('entryModal')

// Modal states
const formModalOpen = ref(false)
const categoryFormModalOpen = ref(false)

// Data layer
const {
	dateRange,
	kakeiboData,
	refreshKakeiboData,
	categoryData,
	deleteEntry,
	categoryState,
	submitCategory,
} = useKakeiboData({
	onCategorySuccess: () => {
		categoryFormModalOpen.value = false
	},
})

// Entry form
const {
	entryState,
	entryDate,
	initializeEntryState,
	shopItems,
	onCreateShopItem,
	submitEntry,
} = useKakeiboEntryForm({
	onSuccess: () => {
		formModalOpen.value = false
		refreshKakeiboData()
	},
})

// Category tree
const { categoryMap, categories, categorySelectMenuItems, getCategoryLabel } =
	useKakeiboCategories(categoryData, id => {
		entryState.category = id
	})

// Exchange rates & currency conversion
const { currency, handleCurrencyChange, amountInCurrency, totalAmount } =
	useKakeiboExchangeRates(kakeiboData)

// Row action menu
function getRowItems(row: Row<Entry>): DropdownMenuItem[] {
	return [
		{
			label: '編集',
			onSelect: () => {
				entryState.id = row.original.id
				entryState.date = new Date(row.original.date)
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
			onSelect: () => deleteEntry(row.original.id),
		},
	]
}

// Table columns
const { columns } = useKakeiboColumns({
	categoryMap,
	amountInCurrency,
	totalAmount,
	getRowItems,
	UButton: resolveComponent('UButton'),
	UDropdownMenu: resolveComponent('UDropdownMenu'),
})

// Grouping
const groupingOptions = ref<GroupingOptions>({
	groupedColumnMode: 'reorder',
	getGroupedRowModel: getGroupedRowModel(),
})
const groupingColumns = shallowRef<string[]>([])

// Keyboard shortcuts
defineShortcuts({
	enter: () => entryModal.value?.submit(),
	meta_a: () => {
		formModalOpen.value = true
	},
})
</script>
