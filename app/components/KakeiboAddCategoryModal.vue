<template>
	<UModal v-model:open="open" :ui="{ content: 'p-4' }">
		<template #content>
			<UForm
				:schema="categorySchema"
				:state="categoryState"
				class="space-y-4"
				@submit="event => emit('submit', event)"
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
		</template>
	</UModal>
</template>
<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { categorySchema, type CategorySchema } from '~/types/kakeibo'

defineProps<{
	categorySelectMenuItems: { label: string; id: number }[]
}>()

const emit = defineEmits<{
	submit: [event: FormSubmitEvent<CategorySchema>]
}>()

const open = defineModel<boolean>('open', { required: true })
const categoryState = defineModel<Partial<CategorySchema>>('categoryState', {
	required: true,
})
</script>
