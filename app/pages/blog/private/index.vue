<template>
	<UPage>
		<UPageBody>
			<UPageHeader
				:title="$t('page.blog.privatePosts')"
				description="Limited to logged in users"
			>
				<template #links>
					<PrivatePostModal
						v-model="privatePostFormState"
						v-model:open="privatePostModalOpen"
						title="创建新文章"
						@submit="createPost"
					>
						<UButton
							label="创建"
							variant="outline"
							icon="i-lucide-file-plus-corner"
						/>
					</PrivatePostModal>
				</template>
			</UPageHeader>
			<UContainer>
				<ul class="space-y-2">
					<li v-for="(post, index) in privatePosts" :key="index">
						<ULink
							:to="`/blog/private/${post.slug}`"
							class="flex justify-between items-center"
						>
							<span>{{ post.title ?? 'No Title' }}</span>
							<DateTime
								:value="post.updated_at ?? post.created_at"
								:format="{
									dateStyle: 'long',
								}"
							/>
						</ULink>
					</li>
				</ul>
			</UContainer>
		</UPageBody>
	</UPage>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const { data: privatePosts, refresh: refreshPrivatePosts } = useAsyncData(
	'private-posts',
	async () => {
		if (user.value) {
			const { data, error, success } = await supabase
				.from('posts')
				.select('title,slug,created_at,updated_at')
				.order('updated_at', {
					ascending: false,
				})
			if (error) {
				console.error('Error fetching private posts:', error)
			}
			if (success) {
				return data
			}
		}
		return []
	},
	{ server: false, watch: [user] },
)
const privatePostModalOpen = ref(false)
const privatePostFormState = reactive({
	title: '',
	content: '',
	slug: '',
})

const createPost = () => {
	supabase
		.from('posts')
		.insert(privatePostFormState)
		.then(res => {
			if (res.success) {
				refreshPrivatePosts()
				privatePostModalOpen.value = false
				privatePostFormState.title = ''
				privatePostFormState.slug = ''
				privatePostFormState.content = ''
			}
		})
}
</script>
