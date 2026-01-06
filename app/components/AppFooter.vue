<template>
	<UFooter>
		<div class="flex flex-col justify-start items-center space-y-4">
			<div>────────୨ৎ────────</div>
			<div v-if="user" class="flex items-center">
				You are logged in
				<UButton
					size="sm"
					variant="ghost"
					color="neutral"
					icon="i-lucide-log-out"
					@click="
						() => {
							supabase.auth.signOut()
						}
					"
				/>
			</div>
			<div class="text-center">
				&copy; {{ new Date().getFullYear() }} Huyễn Cảnh Lưu Ly. All rights
				reserved.
			</div>
		</div>
	</UFooter>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const supabase = useSupabaseClient()
</script>
