<template>
	<UModal
		v-model:open="open"
		:ui="{ content: 'p-4' }"
		@update:open="
			value => {
				if (!value && isEdit) emit('reset')
			}
		"
	>
		<UButton
			icon="i-lucide-plus"
			size="lg"
			class="rounded-full p-3 fixed bottom-4 right-4 z-2000"
		>
			<UContextMenu
				:items="[
					{
						label: 'カテゴリーを追加',
						onSelect() {
							emit('open-category-modal')
						},
					},
				]"
			>
				<div class="absolute inset-0" />
			</UContextMenu>
		</UButton>
		<template #content>
			<UForm
				ref="formRef"
				:schema="entrySchema"
				:state="entryState"
				class="space-y-4 overflow-y-auto max-h-[calc(100dvh-8rem)]"
				@submit="event => emit('submit', event)"
			>
				<div class="flex justify-between">
					<UFormField
						name="date"
						label="日付"
						:ui="{
							root: 'justify-start',
							labelWrapper: 'hidden',
							container: 'mt-0',
						}"
					>
						<UInputDate
							ref="inputDateRef"
							:model-value="entryDate"
							:locale="locale"
							variant="outline"
							class="ps-6.5 pe-10.5"
							@update:model-value="onDateInput"
						>
							<template #leading>
								<UButton
									icon="i-lucide-chevron-left"
									color="neutral"
									variant="link"
									size="sm"
									aria-label="前の日"
									class="px-0"
									tabindex="-1"
									@click="entryDate = entryDate.subtract({ days: 1 })"
								/>
							</template>
							<template #trailing>
								<UButton
									icon="i-lucide-chevron-right"
									color="neutral"
									variant="link"
									size="sm"
									aria-label="次の日"
									class="px-0"
									tabindex="-1"
									@click="entryDate = entryDate.add({ days: 1 })"
								/>
								<UPopover
									v-model:open="entryDateCalendarOpen"
									:reference="inputDateRef?.inputsRef[3]?.$el"
								>
									<UButton
										color="neutral"
										variant="link"
										size="sm"
										icon="i-lucide-calendar"
										aria-label="Select a date"
										class="px-0"
									/>
									<template #content>
										<UCalendar
											v-model="entryDate"
											variant="soft"
											:locale="locale"
											class="p-2"
											@update:model-value="onCalendarSelect"
										/>
									</template>
								</UPopover>
							</template>
						</UInputDate>
					</UFormField>
					<UButton
						icon="i-lucide-send"
						type="submit"
						:label="isEdit ? '修正' : '追加'"
						class="justify-center"
					/>
				</div>
				<UFormField name="amount" label="金額" :ui="{ labelWrapper: 'hidden' }">
					<UFieldGroup class="flex">
						<UInputNumber
							v-model="entryState.amount"
							:min="0"
							class="flex-1"
							:step="entryState.currency === 'JPY' ? 1 : 0.01"
							:increment="false"
							:decrement="false"
							:format-options="{
								style: 'currency',
								currency: entryState.currency,
								currencyDisplay: 'symbol',
								currencySign: 'accounting',
							}"
							variant="underline"
							color="primary"
							size="xl"
							autofocus
							:ui="{ base: 'text-3xl font-bold' }"
							@focus="onFocusInput"
						/>
						<USelect
							v-model="entryState.currency"
							default-value="JPY"
							variant="ghost"
							:items="['JPY', 'CNY', 'USD']"
							:ui="{ base: 'ring-0' }"
							tabindex="-1"
						/>
					</UFieldGroup>
				</UFormField>
				<UFormField name="category" label="カテゴリー">
					<UDropdownMenu
						class="w-full"
						:items="categories"
						:content="{
							align: 'start',
						}"
						:ui="{
							content:
								'max-h-(--reka-dropdown-menu-content-available-height) overflow-y-auto',
						}"
					>
						<UButton
							variant="outline"
							color="neutral"
							:label="categoryLabel"
							class="justify-start"
						/>
					</UDropdownMenu>
				</UFormField>
				<UFormField name="shop" label="店舗">
					<UInput
						ref="shopInput"
						v-model.trim="entryState.shop"
						class="w-full"
						:ui="{
							trailing: 'pe-0',
						}"
						@focus="onFocusInput"
					>
						<template #trailing>
							<UPopover
								:reference="shopInputRef?.inputRef!"
								:ui="{
									content: 'w-(--reka-popper-anchor-width) ring-0 rounded-none',
								}"
							>
								<UButton
									icon="i-lucide-chevron-down"
									variant="link"
									color="neutral"
								/>
								<template #content="{ close }">
									<UListbox :items="shopItems" @update:model-value="close" />
								</template>
							</UPopover>
						</template>
					</UInput>
				</UFormField>
				<UFormField name="note" label="メモ">
					<UTextarea v-model="entryState.note" class="w-full" />
				</UFormField>
				<div class="flex gap-4">
					<UButton
						label="リセット"
						color="neutral"
						variant="subtle"
						@click="emit('reset')"
					/>
					<UButton
						type="submit"
						:label="isEdit ? '修正' : '追加'"
						class="flex-1 justify-center"
					/>
				</div>
			</UForm>
		</template>
	</UModal>
</template>
<script setup lang="ts">
import { CalendarDate, type DateValue } from '@internationalized/date'
import type { DropdownMenuItem, FormSubmitEvent, ListboxItem } from '@nuxt/ui'
import type { DateRange } from 'reka-ui'
import type { EntrySchema } from '~/composables/useKakeiboEntryForm'
import { entrySchema } from '~/composables/useKakeiboEntryForm'

defineProps<{
	categories: DropdownMenuItem[]
	categoryLabel: string
	shopItems: ListboxItem[]
	isEdit: boolean
}>()

const emit = defineEmits<{
	(e: 'submit', event: FormSubmitEvent<EntrySchema>): void
	(e: 'reset' | 'open-category-modal'): void
}>()

const open = defineModel<boolean>('open', { required: true })
const entryState = defineModel<Partial<EntrySchema>>('entryState', {
	required: true,
})
const entryDate = defineModel<CalendarDate>('entryDate', { required: true })

const { locale } = useI18n()
const entryDateCalendarOpen = shallowRef(false)
const inputDateRef = useTemplateRef('inputDateRef')
const formRef = useTemplateRef('formRef')
const shopInputRef = useTemplateRef('shopInput')

const onDateInput = (value?: DateValue | DateRange | DateValue[] | null) => {
	if (value instanceof CalendarDate) entryDate.value = value
}
const onCalendarSelect = (
	value?: DateValue | DateRange | DateValue[] | null,
) => {
	if (value instanceof CalendarDate) entryDate.value = value
	entryDateCalendarOpen.value = false
}

const onFocusInput = (e: FocusEvent) => {
	if (!e.target) return
	;(e.target as HTMLInputElement).select()
}

defineExpose({
	submit: () => formRef.value?.submit(),
})
</script>
