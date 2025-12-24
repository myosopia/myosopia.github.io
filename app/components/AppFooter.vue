<template>
  <UFooter>
    <div class="flex flex-col justify-start items-center space-y-4">
      <div>────────୨ৎ────────</div>
      <div>
        <p v-if="user">
          Logged in as <span>{{ user.email }}</span>
        </p>
      </div>
      <div class="text-center">
        &copy; {{ new Date().getFullYear() }} Huyễn Cảnh Lưu Ly. All rights reserved.
      </div>
    </div>
  </UFooter>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
</script>
