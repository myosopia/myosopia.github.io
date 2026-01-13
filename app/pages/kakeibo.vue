<template>
	<div>
		<h1>家計簿</h1>
		<UForm
			:schema="entrySchema"
			:state="entryState"
			class="space-y-4"
			@submit="submitEntry"
		>
			<UFormField name="date" label="日付">
				<UInputDate v-model="entryState.date" />
			</UFormField>
			<UFormField name="amount" label="金額">
				<UInputNumber v-model="entryState.amount" :min="0" />
			</UFormField>
			<UFormField name="note" label="メモ">
				<UTextarea v-model="entryState.note" />
			</UFormField>
			<UButton type="submit">追加</UButton>
		</UForm>
	</div>
</template>
<script setup lang="ts">
import { z } from 'zod/v4'
import type { FormSubmitEvent } from '@nuxt/ui'
import {
	type CalendarDate,
	today,
	getLocalTimeZone,
} from '@internationalized/date'

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const entrySchema = z.object({
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

const toast = useToast()

const submitEntry = async (event: FormSubmitEvent<EntrySchema>) => {
	event.preventDefault()
	const entryData = event.data
	if (!user.value) {
		alert('ログインが必要です。')
		return
	}
	const { data, error } = await supabase.from('kakeibo').insert([
		{
			date: entryData.date.toString(),
			category: entryData.category,
			amount: entryData.amount,
			currency: entryData.currency,
			note: entryData.note,
		},
	])

	if (error) {
		console.error('エントリの追加に失敗しました:', error)
		alert('エントリの追加に失敗しました。')
	} else {
		alert('エントリが追加されました。')
		// フォームをリセット
		entryState.date = today(getLocalTimeZone())
		entryState.amount = 0
		entryState.currency = 'JPY'
		entryState.category = undefined
		entryState.note = undefined
	}
}
</script>
