<template>
  <ContentRenderer
    v-if="post"
    :value="post"
  />
</template>

<script setup lang="ts">
const route = useRoute()
const { data: post } = await useAsyncData(route.path, () => {
  return queryCollection('blog').path(route.path).first()
})
</script>
