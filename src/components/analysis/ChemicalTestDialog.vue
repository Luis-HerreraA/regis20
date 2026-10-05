<template>
  <PrimeDialog
    :visible="visible"
    modal
    :header="isEditing ? 'Editar examen químico' : 'Examen Químico'"
    :style="{ width: '700px' }"
    @update:visible="closeDialog"
  >
    <div class="p-fluid">
      <div v-if="loadError" class="load-error">
        No se pudo recuperar el examen químico existente. Cierre el formulario e intente
        nuevamente.
      </div>

      <div class="grid formgrid">
        <div class="col-12 md:col-6 field">
          <label>Método</label>
          <InputText v-model="formData.method" placeholder="Método utilizado" disabled />
        </div>

        <div class="col-12 md:col-6 field">
          <label>Resultado</label>
          <Dropdown
            v-model="formData.result"
            :options="resultOptions"
            placeholder="Seleccione resultado"
            optionLabel="label"
            optionValue="value"
          />
        </div>

        <div class="col-12 field">
          <label>Conclusión</label>
          <PrimeTextarea
            v-model="formData.conclution"
            rows="4"
            placeholder="Conclusión del examen químico"
          />
        </div>

        <div v-if="isEditing" class="col-12 field">
          <label for="chemical-change-reason">Motivo de la modificación *</label>
          <PrimeTextarea
            id="chemical-change-reason"
            v-model="changeReason"
            rows="3"
            maxlength="500"
            autoResize
            placeholder="Describa brevemente por qué se modifica el examen químico"
            :class="{ 'p-invalid': reasonTouched && !changeReason.trim() }"
            @blur="reasonTouched = true"
          />
          <small v-if="reasonTouched && !changeReason.trim()" class="p-error">
            El motivo de la modificación es obligatorio.
          </small>
        </div>
      </div>
    </div>

    <template #footer>
      <PrimeButton
        label="Cancelar"
        severity="secondary"
        @click="closeDialog"
        :disabled="isSaving"
      />
      <PrimeButton
        :label="isEditing ? 'Actualizar' : 'Guardar'"
        severity="success"
        @click="submit"
        :loading="isSaving || isLoadingData"
        :disabled="isSaving || isLoadingData || loadError"
      />
    </template>
  </PrimeDialog>

</template>

<script>
import { computed, nextTick, ref, watch } from 'vue'
import PrimeDialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import PrimeTextarea from 'primevue/textarea'
import PrimeButton from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import { useToast } from 'primevue/usetoast'
import analysisService from '@/services/analysisService.js'
import chemicalTestHistoryService from '@/services/chemicalTestHistoryService.js'
import chemicalTestsService from '@/services/chemicalTestsService.js'
import { getHistoryChanges } from '@/utils/analysisHistory.js'

