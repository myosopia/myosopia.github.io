<script setup lang="ts">
import type { TocLink } from '@comark/vue/plugins/toc'
import {
	useElementSize,
	useCurrentElement,
	useMutationObserver,
	useWindowScroll,
	useWindowSize,
} from '@vueuse/core'

const {
	itemKey,
	targetId,
	nextTargetId = '',
	depth,
	text,
} = defineProps<{
	itemKey: string
	targetId: TocLink['id']
	nextTargetId?: TocLink['id']
	depth: TocLink['depth']
	text: TocLink['text']
}>()

const emit = defineEmits<{
	metricsChange: [
		{
			height: number
			active: boolean
		},
	]
	unregister: [key: string]
}>()

const target = shallowRef<HTMLElement | null>(null)
const nextTarget = shallowRef<HTMLElement | null>(null)

let stopTargetObserver: (() => void) | undefined

const stopObservingTarget = () => {
	stopTargetObserver?.()
	stopTargetObserver = undefined
}

const hasResolvedTargets = () => {
	return !!target.value && (nextTargetId.length === 0 || !!nextTarget.value)
}

const resolveTargets = () => {
	if (targetId.length === 0) {
		target.value = null
		nextTarget.value = null
		stopObservingTarget()
		return
	}

	target.value = document.getElementById(targetId)
	nextTarget.value =
		nextTargetId.length > 0 ? document.getElementById(nextTargetId) : null

	if (hasResolvedTargets()) {
		stopObservingTarget()
	}
}

const startObservingTarget = () => {
	stopObservingTarget()
	resolveTargets()
	if (hasResolvedTargets() || targetId.length === 0) {
		return
	}

	const { stop } = useMutationObserver(
		document.body,
		() => {
			resolveTargets()
		},
		{
			childList: true,
			subtree: true,
		},
	)

	stopTargetObserver = stop
}

const href = computed(() => (targetId.length > 0 ? `#${targetId}` : undefined))
const el = useCurrentElement<HTMLElement>()
const { height } = useElementSize(el)
const { y } = useWindowScroll()
const { height: viewportHeight } = useWindowSize()

const active = computed(() => {
	if (!target.value) {
		return false
	}

	const viewportTop = y.value
	const viewportBottom = viewportTop + viewportHeight.value
	const sectionTop = target.value.getBoundingClientRect().top + viewportTop
	const sectionBottom = nextTarget.value
		? nextTarget.value.getBoundingClientRect().top + viewportTop
		: document.documentElement.scrollHeight

	return viewportBottom > sectionTop && viewportTop < sectionBottom
})

watch(
	[height, active],
	([nextHeight, nextActive]) => {
		emit('metricsChange', {
			height: nextHeight,
			active: nextActive,
		})
	},
	{ immediate: true },
)

onMounted(() => {
	startObservingTarget()
})

watch(
	() => [targetId, nextTargetId],
	() => {
		startObservingTarget()
	},
	{ flush: 'post' },
)

onBeforeUnmount(() => {
	stopObservingTarget()
	emit('unregister', itemKey)
})
</script>
<template>
	<component
		:is="targetId.length > 0 ? 'a' : 'span'"
		:href="href"
		:style="`--toc-link-depth: ${depth};`"
		class="block text-sm text-muted transition-colors py-1 pl-[calc(--spacing(4)*(var(--toc-link-depth)-1))]"
		:class="{
			'hover:text-highlighted': !!href,
		}"
	>
		{{ text }}
	</component>
</template>
