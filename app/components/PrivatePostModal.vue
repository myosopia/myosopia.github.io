<script setup lang="ts">
import * as z from 'zod/v4'
const schema = z.object({
	title: z.string(),
	slug: z.string(),
	content: z.string(),
})
type Schema = z.output<typeof schema>
const state = defineModel<Partial<Schema>>({
	required: true,
})
const open = defineModel<boolean>('open', {
	required: false,
})
defineProps<{
	title?: string
	slugDisabled?: boolean
}>()
const emit = defineEmits<{
	submit: []
}>()
const formRef = useTemplateRef('form')
</script>

<template>
	<UModal v-model:open="open" :title="title">
		<slot />
		<template #header="{ close }">
			<UButton
				icon="i-lucide-x"
				variant="ghost"
				color="neutral"
				@click="close"
			/>
			<span class="font-bold">{{ title }}</span>
			<UButton
				label="提交"
				icon="i-lucide-send-horizontal"
				class="ml-auto"
				@click="
					() => {
						formRef?.submit()
					}
				"
			/>
		</template>
		<template #body>
			<UForm
				ref="form"
				:state="state"
				:schema="schema"
				class="space-y-4"
				@submit="emit('submit')"
			>
				<UFormField label="标题">
					<UInput v-model="state.title" class="w-full" />
				</UFormField>
				<UFormField label="Slug">
					<UInput
						v-model="state.slug"
						class="w-full"
						:disabled="slugDisabled"
					/>
				</UFormField>
				<UFormField label="正文">
					<UTextarea v-model="state.content" class="w-full" />
				</UFormField>
			</UForm>
		</template>
	</UModal>
</template>
