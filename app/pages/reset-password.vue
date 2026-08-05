<template>
	<UPage>
		<UPageHeader title="Reset Password" />
		<UPageBody>
			<UStepper v-model="active" :items="items" :disabled="!isDev">
				<template #email>
					<UForm
						:schema="emailSchema"
						:state="emailState"
						class="space-y-4"
						@submit="onSubmitEmail"
					>
						<UFormField
							label="Your Email"
							name="email"
							class="max-w-lg mx-auto"
						>
							<UInput v-model="emailState.email" type="email" class="w-full" />
						</UFormField>
						<UButton
							type="submit"
							size="lg"
							:icon="submitIcon"
							:loading="loading"
							:label="submitLabel"
							:color="hasError ? 'error' : 'primary'"
							class="flex mx-auto"
						/>
					</UForm>
				</template>
				<template #token>
					<UForm
						ref="tokenForm"
						:schema="tokenSchema"
						:state="tokenState"
						class="space-y-4"
						@submit="onSubmitToken"
					>
						<UFormField
							label="Your Email"
							name="email"
							class="max-w-lg mx-auto"
						>
							<UInput
								v-model="tokenState.email"
								type="email"
								class="w-full"
								disabled
							/>
						</UFormField>
						<UFormField
							label="Recovery Token"
							name="token"
							class="max-w-lg mx-auto"
						>
							<UPinInput
								v-model="tokenState.token"
								otp
								:length="6"
								size="xl"
								@complete="onTokenComplete"
							/>
						</UFormField>
						<UButton
							type="submit"
							size="lg"
							:icon="submitIcon"
							:loading="loading"
							:label="submitLabel"
							class="flex mx-auto"
						/>
					</UForm>
				</template>
				<template #password>
					<UForm
						:schema="passwordSchema"
						:state="passwordState"
						class="space-y-4"
						@submit="onSubmitPassword"
					>
						<UFormField
							label="New Password"
							name="password"
							class="max-w-lg mx-auto"
						>
							<UInput
								v-model="passwordState.password"
								type="password"
								class="w-full"
							/>
						</UFormField>
						<UFormField
							label="Confirm Password"
							name="confirmPassword"
							class="max-w-lg mx-auto"
						>
							<UInput
								v-model="passwordState.confirmPassword"
								type="password"
								class="w-full"
							/>
						</UFormField>
						<UButton
							type="submit"
							size="lg"
							:icon="submitIcon"
							:loading="loading"
							:label="submitLabel"
							class="flex mx-auto"
						/>
					</UForm>
				</template>
			</UStepper>
		</UPageBody>
	</UPage>
</template>
<script setup lang="ts">
import type { FormSubmitEvent, StepperItem } from '@nuxt/ui'
import * as z from 'zod/v4'

const isDev = import.meta.dev
const supabase = useSupabaseClient()
const toast = useToast()
const localePath = useLocalePath()

// Stepper
const active = ref(0)
const items = ref<StepperItem[]>([
	{
		title: 'Send Email',
		description: 'Send a recovery token to your email',
		icon: 'i-lucide-mail',
		slot: 'email',
	},
	{
		title: 'Verify Token',
		description: 'Verify your recovery token',
		icon: 'i-lucide-lock-open',
		slot: 'token',
	},
	{
		title: 'Set new password',
		description: 'Set your new password',
		icon: 'i-lucide-rectangle-ellipsis',
		slot: 'password',
	},
])

// Submit button
const loading = ref(false)
const hasError = ref(false)
const submitIcon = computed(() => {
	if (active.value === 0) {
		return 'i-lucide-send'
	}
	return undefined
})
const submitLabel = computed(() => {
	if (active.value === 0) {
		return 'Send Email'
	}
	return 'Submit'
})

// Step 1: Email
const emailSchema = z.object({
	email: z.email('Invalid Email'),
})
type EmailSchema = z.output<typeof emailSchema>
const emailState = reactive<Partial<EmailSchema>>({
	email: undefined,
})
async function onSubmitEmail(event: FormSubmitEvent<EmailSchema>) {
	loading.value = true
	const email = event.data.email
	const { error } = await supabase.auth.resetPasswordForEmail(email)
	if (error) {
		hasError.value = true
		toast.add({
			title: 'Failed to send email',
			description: error.message,
			color: 'error',
			'onUpdate:open'(open) {
				if (!open) {
					hasError.value = false
				}
			},
		})
	} else {
		tokenState.email = email
		active.value = 1
	}
	loading.value = false
}

// Step 2: Token
const tokenForm = useTemplateRef('tokenForm')
const tokenSchema = z.object({
	email: z.email('Invalid Email'),
	token: z.array(z.string()),
})
type TokenSchema = z.output<typeof tokenSchema>
const tokenState = reactive<Partial<TokenSchema>>({
	email: undefined,
	token: undefined,
})
function onTokenComplete() {
	tokenForm.value?.submit()
}
async function onSubmitToken(event: FormSubmitEvent<TokenSchema>) {
	loading.value = true
	const email = event.data.email
	const token = event.data.token.join()
	const { error } = await supabase.auth.verifyOtp({
		email: email,
		token: token,
		type: 'recovery',
	})
	if (error) {
		hasError.value = true
		toast.add({
			title: 'Invalid Token',
			description: error.message,
			color: 'error',
			'onUpdate:open'(open) {
				if (!open) {
					hasError.value = false
				}
			},
		})
	} else {
		active.value = 2
	}
	loading.value = false
}

// Step 3: Password
const passwordSchema = z
	.object({
		password: z
			.string()
			.min(8)
			.regex(/^(?=.*[a-zA-Z])(?=.*\d).+$/, {
				message: 'Password must contain at least one letter and one digit',
			}),
		confirmPassword: z.string(),
	})
	.refine(data => data.password === data.confirmPassword, {
		message: 'Passwords must match',
		path: ['confirmPassword'],
	})
type PasswordSchema = z.output<typeof passwordSchema>
const passwordState = reactive<Partial<PasswordSchema>>({
	password: undefined,
})
async function onSubmitPassword(event: FormSubmitEvent<PasswordSchema>) {
	loading.value = true
	const password = event.data.password
	const { error } = await supabase.auth.updateUser({
		password: password,
	})
	if (error) {
		hasError.value = true
		toast.add({
			title: 'Failed to send email',
			description: error.message,
			color: 'error',
			'onUpdate:open'(open) {
				if (!open) {
					hasError.value = false
				}
			},
		})
	} else {
		toast.add({
			title: 'Password Changed',
			description: 'Your password is successfully changed.',
			color: 'success',
			'onUpdate:open'(open) {
				if (!open) {
					navigateTo(localePath('/'))
				}
			},
		})
	}
	loading.value = false
}
</script>
