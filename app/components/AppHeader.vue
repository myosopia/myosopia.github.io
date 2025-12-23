<template>
  <UHeader title="LH">
    <template #right>
      <ULocaleSelect
        :model-value="locale"
        :locales="Object.values(availableLocales)"
        @update:model-value="updateLocale"
      />
      <UColorModeSwitch />
    </template>
  </UHeader>
</template>

<script setup lang="ts">
  import * as uiLocales from '@nuxt/ui/locale'
  const { locale, locales } = useI18n()
  const switchLocalePath = useSwitchLocalePath()
  const availableLocales = computed(() => {
    return Object.values(uiLocales).filter(uiLocale => locales.value.find(l => l.code === uiLocale.code))
  })

  const updateLocale = (code: string) => {
    // @ts-expect-error code is string
    navigateTo(switchLocalePath(code))
  }
</script>
