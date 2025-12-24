<script setup lang="ts">
const route = useRoute()
const supabase = useSupabaseClient()
const postContent = ref('')
const { data: post } = await useAsyncData(
  `posts`,
  async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', route.params.slug)
      .single()
    if (error) throw error
    postContent.value = data.content
    return data
  },
)
const updatePost = async () => {
  const { error } = await supabase
    .from('posts')
    .update({ content: postContent.value })
    .eq('slug', route.params.slug)
  if (error) {
    console.error('Error updating post:', error)
  }
}
</script>

<template>
  <div>
    <div v-html="post.content" />
    <div>
      <UTextarea v-model="postContent" />
      <UButton @click="updatePost">
        Update Post
      </UButton>
    </div>
  </div>
</template>
