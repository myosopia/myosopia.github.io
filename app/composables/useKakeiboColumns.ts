import { h } from 'vue'
import type { Component, ConcreteComponent, ComputedRef } from 'vue'
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import type { Row, Column } from '@tanstack/vue-table'
import type { Entry, CategoryMapItem } from '~/types/kakeibo'

export const columnLabels: Record<string, string> = {
	date: '日付',
	category: 'カテゴリー',
	amount: '金額',
	shop: '店舗',
	note: 'メモ',
	currency: '通貨',
}

export function useKakeiboColumns(options: {
	categoryMap: ComputedRef<Map<number, CategoryMapItem>>
	amountInCurrency: (row: Row<Entry>) => number
	totalAmount: (column: Column<Entry>) => number
	getRowItems: (row: Row<Entry>) => DropdownMenuItem[]
	UButton: Component | ConcreteComponent | string
	UDropdownMenu: Component | ConcreteComponent | string
}) {
	const {
		categoryMap,
		amountInCurrency,
		totalAmount,
		getRowItems,
		UButton,
		UDropdownMenu,
	} = options

	const columns: TableColumn<Entry>[] = [
		{
			id: 'expand',
			cell({ row }) {
				if (row.getIsGrouped()) {
					return h('div', { class: 'flex items-center' }, [
						h('span', {
							class: 'inline-block',
							style: `width: calc(${row.depth} * 1rem);`,
						}),
						h(UButton, {
							icon: row.getIsExpanded() ? 'i-lucide-minus' : 'i-lucide-plus',
							variant: 'outline',
							color: 'neutral',
							size: 'xs',
							onClick: () => row.toggleExpanded(),
						}),
					])
				}
			},
		},
		{
			id: 'date',
			accessorKey: 'date',
			header({ column }) {
				const isSorted = column.getIsSorted()
				return h(UButton, {
					label: columnLabels[column.id],
					icon: isSorted
						? isSorted === 'asc'
							? 'i-lucide-arrow-up-narrow-wide'
							: 'i-lucide-arrow-down-wide-narrow'
						: 'i-lucide-arrow-up-down',
					variant: 'ghost',
					color: 'neutral',
					ui: { label: 'font-bold' },
					onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
				})
			},
		},
		{
			id: 'category',
			accessorKey: 'category',
			header: columnLabels['category'],
			cell({ row }) {
				if (row.original.category === null) return '未分類'
				if (row.getIsGrouped()) {
					let item = categoryMap.value.get(row.original.category)
					while (item?.parent) {
						item = categoryMap.value.get(item.parent)
					}
					return item?.label
				}
				return categoryMap.value.get(row.original.category)?.label ?? '未分類'
			},
			getGroupingValue(row) {
				if (row.category) {
					let item = categoryMap.value.get(row.category)
					while (item?.parent) {
						item = categoryMap.value.get(item.parent)
					}
					return item?.id
				}
				return row.category
			},
		},
		{
			id: 'amount',
			accessorKey: 'amount',
			header: columnLabels['amount'],
			cell({ row, column }) {
				if (row.getIsGrouped()) {
					const amount = row.getLeafRows().reduce((acc, currentValue) => {
						return acc + amountInCurrency(currentValue)
					}, 0)
					const total = totalAmount(column)
					return `${parseFloat(amount.toFixed(2))} (${parseFloat(((amount / total) * 100).toFixed(2))}%)`
				}
				return parseFloat(amountInCurrency(row).toFixed(2))
			},
			footer({ column }) {
				return parseFloat(totalAmount(column).toFixed(2))
			},
		},
		{
			id: 'currency',
			accessorKey: 'currency',
			header: columnLabels['currency'],
		},
		{
			id: 'shop',
			accessorKey: 'shop',
			header: columnLabels['shop'],
		},
		{
			id: 'note',
			accessorKey: 'note',
			header: columnLabels['note'],
		},
		{
			id: 'actions',
			enableHiding: false,
			cell: ({ row }) => {
				if (row.getIsGrouped()) return
				return h(
					UDropdownMenu,
					{ content: { align: 'end' }, items: getRowItems(row) },
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

	return { columns }
}
