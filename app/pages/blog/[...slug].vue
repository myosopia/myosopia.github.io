<template>
	<UPage>
		<UPageBody class="relative">
			<UContainer class="relative">
				<UContextMenu :items="contextMenuItems" :disabled="!post?.dictionary">
					<ContentRenderer v-if="post" :value="post" />
					<UDrawer
						v-model:open="dictionaryDrawerRightOpen"
						direction="right"
						class="w-96"
					>
						<template #content>
							<div class="p-4 grow">
								<DictionaryLookup v-model="dictionaryQuery" />
							</div>
						</template>
					</UDrawer>
					<UDrawer
						v-model:open="dictionaryDrawerBottomOpen"
						direction="bottom"
						class="h-1/2 min-h-120"
					>
						<template #content>
							<div class="p-4 grow">
								<DictionaryLookup v-model="dictionaryQuery" />
							</div>
						</template>
					</UDrawer>
				</UContextMenu>
				<div v-if="toc" class="absolute h-full right-4 top-1">
					<TocModal :toc="toc" />
				</div>
			</UContainer>
		</UPageBody>
		<ScrollToTop />
		<template #right>
			<UPageAside v-if="toc" class="relative">
				<ComarkToc :toc="toc" />
			</UPageAside>
		</template>
	</UPage>
</template>

<script setup lang="ts">
import type { ContextMenuItem } from '@nuxt/ui'
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'

const breakpoints = useBreakpoints(breakpointsTailwind)
const route = useRoute()
const { data: post } = await useAsyncData(route.path, () => {
	return queryCollection('blog').path(route.path).first()
})
const toc = computed(() => post.value?.body?.toc)
const dictionaryDrawerRightOpen = ref(false)
const dictionaryDrawerBottomOpen = ref(false)
const contextMenuItems = ref<ContextMenuItem[]>([
	{
		label: 'Dictionary Lookup',
		icon: 'i-lucide-book-open',
		onSelect: () => {
			dictionaryQuery.value = window.getSelection()?.toString() || ''
			if (breakpoints.active().value === '') {
				dictionaryDrawerBottomOpen.value = true
			} else {
				dictionaryDrawerRightOpen.value = true
			}
		},
	},
])
const dictionaryQuery = ref('')
</script>
