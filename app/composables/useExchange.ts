export const useExchange = () => {
	const state = {
		from: '',
		to: '',
		date: 'latest',
	}
	const exchangeMap = new Map<string, Map<string, Record<string, number>>>()
	const self = {
		on: (date: string) => {
			state.date = date
			return self
		},
		from: (symbol: string) => {
			state.from = symbol.toLowerCase()
			return self
		},
		to: (symbol: string) => {
			state.to = symbol.toLowerCase()
			return self
		},
		calculate: async (amount: number) => {
			if (!exchangeMap.has(state.date)) {
				exchangeMap.set(state.date, new Map())
			}
			const m = exchangeMap.get(state.date)!
			if (!m.has(state.from)) {
				const endpoint = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${state.date}/v1/currencies/${state.from}.json`
				const data: {
					date: string
				} & Record<string, Record<string, number>> = await $fetch(endpoint)
				m.set(state.from, data[state.from]!)
			}
			const rates = m.get(state.from)!
			if (state.to in rates) {
				const rate = rates[state.to]!
				return rate * amount
			} else {
				return undefined
			}
		},
	}
	return self
}