export default {
  name: 'ChemicalTestDialog',
  components: {
    PrimeDialog,
    InputText,
    PrimeTextarea,
    PrimeButton,
    Dropdown,
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
  emits: ['update:visible', 'saved'],
  setup(props, { emit }) {
    const toast = useToast()
    const isSaving = ref(false)
    const isLoadingData = ref(false)
    const loadError = ref(false)
    const existingChemicalTestId = ref(null)
    const originalChemicalTest = ref(null)
    const isLoadingExisting = ref(false)
    const changeReason = ref('')
    const reasonTouched = ref(false)
    const isEditing = computed(() => {
      const state = String(props.analysis?.state || '').toUpperCase()
      return (
        Boolean(existingChemicalTestId.value) ||
        ['COMPLETADO', 'COMPLETADO_RESERVADO'].includes(state)
      )
    })

    const resultOptions = [
      { label: 'Reacción Cualitativa Positiva', value: 'Reacción Cualitativa Positiva' },
      { label: 'Reacción Cualitativa Negativa', value: 'Reacción Cualitativa Negativa' },
    ]

    const formData = ref({
      method: 'Fast Blue',
      result: '',
      conclution: '',
    })

    // Watcher para actualizar automáticamente la conclusión según el resultado
    watch(
      () => formData.value.result,
      (newResult) => {
        if (isLoadingExisting.value) return

        if (newResult === 'Reacción Cualitativa Positiva') {
          formData.value.conclution =
            'Formación de color rojo púrpura por reacción del reactivo Azul Sólido B (Fast Blue) con compuestos cannabinoides'
        } else if (newResult === 'Reacción Cualitativa Negativa') {
          formData.value.conclution =
            'No hay formación de color rojo púrpura por reacción del reactivo Azul Sólido B (Fast Blue) con compuestos cannabinoides.'
        } else {
          formData.value.conclution = ''
        }
      },
    )

    // Cargar datos del examen químico existente cuando se abre
    watch(
      () => props.visible,
      async (newVal) => {
        if (newVal && props.analysis?.id) {
          const analysisId = props.analysis.id
          resetForm()
          loadError.value = false
          isLoadingData.value = true

          try {
            const { data } = await chemicalTestsService.getByAnalysisId(analysisId)
            if (!props.visible || props.analysis?.id !== analysisId) return

            const chemicalTest = data.content?.[0] || data?.[0]
            if (chemicalTest) {
              existingChemicalTestId.value = chemicalTest.id
              originalChemicalTest.value = JSON.parse(JSON.stringify(chemicalTest))
              const savedResult = String(chemicalTest.result || '').toUpperCase()
              const displayedResult =
                savedResult === 'POSITIVO'
                  ? 'Reacción Cualitativa Positiva'
                  : savedResult === 'NEGATIVO'
                    ? 'Reacción Cualitativa Negativa'
                    : chemicalTest.result || ''

              isLoadingExisting.value = true
              formData.value = {
                method: chemicalTest.method || '',
                result: displayedResult,
                conclution: chemicalTest.conclution || '',
              }
              await nextTick()
              isLoadingExisting.value = false
            } else {
              resetForm()
              loadError.value = isEditing.value
            }
          } catch (error) {
            if (!props.visible || props.analysis?.id !== analysisId) return

            console.error('Error cargando examen químico:', error)
            resetForm()
            loadError.value = true
            toast.add({
              severity: 'error',
              summary: 'Error de carga',
              detail: 'No se pudo recuperar el examen químico existente.',
              life: 4000,
            })
          } finally {
            if (props.analysis?.id === analysisId) isLoadingData.value = false
          }
        }
      },
    )

    const resetForm = () => {
      isLoadingExisting.value = false
      existingChemicalTestId.value = null
      originalChemicalTest.value = null
      changeReason.value = ''
      reasonTouched.value = false
      formData.value = {
        method: 'Fast Blue',
        result: '',
        conclution: '',
      }
    }

    const closeDialog = () => {
      emit('update:visible', false)
    }

    const buildChemicalTestSnapshot = (chemicalTest) => ({
      method: chemicalTest?.method ?? null,
      result: chemicalTest?.result ?? null,
      conclution: chemicalTest?.conclution ?? null,
    })

    const submit = async () => {
      if (!props.analysis?.id) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Análisis inválido',
          life: 3000,
        })
        return
      }

      if (isEditing.value && !existingChemicalTestId.value) {
        toast.add({
          severity: 'error',
          summary: 'Edición no disponible',
          detail: 'No se identificó el examen químico existente. Recargue e intente nuevamente.',
          life: 4500,
        })
        return
      }

      if (isEditing.value && !changeReason.value.trim()) {
        reasonTouched.value = true
        toast.add({
          severity: 'warn',
          summary: 'Motivo requerido',
          detail: 'Debe indicar el motivo de la modificación.',
          life: 3000,
        })
        return
      }

      try {
        // Convertir resultado mostrado a Positivo/Negativo
        let savedResult = 'NEGATIVO'
        if (formData.value.result === 'Reacción Cualitativa Positiva') {
          savedResult = 'POSITIVO'
        }

        const payload = {
          method: formData.value.method || null,
          result: savedResult,
          conclution: formData.value.conclution || null,
          analysis: props.analysis,
          user: { id: parseInt(localStorage.getItem('user_id')) || 1 },
        }

        const oldData = buildChemicalTestSnapshot(originalChemicalTest.value)
        const newData = buildChemicalTestSnapshot(payload)

        if (isEditing.value && getHistoryChanges({ oldData, newData }).length === 0) {
          toast.add({
            severity: 'info',
            summary: 'Sin cambios',
            detail: 'No se detectaron modificaciones para guardar.',
            life: 3000,
          })
          return
        }

        isSaving.value = true
        let savedChemicalTest

        if (existingChemicalTestId.value) {
          const { data } = await chemicalTestsService.update(existingChemicalTestId.value, payload)
          savedChemicalTest = data || { ...payload, id: existingChemicalTestId.value }
        } else {
          const { data } = await chemicalTestsService.create(payload)
          savedChemicalTest = data || payload
        }

        // Al editar se conserva la etapa actual, incluido un eventual informe reservado.
        let updatedAnalysis = props.analysis
        try {
          const currentState = String(props.analysis.state || '').toUpperCase()
          const nextState =
            currentState !== 'MICRO_COMPLETADO' ? props.analysis.state : 'COMPLETADO'

          const { data } = await analysisService.update(props.analysis.id, {
            ...props.analysis,
            state: nextState,
            result: savedResult,
            user: { id: parseInt(localStorage.getItem('user_id')) || 1 },
          })
          updatedAnalysis = data || updatedAnalysis
        } catch (stateErr) {
          console.warn('No se pudo actualizar el estado del análisis:', stateErr)
          toast.add({
            severity: 'warn',
            summary: 'Actualización parcial',
            detail:
              'El examen químico fue guardado, pero no se pudo actualizar su resultado general.',
            life: 5000,
          })
        }

        if (isEditing.value) {
          try {
            await chemicalTestHistoryService.create({
              chemicalTest: savedChemicalTest,
              analysis: updatedAnalysis,
              oldData,
              newData: buildChemicalTestSnapshot(savedChemicalTest),
              changedByUser: { id: parseInt(localStorage.getItem('user_id')) || 1 },
              changeReason: changeReason.value.trim(),
            })
          } catch (historyError) {
            console.error('Error registrando historial de examen químico:', historyError)
            toast.add({
              severity: 'warn',
              summary: 'Historial no registrado',
              detail:
                'El examen químico fue actualizado, pero no se pudo registrar su historial.',
              life: 5000,
            })
          }
        }

        toast.add({
          severity: 'success',
          summary: isEditing.value ? 'Actualizado' : 'Guardado',
          detail: isEditing.value
            ? 'Examen químico actualizado correctamente'
            : 'Examen químico guardado. Análisis COMPLETADO',
          life: 3000,
        })

        emit('saved')
        closeDialog()
      } catch (error) {
        console.error('Error guardando examen químico:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar el examen químico',
          life: 3000,
        })
      } finally {
        isSaving.value = false
      }
    }

    return {
      formData,
      isSaving,
      isLoadingData,
      loadError,
      existingChemicalTestId,
      isEditing,
      changeReason,
      reasonTouched,
      resultOptions,
      closeDialog,
      submit,
      resetForm,
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
  font-weight: 500;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.load-error {
  background: #fff3f3;
  border: 1px solid #f5b7b1;
  border-radius: 6px;
  color: #b42318;
  margin-bottom: 1rem;
  padding: 0.75rem;
}
</style>
