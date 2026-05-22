<template>
	<UPage>
		<UPageHeader title="家計簿" />
		<UPageBody>
			<UContainer>
				<div
					class="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4"
				>
					<!-- 日付範囲 -->
					<UFieldGroup class="overflow-x-auto">
						<UButton
							icon="i-lucide-chevrons-left"
							variant="ghost"
							color="neutral"
							size="sm"
							@click="
								() => {
									dateRange = {
										start: dateRange.start
											.subtract({ months: 1 })
											.set({ day: 1 }),
										end: dateRange.start
											.subtract({ months: 1 })
											.set({ day: 31 }),
									}
								}
							"
						/>
						<UInputDate
							ref="inputDateRange"
							v-model="dateRange"
							:locale="locale"
							range
							size="sm"
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
							size="sm"
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

					<div class="flex items-center gap-2">
						<!-- グループ化 -->
						<UPopover>
							<UButton
								icon="i-lucide-group"
								:variant="groupingColumns.length > 0 ? 'soft' : 'ghost'"
								color="neutral"
								size="sm"
								label="グループ化"
							/>
							<template #content>
								<div class="p-3 flex flex-col gap-2">
									<UCheckboxGroup
										v-model="groupingColumns"
										:items="[
											{ label: '日付', value: 'date' },
											{ label: 'カテゴリー', value: 'category' },
										]"
										@change="
											() => {
												const visible = groupingColumns.length > 0
												table?.tableApi
													.getColumn('expand')
													?.toggleVisibility(visible)
											}
										"
									/>
								</div>
							</template>
						</UPopover>

						<!-- 列の表示 -->
						<UPopover>
							<UButton
								icon="i-lucide-columns-3"
								variant="ghost"
								color="neutral"
								size="sm"
								label="列の表示"
							/>
							<template #content>
								<div class="p-3 flex flex-col gap-2 min-w-32">
									<span class="text-xs text-muted">表示する列</span>
									<UCheckbox
										v-for="column in table?.tableApi
											?.getAllColumns()
											.filter(
												column =>
													column.getCanHide() && columnLabels[column.id],
											)"
										:key="column.id"
										:label="columnLabels[column.id]"
										color="neutral"
										:default-value="column.getIsVisible()"
										@update:model-value="
											value => column.toggleVisibility(!!value)
										"
									/>
								</div>
							</template>
						</UPopover>

						<!-- 通貨 -->
						<USelect
							v-model="currency"
							class="w-28"
							size="sm"
							placeholder="通貨"
							icon="i-lucide-coins"
							:items="[
								{ label: 'JPY', value: 'jpy' },
								{ label: 'CNY', value: 'cny' },
								{ label: 'USD', value: 'usd' },
							]"
							@update:model-value="handleCurrencyChange"
						/>
					</div>
				</div>
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
			<KakeiboEntryModal
				ref="entryModal"
				v-model:open="formModalOpen"
				v-model:entry-state="entryState"
				v-model:entry-date="entryDate"
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
				@submit="submitEntry"
				@reset="initializeEntryState"
				@open-category-modal="categoryFormModalOpen = true"
			/>
			<KakeiboAddCategoryModal
				v-model:open="categoryFormModalOpen"
				v-model:category-state="categoryState"
				:category-select-menu-items="categorySelectMenuItems"
				@submit="submitCategory"
			/>
			<UModal
				v-model:open="deleteConfirmOpen"
				:ui="{ content: 'p-4 max-w-sm' }"
			>
				<template #content>
					<div class="space-y-4">
						<p class="font-medium">このエントリを削除しますか？</p>
						<p class="text-sm text-muted">この操作は元に戻せません。</p>
						<div class="flex justify-end gap-2">
							<UButton
								label="キャンセル"
								color="neutral"
								variant="ghost"
								@click="deleteConfirmOpen = false"
							/>
							<UButton label="削除" color="error" @click="onConfirmDelete" />
						</div>
					</div>
				</template>
			</UModal>
		</UPageBody>
	</UPage>
</template>
<script setup lang="ts">
import { resolveComponent } from 'vue'
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
const deleteConfirmOpen = ref(false)
const pendingDeleteId = ref<number | null>(null)

const confirmDelete = (id: number) => {
	pendingDeleteId.value = id
	deleteConfirmOpen.value = true
}
const onConfirmDelete = () => {
	if (pendingDeleteId.value !== null) deleteEntry(pendingDeleteId.value)
	deleteConfirmOpen.value = false
	pendingDeleteId.value = null
}

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
const { entryState, entryDate, initializeEntryState, shopItems, submitEntry } =
	useKakeiboEntryForm({
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
			color: 'error' as const,
			onSelect: () => confirmDelete(row.original.id),
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
