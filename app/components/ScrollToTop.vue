<script setup lang="ts">
import { computed } from 'vue'
import { useWindowScroll } from '@vueuse/core'

const { y } = useWindowScroll()

const showButton = computed(() => y.value > 300)

const scrollToTop = () => {
	window.scrollTo({
		top: 0,
		behavior: 'smooth',
	})
}
</script>

<template>
	<Transition name="fade">
		<UButton
			v-if="showButton"
			icon="i-lucide-arrow-up-to-line"
			variant="subtle"
			color="neutral"
			class="rounded-full fixed bottom-4 right-4 z-50 size-12"
			@click="scrollToTop"
		/>
	</Transition>
</template>

<style scoped>
@reference '~/assets/css/main.css';
.fade-enter-active,
.fade-leave-active {
	transition:
		opacity 0.2s ease-in-out,
		bottom 0.2s ease-in-out;
	@apply bottom-4 opacity-100;
}

.fade-enter-from,
.fade-leave-to {
	@apply -bottom-12 opacity-0;
}
</style>
