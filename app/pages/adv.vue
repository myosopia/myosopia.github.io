<template>
  <div>
    <div
      class="flex flex-col p-4"
      :class="{
        'fixed': fullscreen,
        'inset-0': fullscreen,
        'z-5000': fullscreen,
        'bg-default': fullscreen,
      }"
    >
      <UCollapsible
        v-model:open="headerOpen"
        :ui="{
          root: `relative mb-4 ${fullscreen ? 'pb-6' : ''}`,
        }"
      >
        <UButton
          variant="ghost"
          size="sm"
          trailing-icon="i-lucide-chevron-down"
          class="group absolute bottom-0 left-1/2 -translate-x-1/2"
          :class="{
            hidden: !fullscreen,
          }"
          :ui="{
            trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
          }"
        />
        <template #content>
          <div class="flex justify-between items-center gap-4">
            <USelectMenu
              v-model="activeTitle"
              :items="advTitles"
            />
            <div class="flex items-center gap-1">
              <UPopover>
                <UButton
                  icon="i-lucide-settings"
                  variant="subtle"
                  color="neutral"
                />
                <template #content>
                  <div class="p-4 flex flex-col gap-4">
                    <UFormField label="Text Speed">
                      <UInputNumber
                        v-model="textSpeed"
                        :min="1"
                        :max="10"
                      />
                    </UFormField>
                    <UFormField label="Text Size">
                      <UTabs
                        v-model="textSize"
                        :content="false"
                        :items="[{
                          label: '小',
                          value: 'text-sm',
                        }, {
                          label: '中',
                          value: 'text-base',
                        }, {
                          label: '大',
                          value: 'text-lg',
                        }]"
                      />
                    </UFormField>
                    <UButton
                      :loading="synchronizationState.synchronizing"
                      loading-icon="i-lucide-loader"
                      :color="(() => {
                        if (synchronizationState.synchronizing) {
                          return 'neutral'
                        }
                        if (synchronizationState.executed) {
                          return synchronizationState.success ? 'success' : 'error'
                        }
                        return 'neutral'
                      })()"
                      @click="synchronize"
                    >
                      Synchronize
                    </UButton>
                  </div>
                </template>
              </UPopover>
              <UButton
                :icon="fullscreen ? 'i-lucide-shrink' : 'i-lucide-fullscreen'"
                variant="soft"
                class="opacity-30 hover:opacity-100"
                @click="fullscreen = !fullscreen; headerOpen = !fullscreen"
              />
            </div>
          </div>
        </template>
      </UCollapsible>
      <UScrollArea
        class="p-4 bg-muted rounded-md"
        :class="{
          grow: fullscreen,
        }"
        @click="nextLine"
      >
        <p :class="textSize">
          <span
            v-for="(char, idx) in currentLine"
            :key="`${progress}-${idx}`"
            class="inline-block"
            style="mask-image: linear-gradient(90deg, #000 0%, #000 33.33%, transparent 66.67%, transparent 100%); mask-size: 300% 100%; mask-position: 100%;"
            :style="{
              animation: `reveal ${500 / textSpeed * 3}ms ease-in forwards`,
              animationDelay: `${idx * 500 / textSpeed}ms`,
            }"
          >{{ char }}</span>
        </p>
      </UScrollArea>
      <div
        class="text-sm text-muted flex justify-center items-center mt-4"
      >
        <UButton
          variant="ghost"
          color="neutral"
          size="sm"
          icon="i-lucide-chevron-left"
          @click="prevLine"
        />
        <UPopover>
          <UButton
            variant="ghost"
            color="neutral"
            size="sm"
          >
            {{ progressHuman }} / {{ advData?.content.length }}
          </UButton>
          <template #content>
            <div class="p-4 text-center">
              <UFormField label="Go to line">
                <UInputNumber
                  v-model="progressHuman"
                  :min="1"
                  :max="advData ? advData.content.length : 0"
                />
              </UFormField>
            </div>
          </template>
        </UPopover>
        <UButton
          variant="ghost"
          color="neutral"
          size="sm"
          icon="i-lucide-chevron-right"
          @click="nextLine"
        />
      </div>
    </div>
    <UModal
      v-model:open="synchronizeModalOpen"
      title="是否同步数据"
    >
      <template #body>
        <p v-if="!synchronizationState.executed">
          您已登陆。点击确认同步云端数据。
        </p>
        <UProgress
          v-if="synchronizationState.synchronizing"
          animation="swing"
        />
        <Transition
          enter-from-class="opacity-0"
          enter-active-class="transition-opacity duration-1000"
          leave-active-class="transition-opacity duration-1000"
          leave-to-class="opacity-0"
        >
          <div
            v-if="synchronizationState.executed && !synchronizationState.synchronizing"
            class="flex gap-2 justify-center items-center font-bold text-xl"
            :class="{
              'text-success': synchronizationState.success,
              'text-error': !synchronizationState.success,
            }"
          >
            <UIcon
              :name="synchronizationState.success ? 'i-lucide-circle-check' : 'i-lucide-triangle-alert'"
              class="size-6"
            />{{ synchronizationState.success ? '同步成功' : '同步失败' }}
          </div>
        </Transition>
      </template>
      <template #footer>
        <UButton
          variant="soft"
          class="grow justify-center"
        >
          取消
        </UButton>
        <UButton
          class="grow justify-center"
          @click="confirmSynchronization"
        >
          确认
        </UButton>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const advState = useState('adv', () => {
  return {
    active: '',
    updatedAt: 0,
    progress: {} as Record<string, number>,
  }
})
const textSpeed = ref(5)
const textSize = ref('text-base')
const fullscreen = ref(false)
const headerOpen = ref(true)
const synchronizationState = reactive({
  synchronizing: false,
  success: false,
  executed: false,
})
const synchronizeModalOpen = ref(false)
const { data: advTitleData } = await useAsyncData('advTitles', () => {
  return queryCollection('adv').select('title', 'stem').all()
})
const advTitles = computed(() => advTitleData.value?.map(item => ({ label: item.title, id: item.stem })))
const activeTitle = computed({
  get() {
    return advTitles.value?.find(item => item.id === advState.value.active) ?? advTitles.value?.[0]
  },
  set(newVal) {
    if (newVal) {
      advState.value.active = newVal.id
      advState.value.updatedAt = Date.now()
      synchronizationState.executed = false
      refreshAdvData()
    }
  },
})
const { data: advData, refresh: refreshAdvData } = await useAsyncData('adv', () => {
  return queryCollection('adv').where('stem', '=', advState.value.active).first()
}, {
  server: false,
})
const progress = computed({
  get() {
    if (advData.value) {
      return advState.value.progress[advData.value.stem] || 0
    }
    return 0
  },
  set(newValue) {
    if (advData.value) {
      advState.value.progress[advData.value.stem] = newValue % advData.value.content.length
      advState.value.updatedAt = Date.now()
      synchronizationState.executed = false
    }
  },
})
const progressHuman = computed({
  get() {
    return progress.value + 1
  },
  set(newValue) {
    progress.value = newValue - 1
  },
})
const currentLine = computed(() => {
  if (advData.value) {
    return advData.value.content[progress.value] ?? ''
  }
  return ''
})
const nextLine = () => {
  progress.value += 1
}
const prevLine = () => {
  progress.value -= 1
}
onMounted(() => {
  const advLocalState = localStorage.getItem('adv')
  if (advLocalState) {
    advState.value = JSON.parse(advLocalState)
  }
  const user = useSupabaseUser()
  if (user.value) {
    synchronizeModalOpen.value = true
  }
})
watch(advState, (newVal) => {
  localStorage.setItem('adv', JSON.stringify(newVal))
}, { deep: true })

