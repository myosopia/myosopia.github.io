import type { Ref } from 'vue'
import type { Row, Column } from '@tanstack/vue-table'
import type { Entry } from '~/types/kakeibo'

type ExchangeRateMap = Record<string, Record<string, Record<string, number>>>

export function useKakeiboExchangeRates(
	kakeiboData: Ref<Entry[] | null | undefined>,
) {
	const currency = ref<string>('')
	const exchangeRates = ref<ExchangeRateMap>({})

	const handleCurrencyChange = async () => {
		const dates = kakeiboData.value?.map(row => row.date)
		const currencies = kakeiboData.value?.map(row => row.currency.toLowerCase())
		if (!exchangeRates.value) {
			exchangeRates.value = {}
		}
		dates?.forEach(async date => {
			for (const cur of currencies ?? []) {
				if (!exchangeRates.value[date] || !exchangeRates.value[date][cur]) {
					const endpoint = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/${cur}.json`
					const data = (await $fetch(endpoint)) as Record<
						string,
						string | Record<string, string>
					>
					if (!exchangeRates.value[date]) {
						exchangeRates.value[date] = {}
					}
					exchangeRates.value[date][cur.toUpperCase()] = data[
						cur
					] as unknown as Record<string, number>
				}
			}
		})
	}

	const amountInCurrency = (row: Row<Entry>): number => {
		const rate =
			(exchangeRates.value &&
			exchangeRates.value[row.original.date] &&
			exchangeRates.value[row.original.date]![row.original.currency]
				? exchangeRates.value[row.original.date]![row.original.currency]![
						currency.value
					]
				: 1) ?? 1
		return row.original.amount * rate
	}

	const totalAmount = (column: Column<Entry>): number => {
		return column.getFacetedRowModel().rows.reduce((acc, currentValue) => {
			const rate =
				(exchangeRates.value &&
				exchangeRates.value[currentValue.original.date] &&
				exchangeRates.value[currentValue.original.date]![
					currentValue.original.currency
				]
					? exchangeRates.value[currentValue.original.date]![
							currentValue.original.currency
						]![currency.value]
					: 1) ?? 1
			return acc + currentValue.original.amount * rate
		}, 0)
	}

	return {
		currency,
		exchangeRates,
		handleCurrencyChange,
		amountInCurrency,
		totalAmount,
	}
}
