// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

const getPrivatePostPrerenderRoutes = async () => {
	const supabaseUrl = process.env.SUPABASE_URL
	const supabaseKey =
		process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_KEY

	if (!supabaseUrl || !supabaseKey) {
		console.warn(
			'[prerender] Skipping private post route discovery because Supabase credentials are missing.',
		)
		return []
	}
	const supabase = createClient(supabaseUrl, supabaseKey)

	try {
		const { data, success, error } = await supabase.from('posts').select('slug')

		if (!success) {
			console.warn(`[prerender] Failed to fetch private post slugs:`, error)
			return []
		}

		return data.map(({ slug }) => `/blog/private/${slug}`)
	} catch (error) {
		console.warn('[prerender] Failed to discover private post routes:', error)
		return []
	}
}

export default defineNuxtConfig({
	modules: [
		'@nuxt/content',
		'@nuxt/eslint',
		'@nuxt/image',
		'@nuxt/ui',
		'@nuxtjs/i18n',
		'@nuxtjs/supabase',
		'@nuxtjs/turnstile',
		'@nuxtjs/seo',
		'@pinia/nuxt',
		'pinia-plugin-persistedstate/nuxt',
	],
	devtools: { enabled: true },
	css: ['~/assets/css/main.css'],
	compatibilityDate: '2025-07-15',
	vite: {
		optimizeDeps: {
			include: [
				'@vue/devtools-core',
				'@vue/devtools-kit',
				'@vueuse/core',
				'text-case',
				'temporal-polyfill',
			],
		},
	},
	imports: {
		presets: [
			{
				from: 'temporal-polyfill',
				imports: ['Temporal'],
			},
		],
		polyfills: true,
	},
	nitro: {
		publicAssets: [
			{
				dir: resolve('node_modules/pdfjs-dist/wasm'),
				baseURL: '/pdfjs/wasm',
			},
			{
				dir: resolve('node_modules/pdfjs-dist/cmaps'),
				baseURL: '/pdfjs/cmaps',
			},
			{
				dir: resolve('node_modules/pdfjs-dist/build'),
				baseURL: '/pdfjs',
			},
		],
		prerender: {
			failOnError: false,
			routes: [
				'/_ipx/s_32x32/avatars/lyhuong.png',
				'/_ipx/s_64x64/avatars/lyhuong.png',
				'/_ipx/s_128x128/avatars/lyhuong.png',
				'/profile',
			],
		},
	},
	hooks: {
		async 'nitro:config'(nitroConfig) {
			const privatePostRoutes = await getPrivatePostPrerenderRoutes()
			if (!privatePostRoutes.length) return

			nitroConfig.prerender ??= {}

			const existingRoutes = Array.isArray(nitroConfig.prerender.routes)
				? nitroConfig.prerender.routes
				: []

			nitroConfig.prerender.routes = [
				...new Set([...existingRoutes, ...privatePostRoutes]),
			]
		},
	},
	i18n: {
		defaultLocale: 'zh-CN',
		locales: [
			{ code: 'en', name: 'English', file: 'en.json' },
			{ code: 'vi', name: 'Tiếng Việt', file: 'vi.json' },
			{ code: 'zh-CN', name: '简体中文', file: 'zh.json' },
			{ code: 'ja', name: '日本語', file: 'ja.json' },
		],
	},
	icon: {
		clientBundle: {
			icons: [
				'lucide:x',
				'lucide:check',
				'lucide:plus',
				'lucide:minus',
				'lucide:moon',
				'lucide:sun',
				'lucide:menu',
				'lucide:arrow-left',
				'lucide:arrow-right',
				'lucide:loader-circle',
				'lucide:eye',
				'lucide:ellipsis-vertical',
				'lucide:copy-check',
				'lucide:hash',
				'lucide:arrow-down-wide-narrow',
			],
			scan: true,
		},
	},
	image: {
		providers: {
			google: {
				provider: '~/providers/google',
				options: {
					baseURL: 'https://lh3.googleusercontent.com',
				},
			},
		},
	},
	site: {
		url: 'https://lhrika.github.io',
		name: 'Huyễn Cảnh Lưu Ly',
		description: 'Personal site of Ly Hương',
		defaultLocale: 'zh',
	},
	supabase: {
		redirect: false,
		redirectOptions: {
			login: '/login',
			saveRedirectToCookie: true,
			callback: '/login',
			include: [],
		},
		url: process.env.SUPABASE_URL,
		key: process.env.SUPABASE_KEY,
	},
})
