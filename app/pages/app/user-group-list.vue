<template>
	<UPage>
		<UPageHeader
			title="用户和用户组"
			description="测试从 Supabase 加载的用户与用户组列表，以及点击事件。"
		/>
		<UPageBody class="mx-auto w-full max-w-xl space-y-4">
			<UPageCard
				title="用户和用户组列表"
				description="切换标签并点击任意项目，结果会显示在下方。"
				icon="i-lucide-users"
			>
				<UserGroupList
					:selected-user-ids="selectedUserIds"
					:selected-user-group-ids="selectedUserGroupIds"
					@user-select="handleUserSelect"
					@user-group-select="handleUserGroupSelect"
				/>
			</UPageCard>

			<UAlert
				v-if="selectedItem"
				color="success"
				variant="soft"
				icon="i-lucide-check-circle"
				title="已触发选择事件"
				:description="selectedItem"
			/>
		</UPageBody>
	</UPage>
</template>

<script setup lang="ts">
const toast = useToast()
const selectedItem = ref('')
const selectedUserIds = ref<string[]>([])
const selectedUserGroupIds = ref<string[]>([])

function handleUserSelect(user: { id: string; name: string }, selected: boolean) {
	selectedUserIds.value = updateSelection(selectedUserIds.value, user.id, selected)
	selectedItem.value = `${selected ? '已选择' : '已取消选择'}用户：${user.name}（${user.id}）`
	toast.add({
		title: selected ? '已选择用户' : '已取消选择用户',
		description: user.name,
		color: 'success',
	})
}

function handleUserGroupSelect(
	userGroup: { id: string; name: string },
	selected: boolean,
) {
	selectedUserGroupIds.value = updateSelection(
		selectedUserGroupIds.value,
		userGroup.id,
		selected,
	)
	selectedItem.value = `${selected ? '已选择' : '已取消选择'}用户组：${userGroup.name}（${userGroup.id}）`
	toast.add({
		title: selected ? '已选择用户组' : '已取消选择用户组',
		description: userGroup.name,
		color: 'success',
	})
}

function updateSelection(ids: string[], id: string, selected: boolean) {
	return selected ? [...ids, id] : ids.filter(selectedId => selectedId !== id)
}
</script>
