<template>
  <UContainer class="flex flex-col items-center px-4 max-w-lg">
    <UForm
      :schema="schema"
      :state="state"
      class="w-full space-y-4"
      @submit="handleSubmitMessage"
    >
      <UFormField
        name="name"
        :label="t('Name')"
      >
        <UInput
          v-model="state.name"
          class="flex"
        />
      </UFormField>
      <UFormField
        name="content"
        :label="t('Message')"
      >
        <UTextarea
          v-model="state.content"
          class="flex"
        />
      </UFormField>
      <UButton
        type="submit"
        color="primary"
      >
        {{ t('Submit') }}
      </UButton>
    </UForm>
  </UContainer>
</template>

<script setup lang="ts">
import { z } from 'zod/v4'

const toast = useToast()
const { t } = useI18n({
  useScope: 'local',
})

const schema = z.object({
  name: z.string(t('Name is required.')).nonempty(t('Name is required.')),
  content: z.string(t('Message is required.')).nonempty(t('Message is required.')),
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: undefined,
  content: undefined,
})

const supabase = useSupabaseClient()

const handleSubmitMessage = async () => {
  const { error } = await supabase
    .from('messages')
    .insert([{ name: state.name!, content: state.content! }])

  if (error) {
    toast.add({
      title: 'Error',
      description: error.message,
      color: 'error',
    })
  }
  else {
    toast.add({
      title: 'Success',
      description: 'Message submitted successfully!',
      color: 'success',
    })
  }
}
</script>

<i18n lang="json">
{
    "zh": {
        "Name is required.": "昵称不能为空。",
        "Message is required.": "留言不能为空。",
        "Submit": "提交",
        "Name": "昵称",
        "Message": "留言",
        "Message Board": "留言板"
    },
    "ja": {
        "Name is required.": "名前は必須です。",
        "Message is required.": "メッセージは必須です。",
        "Submit": "送信",
        "Name": "名前",
        "Message": "メッセージ",
        "Message Board": "メッセージボード"
    },
    "en": {
        "Name is required.": "Name is required.",
        "Message is required.": "Message is required.",
        "Submit": "Submit",
        "Name": "Name",
        "Message": "Message",
        "Message Board": "Message Board"
    },
    "vi": {
        "Name is required.": "Tên là bắt buộc.",
        "Message is required.": "Tin nhắn là bắt buộc.",
        "Submit": "Gửi",
        "Name": "Tên",
        "Message": "Tin nhắn",
        "Message Board": "Bảng tin nhắn"
    }
}
</i18n>
