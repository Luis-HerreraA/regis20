<template>
  <PlantillaContenido>
    <template #contenido>
      <div class="preanalysis-container">
        <div class="page-content">
          <div class="flex justify-content-between align-items-center mb-0">
            <h1>Gestión de Análisis</h1>
            <div class="flex gap-2">
              <!-- Botón para generar informe consolidado (destino = 1) -->
              <Button
                v-if="selectedAnalysis.length > 0 && hasOnlyInteriorDestination"
                icon="pi pi-file-pdf"
                label="Generar Informe Consolidado"
                class="p-button-success"
                @click="generateConsolidatedReport"
                v-tooltip.top="
                  `Generar informe con ${selectedAnalysis.length} análisis seleccionado(s)`
                "
              />

              <!-- Botón para generar reservados (destino ≠ 1) -->
              <Button
                v-if="selectedAnalysis.length > 0 && hasOnlyExteriorDestination"
                icon="pi pi-file"
                label="Generar Reservados"
                class="p-button-info"
                @click="generateReserveds"
                v-tooltip.top="
                  `Generar reservados con ${selectedAnalysis.length} análisis seleccionado(s)`
                "
              />
            </div>
          </div>
          <TabView v-model:activeIndex="activeAnalysisTab">
            <TabPanel v-for="tab in analysisTabs" :key="tab.key" :header="tab.label">
              <div class="table-container">
                <DataTable
                  v-model:filters="filters"
                  v-model:selection="selectedAnalysis"
                  :value="tab.analyses"
                  paginator
                  size="small"
                  :rows="10"
                  :rowsPerPageOptions="[5, 10, 20, 50]"
                  scrollable
                  class="p-datatable-striped p-datatable-gridlines users-table"
                  :loading="loadingAnalysis"
                  dataKey="id"
                  :globalFilterFields="[
                    'id',
                    'number_protocol',
                    'preAnalysis.substance.nsubstance',
                    'preAnalysis.reception.number',
                    'preAnalysis.substance.substanceType.name',
                    'result',
                    'observation',
                    'user.firstName',
                    'user.lastName',
                  ]"
                >
                  <template #header>
                    <div class="flex justify-content-end">
                      <IconField iconPosition="left">
                        <InputIcon>
                          <i class="pi pi-search" />
                        </InputIcon>
                        <InputText
                          v-model="filters['global'].value"
                          placeholder="Buscar en todos los campos..."
                        />
                      </IconField>
                    </div>
                  </template>

                  <template #empty> No se encontraron análisis. </template>
                  <template #loading> Cargando análisis. Por favor espere. </template>
                  <Column headerStyle="width: 3rem; text-align:center;">
                    <template #body="slotProps">
                      <Checkbox
                        :binary="true"
                        :disabled="
                          !canSelectAnalysis(slotProps.data) || !canSelectRow(slotProps.data)
                        "
                        :modelValue="isAnalysisSelected(slotProps.data)"
                        @change="toggleAnalysisSelection(slotProps.data)"
                      />
                    </template>
                  </Column>
                  <Column field="id" header="ID" />
                  <Column field="number_protocol" header="N° Protocolo">
                    <template #body="slotProps">
                      {{ slotProps.data.number_protocol ?? '—' }}
                    </template>
                  </Column>
                  <Column field="preAnalysis.substance.nsubstance" header="N° Sustancia">
                    <template #body="slotProps">
                      {{ slotProps.data.preAnalysis?.substance?.nsubstance ?? '—' }}
                    </template>
                  </Column>
                  <Column field="preAnalysis.reception" header="N° Acta">
                    <template #body="slotProps">
                      #{{ slotProps.data.preAnalysis?.reception?.number || '—' }}
                    </template>
                  </Column>

                  <Column field="preAnalysis.substance" header="Sustancia">
                    <template #body="slotProps">
                      {{ getSubstanceName(slotProps.data.preAnalysis?.substance) }}
                    </template>
                  </Column>
                  <Column field="result" header="Resultado">
                    <template #body="slotProps">
                      <Tag
                        :value="getAnalysisResult(slotProps.data)"
                        :severity="getResultSeverity(getAnalysisResult(slotProps.data))"
                      />
                    </template>
                  </Column>
                  <Column field="user" header="Analista">
                    <template #body="slotProps">
                      {{
                        (slotProps.data.user?.firstName || '') +
                        ' ' +
                        (slotProps.data.user?.lastName || '')
                      }}
                    </template>
                  </Column>
                  <Column field="state" header="Estado">
                    <template #body="slotProps">
                      {{ slotProps.data.state }}
                    </template>
                  </Column>
                  <Column field="createdAt" header="Fecha">
                    <template #body="slotProps">
                      {{ formatDate(slotProps.data.createdAt) }}
                    </template>
                  </Column>
                  <Column header="Acciones">
                    <template #body="slotProps">
                      <div class="analysis-actions">
                        <Button
                          v-if="getPrimaryAnalysisAction(slotProps.data, tab.key)"
                          :label="getPrimaryAnalysisAction(slotProps.data, tab.key).label"
                          :icon="getPrimaryAnalysisAction(slotProps.data, tab.key).icon"
                          :severity="getPrimaryAnalysisAction(slotProps.data, tab.key).severity"
                          size="small"
                          class="primary-analysis-action"
                          @click="runPrimaryAnalysisAction(slotProps.data, tab.key)"
                        />
                        <Button
                          v-if="hasMoreAnalysisActions(slotProps.data, tab.key)"
                          icon="pi pi-ellipsis-v"
                          severity="secondary"
                          text
                          rounded
                          size="small"
                          aria-label="Más acciones"
                          @click="openAnalysisActionsMenu($event, slotProps.data, tab.key)"
                          v-tooltip.top="'Más acciones'"
                        />
                      </div>
                    </template>
                  </Column>
                </DataTable>
              </div>
            </TabPanel>
          </TabView>
        </div>
      </div>
    </template>
  </PlantillaContenido>

  <!-- DIÁLOGO PARA ENVIAR A PRE-ANÁLISIS INDIVIDUAL -->
  <PreAnalysisDialog
    v-model:visible="showPreAnalysisDialog"
    :selected-substance="selectedSubstance"
    :destinations="destinations"
    :methods-destruction="methodsDestruction"
    :loading-destinations="loadingDestinations"
    :loading-methods-destruction="loadingMethodsDestruction"
    :loading="isSendingToPreAnalysis"
    @submit="sendToPreAnalysis"
    @cancel="handlePreAnalysisCancel"
  />

  <BulkPreAnalysisDialog
    v-model:visible="showBulkPreAnalysisDialog"
    :selected-substances="selectedSubstances"
    :destinations="destinations"
    :methods-destruction="methodsDestruction"
    :loading="isSendingBulkToPreAnalysis"
    @submit="sendBulkToPreAnalysis"
    @cancel="handleBulkPreAnalysisCancel"
  />

  <MicroanalysisDialog
    v-model:visible="showMicroanalysisDialog"
    :analysis="selectedAnalysisForMicroanalysis"
    @saved="fetchAnalyses"
  />

  <ChemicalTestDialog
    v-model:visible="showChemicalTestDialog"
    :analysis="selectedAnalysisForChemicalTest"
    @saved="fetchAnalyses"
  />

  <CompleteAnalysis
    ref="macroanalysisDialogRef"
    :analysis="selectedAnalysisForMacroanalysis"
    :show-trigger="false"
    @processed="fetchAnalyses"
  />

  <AnalysisHistoryDialog
    v-model:visible="showAnalysisHistoryDialog"
    :analysis-id="selectedAnalysisForHistory?.id"
    type="all"
    :title="analysisHistoryTitle"
  />

  <PrimeMenu ref="analysisActionsMenu" :model="analysisActionMenuItems" popup />

  <AnalysisDocumentDialog
    v-model:visible="showAnalysisDocumentDialog"
    :analysis="selectedAnalysisForDocuments"
  />

  <!-- DIÁLOGO PARA NÚMERO RESERVADO -->
  <Dialog
    v-model:visible="showReservedNumberDialog"
    modal
    header="Ingrese Número Reservado"
    :style="{ width: '400px' }"
    :modal="true"
  >
    <div class="flex flex-column gap-4">
      <div class="field">
        <label for="reserved">Número Reservado</label>
        <InputNumber
          id="reserved"
          v-model="reservedNumber"
          :useGrouping="false"
          placeholder="Ingrese el número reservado"
          autofocus
        />
      </div>
    </div>

    <template #footer>
      <Button
        label="Cancelar"
        severity="secondary"
        @click="showReservedNumberDialog = false"
        :disabled="isGeneratingReport"
      />
      <Button
        label="Previsualizar"
        icon="pi pi-eye"
        severity="info"
        outlined
        @click="previewConsolidatedReport"
        :disabled="isGeneratingReport"
      />
      <Button
        label="Generar Informe"
        severity="success"
        @click="confirmGenerateReport"
        :loading="isGeneratingReport"
        :disabled="isGeneratingReport"
      />
    </template>
  </Dialog>

  <!-- DIÁLOGO PARA NÚMEROS DE RESERVADOS (Fiscalía Local e ISP) -->
  <Dialog
    v-model:visible="showReservedsDialog"
    modal
    header="Ingrese Números de Reservados"
    :style="{ width: '650px' }"
    :breakpoints="{ '768px': '95vw' }"
    :modal="true"
  >
    <div class="flex flex-column gap-4">
      <div class="field">
        <label for="fiscaliaLocal">Número Reservado - Fiscalía Local *</label>
        <InputNumber
          id="fiscaliaLocal"
          v-model="reservedsData.fiscaliaLocal"
          :useGrouping="false"
          placeholder="Ingrese número de Fiscalía Local"
          autofocus
        />
      </div>

      <div class="field">
        <label for="isp">Número Reservado - Instituto de Salud Pública *</label>
        <InputNumber
          id="isp"
          v-model="reservedsData.isp"
          :useGrouping="false"
          placeholder="Ingrese número de ISP"
        />
      </div>
    </div>

    <template #footer>
      <Button
        label="Cancelar"
        severity="secondary"
        @click="showReservedsDialog = false"
        :disabled="isGeneratingReserveds"
      />
      <Button
        label="Previsualizar ISP"
        icon="pi pi-eye"
        severity="info"
        outlined
        @click="previewReserved('isp')"
        :loading="previewingReserved === 'isp'"
        :disabled="isGeneratingReserveds || Boolean(previewingReserved)"
      />
      <Button
        label="Previsualizar Fiscalía"
        icon="pi pi-eye"
        severity="success"
        outlined
        @click="previewReserved('fiscalia')"
        :loading="previewingReserved === 'fiscalia'"
        :disabled="isGeneratingReserveds || Boolean(previewingReserved)"
      />
      <Button
        label="Generar Reservados"
        severity="info"
        @click="confirmGenerateReserveds"
        :loading="isGeneratingReserveds"
        :disabled="isGeneratingReserveds"
      />
    </template>
  </Dialog>
