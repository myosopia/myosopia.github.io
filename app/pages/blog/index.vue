<template>
  <UPage class="px-4">
    <UPageHeader :title="$t('blog')" />
    <UPageBody>
      <UBlogPosts>
        <UBlogPost
          v-for="(post, index) in posts"
          :key="index"
          v-bind="post"
          :to="post.path"
        >
          <template #description>
            <div v-if="post.description">
              {{ post.description }}
            </div>
            <div
              v-if="post.tags"
              class="text-sm mt-2"
            >
              {{ post.tags?.map(tag => `#${tag}`).join(' ') }}
            </div>
          </template>
        </UBlogPost>
      </UBlogPosts>
      <div v-if="user">
        <UPageSection
          :title="$t('privatePosts')"
          description="Limited to logged in users"
        />
        <UBlogPosts>
          <UBlogPost
            v-for="(post, index) in privatePosts"
            :key="index"
            :title="post.title??'No Title'"
            :date="new Date(post.created_at)"
            :to="`/blog/private/${post.slug}`"
          />
        </UBlogPosts>
      </div>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Blog',
})

const { data: posts } = await useAsyncData('blog', () => queryCollection('blog').all())
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const { data: privatePosts, refresh } = useAsyncData(
  'private-posts',
  async () => {
    if (user.value) {
      const { data, error } = await supabase
        .from('posts')
        .select('title,slug,created_at')
      if (error) {
        console.error('Error fetching private posts:', error)
        return []
      }
      return data
    }
    return []
  },
  { server: false },
)

onMounted(() => {
  refresh()
})
</script>
