<template>
  <figure class="flex flex-col items-center my-5 leading-7 text-pretty gap-2">
    <slot mdc-unwrap="p" />
    <figcaption
      v-if="caption"
    >
      {{ caption }}
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
defineProps<{
  caption?: string
}>()
</script>
