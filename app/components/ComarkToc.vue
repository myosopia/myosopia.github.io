<script setup lang="ts">
import type { Toc } from '@comark/vue/plugins/toc'

defineProps<{
	toc: Toc
}>()
</script>
<template>
	<nav class="space-y-4">
		<slot name="title" :title="toc.title">
			<h2 class="text-sm font-semibold text-highlighted">
				{{ toc.title ?? '目录' }}
			</h2>
		</slot>
		<ComarkTocList v-if="toc.links.length" :links="toc.links" />
	</nav>
</template>
