<template>
	<div class="flex justify-center">
		<UCarousel
			v-slot="{ item }"
			:items="carouselItems"
			dots
			arrows
			:prev="{ color: 'neutral', variant: 'soft' }"
			:next="{ color: 'neutral', variant: 'soft' }"
			:autoplay="{ delay: 2000 }"
			:ui="{
				item: 'sm:basis-1/3',
			}"
			class="max-w-2xl"
		>
			<figure class="relative flex flex-col items-center justify-between gap-2">
				<div class="h-50">
					<UModal>
						<NuxtImg
							height="200"
							loading="lazy"
							placeholder
							:src="item.src"
							class="w-full h-full object-contain"
						/>
						<template #content>
							<NuxtImg :src="item.src" loading="lazy" placeholder />
						</template>
					</UModal>
				</div>
				<figcaption class="text-sm text-toned text-center">
					{{ item.title }}
				</figcaption>
			</figure>
		</UCarousel>
	</div>
</template>

<script setup lang="ts">
const { data: galleryData } = await useFetch('/api/otomatefc-gallery')
const carouselItems = computed(() =>
	(galleryData.value ?? []).flatMap(item =>
		(item.images ?? []).map(src => ({ src, title: item.title })),
	),
)
</script>
