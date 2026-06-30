<script setup lang="ts">
import type { TocLink } from '@comark/vue/plugins/toc'
import ComarkTocLink from './ComarkTocLink.vue'
import { useElementSize } from '@vueuse/core'

const { links } = defineProps<{
	links: TocLink[]
}>()

type FlattenedTocLink = Omit<TocLink, 'children'> & {
	key: string
}

const linksFlattened = computed<FlattenedTocLink[]>(() => {
	const result: FlattenedTocLink[] = []
	const stack: TocLink[] = links.toReversed()
	let index = 0
	let link: TocLink | undefined = undefined
	while (true) {
		link = stack.pop()
		if (link) {
			result.push({
				key: `${link.id}-${index}`,
				text: link.text,
				depth: link.depth,
				id: link.id,
			})
			index += 1
			if (link.children?.length) {
				stack.push(...link.children.toReversed())
			}
		} else {
			break
		}
	}
	return result
})

type TocLinkMetrics = {
	height: number
	active: boolean
}

const linkMetrics = shallowReactive<Record<string, TocLinkMetrics | undefined>>(
	{},
)

const updateLinkMetrics = (key: string, metrics: TocLinkMetrics) => {
	linkMetrics[key] = metrics
}

const removeLinkMetrics = (key: string) => {
	linkMetrics[key] = undefined
}

const listRef = useTemplateRef('list')
const { height } = useElementSize(listRef)

const segments = computed(() => {
	const gap = 8
	const segmentList: {
		top: number
		bottom: number
		depth: number
		active: boolean
	}[] = []
	let y = gap / 2
	linksFlattened.value.forEach(link => {
		const metrics = linkMetrics[link.key]
		const linkHeight = metrics?.height ?? 0
		segmentList.push({
			top: y,
			bottom: y + linkHeight,
			depth: link.depth - 2,
			active: metrics?.active ?? false,
		})
		y += linkHeight + gap
	})
	return segmentList
})
</script>

<template>
	<div class="relative">
		<ComarkTocIndicator
			:height="height"
			:segments="segments"
			class="absolute left-1"
		/>
		<div ref="list" class="flex flex-col">
			<ComarkTocLink
				v-for="(link, index) in linksFlattened"
				:key="link.key"
				:item-key="link.key"
				:target-id="link.id"
				:next-target-id="linksFlattened[index + 1]?.id"
				:text="link.text"
				:depth="link.depth"
				@metrics-change="updateLinkMetrics(link.key, $event)"
				@unregister="removeLinkMetrics"
			/>
		</div>
	</div>
</template>
