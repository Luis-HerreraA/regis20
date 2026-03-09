<template>
  <PlantillaContenido>
    <template #contenido>
      <div class="storages-container">
        <div class="page-content">
          <div class="flex justify-content-between align-items-center mb-4">
            <h1>Almacenes / Contramuestras</h1>
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
                  :selection="selectedStorages"
                  @update:selection="updateSelection"
                  :value="storages"
                  paginator
                  size="large"
                  :rows="5"
                  :rowsPerPageOptions="[5, 10, 20, 50]"
                  scrollable
                  scrollHeight="400px"
                  class="p-datatable-striped p-datatable-gridlines storages-table"
                  dataKey="id"
                >
                  <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                  <Column field="id" header="#" />
                  <Column header="Sustancia">
                    <template #body="slotProps">
                      {{ slotProps.data.substance?.nue || slotProps.data.substance?.id || '—' }}
                    </template>
                  </Column>
                  <Column header="Recepción">
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
                  <Column header="Ubicación">
                    <template #body="slotProps">
                      {{ slotProps.data.storageLocation?.name || '—' }}
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
      </div>
    </template>
  </PlantillaContenido>

  <!-- Componente Dialog de Destrucción -->
  <DestructionDialog
    v-model:visible="showDestructionDialog"
    :selectedStorages="selectedStorages"
    :methodsDestruction="methodsDestruction"
    :loading="isSendingDestruction"
    @submit="handleDestructionSubmit"
    @cancel="handleDestructionCancel"
  />
</template>

<script>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import PlantillaContenido from '../template/PlantillaContenido.vue'
import storagesService from '@/services/storagesService.js'
import methodsDestructionsService from '@/services/methodsDestructionsService.js'
import destructionsService from '@/services/destructionsHeaderService.js'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import DestructionDialog from '@/components/storages/DestructionDialog.vue'

