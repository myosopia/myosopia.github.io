<template>
	<UApp :locale="currentLocale">
		<AppHeader />

		<UMain>
			<NuxtLayout>
				<NuxtPage />
			</NuxtLayout>
		</UMain>

		<AppFooter />
	</UApp>
</template>

<script setup lang="ts">
import * as locales from '@nuxt/ui/locale'

const { locale, t } = useI18n()
const currentLocale = computed(() => {
	return locales[locale.value as keyof typeof locales]
})

const route = useRoute()

const localizedTitle = computed(() => {
	const metaKey = route.meta.title as string
	return metaKey ? t(metaKey) : ''
})

useHead({
	htmlAttrs: {
		lang: locale.value,
	},
	title: () => localizedTitle.value,
	titleTemplate(title) {
		return title ? `${title} - Huyễn Cảnh Lưu Ly` : 'Huyễn Cảnh Lưu Ly'
	},
})
</script>