</template>

<script>
import { ref, onMounted, computed, nextTick, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { FilterMatchMode } from 'primevue/api'
import PlantillaContenido from '../template/PlantillaContenido.vue'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import PrimeMenu from 'primevue/menu'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Chip from 'primevue/chip'
import Checkbox from 'primevue/checkbox'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Tag from 'primevue/tag'

import preAnalysisService from '@/services/preAnalysisService.js'
import analysisService from '@/services/analysisService.js'
import reservedsService from '@/services/reservedsService.js'
import { generarActaPDF } from '@/others/generarActaBtn.js'
import { generarReporteAnalisisPDF } from '@/others/generarReporteAnalisis.js'
import { generarInformeConsolidadoPDF } from '@/others/generarInformeConsolidado.js'
import { generarReservadoPDF, generarReservadoFiscaliaPDF } from '@/others/generarReservadoPDF.js'
import { generarReporteMicroanalisisPDF } from '@/others/generarReporteMicroanalisis.js'
import recepcionService from '@/services/receptionsService.js'
import substancesService from '@/services/substancesService.js'
import EditReceptionUnlock from '@/components/receptions/EditReceptionUnlock.vue'
import destinationsService from '@/services/destinationsService.js'
import methodsDestructionsService from '@/services/methodsDestructionsService.js'
import storagesService from '@/services/storagesService.js'
import destructionsHeaderService from '@/services/destructionsHeaderService.js'
import destructionDetailsService from '@/services/destructionDetailsService.js'
import microanalysisService from '@/services/microanalysisService.js'

import PreAnalysisDialog from '@/components/preanalysis/PreAnalysisDialog.vue'
import BulkPreAnalysisDialog from '@/components/preanalysis/BulkPreAnalysisDialog.vue'
import CompleteAnalysis from '@/components/analysis/CompleteAnalysis.vue'
import MicroanalysisDialog from '@/components/analysis/MicroanalysisDialog.vue'
import ChemicalTestDialog from '@/components/analysis/ChemicalTestDialog.vue'
import AnalysisHistoryDialog from '@/components/analysis/AnalysisHistoryDialog.vue'
import AnalysisDocumentDialog from '@/components/analysis/AnalysisDocumentDialog.vue'
export default {
  name: 'PreAnalysisView',
  components: {
    PlantillaContenido,
    Card,
    DataTable,
    Column,
    Button,
    PrimeMenu,
    InputText,
    IconField,
    InputIcon,
    Dialog,
    Dropdown,
    InputNumber,
    Textarea,
    Chip,
    Checkbox,
    TabView,
    TabPanel,
    Tag,
    EditReceptionUnlock,
    PreAnalysisDialog,
    BulkPreAnalysisDialog,
    CompleteAnalysis,
    MicroanalysisDialog,
    ChemicalTestDialog,
    AnalysisHistoryDialog,
    AnalysisDocumentDialog,
  },

  setup() {
    const loading = ref(false)
    const toast = useToast()
    const receptions = ref([])
    const preAnalysisList = ref([])
    const expandedRows = ref({})
    const loadingSubstances = ref(null)
    const acceptingReceptionId = ref(null)
    const sendingSubstanceId = ref(null)
    const isSendingToPreAnalysis = ref(false)
    const selectedPreAnalysis = ref([])
    const loadingPreAnalysis = ref(false)
    const analysisList = ref([])
    const loadingAnalysis = ref(false)
    const selectedAnalysis = ref([])
    const selectedAnalysisActNumber = ref(null)
    const activeAnalysisTab = ref(0)

    const isCannabisAnalysis = (analysis) => {
      const substance = analysis?.preAnalysis?.substance
      const substanceName = substance?.substanceType?.name || substance?.substanceTypeName || ''
      const normalizedName = substanceName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()

      if (normalizedName.includes('resina')) return false

      return normalizedName.includes('cannabis') || normalizedName.includes('marihuana')
    }

    const macroanalysisStates = new Set([
      'PENDIENTE',
      'MACRO_COMPLETADO',
      'MICRO_COMPLETADO',
      'COMPLETADO',
      'COMPLETADO_RESERVADO',
    ])

    const canEditMacroanalysis = (analysis) => {
      return macroanalysisStates.has(String(analysis?.state || '').toUpperCase())
    }

    const microanalysisStates = new Set([
      'MACRO_COMPLETADO',
      'MICRO_COMPLETADO',
      'COMPLETADO',
      'COMPLETADO_RESERVADO',
    ])

    const canEditMicroanalysis = (analysis) => {
      return microanalysisStates.has(String(analysis?.state || '').toUpperCase())
    }

    const isMicroanalysisEditing = (analysis) => {
      return String(analysis?.state || '').toUpperCase() !== 'MACRO_COMPLETADO'
    }

    const chemicalTestStates = new Set(['MICRO_COMPLETADO', 'COMPLETADO', 'COMPLETADO_RESERVADO'])

    const canEditChemicalTest = (analysis) => {
      return chemicalTestStates.has(String(analysis?.state || '').toUpperCase())
    }

    const isChemicalTestEditing = (analysis) => {
      return String(analysis?.state || '').toUpperCase() !== 'MICRO_COMPLETADO'
    }

    const canViewAnalysisHistory = (analysis) => {
      return microanalysisStates.has(String(analysis?.state || '').toUpperCase())
    }

    const analysisTabs = computed(() => [
      {
        key: 'cannabis',
        label: 'Cannabis',
        analyses: analysisList.value.filter(isCannabisAnalysis),
      },
      {
        key: 'isp',
        label: 'ISP',
        analyses: analysisList.value.filter((analysis) => !isCannabisAnalysis(analysis)),
      },
    ])

    watch(activeAnalysisTab, () => {
      selectedAnalysis.value = []
      selectedAnalysisActNumber.value = null
    })

    // Diálogos y menú contextual de acciones del análisis.
    const macroanalysisDialogRef = ref(null)
    const selectedAnalysisForMacroanalysis = ref(null)
    const analysisActionsMenu = ref(null)
    const analysisActionMenuItems = ref([])

    // Dialog de microanálisis
    const showMicroanalysisDialog = ref(false)
    const selectedAnalysisForMicroanalysis = ref(null)

    // Dialog de examen químico
    const showChemicalTestDialog = ref(false)
    const selectedAnalysisForChemicalTest = ref(null)

    // Historial unificado de macroanálisis, microanálisis y examen químico.
    const showAnalysisHistoryDialog = ref(false)
    const selectedAnalysisForHistory = ref(null)
    const analysisHistoryTitle = computed(() => {
      const analysis = selectedAnalysisForHistory.value
      if (!analysis) return 'Historial de modificaciones'

      const reference = analysis.number_protocol
        ? `protocolo ${analysis.number_protocol}`
        : `análisis #${analysis.id}`
      return `Historial del ${reference}`
    })

    // Los documentos se gestionan exclusivamente desde las filas de la pestaña ISP.
    const showAnalysisDocumentDialog = ref(false)
    const selectedAnalysisForDocuments = ref(null)

    const openAnalysisDocumentDialog = (analysis) => {
      selectedAnalysisForDocuments.value = analysis
      showAnalysisDocumentDialog.value = true
    }

    // Dialog para número reservado
    const showReservedNumberDialog = ref(false)
    const reservedNumber = ref(null)
    const isGeneratingReport = ref(false)

    // Dialog para números de reservados (Fiscalía Local e ISP)
    const showReservedsDialog = ref(false)
    const reservedsData = ref({
      fiscaliaLocal: null,
      isp: null,
    })
    const isGeneratingReserveds = ref(false)
    const previewingReserved = ref(null)

    // Diálogo de pre-análisis individual
    const showPreAnalysisDialog = ref(false)
    const selectedSubstance = ref(null)
    const selectedReception = ref(null)

    // Variables para el procesamiento masivo
    const selectedSubstances = ref([])
    const selectedReceptionForBulk = ref(null)
    const showBulkPreAnalysisDialog = ref(false)
    const isSendingBulkToPreAnalysis = ref(false)
    const destinations = ref([])
    const methodsDestruction = ref([])
    const loadingDestinations = ref(false)
    const loadingMethodsDestruction = ref(false)
    const bulkPreAnalysisData = ref([])

    const filtersReception = ref({
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    })

    // Helpers para selección restringida por Nº de acta
    const getActNumber = (row) => {
      return row?.preAnalysis?.reception?.number ?? row?.reception?.number ?? null
    }

    const isAnalysisSelected = (row) => {
      return selectedAnalysis.value.some((r) => r.id === row.id)
    }

    const canSelectAnalysis = (row) => {
      // No permitir seleccionar si el estado es COMPLETADO_RESERVADO
      if (row.state === 'COMPLETADO_RESERVADO') {
        return false
      }

      // Permitir seleccionar si el destino NO es 1 (Exterior/ISP)
      if (row.preAnalysis?.destination?.id !== 1) {
        return true
      }

      // Para destino 1 (Interior), aplicar la lógica original
      const current = selectedAnalysisActNumber.value
      const rowAct = getActNumber(row)
      const isCompleted = (row.state || '').toUpperCase() === 'COMPLETADO'

      if (!isCompleted) return false
      if (current == null) return true
      return rowAct === current
    }

    const canSelectRow = (row) => {
      // No permitir seleccionar si el estado es RESERVADO
      if (row.state === 'RESERVADO') {
        return false
      }

      // Si no hay nada seleccionado, permitir
      if (selectedAnalysis.value.length === 0) {
        return true
      }

      // Obtener el acta del primer elemento seleccionado
      const firstSelectedRow = selectedAnalysis.value[0]
      const firstSelectedAct = getActNumber(firstSelectedRow)
      const currentRowAct = getActNumber(row)

      // No permitir si el acta es diferente
      if (firstSelectedAct !== currentRowAct) {
        return false
      }

      return true
    }

    const hasOnlyInteriorDestination = computed(() => {
      if (selectedAnalysis.value.length === 0) return false
      return selectedAnalysis.value.every((analysis) => analysis.preAnalysis?.destination?.id === 1)
    })

    const hasOnlyExteriorDestination = computed(() => {
      if (selectedAnalysis.value.length === 0) return false
      return selectedAnalysis.value.every((analysis) => analysis.preAnalysis?.destination?.id !== 1)
    })

    const toggleAnalysisSelection = (row) => {
      // Validar si se puede seleccionar esta fila según el acta
      if (selectedAnalysis.value.length > 0 && !canSelectRow(row)) {
        const firstSelectedRow = selectedAnalysis.value[0]
        const firstAct = getActNumber(firstSelectedRow)
        const currentAct = getActNumber(row)

        toast.add({
          severity: 'warn',
          summary: 'Selección no permitida',
          detail: `No puede mezclar actas distintas. Ya tiene seleccionada acta Nº ${firstAct}`,
          life: 3000,
        })
        return
      }

      if (!canSelectAnalysis(row)) {
        const isCompleted = (row.state || '').toUpperCase() === 'COMPLETADO'
        if (!isCompleted) {
          toast.add({
            severity: 'warn',
            summary: 'Selección no permitida',
            detail: 'Solo puede seleccionar análisis con estado COMPLETADO',
            life: 2000,
          })
          return
        }

        const act = selectedAnalysisActNumber.value
        toast.add({
          severity: 'warn',
          summary: 'Selección limitada',
          detail: `Solo puede seleccionar análisis del Nº de acta ${act}`,
          life: 2000,
        })
        return
      }

      const idx = selectedAnalysis.value.findIndex((r) => r.id === row.id)
      if (idx >= 0) {
        selectedAnalysis.value.splice(idx, 1)
      } else {
        selectedAnalysis.value.push(row)
      }

      // Solo actualizar el acta number si no es un análisis de ISP
      if (row.preAnalysis?.destination?.id === 1) {
        if (selectedAnalysis.value.length === 0) {
          selectedAnalysisActNumber.value = null
        } else if (selectedAnalysis.value.length === 1) {
          selectedAnalysisActNumber.value = getActNumber(selectedAnalysis.value[0])
        }
      }
    }

    const filters = ref({
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    })

    // Computed para validar el formulario individual
    const isPreAnalysisFormValid = computed(() => {
      const totalAvailable = getSubstanceTotalAvailable(selectedSubstance.value)
      return (
        preAnalysisData.value.destination &&
        preAnalysisData.value.weight_sampled &&
        preAnalysisData.value.weight_sampled > 0 &&
        preAnalysisData.value.weight_sampled <= totalAvailable
      )
    })

    // Computed para mostrar/ocultar pesos individuales
    const showIndividualWeights = computed(() => {
      return !bulkPreAnalysisData.value.useAutoWeight
    })

    const isUnitMeasurementType = (measurementType) => {
      const normalizedMeasurementType = String(measurementType || '')
        .trim()
        .toLowerCase()

      return (
        normalizedMeasurementType.includes('unidad') ||
        normalizedMeasurementType.includes('paquete')
      )
    }

    const getSubstanceTotalAvailable = (substance) =>
      isUnitMeasurementType(substance?.measurement_type)
        ? Number(substance?.unit_quantity || 0)
        : Number(substance?.weight_net ?? substance?.weight ?? 0)

    const isRowSelectable = (data) => {
      console.log(data.state)
      console.log(data.reception.state)
      if (data.state != 'DERIVADO' && data.reception.state === 'ACEPTADO') {
        return ''
      } else {
        return 'p-disabled'
      }
    }
    // Computed para validar el formulario masivo
    const isBulkPreAnalysisFormValid = computed(() => {
      if (!bulkPreAnalysisData.value.destination) return false

      if (bulkPreAnalysisData.value.useAutoWeight) {
        if (
          !bulkPreAnalysisData.value.autoWeightValue ||
          bulkPreAnalysisData.value.autoWeightValue <= 0
        )
          return false
        return selectedSubstances.value.every((substance) => {
          const individualWeight = bulkPreAnalysisData.value.individualWeights[substance.id] || {}
          const contr = individualWeight.contra || 0
          const totalAvailable = getSubstanceTotalAvailable(substance)
          const sample = Number(bulkPreAnalysisData.value.autoWeightValue)
          const validAmounts = sample + Number(contr) <= totalAvailable
          const validUnits =
            !isUnitMeasurementType(substance?.measurement_type) ||
            (Number.isInteger(sample) && Number.isInteger(Number(contr)))
          return validAmounts && validUnits
        })
      } else {
        // Validar que todas las sustancias tengan peso de muestra asignado y que muestra+contra <= peso total
        return selectedSubstances.value.every((substance) => {
          const obj = bulkPreAnalysisData.value.individualWeights[substance.id] || {}
          const sample = Number(obj.sample) || 0
          const contra = Number(obj.contra) || 0
          const totalAvailable = getSubstanceTotalAvailable(substance)

          const validAmounts = sample > 0 && sample + contra <= totalAvailable
          const validUnits =
            !isUnitMeasurementType(substance?.measurement_type) ||
            (Number.isInteger(sample) && Number.isInteger(contra))
          return validAmounts && validUnits
        })
      }
    })

    const fetchReceptions = async () => {
      try {
        loading.value = true
        const { data } = await recepcionService.getAllPaginatedByState('', 0, 10, 'asc')
        receptions.value = data.content || data || []

        // Verificar pre-análisis existentes para cada sustancia
        await checkExistingPreAnalysis()
      } catch (e) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las recepciones',
        })
      } finally {
        loading.value = false
      }
    }
    const fetchDropdownData = async () => {
      try {
        loadingDestinations.value = true
        loadingMethodsDestruction.value = true

        const [destinationsResponse, methodsResponse] = await Promise.all([
          destinationsService.getAll(),
          methodsDestructionsService.getAll(),
        ])

        destinations.value = destinationsResponse.data?.content || destinationsResponse.data || []
        methodsDestruction.value = methodsResponse.data?.content || methodsResponse.data || []
      } catch (error) {
        console.error('❌ Error cargando datos de dropdowns:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los destinos o métodos de destrucción',
          life: 3000,
        })
      } finally {
        loadingDestinations.value = false
        loadingMethodsDestruction.value = false
      }
    }

    // Verificar pre-análisis existentes
    const checkExistingPreAnalysis = async () => {
      try {
        const { data: preAnalysisData } = await preAnalysisService.getAll()
        const preAnalysisMap = new Map()

        preAnalysisData.content?.forEach((pa) => {
          if (pa.substance?.id) {
            preAnalysisMap.set(pa.substance.id, true)
          }
        })

        // Marcar sustancias que ya tienen pre-análisis
        receptions.value.forEach((reception) => {
          if (reception.substances) {
            reception.substances.forEach((substance) => {
              substance.hasPreAnalysis = preAnalysisMap.has(substance.id)
            })
          }
        })
      } catch (error) {
        console.error('Error verificando pre-análisis:', error)
      }
    }

    const handleReceptionUpdated = async (eventData) => {
      try {
        console.log('🔄 Actualizando tabla después de edición:', eventData)
        toast.add({
          severity: 'success',
          summary: 'Actualizado',
          detail: eventData.message || 'Recepción actualizada correctamente',
          life: 3000,
        })
        await fetchReceptions()
      } catch (error) {
        console.error('❌ Error al actualizar tabla:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar la tabla',
          life: 3000,
        })
      }
    }

    // ACEPTAR RECEPCIÓN
    const acceptReception = async (reception) => {
      try {
        acceptingReceptionId.value = reception.id

        const payload = {
          ...reception,
          state: 'ACEPTADO',
          is_editable: 'NO',
        }

        await recepcionService.update(reception.id, payload)

        toast.add({
          severity: 'success',
          summary: 'Recepción Aceptada',
          detail: `La recepción #${reception.number} ha sido aceptada correctamente`,
          life: 3000,
        })

        await fetchReceptions()
      } catch (error) {
        console.error('❌ Error aceptando recepción:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo aceptar la recepción',
          life: 3000,
        })
      } finally {
        acceptingReceptionId.value = null
      }
    }

    // MÉTODOS PARA PRE-ANÁLISIS INDIVIDUAL
    const openSendToPreAnalysis = (substance, reception) => {
      selectedSubstance.value = substance
      selectedReception.value = reception
      showPreAnalysisDialog.value = true
    }

    const sendToPreAnalysis = async (formData) => {
      try {
        isSendingToPreAnalysis.value = true

        const payload = {
          substance: selectedSubstance.value,
          reception: { id: selectedReception.value.id },
          destination: formData.destination,
          weight_sampled: formData.weight_sampled,
          weightContra: 0,
          weightDestruction:
            getSubstanceTotalAvailable(selectedSubstance.value) - Number(formData.weight_sampled),
          methodDestruction: formData.methodDestruction,
          observation: formData.observation,
          user: { id: parseInt(localStorage.getItem('user_id')) || 1 },
        }

        // Crear pre-análisis y actualizar sustancia en paralelo
        await Promise.all([
          preAnalysisService.create(payload),
          substancesService.update(selectedSubstance.value.id, {
            ...selectedSubstance.value,
            packaging: { id: 13 },
            state: 'DERIVADO',
          }),
        ])

        toast.add({
          severity: 'success',
          summary: 'Enviado a Pre-Análisis',
          detail: `La sustancia ${selectedSubstance.value.nue} ha sido enviada a pre-análisis`,
          life: 3000,
        })

        showPreAnalysisDialog.value = false
        await fetchReceptions()
        await fetchPreAnalysis()
      } catch (error) {
        console.error('❌ Error enviando a pre-análisis:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo enviar a pre-análisis',
          life: 3000,
        })
      } finally {
        isSendingToPreAnalysis.value = false
      }
    }
    // MÉTODOS PARA PROCESAMIENTO MASIVO
    const getSelectedCountForReception = (reception) => {
      if (!reception.substances) return 0
      return selectedSubstances.value.filter((substance) =>
        reception.substances.some((s) => s.id === substance.id),
      ).length
    }

    const openBulkPreAnalysisDialogForReception = (reception) => {
      selectedReceptionForBulk.value = reception
      openBulkPreAnalysisDialog()
    }

    const openBulkPreAnalysisDialog = () => {
      if (selectedSubstances.value.length === 0) {
        toast.add({
          severity: 'warn',
          summary: 'Sin selección',
          detail: 'Por favor seleccione al menos una sustancia',
          life: 3000,
        })
        return
      }

      // Inicializar datos del formulario
      bulkPreAnalysisData.value = {
        destination: null,
        methodDestruction: null,
        observation: '',
        useAutoWeight: false,
        autoWeightValue: null,
        individualWeights: {},
      }

      // Inicializar pesos individuales (sample y contra)
      selectedSubstances.value.forEach((substance) => {
        bulkPreAnalysisData.value.individualWeights[substance.id] = {
          sample: null,
          contra: null,
        }
      })

      showBulkPreAnalysisDialog.value = true
    }

    const closeBulkDialog = () => {
      showBulkPreAnalysisDialog.value = false
      selectedReceptionForBulk.value = null
    }

    const sendBulkToPreAnalysis = async (formData) => {
      try {
        isSendingBulkToPreAnalysis.value = true

        let successCount = 0
        let errorCount = 0
        const newlyCreatedAnalyses = []

        // 1️⃣ CREAR UN SOLO DESTRUCTION HEADER PARA TODAS LAS SUSTANCIAS
        let destructionHeader = null
        try {
          const totalWeight = selectedSubstances.value.reduce((sum, substance) => {
            const indiv = formData.individualWeights[substance.id] || { sample: null, contra: null }
            const sampleWeight = formData.useAutoWeight ? formData.autoWeightValue : indiv.sample
            const contraWeight = Number(indiv.contra) || 0
            const restante =
              getSubstanceTotalAvailable(substance) - Number(sampleWeight || 0) - contraWeight
            return sum + (restante > 0 ? restante : 0)
          }, 0)

          const headerPayload = {
            act_number: selectedReceptionForBulk.value?.number || `BULK-${Date.now()}`,
            date_destruction: new Date().toISOString().split('T')[0],
            observation: formData.observation || 'Procesamiento masivo',
            state: 'PENDIENTE',
            weight: totalWeight,
            methodDestruction: formData.methodDestruction,
            user: { id: parseInt(localStorage.getItem('user_id')) || 1 },
          }

          const { data: createdHeader } = await destructionsHeaderService.create(headerPayload)
          destructionHeader = createdHeader
          console.log('✅ Destruction Header creado:', destructionHeader)
        } catch (headerErr) {
          console.error('❌ Error creando destruction header:', headerErr)
          toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear el registro de destrucción',
            life: 3000,
          })
          return
        }

        // 2️⃣ PROCESAR CADA SUSTANCIA INDIVIDUALMENTE
        for (const substance of selectedSubstances.value) {
          try {
            const indiv = formData.individualWeights[substance.id] || { sample: null, contra: null }
            const sampleWeight = formData.useAutoWeight ? formData.autoWeightValue : indiv.sample
            const contraWeight = Number(indiv.contra) || 0
            const isUnitBalance = isUnitMeasurementType(substance?.measurement_type)
            const totalAvailable = getSubstanceTotalAvailable(substance)
            const restante = totalAvailable - Number(sampleWeight || 0) - contraWeight

            if (!sampleWeight || sampleWeight <= 0) throw new Error('Cantidad de muestra inválida')
            if (Number(sampleWeight) + contraWeight > totalAvailable)
              throw new Error('La suma de muestra y contramuestra excede el total disponible')
            if (
              isUnitBalance &&
              (!Number.isInteger(Number(sampleWeight)) || !Number.isInteger(contraWeight))
            )
              throw new Error('Las cantidades en unidades deben ser números enteros')

            // Crear pre-análisis
            const payload = {
              substance: substance,
              reception: selectedReceptionForBulk.value,
              destination: formData.destination,
              weight_sampled: sampleWeight,
              weightContra: contraWeight,
              weightDestruction: restante,
              methodDestruction: formData.methodDestruction,
              observation: formData.observation,
              user: { id: parseInt(localStorage.getItem('user_id')) || 1 },
            }

            const { data: createdPre } = await preAnalysisService.create(payload)

            // Crear análisis asociado al pre-análisis y agregarlo a una lista local
            try {
              const analysisPayload = {
                number_protocol: null,
                description: formData.observation || '',
                date_analysis: new Date().toISOString(),
                result: null,
                macro: null,
                micro: null,
                state: 'PENDIENTE',
                user: { id: parseInt(localStorage.getItem('user_id')) || 1 },
                template: { id: 1 },
                preAnalysis: createdPre,
              }
              const { data: createdAnalysis } = await analysisService.create(analysisPayload)
              if (createdAnalysis) newlyCreatedAnalyses.push(createdAnalysis)
            } catch (analysisErr) {
              console.warn('No se pudo crear el análisis automáticamente (bulk):', analysisErr)
            }

            // 3️⃣ Si hay contramuestra, crear registro de almacenamiento Y destruction detail
            if (contraWeight > 0) {
              try {
                await storagesService.create({
                  entry_date: new Date().toISOString().split('T')[0],
                  sample_quantity: 0,
                  counter_sample_quantity: contraWeight,
                  measurement_type: isUnitBalance
                    ? substance?.measurement_type || 'UNIDADES'
                    : 'GRAMOS',
                  unit_quantity: isUnitBalance ? contraWeight : null,
                  description: formData.observation || '',
                  substance: substance,
                  storageLocation: { id: 1 },
                })

              } catch (storErr) {
                console.warn('No se pudo crear registro de almacenamiento:', storErr)
              }
            }

            // 4️⃣ Crear el detalle con el saldo destinado a destrucción.
            if (restante > 0 && destructionHeader) {
              try {
                const detailPayload = {
                  state: 'PENDIENTE',
                  weight: restante,
                  measurement_type: isUnitBalance
                    ? substance?.measurement_type || 'UNIDADES'
                    : 'GRAMOS',
                  unit_quantity: isUnitBalance ? restante : null,
                  destructionHeader: destructionHeader,
                  substance: substance,
                }
                await destructionDetailsService.create(detailPayload)
                console.log(`✅ Destruction Detail creado para sustancia ${substance.nue}`)
              } catch (detailErr) {
                console.warn('No se pudo crear el detalle de destrucción:', detailErr)
              }
            }

            // Actualizar estado de la sustancia
            const payloadSubstance = {
              ...substance,
              packaging: { id: 13 },
              state: 'DERIVADO',
            }
            await substancesService.update(substance.id, payloadSubstance)

            successCount++
          } catch (error) {
            console.error(`❌ Error procesando sustancia ${substance.nue}:`, error)
            errorCount++
          }
        }

        if (errorCount === 0) {
          toast.add({
            severity: 'success',
            summary: 'Procesamiento Masivo Exitoso',
            detail: `${successCount} sustancias procesadas correctamente`,
            life: 4000,
          })
        } else {
          toast.add({
            severity: successCount > 0 ? 'warn' : 'error',
            summary: 'Procesamiento Parcial',
            detail: `${successCount} procesadas, ${errorCount} con errores`,
            life: 5000,
          })
        }
        // Inserción inmediata (optimista) al principio de la lista actual
        if (newlyCreatedAnalyses.length > 0) {
          analysisList.value = [...newlyCreatedAnalyses.reverse(), ...analysisList.value]
        }
        console.log('sakldjalkjdsalkjdalks')

        // Pequeño delay para asegurar persistencia en backend antes del refetch completo
        await new Promise((r) => setTimeout(r, 200))

        closeBulkDialog()
        selectedSubstances.value = []
      } catch (error) {
        console.error('❌ Error en procesamiento masivo:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error general en el procesamiento masivo',
          life: 4000,
        })
      } finally {
        isSendingBulkToPreAnalysis.value = false
      }
    }

    const handlePreAnalysisCancel = () => {
      console.log('Diálogo individual cancelado')
    }

    const handleBulkPreAnalysisCancel = () => {
      console.log('Diálogo masivo cancelado')
    }
    // VER PRE-ANÁLISIS DE UNA SUSTANCIA
    const viewPreAnalysisForSubstance = async (substance) => {
      try {
        // Buscar el pre-análisis correspondiente a esta sustancia
        const { data } = await preAnalysisService.getBySubstanceId(substance.id)
        const preAnalysis = data.content?.[0] || data?.[0]

        if (preAnalysis) {
          viewPreAnalysis(preAnalysis)
        } else {
          toast.add({
            severity: 'warn',
            summary: 'No encontrado',
            detail: 'No se encontró el pre-análisis para esta sustancia',
            life: 3000,
          })
        }
      } catch (error) {
        console.error('Error buscando pre-análisis:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el pre-análisis',
          life: 3000,
        })
      }
    }

    const fetchPreAnalysis = async () => {
      try {
        loadingPreAnalysis.value = true
        const { data } = await preAnalysisService.getAll()
        preAnalysisList.value = data.content || data || []
      } catch (e) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los pre-análisis',
        })
      } finally {
        loadingPreAnalysis.value = false
      }
    }

    const fetchAnalyses = async () => {
      try {
        loadingAnalysis.value = true
        const { data } = await analysisService.getAll()
        const raw = data.content || data || []
        analysisList.value = [...raw].sort((a, b) => {
          const da = new Date(a.createdAt || a.date_analysis || 0)
          const db = new Date(b.createdAt || b.date_analysis || 0)
          return db - da
        })
      } catch (e) {
        console.error('Error cargando análisis:', e)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los análisis',
        })
      } finally {
        loadingAnalysis.value = false
      }
    }

    const onRowExpand = async (event) => {
      const reception = event.data
      loadingSubstances.value = reception.id

      try {
        const { data } = await substancesService.getByReceptionId(reception.id)
        reception.substances = data.content || data || []
        console.log(data)

        // Verificar si cada sustancia tiene pre-análisis
        await checkExistingPreAnalysis()
      } catch (err) {
        console.error('Error cargando sustancias:', err)
      } finally {
        loadingSubstances.value = null
      }
    }

    const onRowCollapse = (event) => {
      // Remover sustancias de la recepción colapsada de la selección
      if (event.data && event.data.substances) {
        const substanceIds = event.data.substances.map((s) => s.id)
        selectedSubstances.value = selectedSubstances.value.filter(
          (substance) => !substanceIds.includes(substance.id),
        )
      }
    }

    const getPoliceName = (police) => {
      if (!police) return '—'
      return `${police.firstName || ''} ${police.firstLastName || ''}`.trim() || '—'
    }

    const getSubstanceName = (substance) => {
      if (!substance) return '—'
      return substance.substanceType?.name || `Sustancia #${substance.id}`
    }

    const getAnalysisResult = (analysis) => {
      console.log(analysis)

      // Obtener los tres campos
      const macro = analysis.macro
      const micro = analysis.micro
      const result = analysis.result

      // Contar cuántos campos están llenos
      const filledCount = (macro ? 1 : 0) + (micro ? 1 : 0) + (result ? 1 : 0)
      console.log('Campos llenos:', filledCount)
      // Los análisis incompletos se muestran como EN PROCESO en Cannabis y ENVIADO en ISP
      if (filledCount < 3) {
        return isCannabisAnalysis(analysis) ? 'EN PROCESO' : 'ENVIADO'
      }

      // Si los tres son POSITIVO
      if (macro === 'POSITIVO' && micro === 'POSITIVO' && result === 'POSITIVO') {
        return 'POSITIVO'
      }

      // Si los tres son NEGATIVO
      if (macro === 'NEGATIVO' && micro === 'NEGATIVO' && result === 'NEGATIVO') {
        return 'NEGATIVO'
      }

      // Si son distintos
      return 'INDETERMINADO'
    }

    const getResultSeverity = (resultText) => {
      switch (resultText) {
        case 'POSITIVO':
          return 'danger'
        case 'NEGATIVO':
          return 'success'
        case 'INDETERMINADO':
          return 'warning'
        case 'EN PROCESO':
        case 'ENVIADO':
          return 'info'
        default:
          return 'info'
      }
    }

    const getDestinationName = (destinationId) => {
      if (!destinationId) return '—'
      const destination = destinations.value?.find((d) => d.id === destinationId)
      return destination?.name || '—'
    }

    const formatDate = (dateString) => {
      if (!dateString) return '—'
      const date = new Date(dateString)
      try {
        return date.toLocaleDateString('es-CL')
      } catch (e) {
        return date.toISOString().split('T')[0]
      }
    }

    // Processing of analyses is handled by the per-row `CompleteAnalysis` component

    const viewReceptionDetail = (reception) => {
      console.log('👁️ Ver recepción:', reception)
      toast.add({
        severity: 'info',
        summary: 'Ver detalle',
        detail: `Mostrando recepción #${reception.number}`,
        life: 2500,
      })
    }

    const viewPreAnalysis = (preAnalysis) => {
      console.log('👁️ Ver pre-análisis:', preAnalysis)
      toast.add({
        severity: 'info',
        summary: 'Ver detalle',
        detail: `Mostrando pre-análisis #${preAnalysis.id}`,
        life: 2500,
      })
    }
    const rowClassPreAnalysis = (row) => {
      console.log(row.data)

      const data = row && row.data ? row.data : row
      if (!data) return ''
      return data.state === 'BORRADOR' ? 'borrador-row' : ''
    }
    const generatePDF = async (item) => {
      const reception = item.reception || item?.substance?.reception || null
      const substance = item.substance || item

      if (!reception) {
        toast.add({
          severity: 'error',
          summary: 'No se puede generar PDF',
          detail: 'El pre-análisis no contiene una recepción válida',
        })
        return
      }

      generarActaPDF(reception, [substance])
    }

    const generateAnalysisReport = (analysis) => {
      try {
        if (!analysis || !analysis.preAnalysis) {
          toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pueden generar el reporte sin datos de análisis',
            life: 3000,
          })
          return
        }

        if ((analysis.state || '').toUpperCase() === 'PENDIENTE') {
          toast.add({
            severity: 'warn',
            summary: 'No disponible',
            detail: 'No se puede generar reporte para un análisis pendiente',
            life: 3000,
          })
          return
        }

        generarReporteAnalisisPDF(analysis)

        toast.add({
          severity: 'success',
          summary: 'Reporte generado',
          detail: 'El reporte de análisis se ha generado correctamente',
          life: 3000,
        })
      } catch (error) {
        console.error('Error generando reporte de análisis:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo generar el reporte de análisis',
          life: 3000,
        })
      }
    }

    const handleAnalysisCompleted = async () => {
      await fetchAnalyses()
    }

    const generateConsolidatedReport = () => {
      if (!selectedAnalysis.value.length) {
        toast.add({
          severity: 'warn',
          summary: 'Sin selección',
          detail: 'Debe seleccionar al menos un análisis',
          life: 2500,
        })
        return
      }

      // Limpiar campo y abrir modal
      reservedNumber.value = null
      showReservedNumberDialog.value = true
    }

    const previewConsolidatedReport = () => {
      if (!reservedNumber.value || reservedNumber.value.toString().trim() === '') {
        toast.add({
          severity: 'warn',
          summary: 'Número reservado requerido',
          detail: 'Debe ingresar un número reservado para previsualizar el informe',
          life: 2500,
        })
        return
      }

      try {
        generarInformeConsolidadoPDF(selectedAnalysis.value, reservedNumber.value, {
          preview: true,
          draft: true,
        })
      } catch (error) {
        console.error('Error previsualizando informe consolidado:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo previsualizar el informe consolidado',
          life: 3000,
        })
      }
    }

    const confirmGenerateReport = async () => {
      if (!reservedNumber.value || reservedNumber.value.toString().trim() === '') {
        toast.add({
          severity: 'warn',
          summary: 'Número reservado requerido',
          detail: 'Debe ingresar un número reservado',
          life: 2500,
        })
        return
      }

      try {
        isGeneratingReport.value = true

        let successCount = 0
        let errorCount = 0

        // Crear un registro de reserved por cada análisis seleccionado y actualizar estado
        for (const analysis of selectedAnalysis.value) {
          try {
            const reservedPayload = {
              number: reservedNumber.value,
              analysis: analysis,
              fiscal: true,
              isp: false,
            }
            await reservedsService.create(reservedPayload)

            // Actualizar estado del análisis a COMPLETADO_RESERVADO
            await analysisService.update(analysis.id, {
              ...analysis,
              state: 'COMPLETADO_RESERVADO',
            })

            successCount++
          } catch (error) {
            console.error(`Error creando reservado para análisis ${analysis.id}:`, error)
            errorCount++
          }
        }

        if (errorCount > 0) {
          toast.add({
            severity: 'warn',
            summary: 'Guardado Parcial',
            detail: `${successCount} reservados creados, ${errorCount} con errores`,
            life: 3000,
          })
        }

        // Generar el PDF con el informe consolidado
        generarInformeConsolidadoPDF(selectedAnalysis.value, reservedNumber.value)

        toast.add({
          severity: 'success',
          summary: 'Informe generado',
          detail: `Informe consolidado con ${selectedAnalysis.value.length} análisis generado correctamente`,
          life: 3000,
        })

        showReservedNumberDialog.value = false
        reservedNumber.value = null

        // Recargar análisis para actualizar estados
        await fetchAnalyses()
      } catch (error) {
        console.error('Error generando informe consolidado:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo generar el informe consolidado',
          life: 3000,
        })
      } finally {
        isGeneratingReport.value = false
      }
    }

    const generateReserveds = () => {
      if (!selectedAnalysis.value.length) {
        toast.add({
          severity: 'warn',
          summary: 'Sin selección',
          detail: 'Debe seleccionar al menos un análisis',
          life: 2500,
        })
        return
      }

      // Limpiar campos y abrir modal
      reservedsData.value = {
        fiscaliaLocal: null,
        isp: null,
      }
      showReservedsDialog.value = true
    }

    const validateReservedNumbers = () => {
      if (
        !reservedsData.value.fiscaliaLocal ||
        reservedsData.value.fiscaliaLocal.toString().trim() === ''
      ) {
        toast.add({
          severity: 'warn',
          summary: 'Número de Fiscalía Local requerido',
          detail: 'Debe ingresar el número de reservado de Fiscalía Local',
          life: 2500,
        })
        return false
      }

      if (!reservedsData.value.isp || reservedsData.value.isp.toString().trim() === '') {
        toast.add({
          severity: 'warn',
          summary: 'Número de ISP requerido',
          detail: 'Debe ingresar el número de reservado del Instituto de Salud Pública',
          life: 2500,
        })
        return false
      }

      return true
    }

    const previewReserved = async (documentType) => {
      if (!validateReservedNumbers()) return

      const analysis = selectedAnalysis.value[0]
      if (!analysis) {
        toast.add({
          severity: 'warn',
          summary: 'Sin selección',
          detail: 'Debe seleccionar al menos un análisis',
          life: 2500,
        })
        return
      }

      const previewWindow = window.open('', '_blank')
      if (!previewWindow) {
        toast.add({
          severity: 'warn',
          summary: 'Ventana bloqueada',
          detail: 'Permita las ventanas emergentes para previsualizar el reservado',
          life: 4000,
        })
        return
      }

      previewingReserved.value = documentType
      try {
        const previewReserveds = [
          {
            number: reservedsData.value.fiscaliaLocal,
            analysis,
            fiscal: true,
            isp: false,
          },
          {
            number: reservedsData.value.isp,
            analysis,
            fiscal: false,
            isp: true,
          },
        ]
        const previewOptions = {
          preview: true,
          draft: true,
          previewWindow,
          analyses: selectedAnalysis.value.map((selected) => ({ analysis: selected })),
        }

        if (documentType === 'isp') {
          await generarReservadoPDF(analysis, previewReserveds, previewOptions)
        } else {
          await generarReservadoFiscaliaPDF(analysis, previewReserveds, previewOptions)
        }

        toast.add({
          severity: 'success',
          summary: 'Vista previa generada',
          detail: `El borrador del reservado de ${documentType === 'isp' ? 'ISP' : 'Fiscalía'} se abrió en una pestaña nueva`,
          life: 3000,
        })
      } catch (error) {
        if (!previewWindow.closed) previewWindow.close()

        console.error('Error previsualizando reservado:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo previsualizar el documento reservado',
          life: 3000,
        })
      } finally {
        previewingReserved.value = null
      }
    }

    const confirmGenerateReserveds = async () => {
      if (!validateReservedNumbers()) return

      try {
        isGeneratingReserveds.value = true

        let successCount = 0
        let errorCount = 0

        // Crear dos registros por cada análisis
        for (const analysis of selectedAnalysis.value) {
          try {
            // Crear reservado de Fiscalía Local
            const fiscalPayload = {
              number: reservedsData.value.fiscaliaLocal,
              analysis: analysis,
              fiscal: true,
              isp: false,
            }
            await reservedsService.create(fiscalPayload)

            // Crear reservado de ISP
            const ispPayload = {
              number: reservedsData.value.isp,
              analysis: analysis,
              fiscal: false,
              isp: true,
            }
            await reservedsService.create(ispPayload)

            // Actualizar estado del análisis a RESERVADO
            await analysisService.update(analysis.id, {
              ...analysis,
              state: 'RESERVADO',
            })

            successCount++
          } catch (error) {
            console.error(`Error creando reservados para análisis ${analysis.id}:`, error)
            errorCount++
          }
        }

        if (errorCount === 0) {
          toast.add({
            severity: 'success',
            summary: 'Reservados generados',
            detail: `Reservados generados correctamente para ${successCount} análisis`,
            life: 3000,
          })
        } else {
          toast.add({
            severity: successCount > 0 ? 'warn' : 'error',
            summary: 'Generación Parcial',
            detail: `${successCount} exitosos, ${errorCount} con errores`,
            life: 3000,
          })
        }

        showReservedsDialog.value = false
        reservedsData.value = {
          fiscaliaLocal: null,
          isp: null,
        }

        // Recargar datos para actualizar la vista
        await fetchAnalyses()
      } catch (error) {
        console.error('Error generando reservados:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo generar los reservados',
          life: 3000,
        })
      } finally {
        isGeneratingReserveds.value = false
      }
    }

    const openMacroanalysisDialog = async (analysis) => {
      selectedAnalysisForMacroanalysis.value = analysis
      await nextTick()
      macroanalysisDialogRef.value?.openDialog()
    }

    const openMicroanalysisDialog = (analysis) => {
      selectedAnalysisForMicroanalysis.value = analysis
      showMicroanalysisDialog.value = true
    }

    const openChemicalTestDialog = (analysis) => {
      selectedAnalysisForChemicalTest.value = analysis
      showChemicalTestDialog.value = true
    }

    const openAnalysisHistoryDialog = (analysis) => {
      selectedAnalysisForHistory.value = analysis
      showAnalysisHistoryDialog.value = true
    }

    const getPrimaryAnalysisAction = (analysis, tabKey) => {
      if (tabKey === 'isp') {
        return { key: 'documents', label: 'Documentos', icon: 'pi pi-paperclip', severity: 'info' }
      }

      if (analysis?.preAnalysis?.destination?.id !== 1) return null

      switch (String(analysis?.state || '').toUpperCase()) {
        case 'PENDIENTE':
          return {
            key: 'macro',
            label: 'Macroanálisis',
            icon: 'pi pi-cog',
            severity: 'success',
          }
        case 'MACRO_COMPLETADO':
          return {
            key: 'micro',
            label: 'Microanálisis',
            icon: 'pi pi-search',
            severity: 'info',
          }
        case 'MICRO_COMPLETADO':
          return {
            key: 'chemical',
            label: 'Examen químico',
            icon: 'pi pi-file-edit',
            severity: 'warning',
          }
        case 'COMPLETADO':
          return {
            key: 'report',
            label: 'Generar reporte',
            icon: 'pi pi-file-pdf',
            severity: 'success',
          }
        case 'COMPLETADO_RESERVADO':
          return {
            key: 'consolidated',
            label: 'Informe consolidado',
            icon: 'pi pi-print',
            severity: 'info',
          }
        default:
          return null
      }
    }

    const runPrimaryAnalysisAction = (analysis, tabKey) => {
      const action = getPrimaryAnalysisAction(analysis, tabKey)
      if (!action) return

      const commands = {
        documents: () => openAnalysisDocumentDialog(analysis),
        macro: () => openMacroanalysisDialog(analysis),
        micro: () => openMicroanalysisDialog(analysis),
        chemical: () => openChemicalTestDialog(analysis),
        report: () => generateAnalysisReport(analysis),
        consolidated: () => printConsolidatedReport(analysis),
      }

      commands[action.key]?.()
    }

    const joinMenuSections = (sections) => {
      return sections
        .filter((section) => section.length > 0)
        .flatMap((section, index) => (index === 0 ? section : [{ separator: true }, ...section]))
    }

    const buildAnalysisActionMenu = (analysis, tabKey) => {
      const state = String(analysis?.state || '').toUpperCase()

      if (tabKey === 'isp') {
        const reservedDocuments = []
        if (state === 'RESERVADO') {
          reservedDocuments.push(
            {
              label: 'Imprimir reservado ISP',
              icon: 'pi pi-print',
              command: () => printReserved(analysis),
            },
            {
              label: 'Imprimir reservado Fiscalía',
              icon: 'pi pi-file-pdf',
              command: () => printReservedFiscalia(analysis),
            },
          )
        }
        return reservedDocuments
      }

      if (analysis?.preAnalysis?.destination?.id !== 1) return []

      const editActions = []
      if (state !== 'PENDIENTE' && canEditMacroanalysis(analysis)) {
        editActions.push({
          label: 'Editar macroanálisis',
          icon: 'pi pi-pencil',
          command: () => openMacroanalysisDialog(analysis),
        })
      }
      if (canEditMicroanalysis(analysis) && isMicroanalysisEditing(analysis)) {
        editActions.push({
          label: 'Editar microanálisis',
          icon: 'pi pi-pencil',
          command: () => openMicroanalysisDialog(analysis),
        })
      }
      if (canEditChemicalTest(analysis) && isChemicalTestEditing(analysis)) {
        editActions.push({
          label: 'Editar examen químico',
          icon: 'pi pi-pencil',
          command: () => openChemicalTestDialog(analysis),
        })
      }

      const documentActions = []
      if (analysis?.micro) {
        documentActions.push({
          label: 'Imprimir microanálisis',
          icon: 'pi pi-file-pdf',
          command: () => printMicroanalysis(analysis),
        })
      }
      if (state === 'COMPLETADO_RESERVADO') {
        documentActions.push({
          label: 'Generar reporte individual',
          icon: 'pi pi-file-pdf',
          command: () => generateAnalysisReport(analysis),
        })
      }

      const auditActions = canViewAnalysisHistory(analysis)
        ? [
            {
              label: 'Ver historial',
              icon: 'pi pi-history',
              command: () => openAnalysisHistoryDialog(analysis),
            },
          ]
        : []

      return joinMenuSections([editActions, documentActions, auditActions])
    }

    const hasMoreAnalysisActions = (analysis, tabKey) => {
      return buildAnalysisActionMenu(analysis, tabKey).length > 0
    }

    const openAnalysisActionsMenu = (event, analysis, tabKey) => {
      analysisActionMenuItems.value = buildAnalysisActionMenu(analysis, tabKey)
      analysisActionsMenu.value?.toggle(event)
    }

    const sendToISP = async (analysis) => {
      try {
        toast.add({
          severity: 'info',
          summary: 'Enviando a ISP',
          detail: `Análisis #${analysis.id} será enviado a ISP`,
          life: 3000,
        })

        // Aquí puedes implementar la lógica para enviar a ISP
        // Por ahora, solo mostramos un mensaje
        console.log('Enviando a ISP:', analysis)
      } catch (error) {
        console.error('❌ Error enviando a ISP:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo enviar a ISP',
          life: 3000,
        })
      }
    }

    const printReserved = async (analysis) => {
      try {
        // Obtener los números reservados de este análisis
        const response = await reservedsService.getByAnalysisId(analysis.id)
        const reserveds = response.data

        if (!reserveds || reserveds.length === 0) {
          toast.add({
            severity: 'warn',
            summary: 'Sin reservados',
            detail: 'No se encontraron números reservados para este análisis',
            life: 2500,
          })
          return
        }

        // Generar PDF con los números reservados
        await generarReservadoPDF(analysis, reserveds)

        toast.add({
          severity: 'success',
          summary: 'PDF Generado',
          detail: `Documento de reservados generado para análisis #${analysis.id}`,
          life: 3000,
        })
      } catch (error) {
        console.error('❌ Error imprimiendo reservado:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo imprimir el documento de reservados',
          life: 3000,
        })
      }
    }

    const printReservedFiscalia = async (analysis) => {
      try {
        // Obtener los números reservados de este análisis
        const response = await reservedsService.getByAnalysisId(analysis.id)
        const reserveds = response.data

        if (!reserveds || reserveds.length === 0) {
          toast.add({
            severity: 'warn',
            summary: 'Sin reservados',
            detail: 'No se encontraron números reservados para este análisis',
            life: 2500,
          })
          return
        }

        // Generar PDF con los números reservados para Fiscalía
        await generarReservadoFiscaliaPDF(analysis, reserveds)

        toast.add({
          severity: 'success',
          summary: 'PDF Generado',
          detail: `Documento de reservados Fiscalía generado para análisis #${analysis.id}`,
          life: 3000,
        })
      } catch (error) {
        console.error('❌ Error imprimiendo reservado Fiscalía:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo imprimir el documento de reservados Fiscalía',
          life: 3000,
        })
      }
    }

    const printMicroanalysis = async (analysis) => {
      const micro = await microanalysisService.getByAnalysisId(analysis.id)
      try {
        if (!analysis.micro) {
          toast.add({
            severity: 'warn',
            summary: 'Sin datos',
            detail: 'No hay información de microanálisis para este análisis',
            life: 2500,
          })
          return
        }

        // Generar PDF del microanálisis
        generarReporteMicroanalisisPDF(analysis, micro)

        toast.add({
          severity: 'success',
          summary: 'PDF Generado',
          detail: `Reporte de microanálisis generado para análisis #${analysis.id}`,
          life: 3000,
        })
      } catch (error) {
        console.error('❌ Error imprimiendo microanálisis:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo imprimir el reporte de microanálisis',
          life: 3000,
        })
      }
    }

    const printConsolidatedReport = async (analysis) => {
      try {
        // Obtener el número reservado asociado a este análisis
        const response = await reservedsService.getByAnalysisId(analysis.id)
        const reserveds = response.data

        if (!reserveds || reserveds.length === 0) {
          toast.add({
            severity: 'warn',
            summary: 'Sin reservados',
            detail: 'No se encontró número reservado para este análisis',
            life: 2500,
          })
          return
        }

        // Buscar el reservado fiscal (fiscal: true)
        const fiscalReserved = reserveds.find((r) => r.fiscal)
        if (!fiscalReserved) {
          toast.add({
            severity: 'warn',
            summary: 'Sin reservado fiscal',
            detail: 'No se encontró número reservado fiscal',
            life: 2500,
          })
          return
        }

        // Cargar todos los análisis asociados a este número reservado
        const analysesResponse = await reservedsService.getByNumberPaginated(fiscalReserved.number)
        const allAnalyses = analysesResponse.data.content || analysesResponse.data || []

        if (allAnalyses.length === 0) {
          toast.add({
            severity: 'warn',
            summary: 'Sin análisis',
            detail: 'No se encontraron análisis asociados a este reservado',
            life: 2500,
          })
          return
        }

        // Extraer los análisis del formato de respuesta
        const analyses = allAnalyses.map((item) => item.analysis)

        // Generar PDF con todos los análisis
        generarInformeConsolidadoPDF(analyses, fiscalReserved.number)

        toast.add({
          severity: 'success',
          summary: 'Informe Generado',
          detail: `Informe consolidado con ${analyses.length} análisis generado`,
          life: 3000,
        })
      } catch (error) {
        console.error('❌ Error imprimiendo informe consolidado:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo imprimir el informe consolidado',
          life: 3000,
        })
      }
    }

    onMounted(() => {
      console.log('✅ Vista de pre-análisis cargada')
      fetchPreAnalysis()
      fetchReceptions()
      fetchAnalyses()
      fetchDropdownData() // ← Agregar esta línea

      // Escuchar evento personalizado cuando PreAnalysis procesa sustancias
      window.addEventListener('analysisUpdated', () => {
        console.log('📊 Actualizando tabla de análisis desde PreAnalysis...')
        fetchAnalyses()
      })
    })

    return {
      loading,
      receptions,
      preAnalysisList,
      expandedRows,
      loadingSubstances,
      acceptingReceptionId,
      sendingSubstanceId,
      isSendingToPreAnalysis,
      showPreAnalysisDialog,
      showBulkPreAnalysisDialog,
      selectedSubstance,
      selectedReception,
      selectedSubstances,
      selectedReceptionForBulk,
      isSendingBulkToPreAnalysis,

      filtersReception,
      filters,
      isPreAnalysisFormValid,
      showIndividualWeights,
      isBulkPreAnalysisFormValid,
      acceptReception,
      openSendToPreAnalysis,
      sendToPreAnalysis,
      getSelectedCountForReception,
      openBulkPreAnalysisDialogForReception,
      openBulkPreAnalysisDialog,
      closeBulkDialog,
      sendBulkToPreAnalysis,
      viewPreAnalysisForSubstance,
      onRowExpand,
      onRowCollapse,
      getPoliceName,
      getSubstanceName,
      getAnalysisResult,
      getResultSeverity,
      getDestinationName,
      viewReceptionDetail,
      viewPreAnalysis,
      generatePDF,
      handleReceptionUpdated,
      formatDate,
      destinations,
      methodsDestruction,
      loadingDestinations,
      loadingMethodsDestruction,

      handlePreAnalysisCancel,
      handleBulkPreAnalysisCancel,
      selectedPreAnalysis,
      analysisList,
      analysisTabs,
      activeAnalysisTab,
      loadingAnalysis,
      selectedAnalysis,
      canSelectAnalysis,
      canSelectRow,
      canEditMacroanalysis,
      canEditMicroanalysis,
      isMicroanalysisEditing,
      canEditChemicalTest,
      isChemicalTestEditing,
      canViewAnalysisHistory,
      isAnalysisSelected,
      toggleAnalysisSelection,

      isRowSelectable,
      rowClassPreAnalysis,
      generateAnalysisReport,
      handleAnalysisCompleted,
      fetchAnalyses,
      generateConsolidatedReport,
      previewConsolidatedReport,
      macroanalysisDialogRef,
      selectedAnalysisForMacroanalysis,
      analysisActionsMenu,
      analysisActionMenuItems,
      getPrimaryAnalysisAction,
      runPrimaryAnalysisAction,
      hasMoreAnalysisActions,
      openAnalysisActionsMenu,
      showMicroanalysisDialog,
      selectedAnalysisForMicroanalysis,
      openMicroanalysisDialog,
      showChemicalTestDialog,
      selectedAnalysisForChemicalTest,
      openChemicalTestDialog,
      showAnalysisHistoryDialog,
      selectedAnalysisForHistory,
      analysisHistoryTitle,
      openAnalysisHistoryDialog,
      showAnalysisDocumentDialog,
      selectedAnalysisForDocuments,
      openAnalysisDocumentDialog,
      sendToISP,
      printReserved,
      printReservedFiscalia,
      printMicroanalysis,
      showReservedNumberDialog,
      reservedNumber,
      isGeneratingReport,
      confirmGenerateReport,
      showReservedsDialog,
      reservedsData,
      isGeneratingReserveds,
      previewingReserved,
      previewReserved,
      confirmGenerateReserveds,
      hasOnlyInteriorDestination,
      hasOnlyExteriorDestination,
      generateReserveds,
      printConsolidatedReport,
    }
  },
}
</script>

<style scoped>
.borrador-row {
  background-color: #fff6b8 !important;
}

:deep(.borrador-row) > td,
:deep(.borrador-row) td {
  background-color: #fff6b8 !important;
}

.analysis-actions {
  align-items: center;
  display: flex;
  gap: 0.35rem;
  justify-content: flex-start;
  min-width: 12.5rem;
}

.primary-analysis-action {
  justify-content: center;
  min-width: 10.5rem;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .analysis-actions {
    min-width: auto;
  }

  .primary-analysis-action {
    min-width: auto;
  }
}
</style>
