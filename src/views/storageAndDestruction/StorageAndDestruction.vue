<template>
  <PlantillaContenido>
    <template #contenido>
      <div class="storage-destruction-container">
        <div class="page-content">
          <h1>Contramuestra y Destrucción</h1>

          <TabView>
            <!-- Pestaña de Contramuestra -->
            <TabPanel header="Contramuestra" leftIcon="pi pi-warehouse">
              <div class="contramuestra-container">
                <div class="flex justify-content-between align-items-center mb-4">
                  <Button
                    v-if="selectedStorages.length > 0"
                    label="Enviar a Destrucción"
                    icon="pi pi-trash"
                    @click="openDestructionDialog"
                    severity="warning"
                  />
                </div>

                <Card>
                  <template #content>
                    <div class="table-container">
                      <DataTable
                        v-model:selection="selectedStorages"
                        :value="storages"
                        paginator
                        size="large"
                        :rows="10"
                        :rowsPerPageOptions="[5, 10, 20, 50]"
                        scrollable
                        scrollHeight="400px"
                        class="p-datatable-striped p-datatable-gridlines storages-table"
                        dataKey="id"
                      >
                        <Column headerStyle="width: 3rem">
                          <template #body="slotProps">
                            <Checkbox
                              v-model="selectedStorages"
                              :value="slotProps.data"
                              :disabled="slotProps.data.state === 'Enviado a destrucción'"
                            />
                          </template>
                        </Column>
                        <Column field="id" header="N° de Muestra" />
                        <Column header="N° NUE">
                          <template #body="slotProps">
                            {{
                              slotProps.data.substance?.nue || slotProps.data.substance?.id || '—'
                            }}
                          </template>
                        </Column>
                        <Column header="N° de Acta">
                          <template #body="slotProps">
                            {{ slotProps.data.substance?.reception?.number || '—' }}
                          </template>
                        </Column>
                        <Column header="Cantidad">
                          <template #body="slotProps">
                            {{ formatStorageAmount(slotProps.data) }}
                            {{ getStorageUnitLabel(slotProps.data) }}
                          </template>
                        </Column>
                        <Column header="Estado">
                          <template #body="slotProps">
                            {{ slotProps.data.state || '—' }}
                          </template>
                        </Column>
                        <Column header="Fecha">
                          <template #body="slotProps">
                            {{ formatDate(slotProps.data.createdAt) }}
                          </template>
                        </Column>
                      </DataTable>
                    </div>
                  </template>
                </Card>
              </div>
            </TabPanel>

            <!-- Pestaña de Destrucción -->
            <TabPanel header="Destrucción" leftIcon="pi pi-ban">
              <div class="destructions-container">
                <Card>
                  <template #content>
                    <div class="table-container">
                      <DataTable
                        v-model:filters="filters"
                        v-model:expandedRows="expandedRows"
                        :value="destructions"
                        paginator
                        size="small"
                        :rows="10"
                        :rowsPerPageOptions="[5, 10, 20, 50]"
                        scrollable
                        class="p-datatable-striped p-datatable-gridlines"
                        :loading="loadingDestructions"
                        dataKey="id"
                        @row-expand="onRowExpand"
                        :globalFilterFields="[
                          'id',
                          'act_number',
                          'date_destruction',
                          'observation',
                          'state',
                          'weight',
                          'methodDestruction.name',
                          'user.username',
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

                        <template #empty> No se encontraron destrucciones. </template>
                        <template #loading> Cargando destrucciones. Por favor espere. </template>

                        <Column :expander="true" headerStyle="width: 3rem" />
                        <Column field="id" header="ID" />
                        <Column field="act_number" header="N° Acta" />
                        <Column field="date_destruction" header="Fecha Destrucción">
                          <template #body="slotProps">
                            {{ slotProps.data.date_destruction }}
                          </template>
                        </Column>
                        <Column field="weight" header="Peso (gr)" />
                        <Column header="Método">
                          <template #body="slotProps">
                            {{ slotProps.data.methodDestruction?.name || '—' }}
                          </template>
                        </Column>
                        <Column field="state" header="Estado">
                          <template #body="slotProps">
                            <Tag
                              :value="slotProps.data.state"
                              :severity="getDestructionSeverity(slotProps.data.state)"
                            />
                          </template>
                        </Column>
                        <Column field="observation" header="Observación" />
                        <Column header="Acciones" bodyStyle="text-align:center">
                          <template #body="slotProps">
                            <div class="flex gap-2 justify-content-center">
                              <Button
                                v-if="slotProps.data.state === 'DESTRUCCION_MASIVA'"
                                icon="pi pi-file-pdf"
                                severity="success"
                                text
                                rounded
                                @click="downloadDestructionReport(slotProps.data)"
                                v-tooltip.top="'Descargar Acta de Destrucción'"
                              />
                              <Button
                                v-if="
                                  slotProps.data.state === 'COMPLETADO' &&
                                  slotProps.data.methodDestruction?.id === 1
                                "
                                icon="pi pi-file"
                                severity="info"
                                text
                                rounded
                                @click="downloadDestructionReportMethod1(slotProps.data)"
                                v-tooltip.top="'Descargar Acta Incineración'"
                              />
                              <Button
                                v-if="slotProps.data.state === 'COMPLETADO'"
                                icon="pi pi-file-pdf"
                                severity="warning"
                                text
                                rounded
                                @click="downloadDestructionReportCompletado(slotProps.data)"
                                v-tooltip.top="'Descargar Acta de Destrucción'"
                              />
                              <EditDestruction
                                v-if="
                                  slotProps.data.state !== 'DESTRUCCION_MASIVA' &&
                                  slotProps.data.state !== 'COMPLETADO'
                                "
                                :destruction="slotProps.data"
                                @updated="onDestructionUpdated"
                              />
                            </div>
                          </template>
                        </Column>

                        <template #expansion="slotProps">
                          <div class="p-3">
                            <h5 class="mb-3">Detalles de Destrucción</h5>
                            <DataTable
                              :value="destructionDetails[slotProps.data.id] || []"
                              :loading="loadingDetails[slotProps.data.id]"
                              size="small"
                              class="p-datatable-sm"
                            >
                              <template #empty>
                                <div class="text-center text-500">No hay detalles disponibles</div>
                              </template>
                              <template #loading>
                                <div class="text-center text-500">Cargando detalles...</div>
                              </template>
                              <Column field="id" header="ID" />
                              <Column header="Sustancia">
                                <template #body="detailSlot">
                                  {{ detailSlot.data.substance?.substanceType?.name || '—' }}
                                </template>
                              </Column>
                              <Column header="Nº NUE">
                                <template #body="detailSlot">
                                  {{ detailSlot.data.substance?.nue || '—' }}
                                </template>
                              </Column>
                              <Column header="Nº Acta">
                                <template #body="detailSlot">
                                  {{ detailSlot.data.substance?.reception?.number || '—' }}
                                </template>
                              </Column>
                              <Column header="Cantidad">
                                <template #body="detailSlot">
                                  {{ formatDestructionDetailAmount(detailSlot.data) }}
                                  {{ getDestructionDetailUnitLabel(detailSlot.data) }}
                                </template>
                              </Column>
                              <Column field="state" header="Estado">
                                <template #body="detailSlot">
                                  <Tag
                                    :value="detailSlot.data.state"
                                    :severity="getDestructionSeverity(detailSlot.data.state)"
                                  />
                                </template>
                              </Column>
                            </DataTable>
                          </div>
                        </template>
                      </DataTable>
                    </div>
                  </template>
                </Card>
              </div>
            </TabPanel>
          </TabView>
        </div>
      </div>

      <!-- Diálogo de Destrucción -->
      <Dialog
        v-model:visible="destructionDialogVisible"
        modal
        header="Crear Destrucción desde Almacenamiento"
        :style="{ width: '60rem' }"
        @update:visible="closeDestructionDialog"
      >
        <CreateDestruction
          :substances="selectedStorages"
          @close="closeDestructionDialog"
          @created="onDestructionCreated"
        />
      </Dialog>

      <!-- Diálogo de Edición de Destrucción -->
      <Dialog
        v-model:visible="editDestructionDialogVisible"
        modal
        header="Editar Destrucción"
        :style="{ width: '50rem' }"
        @update:visible="closeEditDestructionDialog"
      >
        <EditDestruction
          :destruction="selectedDestruction"
          @close="closeEditDestructionDialog"
          @updated="onDestructionUpdated"
        />
      </Dialog>

      <!-- Confirmación de Eliminación -->
      <ConfirmDialog />
    </template>
  </PlantillaContenido>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import PlantillaContenido from '@/views/template/PlantillaContenido.vue'
