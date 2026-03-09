<template>
  <Dialog
    :visible="visible"
    modal
    header="Enviar Contramuestras a Destrucción"
    :style="{ width: '800px' }"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="p-fluid">
      <div class="mb-4">
        <h4 class="mb-2">Almacenamientos Seleccionados</h4>
        <DataTable
          :value="selectedStorages"
          class="p-datatable-sm"
          responsiveLayout="scroll"
          :rows="5"
          :paginator="selectedStorages.length > 5"
        >
          <Column field="id" header="N° Muestra" :style="{ width: '100px' }" />
          <Column header="N° NUE" :style="{ width: '120px' }">
            <template #body="slotProps">
              {{ slotProps.data.substance?.nue || slotProps.data.substance?.id || '—' }}
            </template>
          </Column>
          <Column header="N° Acta" :style="{ width: '120px' }">
            <template #body="slotProps">
              {{ slotProps.data.substance?.reception?.number || '—' }}
            </template>
          </Column>
          <Column header="Cantidad" :style="{ width: '140px' }">
            <template #body="slotProps">
              {{ formatStorageAmount(slotProps.data) }} {{ getStorageUnitLabel(slotProps.data) }}
            </template>
          </Column>
        </DataTable>

        <div class="mt-3 flex justify-content-end">
          <p class="text-lg font-bold" v-if="!hasMixedUnits">
            Total: <span class="text-primary">{{ formattedTotalAmount }} {{ totalUnitLabel }}</span>
          </p>
          <p class="text-sm text-500" v-else>Selección con distintos tipos de medición</p>
        </div>
      </div>

      <div class="field">
        <label for="methodSelect">Método de Destrucción *</label>
        <Dropdown
          id="methodSelect"
          v-model="formData.methodDestruction"
          :options="methodsDestruction"
          optionLabel="name"
          placeholder="Seleccione un método"
          class="w-full"
        />
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" icon="pi pi-times" @click="closeDialog" class="p-button-text" />
      <Button
        label="Enviar a Destrucción"
        icon="pi pi-send"
        @click="submitForm"
        :loading="loading"
      />
    </template>
  </Dialog>
</template>

<script>
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'

export default {
  name: 'DestructionDialog',
  components: {
    Dialog,
    DataTable,
    Column,
    Dropdown,
    Textarea,
    Button,
  },
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    selectedStorages: {
      type: Array,
      default: () => [],
    },
    methodsDestruction: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:visible', 'submit'],

  setup(props, { emit }) {
    const formData = ref({
      methodDestruction: null,
      observation: '',
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

    const getStorageUnitLabel = (storage) => {
      const measurementType = storage?.measurement_type || storage?.substance?.measurement_type
      return isUnitMeasurementType(measurementType) ? 'und' : 'gr'
    }

    const getStorageAmount = (storage) => {
      if (getStorageUnitLabel(storage) === 'und') {
        return Number(
          storage?.unit_quantity !== undefined && storage?.unit_quantity !== null
            ? storage.unit_quantity
            : storage?.counter_sample_quantity || 0,
        )
      }

      return Number(storage?.counter_sample_quantity || 0)
    }

    const formatStorageAmount = (storage) => {
      const amount = getStorageAmount(storage)
      return getStorageUnitLabel(storage) === 'und' ? String(Math.trunc(amount)) : amount.toFixed(2)
    }

    const hasMixedUnits = computed(() => {
      if (!props.selectedStorages.length) return false
      const labels = new Set(props.selectedStorages.map((storage) => getStorageUnitLabel(storage)))
      return labels.size > 1
    })

    const totalAmount = computed(() => {
      return props.selectedStorages.reduce((total, storage) => total + getStorageAmount(storage), 0)
    })

    const totalUnitLabel = computed(() => {
      if (!props.selectedStorages.length || hasMixedUnits.value) return ''
      return getStorageUnitLabel(props.selectedStorages[0])
    })

    const formattedTotalAmount = computed(() => {
      if (totalUnitLabel.value === 'und') return String(Math.trunc(totalAmount.value))
      return totalAmount.value.toFixed(2)
    })

    // Limpiar formulario cuando se abre/cierra el diálogo
    watch(
      () => props.visible,
      (newVal) => {
        if (newVal) {
          formData.value = {
            methodDestruction: null,
            observation: '',
          }
        }
      },
    )

    const closeDialog = () => {
      emit('update:visible', false)
    }

    const submitForm = () => {
      if (formData.value.methodDestruction) {
        emit('submit', {
          methodDestruction: formData.value.methodDestruction,
          observation: formData.value.observation,
        })
      }
    }

    return {
      formData,
      hasMixedUnits,
      totalUnitLabel,
      formattedTotalAmount,
      getStorageUnitLabel,
      formatStorageAmount,
      closeDialog,
      submitForm,
    }
  },
}
</script>
