<script setup lang="ts">
import * as z from 'zod/v4'
import type { Database } from '~/types/database.types'

const schema = z.object({
	title: z.string(),
	slug: z.string(),
	content: z.string(),
})
type Schema = z.output<typeof schema>
const state = defineModel<Partial<Schema>>({
	required: true,
})
const open = defineModel<boolean>('open', {
	required: false,
})
const props = defineProps<{
	title?: string
	slugDisabled?: boolean
	postId?: number
}>()
const emit = defineEmits<{
	submit: []
}>()
const formRef = useTemplateRef('form')
const supabase = useSupabaseClient<Database>()
const toast = useToast()
const permissionModalOpen = ref(false)
const permissionLoading = ref(false)
const permissionSaving = ref(false)
const selectedUserIds = ref<string[]>([])
const selectedUserGroupIds = ref<Database['public']['Enums']['app_role'][]>([])

watch([permissionModalOpen, () => props.postId], ([isOpen, postId]) => {
	if (isOpen && postId) loadPermissions(postId)
})

async function loadPermissions(postId: number) {
	permissionLoading.value = true
	const { data, error } = await supabase
		.from('post_permissions')
		.select('user_id, user_role')
		.eq('post_id', postId)

	if (error) {
		toast.add({
			title: '加载权限失败',
			description: error.message,
			color: 'error',
		})
	} else {
		selectedUserIds.value = data.flatMap(permission =>
			permission.user_id ? [permission.user_id] : [],
		)
		selectedUserGroupIds.value = data.flatMap(permission =>
			permission.user_role ? [permission.user_role] : [],
		)
	}
	permissionLoading.value = false
}

async function updateUserPermission(
	user: { id: string; name: string },
	selected: boolean,
) {
	if (!props.postId || permissionSaving.value) return

	permissionSaving.value = true
	const { error } = selected
		? await supabase.from('post_permissions').insert({
				post_id: props.postId,
				user_id: user.id,
			})
		: await supabase
				.from('post_permissions')
				.delete()
				.eq('post_id', props.postId)
				.eq('user_id', user.id)

	if (error) {
		toast.add({
			title: '更新权限失败',
			description: error.message,
			color: 'error',
		})
	} else {
		selectedUserIds.value = updateSelection(
			selectedUserIds.value,
			user.id,
			selected,
		)
	}
	permissionSaving.value = false
}

async function updateUserGroupPermission(
	userGroup: { id: Database['public']['Enums']['app_role']; name: string },
	selected: boolean,
) {
	if (!props.postId || permissionSaving.value) return

	permissionSaving.value = true
	const { error } = selected
		? await supabase.from('post_permissions').insert({
				post_id: props.postId,
				user_role: userGroup.id,
			})
		: await supabase
				.from('post_permissions')
				.delete()
				.eq('post_id', props.postId)
				.eq('user_role', userGroup.id)

	if (error) {
		toast.add({
			title: '更新权限失败',
			description: error.message,
			color: 'error',
		})
	} else {
		selectedUserGroupIds.value = updateSelection(
			selectedUserGroupIds.value,
			userGroup.id,
			selected,
		)
	}
	permissionSaving.value = false
}

function updateSelection<T>(ids: T[], id: T, selected: boolean) {
	return selected ? [...ids, id] : ids.filter(selectedId => selectedId !== id)
}
</script>

<template>
	<UModal v-model:open="open" :title="title">
		<slot />
		<template #header="{ close }">
			<UButton
				icon="i-lucide-x"
				variant="ghost"
				color="neutral"
				@click="close"
			/>
			<span class="font-bold">{{ title }}</span>
			<UModal
				v-model:open="permissionModalOpen"
				title="文章权限"
				description="选择可阅读这篇文章的用户或用户组。"
			>
				<UButton
					v-if="props.postId"
					label="权限"
					icon="i-lucide-users-round"
					variant="ghost"
					color="neutral"
					class="ml-auto"
				/>
				<template #body>
					<UAlert
						v-if="permissionLoading"
						color="neutral"
						variant="soft"
						title="正在加载权限"
						icon="i-lucide-loader-circle"
					/>
					<UserGroupList
						v-else
						:selected-user-ids="selectedUserIds"
						:selected-user-group-ids="selectedUserGroupIds"
						@user-select="updateUserPermission"
						@user-group-select="updateUserGroupPermission"
					/>
				</template>
			</UModal>

			<UButton
				label="提交"
				icon="i-lucide-send-horizontal"
				:class="{ 'ml-auto': !props.postId }"
				@click="
					() => {
						formRef?.submit()
					}
				"
			/>
		</template>
		<template #body>
			<UForm
				ref="form"
				:state="state"
				:schema="schema"
				class="space-y-4"
				@submit="emit('submit')"
			>
				<UFormField label="标题">
					<UInput v-model="state.title" class="w-full" />
				</UFormField>
				<UFormField label="Slug">
					<UInput
						v-model="state.slug"
						class="w-full"
						:disabled="slugDisabled"
					/>
				</UFormField>
				<UFormField label="正文">
					<UTextarea v-model="state.content" autoresize class="w-full" />
				</UFormField>
			</UForm>
		</template>
	</UModal>
</template>
