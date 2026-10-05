<template>
  <PlantillaContenido>
    <template #contenido>
      <div class="preanalysis-container">
        <div class="page-content">
          <div class="flex justify-content-between align-items-center mb-0">
            <h1>Gestión de Pre-Análisis</h1>
          </div>
          <TabView>
            <TabPanel header="Recepción">
              <div class="table-container">
                <DataTable
                  v-model:filters="filtersReception"
                  v-model:expandedRows="expandedRows"
                  :value="receptions"
                  paginator
                  :rows="10"
                  size="small"
                  :loading="loading"
                  dataKey="id"
                  scrollable
                  :rowClass="rowClassPreAnalysis"
                  class="p-datatable-striped p-datatable-gridlines users-table"
                  :globalFilterFields="[
                    'id',
                    'number',
                    'of_number',
                    'date_reception',
                    'of_number_date',
                    'police.firstName',
                    'police.firstLastName',
                  ]"
                  @rowExpand="onRowExpand"
                  @rowCollapse="onRowCollapse"
                >
                  <!-- BOTONES SUPERIORES -->
                  <template #header>
                    <div class="flex justify-content-between align-items-center w-full">
                      <IconField iconPosition="left">
                        <InputIcon><i class="pi pi-search" /></InputIcon>
                        <InputText
                          v-model="filtersReception.global.value"
                          placeholder="Buscar..."
                        />
                      </IconField>
                    </div>
                  </template>

                  <template #empty> No se encontraron recepciones. </template>

                  <!-- EXPANDER -->
                  <Column expander style="width: 3rem" />

                  <Column field="number" header="N° Acta" />
                  <Column field="of_number" header="N° Oficio" />
                  <Column field="date_reception" header="Fecha Recepción" />
                  <Column field="of_number_date" header="Fecha Oficio" />

                  <Column header="Policía">
                    <template #body="{ data }">
                      {{ getPoliceName(data.police) }}
                    </template>
                  </Column>
                  <Column field="state" header="Estado" />

                  <Column header="Acciones">
                    <template #body="slotProps">
                      <div class="flex align-items-center gap-2">
                        <!--  <Button
                          icon="pi pi-eye"
                          class="p-button-text p-button-info"
                          v-tooltip="'Ver Detalle'"
                          @click="viewReceptionDetail(slotProps.data)"
                        />
                        <Button
                          icon="pi pi-file-pdf"
                          class="p-button-text p-button-help"
                          v-tooltip="'Generar Informe PDF'"
                          @click="generatePDF(slotProps.data)"
                        />-->

                        <!-- BOTÓN PARA ACEPTAR RECEPCIÓN (solo si no es editable) -->
                        <Button
                          v-if="
                            (slotProps.data.is_editable !== 'SI' &&
                              slotProps.data.state === 'FINALIZADO') ||
                            slotProps.data.state === 'EDITADO'
                          "
                          icon="pi pi-check"
                          class="p-button-text p-button-success"
                          v-tooltip="'Aceptar Recepción'"
                          @click="acceptReception(slotProps.data)"
                          :loading="acceptingReceptionId === slotProps.data.id"
                        />

                        <!-- BOTÓN PARA HACER EDITABLE -->
                        <EditReceptionUnlock
                          v-if="
                            slotProps.data.is_editable !== 'SI' &&
                            slotProps.data.state !== 'BORRADOR'
                          "
                          :reception="slotProps.data"
                          @updated="handleReceptionUpdated"
                        />
                        <Button
                          v-if="
                            slotProps.data.is_editable === 'SI' &&
                            slotProps.data.state !== 'BORRADOR'
                          "
                          icon="pi pi-lock-open"
                          class="p-button-text p-button-success"
                          v-tooltip="'Generar Informe PDF'"
                        />
                      </div>
                    </template>
                  </Column>

                  <!-- EXPANSION: LISTA DE SUSTANCIAS -->
                  <template #expansion="slotProps">
                    <div class="p-3">
                      <!-- LOADER CUANDO SE EXPANDE -->
                      <div
                        v-if="loadingSubstances === slotProps.data.id"
                        class="flex justify-content-center py-4"
                      >
                        <i class="pi pi-spinner pi-spin" style="font-size: 2rem"></i>
                      </div>

                      <!-- TABLA UNA VEZ CARGADO -->
                      <div v-else>
                        <!-- HEADER DE SUSTANCIAS CON CONTADOR -->
                        <div class="flex justify-content-between align-items-center mb-3">
                          <h4>Sustancias de la Recepción</h4>
                          <div
                            v-if="slotProps.data.state === 'ACEPTADO'"
                            class="flex align-items-center gap-2"
                          >
                            <span class="text-sm text-500">
                              {{ getSelectedCountForReception(slotProps.data) }} sustancias
                              seleccionadas
                            </span>
                            <Button
                              v-if="getSelectedCountForReception(slotProps.data) > 0"
                              icon="pi pi-send"
                              label="Procesar Seleccionadas"
                              class="p-button-primary p-button-sm"
                              @click="openBulkPreAnalysisDialogForReception(slotProps.data)"
                            />
                          </div>
                        </div>

                        <DataTable
                          :value="slotProps.data.substances"
                          class="p-datatable-sm mt-0"
                          v-model:selection="selectedSubstances"
                          dataKey="id"
                          :rowClass="isRowSelectable"
                          selectionMode="checkbox"
                          @row-select="onSubstanceSelect"
                          @row-unselect="onSubstanceUnselect"
                        >
                          <!-- COLUMNA DE SELECCIÓN -->
                          <Column
                            selectionMode="multiple"
                            :rowSelectAll="false"
                            headerStyle="width: 3rem"
                          >
                          </Column>
                          <Column field="nsubstance" header="N°" />

                          <Column field="nue" header="NUE" />
                          <Column field="measurement_type" header="Tipo Medición">
                            <template #body="slotProps">
                              {{ slotProps.data.measurement_type || '-' }}
                            </template>
                          </Column>
                          <Column field="unit_quantity" header="Cantidad">
                            <template #body="slotProps">
                              {{
                                slotProps.data.unit_quantity === null ||
                                slotProps.data.unit_quantity === undefined ||
                                slotProps.data.unit_quantity === ''
                                  ? '-'
                                  : slotProps.data.unit_quantity
                              }}
                            </template>
                          </Column>
                          <Column field="weight" header="Peso Bruto">
                            <template #body="slotProps">
                              {{
                                slotProps.data.weight === null ||
                                slotProps.data.weight === undefined ||
                                slotProps.data.weight === ''
                                  ? '-'
                                  : slotProps.data.weight
                              }}
                            </template>
                          </Column>
                          <Column field="weight_net" header="Peso Neto">
                            <template #body="slotProps">
                              {{
                                slotProps.data.weight_net === null ||
                                slotProps.data.weight_net === undefined ||
                                slotProps.data.weight_net === ''
                                  ? '-'
                                  : slotProps.data.weight_net
                              }}
                            </template>
                          </Column>
                          <Column field="substanceType.name" header="Tipo" />
                          <Column field="state" header="Estado" />
                        </DataTable>

                        <template
                          v-if="
                            !slotProps.data.substances || slotProps.data.substances.length === 0
                          "
                        >
                          <p class="mt-3 text-500">No hay sustancias asociadas.</p>
                        </template>
                      </div>
                    </div>
                  </template>
                </DataTable>
              </div>
            </TabPanel>

            <TabPanel header="Muestras en Pre-Análisis">
              <div class="table-container">
                <DataTable
                  v-model:filters="filters"
                  v-model:selection="selectedPreAnalysis"
                  :value="preAnalysisList"
                  paginator
                  size="small"
                  :rows="10"
                  :rowsPerPageOptions="[5, 10, 20, 50]"
                  scrollable
                  class="p-datatable-striped p-datatable-gridlines users-table"
                  :loading="loadingPreAnalysis"
                  dataKey="id"
                  :globalFilterFields="[
                    'id',
                    'substance.substanceType.name',
                    'reception.number',
                    'weight_sampled',
                    'observation',
                    'destination.name',
                    'methodDestruction.name',
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

                  <template #empty> No se encontraron pre-análisis. </template>
                  <template #loading> Cargando pre-análisis. Por favor espere. </template>
                  <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

                  <Column field="reception" header="N° de Acta">
                    <template #body="slotProps">
                      #{{ slotProps.data.reception?.number || '—' }}
                    </template>
                  </Column>
                  <Column field="substance" header="Sustancia">
                    <template #body="slotProps">
                      {{ getSubstanceName(slotProps.data.substance) }}
                    </template>
                  </Column>

                  <Column field="weight_sampled" header="Peso(gr)">
                    <template #body="slotProps">
                      {{ slotProps.data.weight_sampled ?? '—' }}
                    </template>
                  </Column>

                  <Column field="observation" header="Observación">
                    <template #body="slotProps">
                      {{ slotProps.data.observation || 'Sin observación' }}
                    </template>
                  </Column>

                  <Column field="destination" header="Destino">
                    <template #body="slotProps">
                      {{ getDestinationName(slotProps.data.destination?.id) }}
                    </template>
                  </Column>

                  <Column field="methodDestruction" header="Mét. Destrucción">
                    <template #body="slotProps">
                      {{ slotProps.data.methodDestruction?.name || '—' }}
                    </template>
                  </Column>

                  <Column header="Acciones">
                    <template #body="slotProps">
                      <div class="flex align-items-center gap-2">
                        <Button
                          icon="pi pi-eye"
                          class="p-button-text p-button-info"
                          v-tooltip="'Ver Detalle'"
                          @click="viewPreAnalysis(slotProps.data)"
                        />
                        <Button
                          icon="pi pi-file-pdf"
                          class="p-button-text p-button-help"
                          v-tooltip="'Generar Informe PDF'"
                          @click="generatePDF(slotProps.data)"
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
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { FilterMatchMode } from 'primevue/api'
import PlantillaContenido from '../template/PlantillaContenido.vue'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
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

