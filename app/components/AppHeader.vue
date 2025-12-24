<template>
  <div class="uppercase hidden lg:flex justify-center items-center text-2xl pt-8">
    <div>꒰୨⁺ <span class="text-xl font-bold text-primary">{{ $t('appTitle') }}</span> ⁺୧꒱</div>
  </div>
  <div class="fixed z-100 top-0 right-0 mt-6 mr-6 hidden lg:flex items-center gap-4">
    <ULocaleSelect
      :model-value="locale"
      :locales="Object.values(availableLocales)"
      @update:model-value="updateLocale"
    />
    <UColorModeSwitch />
  </div>
  <UHeader
    :title="$t('appTitle')"
    mode="drawer"
    :ui="{
      root: 'border-0 h-auto',
      title: 'hidden',
      container: 'block py-4',
      left: 'lg:hidden',
      right: 'lg:hidden',
      center: 'justify-center',
    }"
  >
    <UNavigationMenu :items="items" />
    <template #right>
      <ULocaleSelect
        :model-value="locale"
        :locales="Object.values(availableLocales)"
        @update:model-value="updateLocale"
      />
      <UColorModeSwitch />
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