export default {
  name: 'StoragesView',

  components: {
    PlantillaContenido,
    Card,
    DataTable,
    Column,
    Button,
    DestructionDialog,
  },

  setup() {
    const toast = useToast()
    const storages = ref([])
    const selectedStorages = ref([])
    const showDestructionDialog = ref(false)
    const isSendingDestruction = ref(false)
    const methodsDestruction = ref([])

    const destructionData = ref({
      methodDestruction: null,
      observation: '',
    })

    const fetchStorages = async () => {
      try {
        console.log('🔄 Recargando datos de almacenamientos desde el API...')
        const { data } = await storagesService.getAll()
        storages.value = data.content || data || []
        console.log('✅ Datos de almacenamientos recargados correctamente')
      } catch (error) {
        console.error('❌ Error cargando almacenamientos:', error)
      }
    }

    const formatDate = (dateString) => {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleDateString('es-CL')
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

    const getStorageAmount = (storage) => {
      const measurementType = storage?.measurement_type || storage?.substance?.measurement_type

      if (isUnitMeasurementType(measurementType)) {
        return Number(
          storage?.unit_quantity !== undefined && storage?.unit_quantity !== null
            ? storage.unit_quantity
            : storage?.counter_sample_quantity || 0,
        )
      }

      return Number(storage?.counter_sample_quantity || 0)
    }

    const getStorageUnitLabel = (storage) => {
      const measurementType = storage?.measurement_type || storage?.substance?.measurement_type
      return isUnitMeasurementType(measurementType) ? 'und' : 'gr'
    }

    const formatStorageAmount = (storage) => {
      const amount = getStorageAmount(storage)
      return getStorageUnitLabel(storage) === 'und' ? String(Math.trunc(amount)) : amount.toFixed(2)
    }

    const loadMethodsDestruction = async () => {
      try {
        const { data } = await methodsDestructionsService.getAll()
        methodsDestruction.value = data.content || data || []
      } catch (error) {
        console.error('❌ Error cargando métodos de destrucción:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los métodos de destrucción',
          life: 3000,
        })
      }
    }

    const openDestructionDialog = async () => {
      await loadMethodsDestruction()
      showDestructionDialog.value = true
      console.log('✅ Dialog abierto, métodos cargados:', methodsDestruction.value)
    }

    const updateSelection = (newSelection) => {
      // Solo permitir seleccionar storages con state "Pendiente" o "Almacenado"
      const validStates = ['Pendiente', 'Almacenado', null]
      const filteredSelection = newSelection.filter((storage) =>
        validStates.includes(storage.state),
      )
      selectedStorages.value = filteredSelection
    }

    const handleDestructionCancel = () => {
      showDestructionDialog.value = false
    }

    const handleDestructionSubmit = async (formData) => {
      isSendingDestruction.value = true
      try {
        let successCount = 0
        let errorCount = 0
        const userId = parseInt(localStorage.getItem('user_id')) || 1

        // Procesar cada almacenamiento seleccionado
        for (const storage of selectedStorages.value) {
          try {
            const destructionPayload = {
              state: 'PENDIENTE',
              weight: getStorageAmount(storage),
              methodDestruction: formData.methodDestruction,
              user: { id: userId },
              act_number: null,
              date_destruction: null,
              observation: null,
            }

            console.log('📤 Enviando a destrucción:', destructionPayload)
            await destructionsService.create(destructionPayload)

            // Actualizar el estado del storage con todos los campos
            const storageUpdatePayload = {
              id: storage.id,
              substance: storage.substance,
              storageLocation: storage.storageLocation,
              counter_sample_quantity: getStorageAmount(storage),
              measurement_type:
                storage.measurement_type || storage.substance?.measurement_type || null,
              unit_quantity:
                storage.unit_quantity !== undefined && storage.unit_quantity !== null
                  ? storage.unit_quantity
                  : getStorageUnitLabel(storage) === 'und'
                    ? getStorageAmount(storage)
                    : null,
              description: storage.description,
              state: 'Derivado para destruccion',
              createdAt: storage.createdAt,
            }

            console.log('📤 Actualizando storage:', storageUpdatePayload)
            await storagesService.update(storage.id, storageUpdatePayload)

            successCount++
          } catch (error) {
            console.error('❌ Error procesando almacenamiento:', error)
            errorCount++
          }
        }

        if (errorCount === 0) {
          toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `${successCount} registro(s) enviado(s) a destrucción`,
            life: 4000,
          })
          selectedStorages.value = []
          showDestructionDialog.value = false
          fetchStorages()
        } else {
          toast.add({
            severity: successCount > 0 ? 'warn' : 'error',
            summary: 'Procesamiento Parcial',
            detail: `${successCount} procesado(s), ${errorCount} error(es)`,
            life: 4000,
          })
        }
      } catch (error) {
        console.error('❌ Error en destrucción:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron enviar los registros a destrucción',
          life: 3000,
        })
      } finally {
        isSendingDestruction.value = false
      }
    }

    const closeDestructionDialog = () => {
      showDestructionDialog.value = false
    }

    const openMethodDialog = async () => {
      await loadMethodsDestruction()
      showMethodDialog.value = true
    }

    const closeMethodDialog = () => {
      showMethodDialog.value = false
    }

    const sendToDestruction = async () => {
      if (!destructionData.value.methodDestruction) {
        toast.add({
          severity: 'warn',
          summary: 'Atención',
          detail: 'Debe seleccionar un método de destrucción',
          life: 3000,
        })
        return
      }

      isSendingDestruction.value = true
      try {
        const userId = parseInt(localStorage.getItem('user_id')) || 1

        let successCount = 0
        let errorCount = 0

        // Procesar cada almacenamiento seleccionado
        for (const storage of selectedStorages.value) {
          try {
            const payload = {
              act_number: null,
              date_destruction: null,
              observation: destructionData.value.observation || null,
              state: 'PENDIENTE',
              weight: getStorageAmount(storage),
              methodDestruction: destructionData.value.methodDestruction,
              user: null,
            }

            console.log('📤 Enviando a destrucción:', payload)
            await destructionsService.create(payload)
            successCount++
          } catch (error) {
            console.error('❌ Error procesando almacenamiento:', error)
            errorCount++
          }
        }

        if (errorCount === 0) {
          toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `${successCount} registro(s) enviado(s) a destrucción`,
            life: 4000,
          })
          selectedStorages.value = []
          closeDestructionDialog()
          closeMethodDialog()
          fetchStorages()
        } else {
          toast.add({
            severity: successCount > 0 ? 'warn' : 'error',
            summary: 'Procesamiento Parcial',
            detail: `${successCount} procesado(s), ${errorCount} error(es)`,
            life: 4000,
          })
        }

        closeMethodDialog()
      } catch (error) {
        console.error('❌ Error en destrucción masiva:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron enviar los registros a destrucción',
          life: 3000,
        })
      } finally {
        isSendingDestruction.value = false
      }
    }

    onMounted(() => {
      console.log('✅ Vista de almacenamientos cargada')
      fetchStorages()
    })

    return {
      storages,
      fetchStorages,
      formatDate,
      formatStorageAmount,
      getStorageUnitLabel,
      selectedStorages,
      showDestructionDialog,
      methodsDestruction,
      isSendingDestruction,
      openDestructionDialog,
      updateSelection,
      handleDestructionCancel,
      handleDestructionSubmit,
    }
  },
}
</script>

<style scoped>
.storages-container {
  padding: 1rem;
}

.table-container {
  overflow-x: auto;
}
</style>
