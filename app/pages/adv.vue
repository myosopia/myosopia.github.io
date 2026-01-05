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
      <div class="flex justify-between items-center gap-4 mb-4">
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
            @click="fullscreen = !fullscreen"
          />
        </div>
      </div>
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
    activeTitle.value = advTitles.value?.find(item => item.id === advState.value.active)
  }
})
watch(advState, (newVal) => {
  localStorage.setItem('adv', JSON.stringify(newVal))
}, { deep: true })

const synchronizationState = reactive({
  synchronizing: false,
  success: false,
  executed: false,
})
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
</script>

<style>
@keyframes reveal {
  from { mask-position: 100%; }
  to { mask-position: 0%; }
}
</style>
