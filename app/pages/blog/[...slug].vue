<template>
  <UPage>
    <UPageBody>
      <ContentRenderer
        v-if="post"
        :value="post"
        class="px-4 max-w-3xl mx-auto"
      />
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
const route = useRoute()
const { data: post } = await useAsyncData(route.path, () => {
  return queryCollection('blog').path(route.path).first()
})
</script>
