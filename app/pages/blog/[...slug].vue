<template>
  <UPage>
    <UPageBody>
      <UContextMenu :items="contextMenuItems">
        <ContentRenderer
          v-if="post"
          :value="post"
          class="px-4 max-w-3xl mx-auto"
        />
        <UDrawer
          v-model:open="dictionaryOpen"
          direction="right"
          class="w-64 sm:w-96"
        >
          <template #content>
            <div class="p-4 grow">
              <DictionaryLookup v-model="dictionaryQuery" />
            </div>
          </template>
        </UDrawer>
      </UContextMenu>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import type { ContextMenuItem } from '@nuxt/ui'

const route = useRoute()
const { data: post } = await useAsyncData(route.path, () => {
  return queryCollection('blog').path(route.path).first()
})
const dictionaryOpen = ref(false)
const contextMenuItems = ref<ContextMenuItem[]>([
  {
    label: 'Dictionary Lookup',
    icon: 'i-lucide-book-open',
    onSelect: () => {
      dictionaryQuery.value = window.getSelection()?.toString() || ''
      dictionaryOpen.value = true
    },
  },
])
const dictionaryQuery = ref('')
</script>
