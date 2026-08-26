<template>
  <div>
    <!-- Botón de historial -->
    <Button
      icon="pi pi-history"
      class="p-button-text p-button-secondary"
      v-tooltip="'Ver historial de recepción'"
      @click="openDialog"
    />

    <!-- Modal con la tabla del historial -->
    <Dialog
      v-model:visible="visible"
      modal
      :header="`Historial de Recepción #${reception?.number || ''}`"
      :style="{ width: '60rem' }"
    >
      <template #default>
        <div v-if="loading" class="flex justify-center my-4">
          <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
        </div>

        <div v-else>
          <DataTable
            :value="historyList"
            paginator
            :rows="5"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            responsiveLayout="scroll"
            class="p-datatable-striped p-datatable-gridlines"
          >
            <Column field="description" header="Descripción" style="width: 50%"></Column>

            <Column header="Usuario" style="width: 25%">
              <template #body="slotProps">
                {{ slotProps.data.user?.username || '—' }}
              </template>
            </Column>

            <Column header="Fecha" style="width: 25%">
              <template #body="slotProps">
                {{ formatDate(slotProps.data.createdAt) }}
              </template>
            </Column>
          </DataTable>

          <div v-if="!loading && historyList.length === 0" class="text-center text-gray-500 mt-3">
            No hay historial disponible para esta recepción.
          </div>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import receptionsHistoryService from '@/services/receptionsHistoryService.js'

// === Props ===
const props = defineProps({
  reception: {
    type: Object,
    required: true,
  },
})

// === Variables reactivas ===
const visible = ref(false)
const loading = ref(false)
const historyList = ref([])
const toast = useToast()

// === Funciones ===
const openDialog = async () => {
  visible.value = true
  await loadHistory()
}

const loadHistory = async () => {
  try {
    loading.value = true
    const { data } = await receptionsHistoryService.getByReceptionId(props.reception.id)
    historyList.value = data || []
  } catch (error) {
    console.error('❌ Error cargando historial:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo cargar el historial de esta recepción',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleString('es-CL')
}
</script>

<style scoped>
.text-gray-500 {
  color: #6b7280;
}
</style>
