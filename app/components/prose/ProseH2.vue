<script setup lang="ts">
import H2 from '@nuxt/ui/components/prose/H2.vue'
</script>
<template>
	<H2
		:ui="{
			leading: 'top-1/2 -translate-y-1/2',
		}"
		class="prose-h2 flex flex-col gap-4 ps-4 py-4"
		><slot
	/></H2>
</template>
<style lang="css" scoped>
@reference '~/assets/css/main.css';
.prose-h2 {
	&::before {
		content: '⊹';
		@apply absolute inline-block text-primary text-base font-bold lg:text-lg top-0 left-0 leading-none;
	}
	&:hover::before {
		@apply animate-ping;
	}
}
</style>
