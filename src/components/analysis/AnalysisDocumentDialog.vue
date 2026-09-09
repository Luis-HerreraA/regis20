<template>
  <PrimeDialog
    :visible="visible"
    modal
    :header="dialogTitle"
    :style="{ width: '800px' }"
    :breakpoints="{ '960px': '90vw', '640px': '96vw' }"
    @update:visible="updateVisible"
  >
    <TabView>
      <TabPanel header="Adjuntar archivo">
        <div class="p-fluid">
          <div class="field">
            <label for="analysis-document">Archivo *</label>
            <FileUpload
              id="analysis-document"
              ref="fileUploadRef"
              name="file"
              :multiple="false"
              :maxFileSize="52428800"
              :showUploadButton="false"
              :showCancelButton="false"
              chooseLabel="Seleccionar archivo"
              invalidFileSizeMessage="El archivo supera el máximo permitido de 50 MB."
              @select="handleFileSelect"
              @clear="selectedFile = null"
              @remove="selectedFile = null"
            >
              <template #empty>
                <p class="upload-empty">
                  Arrastre un archivo aquí o presione “Seleccionar archivo”.
                </p>
              </template>
            </FileUpload>
            <small v-if="selectedFile" class="selected-file">
              {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
            </small>
          </div>

          <div class="field">
            <label for="analysis-document-description">Descripción (opcional)</label>
            <PrimeTextarea
              id="analysis-document-description"
              v-model="description"
              rows="3"
              placeholder="Ingrese una descripción del documento"
            />
          </div>

          <div class="flex justify-content-end">
            <PrimeButton
              label="Adjuntar"
              icon="pi pi-upload"
              severity="success"
              :loading="uploading"
              :disabled="!selectedFile || uploading"
              @click="uploadDocument"
            />
          </div>
        </div>
      </TabPanel>

      <TabPanel header="Documentos adjuntos">
        <div v-if="loading" class="loading-container">
          <ProgressSpinner />
        </div>

        <div v-else-if="documents.length === 0" class="empty-message">
          No hay documentos adjuntos a este análisis.
        </div>

        <DataTable v-else :value="documents" stripedRows size="small" responsiveLayout="scroll">
          <Column field="name" header="Nombre" />
          <Column field="size" header="Tamaño">
            <template #body="slotProps">
              {{ formatFileSize(slotProps.data.size) }}
            </template>
          </Column>
          <Column field="description" header="Descripción">
            <template #body="slotProps">
              {{ slotProps.data.description || '—' }}
            </template>
          </Column>
          <Column field="createdAt" header="Fecha">
            <template #body="slotProps">
              {{ formatDate(slotProps.data.createdAt) }}
            </template>
          </Column>
          <Column header="Acciones" headerStyle="width: 7rem">
            <template #body="slotProps">
              <div class="flex gap-1">
                <PrimeButton
                  icon="pi pi-download"
                  class="p-button-text p-button-info p-button-sm"
                  :loading="downloadingId === slotProps.data.id"
                  v-tooltip.top="'Descargar'"
                  @click="downloadDocument(slotProps.data)"
                />
                <PrimeButton
                  icon="pi pi-trash"
                  class="p-button-text p-button-danger p-button-sm"
                  :loading="deletingId === slotProps.data.id"
                  v-tooltip.top="'Eliminar'"
                  @click="deleteDocument(slotProps.data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </TabPanel>
    </TabView>

    <template #footer>
      <PrimeButton label="Cerrar" severity="secondary" @click="updateVisible(false)" />
    </template>
  </PrimeDialog>
</template>

<script>
import { computed, ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import PrimeButton from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import PrimeDialog from 'primevue/dialog'
import FileUpload from 'primevue/fileupload'
import ProgressSpinner from 'primevue/progressspinner'
import TabPanel from 'primevue/tabpanel'
import TabView from 'primevue/tabview'
import PrimeTextarea from 'primevue/textarea'
import analysisDocumentsService from '@/services/analysis_documents.js'

export default {
  name: 'AnalysisDocumentDialog',
  components: {
    PrimeButton,
    Column,
    DataTable,
    PrimeDialog,
    FileUpload,
    ProgressSpinner,
    TabPanel,
    TabView,
    PrimeTextarea,
  },
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    analysis: {
      type: Object,
      default: null,
    },
  },
  emits: ['update:visible', 'updated'],
  setup(props, { emit }) {
    const toast = useToast()
    const documents = ref([])
    const selectedFile = ref(null)
    const description = ref('')
    const fileUploadRef = ref(null)
    const loading = ref(false)
    const uploading = ref(false)
    const downloadingId = ref(null)
    const deletingId = ref(null)

    const dialogTitle = computed(() =>
      props.analysis?.id
        ? `Documentos del análisis #${props.analysis.id}`
        : 'Documentos del análisis',
    )

    const getErrorMessage = (error, fallback) =>
      error?.response?.data?.message || error?.response?.data?.error || fallback

    const formatFileSize = (bytes) => {
      const size = Number(bytes)
      if (!Number.isFinite(size) || size <= 0) return '0 Bytes'

      const units = ['Bytes', 'KB', 'MB', 'GB']
      const unitIndex = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1)
      const value = size / Math.pow(1024, unitIndex)
      return `${Math.round(value * 100) / 100} ${units[unitIndex]}`
    }

    const formatDate = (date) => {
      if (!date) return '—'
      return new Date(date).toLocaleString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    const resetForm = () => {
      selectedFile.value = null
      description.value = ''
      fileUploadRef.value?.clear()
    }

    const fetchDocuments = async () => {
      if (!props.analysis?.id) {
        documents.value = []
        return
      }

      loading.value = true
      try {
        const { data } = await analysisDocumentsService.getByAnalysisId(props.analysis.id)
        documents.value = data?.content || data || []
      } catch (error) {
        console.error('Error cargando documentos del análisis:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: getErrorMessage(error, 'No se pudieron cargar los documentos'),
          life: 3000,
        })
      } finally {
        loading.value = false
      }
    }

    const handleFileSelect = (event) => {
      selectedFile.value = event.files?.[0] || null
    }

    const uploadDocument = async () => {
      if (!selectedFile.value || !props.analysis?.id) return

      const userId = Number.parseInt(localStorage.getItem('user_id'), 10)
      if (!userId) {
        toast.add({
          severity: 'error',
          summary: 'Sesión inválida',
          detail: 'No se pudo identificar al usuario que adjunta el documento',
          life: 3000,
        })
        return
      }

      uploading.value = true
      try {
        await analysisDocumentsService.upload(
          props.analysis.id,
          userId,
          selectedFile.value,
          description.value.trim(),
        )
        toast.add({
          severity: 'success',
          summary: 'Documento adjuntado',
          detail: 'El documento se cargó correctamente',
          life: 3000,
        })
        resetForm()
        await fetchDocuments()
        emit('updated')
      } catch (error) {
        console.error('Error adjuntando documento al análisis:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: getErrorMessage(error, 'No se pudo adjuntar el documento'),
          life: 3000,
        })
      } finally {
        uploading.value = false
      }
    }

    const downloadDocument = async (document) => {
      downloadingId.value = document.id
      try {
        const { data } = await analysisDocumentsService.download(document.id)
        const url = URL.createObjectURL(data)
        const link = window.document.createElement('a')
        link.href = url
        link.download = document.name || `documento_analisis_${document.id}`
        window.document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Error descargando documento del análisis:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: getErrorMessage(error, 'No se pudo descargar el documento'),
          life: 3000,
        })
      } finally {
        downloadingId.value = null
      }
    }

    const deleteDocument = async (document) => {
      if (!window.confirm(`¿Desea eliminar el documento “${document.name}”?`)) return

      deletingId.value = document.id
      try {
        await analysisDocumentsService.delete(document.id)
        documents.value = documents.value.filter((item) => item.id !== document.id)
        toast.add({
          severity: 'success',
          summary: 'Documento eliminado',
          detail: 'El documento se eliminó correctamente',
          life: 3000,
        })
        emit('updated')
      } catch (error) {
        console.error('Error eliminando documento del análisis:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: getErrorMessage(error, 'No se pudo eliminar el documento'),
          life: 3000,
        })
      } finally {
        deletingId.value = null
      }
    }

    const updateVisible = (value) => {
      emit('update:visible', value)
      if (!value) resetForm()
    }

    watch(
      () => [props.visible, props.analysis?.id],
      ([visible]) => {
        if (visible) {
          resetForm()
          fetchDocuments()
        }
      },
    )

    return {
      documents,
      selectedFile,
      description,
      fileUploadRef,
      loading,
      uploading,
      downloadingId,
      deletingId,
      dialogTitle,
      formatFileSize,
      formatDate,
      handleFileSelect,
      uploadDocument,
      downloadDocument,
      deleteDocument,
      updateVisible,
    }
  },
}
</script>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

.field label {
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.selected-file {
  color: #059669;
  margin-top: 0.5rem;
}

.upload-empty,
.empty-message {
  color: #6b7280;
  text-align: center;
}

.loading-container {
  align-items: center;
  display: flex;
  justify-content: center;
  min-height: 12rem;
}

.empty-message {
  padding: 3rem 1rem;
}
</style>