import preAnalysisService from '@/services/preAnalysisService.js'
import { generarActaPDF } from '@/others/generarActaBtn.js'
import recepcionService from '@/services/receptionsService.js'
import substancesService from '@/services/substancesService.js'
import EditReceptionUnlock from '@/components/receptions/EditReceptionUnlock.vue'
import destinationsService from '@/services/destinationsService.js'
import methodsDestructionsService from '@/services/methodsDestructionsService.js'
import analysisService from '@/services/analysisService.js'
import storagesService from '@/services/storagesService.js'
import destructionsService from '@/services/destructionsHeaderService.js'
import destructionDetailsService from '@/services/destructionDetailsService.js'

import PreAnalysisDialog from '@/components/preanalysis/PreAnalysisDialog.vue'
import BulkPreAnalysisDialog from '@/components/preanalysis/BulkPreAnalysisDialog.vue'
export default {
  name: 'PreAnalysisView',
  components: {
    PlantillaContenido,
    Card,
    DataTable,
    Column,
    Button,
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
    EditReceptionUnlock,
    PreAnalysisDialog,
    BulkPreAnalysisDialog,
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
    const isRowSelectable = (data) => {
      console.log(data.state)
      console.log(data.reception.state)

      // Primero verificar estado de derivación y recepción
      if (data.state === 'DERIVADO' || data.reception.state !== 'ACEPTADO') {
        return 'p-disabled'
      }

      // Si no hay sustancias seleccionadas, permitir seleccionar
      if (selectedSubstances.value.length === 0) {
        return ''
      }

      // Obtener el tipo de sustancia actual
      //const currentSubstanceTypeId = data.substanceType?.id
      // Obtener el tipo de la primera sustancia seleccionada
      //const firstSelectedSubstance = selectedSubstances.value[0]
      //const firstSelectedTypeId = firstSelectedSubstance.substanceType?.id

      // Definir grupos
      //const interiorGroup = [1, 2, 3]
      //const isCurrentInterior = interiorGroup.includes(currentSubstanceTypeId)
      //const isFirstSelectedInterior = interiorGroup.includes(firstSelectedTypeId)

      // Si ambos están en el mismo grupo, permitir
      // Si ambos están en grupos diferentes, permitir
      // Si uno está en interior y otro no, bloquear
      //if (isCurrentInterior === isFirstSelectedInterior) {
      //  return ''
      //} else {
      //  return 'p-disabled'
      //}
    }
    // Computed para validar el formulario masivo
    const isBulkPreAnalysisFormValid = computed(() => {
      if (!bulkPreAnalysisData.value.destination) return false

      if (bulkPreAnalysisData.value.useAutoWeight) {
        return (
          bulkPreAnalysisData.value.autoWeightValue && bulkPreAnalysisData.value.autoWeightValue > 0
        )
      } else {
        // Validar que todas las sustancias tengan peso asignado
        return selectedSubstances.value.every((substance) => {
          const weight = bulkPreAnalysisData.value.individualWeights[substance.id]
          return weight && weight > 0 && weight <= substance.weight
        })
      }
    })

    const fetchReceptions = async () => {
      try {
        loading.value = true

        // Preserve expanded rows before refreshing
        const expandedBefore = { ...expandedRows.value }

        const { data } = await recepcionService.getAllPaginatedByState('', 0, 10, 'asc')
        receptions.value = data.content || data || []

        // If there were expanded rows, reload substances for them so UI doesn't disappear
        const reloadPromises = []
        const expandedKeys = Object.keys(expandedBefore || {})
        if (expandedKeys.length > 0) {
          for (const key of expandedKeys) {
            const recId = Number(key)
            const reception = receptions.value.find((r) => Number(r.id) === recId)
            if (reception) {
              reloadPromises.push(loadSubstancesForReception(reception))
            }
          }
          // Wait for all expanded receptions to load their substances
          await Promise.all(reloadPromises)
        } else {
          // If no expanded rows, still ensure pre-analysis mapping is up-to-date
          await checkExistingPreAnalysis()
        }

        // Clean selectedSubstances to only keep those still present in receptions
        selectedSubstances.value = selectedSubstances.value.filter((ss) =>
          receptions.value.some((r) => r.substances && r.substances.some((s) => s.id === ss.id)),
        )
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

    // Helper: carga sustancias para una recepción y marca loading
    const loadSubstancesForReception = async (reception) => {
      if (!reception) return
      try {
        loadingSubstances.value = reception.id
        const { data } = await substancesService.getByReceptionId(reception.id)
        reception.substances = data.content || data || []

        // Verificar si cada sustancia tiene pre-análisis (actualiza flags)
        await checkExistingPreAnalysis()
      } catch (err) {
        console.error('Error cargando sustancias para recepción:', reception.id, err)
      } finally {
        loadingSubstances.value = null
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

        // Crear pre-análisis
        const { data: createdPre } = await preAnalysisService.create(payload)

        // Crear análisis asociado usando datos del formulario
        try {
          const analysisPayload = {
            number_protocol: null,
            description: '',
            date_analysis: new Date().toISOString(),
            result: null,
            macro: null,
            micro: null,
            state: 'PENDIENTE',
            user: { id: parseInt(localStorage.getItem('user_id')) || 1 },
            template: { id: 1 }, // Plantilla por defecto
            preAnalysis: { id: createdPre.id || createdPre?.data?.id || createdPre },
          }

          await analysisService.create(analysisPayload)
        } catch (analysisErr) {
          console.warn('No se pudo crear el análisis automáticamente:', analysisErr)
          toast.add({
            severity: 'warn',
            summary: 'Análisis no creado',
            detail: 'No se pudo crear el registro de análisis automáticamente',
            life: 4000,
          })
        }

        // Actualizar estado de la sustancia
        await substancesService.update(selectedSubstance.value.id, {
          ...selectedSubstance.value,
          packaging: { id: 13 },
          state: 'DERIVADO',
        })

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

      // Determinar destino automáticamente basado en el tipo de sustancia
      const firstSubstance = selectedSubstances.value[0]
      const substanceTypeId = firstSubstance.substanceType?.id
      const interiorGroup = [1, 2, 3]
      const isInteriorType = interiorGroup.includes(substanceTypeId)

      // Buscar el destino correcto
      let autoDestination = null
      if (isInteriorType) {
        autoDestination = destinations.value.find((d) => d.name?.toLowerCase().includes('interior'))
      } else {
        autoDestination = destinations.value.find((d) => d.name?.toLowerCase().includes('exterior'))
      }

      // Inicializar datos del formulario
      bulkPreAnalysisData.value = {
        destination: autoDestination || null,
        methodDestruction: null,
        observation: '',
        useAutoWeight: false,
        autoWeightValue: null,
        individualWeights: {},
      }

      // Inicializar pesos individuales (sample y contramuestra)
      selectedSubstances.value.forEach((substance) => {
        bulkPreAnalysisData.value.individualWeights[substance.id] = {
          sample: null,
          contra: null,
        }
      })

      showBulkPreAnalysisDialog.value = true
    }

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

    const closeBulkDialog = () => {
      showBulkPreAnalysisDialog.value = false
      selectedReceptionForBulk.value = null
    }

    const sendBulkToPreAnalysis = async (formData) => {
      try {
        isSendingBulkToPreAnalysis.value = true

        let successCount = 0
        let errorCount = 0

        // 1️⃣ CREAR UN SOLO DESTRUCTION HEADER PARA TODAS LAS SUSTANCIAS
        let destructionHeader = null
        try {
          // Calcular peso total de restantes (para destrucción)
          const totalRestante = selectedSubstances.value.reduce((sum, substance) => {
            const indiv = formData.individualWeights[substance.id] || { sample: null, contra: null }
            const sampleWeight = formData.useAutoWeight ? formData.autoWeightValue : indiv.sample
            const contraWeight = Number(indiv.contra) || 0
            const totalAvailable = getSubstanceTotalAvailable(substance)
            const restante = totalAvailable - Number(sampleWeight || 0) - contraWeight
            return sum + (restante > 0 ? restante : 0)
          }, 0)

          if (totalRestante > 0) {
            const destructionHeaderPayload = {
              act_number: selectedReceptionForBulk.value?.number || `BULK-${Date.now()}`,
              date_destruction: new Date().toISOString().split('T')[0],
              observation: formData.observation || 'Procesamiento masivo',
              state: 'PENDIENTE',
              weight: totalRestante,
              methodDestruction: formData.methodDestruction || null,
              user: { id: parseInt(localStorage.getItem('user_id')) || 1 },
            }
            const { data: createdHeader } =
              await destructionsService.create(destructionHeaderPayload)
            destructionHeader = createdHeader
            console.log('✅ Destruction Header creado (PreAnalysis):', destructionHeader)
          }
        } catch (headerErr) {
          console.error('❌ Error creando destruction header:', headerErr)
        }

        // 2️⃣ PROCESAR CADA SUSTANCIA INDIVIDUALMENTE
        for (const substance of selectedSubstances.value) {
          try {
            // Determinar pesos: muestra (sample), contramuestra (contra) y restante (destrucción)
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

            // 1) Crear pre-análisis (va a análisis)
            const payloadPre = {
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

            const { data: createdPre } = await preAnalysisService.create(payloadPre)

            // Crear análisis asociado al pre-análisis (antes de actualizar la sustancia)
            try {
              const analysisPayload = {
                number_protocol: null,
                description: '',
                date_analysis: new Date().toISOString(),
                result: null,
                macro: null,
                micro: null,
                state: 'PENDIENTE',
                user: { id: parseInt(localStorage.getItem('user_id')) || 1 },
                template: { id: 1 }, // Plantilla por defecto
                preAnalysis: createdPre,
              }

              await analysisService.create(analysisPayload)
            } catch (analysisErr) {
              console.warn('No se pudo crear el análisis automáticamente (bulk):', analysisErr)
            }

            // 2) Si hay contramuestra, crear registro en storage (almacenamiento)
            if (contraWeight > 0) {
              try {
                // storagesService guarda el registro de almacenamiento
                await storagesService.create({
                  entry_date: new Date().toISOString().split('T')[0],
                  sample_quantity: 0,
                  counter_sample_quantity: contraWeight,
                  measurement_type: isUnitBalance
                    ? substance?.measurement_type || 'UNIDADES'
                    : 'GRAMOS',
                  unit_quantity: isUnitBalance ? contraWeight : null,
                  description: '',
                  substance: substance,
                  storageLocation: { id: 1 },
                })
              } catch (storErr) {
                console.warn('No se pudo crear registro de almacenamiento:', storErr)
              }
            }

            // 3️⃣ Si hay restante para destrucción Y existe el header, crear SOLO el detail
            if (restante > 0 && destructionHeader) {
              try {
                const destructionDetailPayload = {
                  state: 'PENDIENTE',
                  weight: restante,
                  measurement_type: isUnitBalance
                    ? substance?.measurement_type || 'UNIDADES'
                    : 'GRAMOS',
                  unit_quantity: isUnitBalance ? restante : null,
                  destructionHeader: destructionHeader,
                  substance: substance,
                }
                await destructionDetailsService.create(destructionDetailPayload)
                console.log(`✅ Destruction Detail creado para sustancia ${substance.nue}`)
              } catch (destErr) {
                console.warn('No se pudo crear destruction detail:', destErr)
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

        closeBulkDialog()
        selectedSubstances.value = []
        await fetchReceptions()
        await fetchPreAnalysis()

        // Emitir evento para que Analysis.vue se actualice
        window.dispatchEvent(new CustomEvent('analysisUpdated'))
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

    const onRowExpand = async (event) => {
      // Use the helper so the same logic is reused when we refresh receptions
      await loadSubstancesForReception(event.data)
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

    const onSubstanceSelect = (/*event*/) => {
      // Validar que no se mezclen sustancias incompatibles
      // const selectedSubstance = event.data
      // const currentSubstanceTypeId = selectedSubstance.substanceType?.id
      // const interiorGroup = [1, 2, 3]
      // const isCurrentInterior = interiorGroup.includes(currentSubstanceTypeId)

      // Si es la primera selección, permitir
      if (selectedSubstances.value.length <= 1) {
        return
      }

      // Validar que no se mezclen grupos
      // const firstSelectedSubstance = selectedSubstances.value[0]
      // const firstSelectedTypeId = firstSelectedSubstance.substanceType?.id
      // const isFirstSelectedInterior = interiorGroup.includes(firstSelectedTypeId)

      // if (isCurrentInterior !== isFirstSelectedInterior) {
      //   // Remover la sustancia si no es compatible
      //   selectedSubstances.value = selectedSubstances.value.filter(
      //     (s) => s.id !== selectedSubstance.id,
      //   )
      // }
    }

    const onSubstanceUnselect = (event) => {
      // No es necesario hacer nada aquí, pero está disponible para futuros eventos
    }
    const rowClassPreAnalysis = (row) => {
      console.log(row.data)

      const data = row && row.data ? row.data : row
      if (!data) return ''
      return data.state === 'BORRADOR' ? 'borrador-row' : ''
    }
    const getPoliceName = (police) => {
      if (!police) return '—'
      return `${police.firstName || ''} ${police.firstLastName || ''}`.trim() || '—'
    }

    const getSubstanceName = (substance) => {
      if (!substance) return '—'
      return substance.substanceType?.name || `Sustancia #${substance.id}`
    }

    const getDestinationName = (destinationId) => {
      if (!destinationId) return '—'
      const destination = destinations.value?.find((d) => d.id === destinationId)
      return destination?.name || '—'
    }

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

    onMounted(() => {
      console.log('✅ Vista de pre-análisis cargada')
      fetchPreAnalysis()
      fetchReceptions()
      fetchDropdownData() // ← Agregar esta línea
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
      getDestinationName,
      viewReceptionDetail,
      viewPreAnalysis,
      generatePDF,
      handleReceptionUpdated,
      destinations,
      methodsDestruction,
      loadingDestinations,
      loadingMethodsDestruction,
      sendToPreAnalysis,
      handlePreAnalysisCancel,
      handleBulkPreAnalysisCancel,
      selectedPreAnalysis,

      isRowSelectable,
      rowClassPreAnalysis,
      onSubstanceSelect,
      onSubstanceUnselect,
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

/* Ocultar el checkbox de seleccionar todo en la tabla de sustancias */
:deep(.p-datatable-thead > tr > th[data-pc-section='headercell']:first-child .p-checkbox) {
  display: none !important;
}

:deep(.p-datatable .p-datatable-thead > tr > th:first-child .p-checkbox) {
  display: none !important;
}
</style>
