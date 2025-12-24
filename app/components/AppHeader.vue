<template>
  <div class="uppercase hidden lg:flex justify-center items-center text-2xl pt-8">
    <div>꒰୨⁺ <span class="text-xl font-bold text-primary">{{ $t('appTitle') }}</span> ⁺୧꒱</div>
  </div>
  <UHeader
    :title="pageTitle"
    mode="drawer"
    :ui="{
      root: 'border-0 h-auto',
      container: 'flex py-4',
      center: 'justify-center',
    }"
  >
    <UNavigationMenu :items="items" />
    <template #right>
      <div class="flex gap-4 items-center justify-end">
        <ULocaleSelect
          :model-value="locale"
          :locales="Object.values(availableLocales)"
          @update:model-value="updateLocale"
        />
        <UColorModeSwitch />
      </div>
    </template>
    <template #body>
      <UNavigationMenu
        :items="items"
        orientation="vertical"
        class="-mx-2.5"
      />
    </template>
  </UHeader>
  <div class="uppercase lg:hidden text-center text-2xl mb-4">
    ꒰୨⁺ <span class="text-xl font-bold text-primary">{{ $t('appTitle') }}</span> ⁺୧꒱
  </div>
</template>

<script setup lang="ts">
import * as uiLocales from '@nuxt/ui/locale'
import type { NavigationMenuItem } from '@nuxt/ui'

// Page title
const route = useRoute()
const pageTitle = computed(() => (route.meta.title as string) || '')

// I18n
const { locale, locales, t } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const availableLocales = computed(() => {
  return Object.values(uiLocales).filter(uiLocale => locales.value.find(l => l.code === uiLocale.code))
})

const updateLocale = (code: string) => {
  // @ts-expect-error code is string
  navigateTo(switchLocalePath(code))
}

// Navigation Menu
const items = computed<NavigationMenuItem[]>(() => [
  {
    label: t('blog'),
    to: '/blog',
  },
  {
    label: t('about'),
    to: '/about',
  },
  {
    label: t('contact'),
    to: '/contact',
  },
])
</script>
