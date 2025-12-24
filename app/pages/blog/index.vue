<template>
  <div>
    <h1>Blog</h1>
    <ul>
      <li
        v-for="post in posts"
        :key="post.id"
      >
        <NuxtLink :to="post.path">{{ post.title }}</NuxtLink>
      </li>
    </ul>
    <div v-if="user">
      <p>Logged in as: {{ user.email }}</p>
      <h2>Private Posts</h2>
      <ul>
        <li
          v-for="post in privatePosts"
          :key="post.id"
        >
          <NuxtLink :to="`/blog/private/${post.slug}`">
            {{ post.title }}
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: posts } = await useAsyncData('blog', () => queryCollection('blog').all())
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const { data: privatePosts } = useAsyncData('private-posts', async () => {
  if (user.value) {
    const { data, error } = await supabase
      .from('posts')
      .select('id,title,slug')
    if (error) {
      console.error('Error fetching private posts:', error)
      return []
    }
    return data
  }
  else {
    return []
  }
})
</script>
