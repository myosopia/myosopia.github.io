<template>
	<UModal title="目录">
		<UButton
			icon="i-lucide-table-of-contents"
			label="目录"
			color="neutral"
			variant="outline"
			class="sticky lg:hidden z-50 transition-[top] duration-400"
			:class="{
				'top-(--ui-header-height)': store.showHeader,
				'top-4': !store.showHeader,
			}"
		/>
		<template #body>
			<ClientOnly>
				<ComarkTocList :links="toc.links" />
			</ClientOnly>
		</template>
	</UModal>
</template>
<script setup lang="ts">
import type { Toc } from '@comark/vue/plugins/toc'
defineProps<{
	toc: Toc
}>()
const store = useAppStore()
</script>
