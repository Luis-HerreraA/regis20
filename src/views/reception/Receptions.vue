<template>
  <PlantillaContenido>
    <template #contenido>
      <div class="users-container">
        <div class="page-content">
          <div class="flex justify-content-between align-items-center mb-4">
            <h1>Gestión de Recepciones</h1>
            <CreateReception @created="handleReceptionCreated" />
          </div>

          <Card>
            <template #content>
              <div class="table-container">
                <DataTable
                  v-model:filters="filters"
                  :value="receptions"
                  paginator
                  size="small"
                  :rows="10"
                  :rowsPerPageOptions="[5, 10, 20, 50]"
                  scrollable
                  class="p-datatable-striped p-datatable-gridlines users-table"
                  :loading="loading"
                  :rowClass="rowClass"
                  dataKey="id"
                  :globalFilterFields="[
                    'id',
                    'number',
                    'of_number',
                    'date_reception',
                    'of_number_date',
                    'police.firstName',
                    'police.firstLastName',
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

                  <template #empty> No se encontraron recepciones. </template>
                  <template #loading> Cargando recepciones. Por favor espere. </template>

                  <Column field="id" header="ID">
                    <template #filter="{ filterModel, filterCallback }">
                      <InputText
                        v-model="filterModel.value"
                        type="text"
                        @input="filterCallback()"
                        class="p-column-filter"
                        placeholder="Buscar por ID"
                      />
                    </template>
                  </Column>

                  <Column field="number" header="N° Acta">
                    <template #filter="{ filterModel, filterCallback }">
                      <InputText
                        v-model="filterModel.value"
                        type="text"
                        @input="filterCallback()"
                        class="p-column-filter"
                        placeholder="Buscar por N° Acta"
                      />
                    </template>
                  </Column>

                  <Column field="of_number" header="N° Oficio">
                    <template #filter="{ filterModel, filterCallback }">
                      <InputText
                        v-model="filterModel.value"
                        type="text"
                        @input="filterCallback()"
                        class="p-column-filter"
                        placeholder="Buscar por N° Oficio"
                      />
                    </template>
                  </Column>

                  <Column field="date_reception" header="Fecha Recepción">
                    <template #body="slotProps">
                      {{ slotProps.data.date_reception }}
                    </template>
                    <template #filter="{ filterModel, filterCallback }">
                      <InputText
                        v-model="filterModel.value"
                        type="text"
                        @input="filterCallback()"
                        class="p-column-filter"
                        placeholder="Buscar por fecha recepción"
                      />
                    </template>
                  </Column>

                  <Column field="of_number_date" header="Fecha Oficio">
                    <template #body="slotProps">
                      {{ slotProps.data.of_number_date }}
                    </template>
                    <template #filter="{ filterModel, filterCallback }">
                      <InputText
                        v-model="filterModel.value"
                        type="text"
                        @input="filterCallback()"
                        class="p-column-filter"
                        placeholder="Buscar por fecha oficio"
                      />
                    </template>
                  </Column>

                  <Column field="police" header="Policía">
                    <template #body="slotProps">
                      {{ getPoliceName(slotProps.data.police) }}
                    </template>
                    <template #filter="{ filterModel, filterCallback }">
                      <InputText
                        v-model="filterModel.value"
                        type="text"
                        @input="filterCallback()"
                        class="p-column-filter"
                        placeholder="Buscar por policía"
                      />
                    </template>
                  </Column>

                  <Column header="Acciones">
                    <template #body="slotProps">
                      <div class="flex align-items-center gap-2">
                        <ViewHistoryReception :reception="slotProps.data" />
                        <Button
                          :icon="
                            slotProps.data.state === 'BORRADOR'
                              ? 'pi pi-eye'
                              : 'pi pi-file-pdf'
                          "
                          :class="
                            slotProps.data.state === 'BORRADOR'
                              ? 'p-button-text p-button-warning draft-pdf-button'
                              : 'p-button-text p-button-help'
                          "
                          v-tooltip="
                            slotProps.data.state === 'BORRADOR'
                              ? 'Ver acta borrador con marca de agua'
                              : 'Generar PDF'
                          "
                          @click="generatePDF(slotProps.data)"
                        />
                        <Button
                          icon="pi pi-paperclip"
                          class="p-button-text p-button-info"
                          v-tooltip="'Adjuntar Archivo'"
                          @click="openFileUploadDialog(slotProps.data)"
                        />
                        <EditReceptionUnlock
                          v-if="
                            slotProps.data.is_editable !== 'SI' &&
                            slotProps.data.state !== 'BORRADOR'
                          "
                          :reception="slotProps.data"
                          @updated="handleReceptionUpdated"
                        />
                        <EditReception
                          v-if="
                            slotProps.data.is_editable === 'SI' ||
                            slotProps.data.state === 'BORRADOR'
                          "
                          :reception="slotProps.data"
                          @updated="handleReceptionUpdated"
                        />
                      </div>
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
  <FileUploadDialog
    :visible="fileUploadDialogVisible"
    :reception="selectedReceptionForUpload"
    @update:visible="fileUploadDialogVisible = $event"
    @uploaded="handleFileUploaded"
  />
