<template>
	<div>
		<h1>家計簿</h1>
		<UForm
			:schema="entrySchema"
			:state="entryState"
			class="space-y-4"
			@submit="submitEntry"
		>
			<UButton type="submit">追加</UButton>
		</UForm>
	</div>
</template>
<script setup lang="ts">
import { z } from 'zod/v4'
import type { FormSubmitEvent } from '@nuxt/ui'

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const entrySchema = z.object({
	date: z.iso.date(),
	category: z.number().optional(),
	amount: z.number().min(0, '金額は0以上で入力してください'),
	currency: z.string(),
	note: z.string().optional(),
})

type EntrySchema = z.output<typeof entrySchema>

const entryState = reactive<Partial<EntrySchema>>({
	date: new Date().toISOString().substring(0, 10),
	amount: 0,
	currency: 'JPY',
})

const submitEntry = async (event: FormSubmitEvent<EntrySchema>) => {
	event.preventDefault()
	const entryData = event.data

	if (!user.value) {
		alert('ログインが必要です。')
		return
	}

	const { data, error } = await supabase.from('kakeibo').insert([
		{
			user_id: user.value.id,
			date: entryData.date,
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
		entryState.date = new Date().toISOString().substring(0, 10)
		entryState.amount = 0
		entryState.currency = 'JPY'
		entryState.category = undefined
		entryState.note = undefined
	}
}
</script>