import CreateDestruction from '@/components/destructions/CreateDestruction.vue'
import EditDestruction from '@/components/destructions/EditDestruction.vue'
import storagesService from '@/services/storagesService'
import destructionsService from '@/services/destructionsHeaderService'
import destructionDetailsService from '@/services/destructionDetailsService'
import { generarActaDestruccionPDF } from '@/others/generarActaDestruccion.js'
import { generarActaDestruccionMetodo1PDF } from '@/others/generarActaDestruccionMetodo1.js'
import { generarActaDestruccionCompletadoPDF } from '@/others/generarActaDestruccionCompletado.js'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Checkbox from 'primevue/checkbox'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import ConfirmDialog from 'primevue/confirmdialog'

export default {
  name: 'StorageAndDestruction',
  components: {
    PlantillaContenido,
    CreateDestruction,
    EditDestruction,
    TabView,
    TabPanel,
    Card,
    DataTable,
    Column,
    Dialog,
    Button,
    Tag,
    Checkbox,
    InputText,
    IconField,
    InputIcon,
    ConfirmDialog,
  },
  setup() {
    const confirm = useConfirm()
    const toast = useToast()

    // Estado de Almacenamiento
    const storages = ref([])
    const selectedStorages = ref([])

    // Estado de Destrucción
    const destructions = ref([])
    const loadingDestructions = ref(false)
    const selectedDestruction = ref(null)
    const expandedRows = ref({})
    const destructionDetails = ref({})
    const loadingDetails = ref({})

    // Diálogos
    const destructionDialogVisible = ref(false)
    const editDestructionDialogVisible = ref(false)

    // Filtros
    const filters = reactive({
      global: { value: null, matchMode: 'contains' },
    })

    // Cargar almacenamientos
    const loadStorages = async () => {
      try {
        const { data } = await storagesService.getAll()
        storages.value = data.content || data || []
      } catch (error) {
        console.error('Error cargando almacenamientos:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los almacenamientos',
          life: 3000,
        })
      }
    }

    // Cargar destrucciones
    const loadDestructions = async () => {
      try {
        loadingDestructions.value = true
        const { data } = await destructionsService.getAll()
        destructions.value = data.content || data || []
      } catch (error) {
        console.error('Error cargando destrucciones:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las destrucciones',
          life: 3000,
        })
      } finally {
        loadingDestructions.value = false
      }
    }

    // Cargar detalles de destrucción cuando se expande una fila
    const onRowExpand = async (event) => {
      const headerId = event.data.id

      // Si ya tenemos los detalles cargados, no los volvemos a cargar
      if (destructionDetails.value[headerId]) {
        return
      }

      try {
        loadingDetails.value[headerId] = true
        const { data } = await destructionDetailsService.getByHeaderId(headerId)
        destructionDetails.value[headerId] = data.content || data || []
      } catch (error) {
        console.error('Error cargando detalles de destrucción:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los detalles de la destrucción',
          life: 3000,
        })
        destructionDetails.value[headerId] = []
      } finally {
        loadingDetails.value[headerId] = false
      }
    }

    // Abrir diálogo de destrucción
    const openDestructionDialog = () => {
      destructionDialogVisible.value = true
    }

    // Cerrar diálogo de destrucción
    const closeDestructionDialog = () => {
      destructionDialogVisible.value = false
      selectedStorages.value = []
      loadStorages()
    }

    // Al crear destrucción
    const onDestructionCreated = () => {
      loadDestructions()
      closeDestructionDialog()
    }

    // Editar destrucción
    const editDestruction = (destruction) => {
      selectedDestruction.value = destruction
      editDestructionDialogVisible.value = true
    }

    // Cerrar diálogo de edición
    const closeEditDestructionDialog = () => {
      editDestructionDialogVisible.value = false
      selectedDestruction.value = null
    }

    // Al actualizar destrucción
    const onDestructionUpdated = () => {
      loadDestructions()
      closeEditDestructionDialog()
    }

    // Confirmar eliminación
    const confirmDelete = (id) => {
      confirm.require({
        message: '¿Estás seguro de que deseas eliminar esta destrucción?',
        header: 'Confirmar Eliminación',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          try {
            await destructionsService.delete(id)
            toast.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Destrucción eliminada correctamente',
              life: 3000,
            })
            loadDestructions()
          } catch (error) {
            console.error('Error eliminando destrucción:', error)
            toast.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar la destrucción',
              life: 3000,
            })
          }
        },
      })
    }

    // Formatear fecha
    const formatDate = (date) => {
      if (!date) return '—'
      return new Date(date).toLocaleDateString('es-CL')
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

    const getStorageUnitLabel = (storage) => {
      const measurementType = storage?.measurement_type || storage?.substance?.measurement_type
      return isUnitMeasurementType(measurementType) ? 'und' : 'gr'
    }

    const formatStorageAmount = (storage) => {
      const isUnit = getStorageUnitLabel(storage) === 'und'
      const amount = Number(
        isUnit
          ? storage?.unit_quantity !== undefined && storage?.unit_quantity !== null
            ? storage.unit_quantity
            : storage?.counter_sample_quantity || 0
          : storage?.counter_sample_quantity || 0,
      )

      return isUnit ? String(Math.trunc(amount)) : amount.toFixed(2)
    }

    const getDestructionDetailUnitLabel = (detail) => {
      const measurementType = detail?.measurement_type || detail?.substance?.measurement_type
      return isUnitMeasurementType(measurementType) ? 'und' : 'gr'
    }

    const formatDestructionDetailAmount = (detail) => {
      const isUnit = getDestructionDetailUnitLabel(detail) === 'und'
      const amount = Number(
        isUnit
          ? detail?.unit_quantity !== undefined && detail?.unit_quantity !== null
            ? detail.unit_quantity
            : detail?.weight || 0
          : detail?.weight || 0,
      )

      return isUnit ? String(Math.trunc(amount)) : amount.toFixed(2)
    }

    // Severidad del tag de estado
    const getDestructionSeverity = (state) => {
      switch (state) {
        case 'COMPLETADO':
        case 'DESTRUCCION_MASIVA':
          return 'success'
        case 'PENDIENTE':
          return 'warning'
        case 'CANCELADO':
          return 'danger'
        default:
          return 'info'
      }
    }

    // Descargar reporte de destrucción
    const downloadDestructionReport = async (destruction) => {
      try {
        // Si no tenemos los detalles cargados, cargarlos primero
        if (!destructionDetails.value[destruction.id]) {
          loadingDetails.value[destruction.id] = true
          const { data } = await destructionDetailsService.getByHeaderId(destruction.id)
          destructionDetails.value[destruction.id] = data.content || data || []
          loadingDetails.value[destruction.id] = false
        }

        // Generar el PDF
        generarActaDestruccionPDF(destruction, destructionDetails.value[destruction.id])

        toast.add({
          severity: 'success',
          summary: 'PDF Generado',
          detail: 'Acta de destrucción descargada correctamente',
          life: 3000,
        })
      } catch (error) {
        console.error('Error generando acta de destrucción:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo generar el acta de destrucción',
          life: 3000,
        })
      }
    }

    // Descargar reporte de destrucción método 1
    const downloadDestructionReportMethod1 = async (destruction) => {
      try {
        // Generar el PDF con el formato del método 1
        await generarActaDestruccionMetodo1PDF(destruction)

        toast.add({
          severity: 'success',
          summary: 'PDF Generado',
          detail: 'Acta de destrucción método 1 descargada correctamente',
          life: 3000,
        })
      } catch (error) {
        console.error('Error generando acta de destrucción método 1:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo generar el acta de destrucción método 1',
          life: 3000,
        })
      }
    }

    // Descargar reporte de destrucción para estado COMPLETADO (otros métodos)
    const downloadDestructionReportCompletado = async (destruction) => {
      try {
        // Si no tenemos los detalles cargados, cargarlos primero
        if (!destructionDetails.value[destruction.id]) {
          loadingDetails.value[destruction.id] = true
          const { data } = await destructionDetailsService.getByHeaderId(destruction.id)
          destructionDetails.value[destruction.id] = data.content || data || []
          loadingDetails.value[destruction.id] = false
        }

        // Generar el PDF con el formato para COMPLETADO
        await generarActaDestruccionCompletadoPDF(
          destruction,
          destructionDetails.value[destruction.id],
        )

        toast.add({
          severity: 'success',
          summary: 'PDF Generado',
          detail: 'Acta de destrucción descargada correctamente',
          life: 3000,
        })
      } catch (error) {
        console.error('Error generando acta de destrucción:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo generar el acta de destrucción',
          life: 3000,
        })
      }
    }

    onMounted(() => {
      loadStorages()
      loadDestructions()
    })

    return {
      storages,
      selectedStorages,
      destructions,
      loadingDestructions,
      expandedRows,
      destructionDetails,
      loadingDetails,
      destructionDialogVisible,
      editDestructionDialogVisible,
      selectedDestruction,
      filters,
      openDestructionDialog,
      closeDestructionDialog,
      onDestructionCreated,
      onRowExpand,
      editDestruction,
      closeEditDestructionDialog,
      onDestructionUpdated,
      confirmDelete,
      formatDate,
      formatStorageAmount,
      getStorageUnitLabel,
      formatDestructionDetailAmount,
      getDestructionDetailUnitLabel,
      getDestructionSeverity,
      downloadDestructionReport,
      downloadDestructionReportMethod1,
      downloadDestructionReportCompletado,
    }
  },
}
</script>

<style scoped>
.storage-destruction-container {
  padding: 1rem;
}

.page-content {
  width: 100%;
}

h1 {
  margin-bottom: 1.5rem;
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text-color);
}

h2 {
  margin-bottom: 1rem;
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--text-color);
}

.table-container {
  width: 100%;
  overflow-x: auto;
}

:deep(.p-tabview-nav) {
  background: var(--surface-50);
  border-bottom: 2px solid var(--surface-200);
}

:deep(.p-tabview-panels) {
  padding: 1.5rem 0;
}
</style>
