/** A single image entry inside the `gallery` array. */
export interface GalleryImage {
	type: string
	src: string
	comment?: string
}

/** Thumbnail object used in the attributes. */
export interface Thumbnail {
	src: string
}

/** Attributes belonging to an `illustration-gallery` resource. */
export interface IllustrationGalleryAttributes {
	gallery: GalleryImage[]
	isEnable: boolean
	memberOnly: ('yearly' | 'monthly')[] // e.g. ["yearly","monthly"]
	releasedAt: number // timestamp (ms since epoch)
	sealedAt?: number // timestamp or null (optional)
	slug: string
	thumbnail?: Thumbnail
	title: string
}

/** Top-level resource item in `data` array. */
export interface IllustrationGalleryItem {
	id: string
	type: string
	attributes: IllustrationGalleryAttributes
}

/** Common paging/metadata block. */
export interface ApiMeta {
	count?: number
}

/** Common links object returned by the API. */
export interface ApiLinks {
	self: string
	first?: string
	prev?: string
	next?: string
	last?: string
}

/** Full response envelope from the illustration-gallery endpoint. */
export interface IllustrationGalleryResponse {
	status: number
	data: IllustrationGalleryItem[]
	meta?: ApiMeta
	links?: ApiLinks
	included?: unknown
}

export default defineEventHandler(async () => {
	const upstream = 'https://otomatefc.jp/api/content/illustration-gallery'
	const { status, data } = await $fetch<IllustrationGalleryResponse>(upstream)
	if (status !== 200) {
		throw createError({
			statusCode: status,
			statusMessage: 'Failed to fetch gallery data',
		})
	}
	const entries = data.map(item => {
		return {
			title: item.attributes.title,
			images: item.attributes.gallery.map(img => img.src),
		}
	})
	return entries
})
