<template>
  <PrimeDialog
    :visible="visible"
    modal
    :header="title"
    :style="{ width: '820px', maxWidth: '95vw' }"
    @update:visible="closeDialog"
  >
    <TabView v-if="type === 'all'">
      <TabPanel v-for="config in historyTypes" :key="config.key" :header="tabTitle(config)">
        <AnalysisHistoryList
          :records="historyRecords[config.key]"
          :loading="loadingByType[config.key]"
          :error="errorsByType[config.key]"
          :empty-message="config.emptyMessage"
        />
      </TabPanel>
    </TabView>

    <AnalysisHistoryList
      v-else
      :records="historyRecords[type]"
      :loading="loadingByType[type]"
      :error="errorsByType[type]"
      :empty-message="selectedType.emptyMessage"
    />

    <template #footer>
      <PrimeButton label="Cerrar" severity="secondary" @click="closeDialog" />
    </template>
  </PrimeDialog>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import PrimeButton from 'primevue/button'
import PrimeDialog from 'primevue/dialog'
import TabPanel from 'primevue/tabpanel'
import TabView from 'primevue/tabview'
import AnalysisHistoryList from '@/components/analysis/AnalysisHistoryList.vue'
import analysisHistoryService from '@/services/analysisHistoryService.js'
import chemicalTestHistoryService from '@/services/chemicalTestHistoryService.js'
import microanalysisHistoryService from '@/services/microanalysisHistoryService.js'
import { normalizeHistoryResponse } from '@/utils/analysisHistory.js'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  analysisId: {
    type: [Number, String],
    default: null,
  },
  type: {
    type: String,
    default: 'all',
    validator: (value) => ['all', 'macro', 'micro', 'chemical'].includes(value),
  },
  title: {
    type: String,
    default: 'Historial de modificaciones',
  },
})

const emit = defineEmits(['update:visible'])
let loadRequestId = 0

const historyTypes = [
  {
    key: 'macro',
    label: 'Macroanálisis',
    emptyMessage: 'No hay modificaciones registradas para el macroanálisis.',
    service: analysisHistoryService,
  },
  {
    key: 'micro',
    label: 'Microanálisis',
    emptyMessage: 'No hay modificaciones registradas para el microanálisis.',
    service: microanalysisHistoryService,
  },
  {
    key: 'chemical',
    label: 'Examen químico',
    emptyMessage: 'No hay modificaciones registradas para el examen químico.',
    service: chemicalTestHistoryService,
  },
]

const historyRecords = reactive({
  macro: [],
  micro: [],
  chemical: [],
})

const loadingByType = reactive({
  macro: false,
  micro: false,
  chemical: false,
})

const errorsByType = reactive({
  macro: '',
  micro: '',
  chemical: '',
})

const selectedType = computed(
  () => historyTypes.find((config) => config.key === props.type) || historyTypes[0],
)

const requestedTypes = computed(() =>
  props.type === 'all' ? historyTypes : [selectedType.value],
)

const closeDialog = () => emit('update:visible', false)

const toTimestamp = (value) => {
  const timestamp = new Date(value || 0).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

const loadHistoryType = async (config, requestId) => {
  loadingByType[config.key] = true
  errorsByType[config.key] = ''
  historyRecords[config.key] = []

  try {
    const { data } = await config.service.getByAnalysisId(props.analysisId)
    if (requestId !== loadRequestId || !props.visible) return

    historyRecords[config.key] = normalizeHistoryResponse(data).sort(
      (first, second) => toTimestamp(second.changedAt) - toTimestamp(first.changedAt),
    )
  } catch (error) {
    if (requestId !== loadRequestId || !props.visible) return

    console.error(`Error cargando historial ${config.key}:`, error)
    errorsByType[config.key] = `No se pudo cargar el historial de ${config.label.toLowerCase()}.`
  } finally {
    if (requestId === loadRequestId) loadingByType[config.key] = false
  }
}

const loadHistory = async () => {
  const requestId = ++loadRequestId

  if (props.analysisId === null || props.analysisId === undefined) {
    requestedTypes.value.forEach((config) => {
      historyRecords[config.key] = []
      loadingByType[config.key] = false
      errorsByType[config.key] = ''
    })
    return
  }

  await Promise.all(requestedTypes.value.map((config) => loadHistoryType(config, requestId)))
}

watch(
  () => [props.visible, props.analysisId, props.type],
  ([isVisible]) => {
    if (isVisible) loadHistory()
    else loadRequestId += 1
  },
)

const tabTitle = (config) => {
  const count = historyRecords[config.key].length
  return loadingByType[config.key] ? config.label : `${config.label} (${count})`
}
</script>
