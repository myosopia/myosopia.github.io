<script setup lang="ts">
type Point = [number, number]
type Range = {
	start: number
	end: number
}
type TrackMetric = {
	point: Point
	length: number
}

const ZERO_POINT: Point = [0, 0]
const DEPTH_STEP = 16

const {
	height,
	segments,
	duration = 250,
} = defineProps<{
	height: number
	segments: {
		top: number
		bottom: number
		depth: number
		active: boolean
	}[]
	duration?: number
}>()

const pointsToString = (points: Point[]) => {
	return points.map(p => p.join(',')).join(' ')
}

const distanceBetweenPoints = (from: Point, to: Point) => {
	return Math.hypot(to[0] - from[0], to[1] - from[1])
}

const interpolatePoint = (from: Point, to: Point, progress: number): Point => {
	return [
		from[0] + (to[0] - from[0]) * progress,
		from[1] + (to[1] - from[1]) * progress,
	]
}

const trackPoints = computed(() => {
	const ps: Point[] = []
	segments.forEach(seg => {
		ps.push([seg.depth * DEPTH_STEP, seg.top])
		ps.push([seg.depth * DEPTH_STEP, seg.bottom])
	})
	return ps
})

const pointsString = computed(() => {
	return pointsToString(trackPoints.value)
})

const trackMetrics = computed<TrackMetric[]>(() => {
	let totalLength = 0
	return trackPoints.value.map((point, index) => {
		const previousPoint = trackPoints.value[index - 1]
		if (index > 0) {
			totalLength += distanceBetweenPoints(previousPoint ?? point, point)
		}
		return {
			point,
			length: totalLength,
		}
	})
})

const totalTrackLength = computed(() => trackMetrics.value.at(-1)?.length ?? 0)

const segmentRanges = computed(() => {
	let previousPoint: Point = trackPoints.value[0] ?? [0, 0]
	let cursor = 0
	return segments.map(seg => {
		const topPoint: Point = [seg.depth * DEPTH_STEP, seg.top]
		const bottomPoint: Point = [seg.depth * DEPTH_STEP, seg.bottom]
		cursor += distanceBetweenPoints(previousPoint, topPoint)
		const start = cursor
		cursor += distanceBetweenPoints(topPoint, bottomPoint)
		const end = cursor
		previousPoint = bottomPoint
		return {
			start,
			end,
			active: seg.active,
		}
	})
})

const activeRange = computed<Range | null>(() => {
	const activeSegments = segmentRanges.value.filter(seg => seg.active)
	if (activeSegments.length === 0) {
		return null
	}
	return {
		start: Math.min(...activeSegments.map(seg => seg.start)),
		end: Math.max(...activeSegments.map(seg => seg.end)),
	}
})

const width = computed(() => {
	return Math.max(4, ...trackPoints.value.map(([x]) => x))
})

const displayedActiveRange = ref<Range | null>(
	activeRange.value ? { ...activeRange.value } : null,
)

const easeOutCubic = (value: number) => 1 - (1 - value) ** 3

let animationFrame = 0

const stopAnimation = () => {
	if (animationFrame) {
		cancelAnimationFrame(animationFrame)
		animationFrame = 0
	}
}

const animateActiveRange = (nextRange: Range | null) => {
	stopAnimation()
	if (!nextRange) {
		displayedActiveRange.value = null
		return
	}
	const fromRange = displayedActiveRange.value ?? nextRange
	if (fromRange.start === nextRange.start && fromRange.end === nextRange.end) {
		displayedActiveRange.value = { ...nextRange }
		return
	}
	const start = performance.now()
	const frame = (now: number) => {
		const progress = Math.min((now - start) / duration, 1)
		const easedProgress = easeOutCubic(progress)
		displayedActiveRange.value = {
			start:
				fromRange.start + (nextRange.start - fromRange.start) * easedProgress,
			end: fromRange.end + (nextRange.end - fromRange.end) * easedProgress,
		}
		if (progress < 1) {
			animationFrame = requestAnimationFrame(frame)
			return
		}
		animationFrame = 0
		displayedActiveRange.value = { ...nextRange }
	}
	animationFrame = requestAnimationFrame(frame)
}

const pointAtLength = (length: number): Point => {
	const clampedLength = Math.min(Math.max(length, 0), totalTrackLength.value)
	if (trackMetrics.value.length === 0) {
		return ZERO_POINT
	}
	for (let index = 1; index < trackMetrics.value.length; index += 1) {
		const current = trackMetrics.value[index]
		const previous = trackMetrics.value[index - 1]
		if (!current || !previous) {
			continue
		}
		if (clampedLength <= current.length) {
			const segmentLength = current.length - previous.length
			if (segmentLength === 0) {
				return [current.point[0], current.point[1]]
			}
			return interpolatePoint(
				previous.point,
				current.point,
				(clampedLength - previous.length) / segmentLength,
			)
		}
	}
	const lastPoint = trackMetrics.value.at(-1)?.point ?? ZERO_POINT
	return [lastPoint[0], lastPoint[1]]
}

const polylinePointsForRange = (range: Range): Point[] => {
	const start = Math.min(range.start, range.end)
	const end = Math.max(range.start, range.end)
	if (end <= start) {
		return [pointAtLength(start)]
	}
	const points: Point[] = [pointAtLength(start)]
	for (let index = 1; index < trackMetrics.value.length - 1; index += 1) {
		const vertex = trackMetrics.value[index]
		if (!vertex) {
			continue
		}
		if (vertex.length > start && vertex.length < end) {
			points.push(vertex.point)
		}
	}
	points.push(pointAtLength(end))
	return points
}

const activePointsString = computed(() => {
	if (!displayedActiveRange.value) {
		return ''
	}
	return pointsToString(polylinePointsForRange(displayedActiveRange.value))
})

watch(activeRange, animateActiveRange)

onBeforeUnmount(() => {
	stopAnimation()
})
</script>
<template>
	<svg
		:viewBox="`-4 0 ${width * 2} ${height}`"
		xmlns="http://www.w3.org/2000/svg"
		:style="`width: ${width * 2}px;`"
	>
		<polyline
			:points="pointsString"
			fill="none"
			class="stroke-(--ui-border-muted) stroke-2"
		/>
		<polyline
			:points="activePointsString"
			fill="none"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="stroke-primary stroke-2"
		/>
	</svg>
</template>
