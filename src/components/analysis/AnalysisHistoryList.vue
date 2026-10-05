<template>
  <div v-if="loading" class="flex justify-content-center py-5">
    <ProgressSpinner style="width: 48px; height: 48px" strokeWidth="4" />
  </div>

  <div v-else-if="error" class="history-error">
    {{ error }}
  </div>

  <div v-else-if="records.length === 0" class="empty-history">
    {{ emptyMessage }}
  </div>

  <div v-else class="history-list">
    <article v-for="record in records" :key="record.id" class="history-entry">
      <header class="history-header">
        <div>
          <div class="history-user">{{ formatUser(record.changedByUser) }}</div>
          <div class="history-date">{{ formatDate(record.changedAt) }}</div>
        </div>
        <span class="history-id">#{{ record.id }}</span>
      </header>

      <div class="history-reason">
        <strong>Motivo:</strong> {{ record.changeReason || '—' }}
      </div>

      <DataTable
        v-if="getChanges(record).length > 0"
        :value="getChanges(record)"
        responsiveLayout="scroll"
        class="p-datatable-sm p-datatable-gridlines"
      >
        <Column field="label" header="Campo" />
        <Column header="Valor anterior">
          <template #body="slotProps">
            {{ formatHistoryValue(slotProps.data.oldValue) }}
          </template>
        </Column>
        <Column header="Valor nuevo">
          <template #body="slotProps">
            {{ formatHistoryValue(slotProps.data.newValue) }}
          </template>
        </Column>
      </DataTable>

      <div v-else class="empty-changes">El registro no contiene diferencias detalladas.</div>
    </article>
  </div>
</template>

<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import ProgressSpinner from 'primevue/progressspinner'
import { formatHistoryValue, getHistoryChanges } from '@/utils/analysisHistory.js'

defineProps({
  records: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
  emptyMessage: {
    type: String,
    default: 'No hay modificaciones registradas.',
  },
})

const getChanges = (record) => getHistoryChanges(record)

const formatUser = (user) => {
  if (!user) return 'Usuario no informado'

  const fullName = [user.firstName, user.secondName, user.firstLastName, user.secondLastName]
    .filter(Boolean)
    .join(' ')
    .trim()

  return fullName || user.username || `Usuario #${user.id}`
}

const formatDate = (dateValue) => {
  if (!dateValue) return 'Fecha no informada'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return String(dateValue)

  return date.toLocaleString('es-CL')
}
</script>

<style scoped>
.empty-history,
.empty-changes,
.history-error {
  color: #6b7280;
  padding: 1.25rem;
  text-align: center;
}

.history-error {
  background: #fff3f3;
  border: 1px solid #f5b7b1;
  border-radius: 6px;
  color: #b42318;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.history-entry {
  border: 1px solid #dfe3e8;
  border-radius: 8px;
  padding: 1rem;
}

.history-header {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.history-user {
  font-weight: 600;
}

.history-date,
.history-id {
  color: #6b7280;
  font-size: 0.85rem;
}

.history-reason {
  background: #f7f8fa;
  border-radius: 6px;
  margin-bottom: 0.75rem;
  padding: 0.75rem;
}
</style>
