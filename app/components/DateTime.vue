<template>
	<ClientOnly
		><time :datetime="value">{{ formattedString }}</time></ClientOnly
	>
</template>
<script setup lang="ts">
const {
	value,
	format = {
		dateStyle: 'medium',
		timeStyle: 'short',
	},
} = defineProps<{
	value: string
	format?: Intl.DateTimeFormatOptions
}>()
const { locale } = useI18n()
const formattedString = computed(() =>
	formatDateTime(value, locale.value, format),
)
</script>
