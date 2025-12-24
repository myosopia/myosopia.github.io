<template>
  <UFooter class="border-t border-t-accented">
    <div class="flex flex-col justify-start items-center">
      <div>
        <p v-if="user">
          Logged in as <span>{{ user.email }}</span>
        </p>
      </div>
      <div class="text-center py-4">
        &copy; {{ new Date().getFullYear() }} Huyễn Cảnh Lưu Ly. All rights reserved.
      </div>
    </div>
  </UFooter>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
</script>