const synchronize = async () => {
  synchronizationState.executed = true
  synchronizationState.synchronizing = true
  const supabase = useSupabaseClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  if (user) {
    const { data, error } = await supabase.from('adv').select('*').eq('user_id', user.id).single()
    if (error && error.code !== 'PGRST116') {
      synchronizationState.success = false
      synchronizationState.synchronizing = false
      console.log(error)
      return
    }
    if (!data) {
      const { error } = await supabase.from('adv').insert({
        active: advState.value.active,
        updated_at: new Date(advState.value.updatedAt).toISOString(),
        progress: advState.value.progress,
        user_id: user.id,
      })
      if (error) {
        console.log(error)
        synchronizationState.success = false
      }
      else {
        synchronizationState.success = true
      }
    }
    else if (new Date(advState.value.updatedAt) > new Date(data.updated_at)) {
      // Local is newer, upload
      const { error } = await supabase.from('adv').update({
        active: advState.value.active,
        updated_at: new Date(advState.value.updatedAt).toISOString(),
        progress: advState.value.progress,
      }).eq('user_id', user.id)
      if (error) {
        synchronizationState.success = false
      }
      else {
        synchronizationState.success = true
      }
    }
    else {
      // Remote is newer, download
      advState.value.active = data.active ?? ''
      advState.value.updatedAt = new Date(data.updated_at).getTime()
      advState.value.progress = JSON.parse(JSON.stringify(data.progress)) ?? {}
      synchronizationState.success = true
      refreshAdvData()
    }
  }
  synchronizationState.synchronizing = false
}
const confirmSynchronization = async () => {
  await synchronize()
  setTimeout(() => {
    synchronizeModalOpen.value = false
  }, 1000)
}
</script>

<style>
@keyframes reveal {
  from { mask-position: 100%; }
  to { mask-position: 0%; }
}
</style>
