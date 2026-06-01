import { defineStore } from 'pinia'
import type { RoutineStatus, RoutineData } from '~/types/routine'

export const useRoutineStore = defineStore(
	'routine',
	() => {
		const map = reactive<Record<string, RoutineData>>({})

		const getStatus = (routineId: string, index: number) => {
			const routine = map[routineId]
			if (routine) {
				return routine.status[index] ?? 'todo'
			} else {
				return 'todo'
			}
		}

		const setStatus = (
			routineId: string,
			index: number,
			value: RoutineStatus,
		) => {
			let routine = map[routineId]
			if (!routine) {
				routine = { status: [], resetAt: Date.now() }
				map[routineId] = routine
			}
			if (routine.status.length <= index) {
				routine.status.push(
					...Array(index + 1 - routine.status.length).fill('todo'),
				)
			}
			routine.status[index] = value
		}

		const reset = (id: string) => {
			Reflect.deleteProperty(map, id)
		}

		const getResetAt = (id: string) => {
			return map[id]?.resetAt ?? Date.now()
		}

		const getNextIndex = (
			routineId: string,
			currentIndex: number,
			max: number,
		) => {
			const routine = map[routineId]
			if (!routine) {
				return -1
			}
			const nextIndex = routine.status.findIndex(
				(value, index) => index > currentIndex && value !== 'disabled',
			)
			if (nextIndex >= 0) {
				return nextIndex
			}
			if (routine.status.length < max) {
				return routine.status.length
			}
			return -1
		}

		return { map, getStatus, setStatus, reset, getResetAt, getNextIndex }
	},
	{
		persist: {
			storage: piniaPluginPersistedstate.localStorage(),
		},
	},
)
