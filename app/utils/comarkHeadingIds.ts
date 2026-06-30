import type { ComarkElement, ComarkElementAttributes, ComarkNode } from 'comark'
import { defineComarkPlugin } from 'comark'

type HeadingState = {
	level: number
	id: string
}

const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
const COMBINING_MARKS_RE = /[\u0300-\u036f]/g
const INVALID_SLUG_CHARS_RE = /[^\p{Letter}\p{Number}_-]+/gu
const DUPLICATE_DASH_RE = /-{2,}/g
const BROKEN_GENERATED_ID_RE = /^-+(?:\d+)?$/u

const isElement = (node: ComarkNode): node is ComarkElement =>
	Array.isArray(node) && typeof node[0] === 'string'

const getChildren = (node: ComarkElement): ComarkNode[] =>
	node.slice(2) as ComarkNode[]

const flattenNodeText = (node: ComarkNode): string => {
	if (typeof node === 'string') {
		return node
	}

	if (!isElement(node)) {
		return ''
	}

	return getChildren(node)
		.map(child => flattenNodeText(child))
		.join('')
}

const slugifyHeadingText = (text: string): string => {
	let slug = text
		.normalize('NFKD')
		.replace(COMBINING_MARKS_RE, '')
		.toLowerCase()
		.trim()
		.replace(/\s+/g, '-')
		.replace(INVALID_SLUG_CHARS_RE, '')
		.replace(DUPLICATE_DASH_RE, '-')
		.replace(/^-+|-+$/g, '')

	if (slug.length === 0) {
		slug = 'section'
	}

	if (/^\d/u.test(slug)) {
		slug = `_${slug}`
	}

	return slug
}

const buildUniqueHeadingId = (
	baseId: string,
	level: number,
	headingStack: HeadingState[],
	headingIdCounts: Map<string, number>,
): string => {
	while (
		headingStack.length > 0 &&
		headingStack[headingStack.length - 1]!.level >= level
	) {
		headingStack.pop()
	}

	let candidateId = baseId
	const parentHeading = headingStack.at(-1)
	if (parentHeading && parentHeading.level >= 2) {
		candidateId = `${parentHeading.id}-${candidateId}`
	}

	const duplicateCount = headingIdCounts.get(candidateId) ?? 0
	headingIdCounts.set(candidateId, duplicateCount + 1)

	const uniqueId =
		duplicateCount === 0 ? candidateId : `${candidateId}-${duplicateCount}`

	headingStack.push({ level, id: uniqueId })
	return uniqueId
}

const reserveHeadingId = (
	id: string,
	level: number,
	headingStack: HeadingState[],
	headingIdCounts: Map<string, number>,
) => {
	while (
		headingStack.length > 0 &&
		headingStack[headingStack.length - 1]!.level >= level
	) {
		headingStack.pop()
	}

	headingIdCounts.set(id, (headingIdCounts.get(id) ?? 0) + 1)
	headingStack.push({ level, id })
}

const visitNodes = (
	nodes: ComarkNode[],
	headingStack: HeadingState[],
	headingIdCounts: Map<string, number>,
) => {
	nodes.forEach(node => {
		if (!isElement(node)) {
			return
		}

		const [tag, rawAttrs, ...children] = node
		const attrs = (rawAttrs ?? {}) as ComarkElementAttributes

		if (HEADING_TAGS.has(tag)) {
			const level = Number.parseInt(tag.slice(1), 10)
			const currentId =
				typeof attrs.id === 'string' && attrs.id.length > 0 ? attrs.id : null
			const preferredId = slugifyHeadingText(
				children.map(child => flattenNodeText(child)).join(''),
			)
			const shouldRegenerateId =
				currentId === null || BROKEN_GENERATED_ID_RE.test(currentId)

			if (currentId && !shouldRegenerateId) {
				reserveHeadingId(currentId, level, headingStack, headingIdCounts)
			} else {
				attrs.id = buildUniqueHeadingId(
					preferredId,
					level,
					headingStack,
					headingIdCounts,
				)
			}
		}

		visitNodes(children, headingStack, headingIdCounts)
	})
}

export default defineComarkPlugin(() => ({
	name: 'ensure-heading-ids',
	post(state) {
		visitNodes(state.tree.nodes, [], new Map())
	},
}))
