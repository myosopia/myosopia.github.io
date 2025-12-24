<script setup lang="ts">
const email = ref('')
const password = ref('')
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const signInWithPassword = async () => {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })
  if (error) console.log(error)
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <input
      v-model="email"
      type="email"
    >
    <input
      v-model="password"
      type="password"
    >
    <UButton @click="signInWithPassword">
      Sign In with E-Mail and Password
    </UButton>
    <div>{{ user?.email }}</div>
  </div>
</template>