</template>

<script>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { FilterMatchMode } from 'primevue/api'
import PlantillaContenido from '../template/PlantillaContenido.vue'
import recepcionService from '@/services/receptionsService.js'
import CreateReception from '@/components/receptions/CreateReception.vue'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import substancesService from '@/services/substancesService.js'
import { generarActaPDF } from '@/others/generarActaBtn.js'
import EditReception from '@/components/receptions/EditReception.vue'
import ViewHistoryReception from '@/components/receptions/ViewHistoryReception.vue'
import EditReceptionUnlock from '@/components/receptions/EditReceptionUnlock.vue'
import FileUploadDialog from '@/components/reception/FileUploadDialog.vue'
export default {
  name: 'ReceptionsView',
  components: {
    PlantillaContenido,
    CreateReception,
    EditReception,
    Card,
    DataTable,
    Column,
    Button,
    ViewHistoryReception,
    InputText,
    IconField,
    InputIcon,
    EditReceptionUnlock,
    FileUploadDialog,
  },

  setup() {
    const receptions = ref([])
    const loading = ref(false)
    const toast = useToast()
    const confirm = useConfirm()
    const fileUploadDialogVisible = ref(false)
    const selectedReceptionForUpload = ref(null)

    // Definir los filtros
    const filters = ref({
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      id: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
      number: { value: null, matchMode: FilterMatchMode.CONTAINS },
      of_number: { value: null, matchMode: FilterMatchMode.CONTAINS },
      date_reception: { value: null, matchMode: FilterMatchMode.CONTAINS },
      of_number_date: { value: null, matchMode: FilterMatchMode.CONTAINS },
      police: { value: null, matchMode: FilterMatchMode.CONTAINS },
    })

    const fetchReceptions = async () => {
      try {
        loading.value = true
        const { data } = await recepcionService.getAll()
        receptions.value = data.content || data || []
        console.log('✅ Recepciones cargadas:', receptions.value)
      } catch (error) {
        console.error('❌ Error cargando recepciones:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las recepciones',
          life: 3000,
        })
      } finally {
        loading.value = false
      }
    }

    const rowClass = (row) => {
      const data = row && row.data ? row.data : row
      if (!data) return ''
      return data.state === 'BORRADOR' ? 'borrador-row' : ''
    }

    const handleReceptionUpdated = (payload) => {
      // El componente hijo puede emitir directamente la recepción o un objeto { reception, message }
      const updated = payload && payload.reception ? payload.reception : payload

      if (!updated || !updated.id) {
        // Si no hay un objeto válido, recargar la lista como fallback
        fetchReceptions()
        toast.add({
          severity: 'warn',
          summary: 'Atención',
          detail: 'No se recibió la recepción actualizada',
          life: 3000,
        })
        return
      }

      const index = receptions.value.findIndex((r) => r.id === updated.id)
      if (index !== -1) {
        // Reemplazar el elemento existente (preserva reactividad)
        receptions.value.splice(index, 1, updated)
      } else {
        // Si no estaba en la lista, recargar para sincronizar
        fetchReceptions()
      }

      const message = (payload && payload.message) || 'Recepción actualizada correctamente'
      toast.add({ severity: 'success', summary: 'Actualizada', detail: message, life: 3000 })
    }

    const generatePDF = async (reception) => {
      const isDraft = reception.state === 'BORRADOR'
      const draftPreviewWindow = isDraft ? window.open('', '_blank') : null

      if (isDraft && !draftPreviewWindow) {
        toast.add({
          severity: 'warn',
          summary: 'Ventana bloqueada',
          detail: 'Permite las ventanas emergentes para visualizar el acta borrador',
          life: 4000,
        })
        return
      }

      try {
        toast.add({
          severity: 'info',
          summary: 'Generando PDF...',
          detail: `Creando acta para recepción #${reception.id}`,
          life: 2000,
        })

        // 1️⃣ Obtener recepción por ID
        const { data: receptionData } = await recepcionService.getById(reception.id)

        // 2️⃣ Obtener sustancias (temporal hasta que llegue el endpoint real)
        const { data: substancesData } = await substancesService.getByReceptionId(reception.id)
        // filtrar por recepción si existe esa relación
        const substances = substancesData.filter((s) => s.reception?.id === reception.id)

        // 3️⃣ Llamar a la función del PDF
        generarActaPDF({ ...receptionData, state: reception.state }, substances, draftPreviewWindow)

        toast.add({
          severity: 'success',
          summary: isDraft ? 'Vista previa generada' : 'PDF generado',
          detail: isDraft
            ? `Acta borrador #${reception.number} abierta en una pestaña nueva`
            : `Acta de recepción #${reception.number} descargada`,
          life: 3000,
        })
      } catch (error) {
        if (draftPreviewWindow && !draftPreviewWindow.closed) draftPreviewWindow.close()

        console.error('❌ Error generando PDF:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo generar el PDF del acta',
          life: 3000,
        })
      }
    }

    const handleReceptionCreated = (newReception) => {
      receptions.value.unshift(newReception)
      console.log('✅ Nueva recepción agregada a la tabla:', newReception)
    }

    const getPoliceName = (police) => {
      if (!police) return 'N/A'
      return `${police.firstName || ''} ${police.firstLastName || ''}`.trim() || 'Sin nombre'
    }

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString('es-CL')
    }

    const viewReception = (reception) => {
      console.log('Ver recepción:', reception)
      toast.add({
        severity: 'info',
        summary: 'Ver recepción',
        detail: `Viendo recepción #${reception.id}`,
        life: 2000,
      })
    }

    const confirmDelete = (reception) => {
      confirm.require({
        message: `¿Estás seguro de eliminar la recepción #${reception.id}?`,
        header: 'Confirmar eliminación',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          deleteReception(reception.id)
        },
      })
    }

    const deleteReception = async (id) => {
      try {
        await recepcionService.delete(id)
        receptions.value = receptions.value.filter((r) => r.id !== id)
        toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Recepción eliminada correctamente',
          life: 3000,
        })
      } catch (error) {
        console.error('❌ Error eliminando recepción:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar la recepción',
          life: 3000,
        })
      }
    }

    const openFileUploadDialog = (reception) => {
      selectedReceptionForUpload.value = reception
      fileUploadDialogVisible.value = true
    }

    const handleFileUploaded = () => {
      toast.add({
        severity: 'success',
        summary: 'Archivo adjuntado',
        detail: 'El archivo se cargó exitosamente',
        life: 3000,
      })
      fileUploadDialogVisible.value = false
    }

    onMounted(() => {
      console.log('✅ Vista de recepciones cargada')
      fetchReceptions()
    })

    return {
      receptions,
      loading,
      filters,
      rowClass,
      generatePDF,
      fetchReceptions,
      handleReceptionCreated,
      getPoliceName,
      formatDate,
      viewReception,
      confirmDelete,
      handleReceptionUpdated,
      fileUploadDialogVisible,
      selectedReceptionForUpload,
      openFileUploadDialog,
      handleFileUploaded,
    }
  },
}
</script>

<style scoped>
.users-container {
  padding: 1.5rem;
}

.table-container {
  margin-top: 1rem;
}

.borrador-row {
  background-color: #fff6b8 !important;
}

:deep(.draft-pdf-button) {
  border: 1px solid var(--yellow-500);
  border-radius: 50%;
}

:deep(.borrador-row) > td,
:deep(.borrador-row) td {
  background-color: #fff6b8 !important;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

/* Estilos para los filtros */
:deep(.p-column-filter) {
  width: 100%;
}

:deep(.p-datatable-filter-row td) {
  padding: 0.5rem;
}
</style>
