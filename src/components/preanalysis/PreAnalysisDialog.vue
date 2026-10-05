<template>
  <Dialog
    :visible="visible"
    modal
    header="Enviar a Pre-Análisis"
    :style="{ width: '500px' }"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="p-fluid">
      <div class="field">
        <label for="destination">Destino *</label>
        <Dropdown
          id="destination"
          v-model="formData.destination"
          :options="destinations"
          optionLabel="name"
          optionValue="id"
          placeholder="Seleccione destino"
          class="w-full"
          :loading="loadingDestinations"
        />
      </div>

      <div class="field">
        <label for="weight">{{ samplingLabel }} *</label>
        <InputNumber
          id="weight"
          v-model="formData.weight_sampled"
          mode="decimal"
          :min="0"
          :max="totalAvailable"
          :minFractionDigits="isUnitMeasurement ? 0 : 1"
          :maxFractionDigits="isUnitMeasurement ? 0 : 2"
          :useGrouping="false"
          class="w-full"
        />
        <small class="text-500">
          Disponible: {{ formattedTotalAvailable }} {{ unitLabel }}
          <template v-if="isUnitMeasurement && referenceWeight !== null">
            · Peso neto referencial: {{ referenceWeight }} g
          </template>
        </small>
        <small class="p-error block" v-if="formData.weight_sampled > totalAvailable">
          La cantidad no puede superar el total disponible ({{ formattedTotalAvailable }}
          {{ unitLabel }}).
        </small>
      </div>

      <div class="field">
        <label for="method">Método de Destrucción</label>
        <Dropdown
          id="method"
          v-model="formData.methodDestruction"
          :options="methodsDestruction"
          optionLabel="name"
          optionValue="id"
          placeholder="Seleccione método"
          class="w-full"
          :loading="loadingMethodsDestruction"
        />
      </div>

      <div class="field">
        <label for="observation">Observación</label>
        <Textarea
          id="observation"
          v-model="formData.observation"
          rows="3"
          placeholder="Observaciones adicionales..."
          class="w-full"
        />
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" icon="pi pi-times" @click="closeDialog" class="p-button-text" />
      <Button
        label="Enviar"
        icon="pi pi-send"
        @click="submitForm"
        :loading="loading"
        :disabled="!isFormValid"
      />
    </template>
  </Dialog>
</template>

<script>
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'

export default {
  name: 'PreAnalysisDialog',
  components: {
    Dialog,
    Dropdown,
    InputNumber,
    Textarea,
    Button,
  },
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    selectedSubstance: {
      type: Object,
      default: null,
    },
    destinations: {
      type: Array,
      default: () => [],
    },
    methodsDestruction: {
      type: Array,
      default: () => [],
    },
    loadingDestinations: {
      type: Boolean,
      default: false,
    },
    loadingMethodsDestruction: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:visible', 'submit', 'cancel'],
  setup(props, { emit }) {
    const formData = ref({
      destination: null,
      weight_sampled: null,
      methodDestruction: null,
      observation: '',
    })

    const normalizeMeasurementType = (measurementType) =>
      String(measurementType || '')
        .trim()
        .toLowerCase()

    const isUnitMeasurement = computed(() => {
      const measurementType = normalizeMeasurementType(props.selectedSubstance?.measurement_type)
      return measurementType.includes('unidad') || measurementType.includes('paquete')
    })

    const totalAvailable = computed(() =>
      isUnitMeasurement.value
        ? Number(props.selectedSubstance?.unit_quantity || 0)
        : Number(props.selectedSubstance?.weight_net ?? props.selectedSubstance?.weight ?? 0),
    )

    const referenceWeight = computed(() => {
      const weight = props.selectedSubstance?.weight_net ?? props.selectedSubstance?.weight
      return weight === null || weight === undefined || weight === '' ? null : Number(weight)
    })

    const unitLabel = computed(() => (isUnitMeasurement.value ? 'unidades' : 'g'))
    const samplingLabel = computed(() =>
      isUnitMeasurement.value ? 'Cantidad a muestrear (unidades)' : 'Peso a muestrear (g)',
    )
    const formattedTotalAvailable = computed(() =>
      isUnitMeasurement.value
        ? String(Math.trunc(totalAvailable.value))
        : totalAvailable.value.toFixed(2),
    )

    const isFormValid = computed(() => {
      return (
        formData.value.destination &&
        formData.value.weight_sampled &&
        formData.value.weight_sampled > 0 &&
        formData.value.weight_sampled <= totalAvailable.value &&
        (!isUnitMeasurement.value || Number.isInteger(Number(formData.value.weight_sampled)))
      )
    })

    const closeDialog = () => {
      emit('update:visible', false)
      emit('cancel')
    }

    const submitForm = () => {
      if (isFormValid.value) {
        emit('submit', formData.value)
      }
    }

    // Resetear formulario cuando se abre el diálogo y auto-seleccionar destino
    watch(
      () => props.visible,
      (newVal) => {
        if (newVal) {
          formData.value = {
            destination: null,
            weight_sampled: null,
            methodDestruction: null,
            observation: '',
          }

          // Auto-seleccionar destino basado en el tipo de sustancia
          if (props.selectedSubstance?.substanceType?.id) {
            const substanceTypeId = props.selectedSubstance.substanceType.id
            const interiorGroup = [1, 2, 3]
            const isInteriorType = interiorGroup.includes(substanceTypeId)

            // Buscar el destino correcto
            if (isInteriorType) {
              // Buscar destino con id 1
              const interiorDestination = props.destinations.find((d) => d.id === 1)
              if (interiorDestination) {
                formData.value.destination = interiorDestination.id
              }
            } else {
              // Buscar destino con id 2
              const exteriorDestination = props.destinations.find((d) => d.id === 2)
              if (exteriorDestination) {
                formData.value.destination = exteriorDestination.id
              }
            }
          }
        }
      },
    )

    return {
      formData,
      isFormValid,
      closeDialog,
      submitForm,
      isUnitMeasurement,
      totalAvailable,
      referenceWeight,
      unitLabel,
      samplingLabel,
      formattedTotalAvailable,
    }
  },
}
</script>
