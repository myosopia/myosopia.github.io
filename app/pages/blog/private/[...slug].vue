<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core'

const { y, directions } = useWindowScroll()
const store = useAppStore()

watch(directions, ({ top, bottom }) => {
	if (top) {
		store.showHeader = true
	}
	if (bottom && y.value > 300) {
		store.showHeader = false
	}
})

const route = useRoute()
const slug =
	typeof route.params.slug === 'string'
		? route.params.slug
		: (route.params.slug ?? []).join('/')
const supabase = useSupabaseClient()
const { data: post } = await useAsyncData(
	`post-${slug}`,
	async () => {
		const { data, error } = await supabase
			.from('posts')
			.select('*')
			.eq('slug', slug)
			.single()
		if (error) return null
		return data
	},
	{
		server: false,
	},
)
if (import.meta.client && !post.value) {
	throw createError({ statusCode: 404, statusMessage: 'Post not found' })
}

useHead({
	title: post.value?.title ?? 'Loading',
})

const modalOpen = ref(false)
const state = reactive({
	slug: slug,
	title: post.value?.title ?? '',
	content: post.value?.content ?? '',
})

const toast = useToast()
const updatePost = async () => {
	const { error } = await supabase
		.from('posts')
		.update({
			title: state.title,
			content: state.content,
			updated_at: Temporal.Now.zonedDateTimeISO().toString({
				timeZoneName: 'never',
			}),
		})
		.eq('slug', slug)
	if (error) {
		toast.add({
			title: 'Error',
			description: 'Failed to update post',
			color: 'error',
		})
	} else {
		toast.add({
			title: 'Success',
			description: 'Post updated successfully',
			color: 'success',
		})
	}
	refreshNuxtData(`post-${slug}`)
	modalOpen.value = false
}
</script>

<template>
	<UPage>
		<UPageBody>
			<UContainer v-if="post" class="space-y-4 sm:space-y-6 lg:space-y-8">
				<div class="flex items-end justify-between">
					<div class="flex flex-col text-muted text-sm">
						<span v-if="post?.created_at">
							创建于
							<DateTime :value="post.created_at" />
						</span>
						<span v-if="post?.updated_at">
							更新于
							<DateTime :value="post.updated_at" />
						</span>
					</div>
					<PrivatePostModal
						v-model="state"
						v-model:open="modalOpen"
						:slug-disabled="true"
						title="更新文章"
						@submit="updatePost"
					>
						<UButton label="编辑" icon="i-lucide-square-pen" variant="ghost" />
					</PrivatePostModal>
				</div>
				<Suspense>
					<Comark v-if="post" :markdown="post.content ?? ''" />
				</Suspense>
			</UContainer>
			<ScrollToTop />
		</UPageBody>
	</UPage>
</template>
