<script setup lang="ts">
import type { TabsItem, UserProps } from '@nuxt/ui'
import type { Database, Tables } from '~/types/database.types'

interface UserListItem {
	id: string
	name: string
	description?: string
	avatar?: UserProps['avatar']
}

interface UserGroupListItem {
	id: Database['public']['Enums']['app_role']
	name: string
	description?: string
	icon?: string
}

const props = withDefaults(
	defineProps<{
		selectedUserIds?: readonly string[]
		selectedUserGroupIds?: readonly Database['public']['Enums']['app_role'][]
	}>(),
	{
		selectedUserIds: () => [],
		selectedUserGroupIds: () => [],
	},
)

const emit = defineEmits<{
	userSelect: [user: UserListItem, selected: boolean]
	userGroupSelect: [userGroup: UserGroupListItem, selected: boolean]
}>()

const supabase = useSupabaseClient()

const { data, error, status, refresh, execute } = useAsyncData(
	'user-group-list',
	async () => {
		const [profilesResult, rolesResult] = await Promise.all([
			supabase.from('profiles').select('user_id, name, avatar').order('name'),
			supabase.from('user_roles').select('role, user_id').order('role'),
		])

		if (profilesResult.error) throw profilesResult.error
		if (rolesResult.error) throw rolesResult.error

		const users = (profilesResult.data ?? []).map(profile =>
			toUserListItem(profile),
		)
		const roleMemberCounts = new Map<
			Database['public']['Enums']['app_role'],
			number
		>()
		for (const userRole of rolesResult.data ?? []) {
			roleMemberCounts.set(
				userRole.role,
				(roleMemberCounts.get(userRole.role) ?? 0) + 1,
			)
		}

		const userGroups = Array.from(roleMemberCounts, ([role, memberCount]) => ({
			id: role,
			name: role,
			description: `${memberCount} 位用户`,
			icon: 'i-lucide-users',
		}))

		return { users, userGroups }
	},
	{
		immediate: false,
		server: false,
		default: () => ({ users: [], userGroups: [] }),
	},
)

onMounted(() => {
	execute()
})

function toUserListItem(
	profile: Pick<Tables<'profiles'>, 'user_id' | 'name' | 'avatar'>,
) {
	return {
		id: profile.user_id,
		name: profile.name,
		avatar: profile.avatar
			? { src: profile.avatar }
			: { icon: 'i-lucide-user' },
	}
}

const tabs = [
	{
		label: '用户',
		value: 'users',
		slot: 'users',
	},
	{
		label: '用户组',
		value: 'groups',
		slot: 'groups',
	},
] satisfies TabsItem[]

const activeTab = ref<'users' | 'groups'>('users')

const isUserSelected = (id: string) => props.selectedUserIds.includes(id)
const isUserGroupSelected = (id: UserGroupListItem['id']) =>
	props.selectedUserGroupIds.includes(id)
</script>

<template>
	<UTabs v-model="activeTab" :items="tabs" variant="link" class="w-full">
		<template #users>
			<div class="space-y-1 pt-3">
				<UAlert
					v-if="error"
					color="error"
					title="无法加载用户与用户组"
					description="请稍后重试。"
					:actions="[
						{
							label: '重试',
							onClick() {
								refresh()
							},
						},
					]"
				/>
				<template v-if="status === 'pending'">
					<USkeleton v-for="index in 3" :key="index" class="h-12 w-full" />
				</template>
				<UUser
					v-for="user in data.users"
					:key="user.id"
					as="button"
					:name="user.name"
					:avatar="user.avatar"
					:class="[
						'w-full rounded-md px-3 py-2 text-left hover:bg-elevated focus-visible:outline-3 focus-visible:outline-primary/25',
						{ 'bg-elevated': isUserSelected(user.id) },
					]"
					@click="emit('userSelect', user, !isUserSelected(user.id))"
				/>
				<p
					v-if="status === 'success' && !data.users.length"
					class="px-3 py-2 text-sm text-muted"
				>
					暂无用户
				</p>
			</div>
		</template>

		<template #groups>
			<div class="space-y-1 pt-3">
				<UAlert
					v-if="error"
					color="error"
					title="无法加载用户与用户组"
					description="请稍后重试。"
					:actions="[
						{
							label: '重试',
							onClick() {
								refresh()
							},
						},
					]"
				/>
				<template v-if="status === 'pending'">
					<USkeleton v-for="index in 3" :key="index" class="h-12 w-full" />
				</template>
				<button
					v-for="userGroup in data.userGroups"
					:key="userGroup.id"
					type="button"
					:aria-pressed="isUserGroupSelected(userGroup.id)"
					:class="[
						'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-elevated focus-visible:outline-3 focus-visible:outline-primary/25',
						{ 'bg-elevated': isUserGroupSelected(userGroup.id) },
					]"
					@click="
						emit(
							'userGroupSelect',
							userGroup,
							!isUserGroupSelected(userGroup.id),
						)
					"
				>
					<UIcon
						:name="userGroup.icon ?? 'i-lucide-users'"
						class="size-5 shrink-0 text-muted"
					/>
					<span class="min-w-0">
						<span class="block truncate text-sm font-medium text-highlighted">
							{{ userGroup.name }}
						</span>
						<span
							v-if="userGroup.description"
							class="block truncate text-xs text-muted"
						>
							{{ userGroup.description }}
						</span>
					</span>
				</button>
				<p
					v-if="status === 'success' && !data.userGroups.length"
					class="px-3 py-2 text-sm text-muted"
				>
					暂无用户组
				</p>
			</div>
		</template>
	</UTabs>
</template>
