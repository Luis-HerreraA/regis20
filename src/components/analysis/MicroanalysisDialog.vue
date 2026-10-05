<template>
  <PrimeDialog
    :visible="visible"
    modal
    :header="isEditing ? 'Editar microanálisis' : 'Microanálisis'"
    :style="{ width: '700px' }"
    @update:visible="closeDialog"
  >
    <div class="p-fluid">
      <div v-if="loadError" class="load-error">
        No se pudo recuperar el microanálisis existente. Cierre el formulario e intente nuevamente.
      </div>

      <div class="grid formgrid">
        <div class="col-12 md:col-6 field">
          <label for="microanalysis-date">Fecha *</label>
          <Calendar
            inputId="microanalysis-date"
            v-model="formData.date"
            dateFormat="dd/mm/yy"
            showIcon
            required
            :class="{ 'p-invalid': dateTouched && !hasValidDate }"
            @blur="dateTouched = true"
          />
          <small v-if="dateTouched && !hasValidDate" class="p-error">
            La fecha del microanálisis es obligatoria.
          </small>
        </div>

        <div class="col-12 md:col-6 field">
          <label>Aumento Utilizado</label>
          <InputText v-model="formData.aumento" placeholder="Ej: 40x, 100x" />
        </div>
        <div class="col-12 md:col-6 field">
          <label>Tricomas Glandulares</label>
          <Dropdown
            v-model="formData.ttgland"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar..."
          />
        </div>

        <div class="col-12 md:col-6 field">
          <label>Tricomas no Glandulares</label>
          <Dropdown
            v-model="formData.ttnogland"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar..."
          />
        </div>

        <div class="col-12 md:col-6 field">
          <label>Estomas</label>
          <Dropdown
            v-model="formData.stomas"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar..."
          />
        </div>

        <div class="col-12 md:col-6 field">
          <label>Celulas Epidermicas</label>
          <Dropdown
            v-model="formData.celepi"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar..."
          />
        </div>

        <div class="col-12 field">
          <label>Resultado</label>
          <Dropdown
            v-model="formData.observation"
            :options="resultOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar resultado"
          />
        </div>

        <div v-if="isEditing" class="col-12 field">
          <label for="micro-change-reason">Motivo de la modificación *</label>
          <PrimeTextarea
            id="micro-change-reason"
            v-model="changeReason"
            rows="3"
            maxlength="500"
            autoResize
            placeholder="Describa brevemente por qué se modifica el microanálisis"
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
        label="Previsualizar"
        icon="pi pi-eye"
        severity="info"
        outlined
        @click="previewReport"
        :loading="isPreviewing"
        :disabled="isSaving || isLoadingData || loadError"
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
import { computed, ref, watch } from 'vue'
import PrimeDialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Calendar from 'primevue/calendar'
import PrimeButton from 'primevue/button'
import PrimeTextarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import { useToast } from 'primevue/usetoast'
import microanalysisService from '@/services/microanalysisService.js'
import microanalysisHistoryService from '@/services/microanalysisHistoryService.js'
import analysisService from '@/services/analysisService.js'
import { generarReporteMicroanalisisPDF } from '@/others/generarReporteMicroanalisis.js'
import { getHistoryChanges } from '@/utils/analysisHistory.js'

export default {
  name: 'MicroanalysisDialog',
  components: {
    PrimeDialog,
    InputText,
    Calendar,
    PrimeButton,
    PrimeTextarea,
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
    const isPreviewing = ref(false)
    const isLoadingData = ref(false)
    const loadError = ref(false)
    const existingMicroanalysisId = ref(null)
    const originalMicroanalysis = ref(null)
    const dateTouched = ref(false)
    const changeReason = ref('')
    const reasonTouched = ref(false)
    const isEditing = computed(() => {
      const state = String(props.analysis?.state || '').toUpperCase()
      return (
        Boolean(existingMicroanalysisId.value) ||
        ['MICRO_COMPLETADO', 'COMPLETADO', 'COMPLETADO_RESERVADO'].includes(state)
      )
    })

    const statusOptions = [
      { label: 'Presentes', value: 'Presentes' },
      { label: 'Ausentes', value: 'Ausentes' },
      { label: 'No observados', value: 'No observados' },
    ]

    const resultOptions = [
      { label: 'Característico de Cannabis', value: 'Característico de Cannabis' },
      { label: 'No Característico de Cannabis', value: 'No Característico de Cannabis' },
    ]

    const formData = ref({
      ttgland: null,
      ttnogland: null,
      stomas: null,
      celepi: null,
      observation: '',
      date: null,
      aumento: '',
    })

    const isValidDate = (value) => {
      const date = value instanceof Date ? value : new Date(value)
      return !Number.isNaN(date.getTime())
    }

    const hasValidDate = computed(() => isValidDate(formData.value.date))

    const parseDate = (value) => {
      if (!value) return null
      if (value instanceof Date) return isValidDate(value) ? value : null

      const localDateMatch = String(value).match(/^(\d{2})-(\d{2})-(\d{4})$/)
      if (localDateMatch) {
        const [, day, month, year] = localDateMatch
        const parsedDate = new Date(Number(year), Number(month) - 1, Number(day))
        const matchesInput =
          parsedDate.getFullYear() === Number(year) &&
          parsedDate.getMonth() === Number(month) - 1 &&
          parsedDate.getDate() === Number(day)
        return isValidDate(parsedDate) && matchesInput ? parsedDate : null
      }

      const parsedDate = new Date(value)
      return isValidDate(parsedDate) ? parsedDate : null
    }

    // Cargar datos del microanálisis existente cuando se abre
    watch(
      () => props.visible,
      async (newVal) => {
        if (newVal && props.analysis?.id) {
          const analysisId = props.analysis.id
          resetForm()
          loadError.value = false
          isLoadingData.value = true

          try {
            const { data } = await microanalysisService.getByAnalysisId(analysisId)
            if (!props.visible || props.analysis?.id !== analysisId) return

            const microanalysis = data.content?.[0] || data?.[0]
            if (microanalysis) {
              existingMicroanalysisId.value = microanalysis.id
              originalMicroanalysis.value = JSON.parse(JSON.stringify(microanalysis))
              formData.value = {
                ttgland: microanalysis.ttgland || null,
                ttnogland: microanalysis.ttnogland || null,
                stomas: microanalysis.stomas || null,
                celepi: microanalysis.celepi || null,
                observation: microanalysis.observation || '',
                date: parseDate(microanalysis.date),
                aumento: microanalysis.aumento || '',
              }
            } else {
              existingMicroanalysisId.value = null
              resetForm()
              loadError.value = isEditing.value
            }
          } catch (error) {
            if (!props.visible || props.analysis?.id !== analysisId) return

            console.error('Error cargando microanálisis:', error)
            resetForm()
            loadError.value = true
            toast.add({
              severity: 'error',
              summary: 'Error de carga',
              detail: 'No se pudo recuperar el microanálisis existente.',
              life: 4000,
            })
          } finally {
            if (props.analysis?.id === analysisId) isLoadingData.value = false
          }
        }
      },
    )

    const resetForm = () => {
      existingMicroanalysisId.value = null
      originalMicroanalysis.value = null
      dateTouched.value = false
      changeReason.value = ''
      reasonTouched.value = false
      formData.value = {
        ttgland: null,
        ttnogland: null,
        stomas: null,
        celepi: null,
        observation: '',
        date: null,
        aumento: '',
        conclution: '',
      }
    }

    const formatDate = (date) => {
      if (!isValidDate(date)) return null
      const d = new Date(date)
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      return `${day}-${month}-${year}`
    }

    const buildMicroanalysisSnapshot = (microanalysis) => ({
      ttgland: microanalysis?.ttgland ?? null,
      ttnogland: microanalysis?.ttnogland ?? null,
      stomas: microanalysis?.stomas ?? null,
      celepi: microanalysis?.celepi ?? null,
      observation: microanalysis?.observation ?? null,
      conclution: microanalysis?.conclution ?? null,
      date: microanalysis?.date ?? null,
      aumento: microanalysis?.aumento ?? null,
    })

    const validateRequiredDate = () => {
      dateTouched.value = true
      if (hasValidDate.value) return true

      toast.add({
        severity: 'warn',
        summary: 'Fecha requerida',
        detail: 'Debe ingresar la fecha del microanálisis.',
        life: 3000,
      })
      return false
    }

    const closeDialog = () => {
      emit('update:visible', false)
    }

    const previewReport = () => {
      if (!validateRequiredDate()) return

      if (!props.analysis?.id) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Análisis inválido', life: 3000 })
        return
      }

      const previewWindow = window.open('', '_blank')

      if (!previewWindow) {
        toast.add({
          severity: 'warn',
          summary: 'Ventana bloqueada',
          detail: 'Permita las ventanas emergentes para previsualizar el reporte',
          life: 4000,
        })
        return
      }

      isPreviewing.value = true
      try {
        const microResult = formData.value.observation
          ? formData.value.observation === 'Característico de Cannabis'
            ? 'POSITIVO'
            : 'NEGATIVO'
          : null
        const conclution = formData.value.observation
          ? microResult === 'POSITIVO'
            ? 'Se identifican estructuras compatibles con especie vegetal del género Cannabis'
            : 'No se identifican estructuras compatibles con especie vegetal del género Cannabis'
          : null
        const previewAnalysis = {
          ...props.analysis,
          state: 'BORRADOR',
          micro: microResult,
        }
        const previewMicroanalysis = {
          ...formData.value,
          date: formData.value.date ? formatDate(formData.value.date) : null,
          conclution,
          analysis: previewAnalysis,
          user: props.analysis.user,
        }

        generarReporteMicroanalisisPDF(previewAnalysis, previewMicroanalysis, {
          preview: true,
          draft: true,
          previewWindow,
        })

        toast.add({
          severity: 'success',
          summary: 'Vista previa generada',
          detail: 'El borrador del reporte de microanálisis se abrió en una pestaña nueva',
          life: 3000,
        })
      } catch (error) {
        if (!previewWindow.closed) previewWindow.close()

        console.error('Error previsualizando reporte de microanálisis:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo previsualizar el reporte de microanálisis',
          life: 3000,
        })
      } finally {
        isPreviewing.value = false
      }
    }

    const submit = async () => {
      if (!validateRequiredDate()) return

      if (!props.analysis?.id) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Análisis inválido',
          life: 3000,
        })
        return
      }

      if (isEditing.value && !existingMicroanalysisId.value) {
        toast.add({
          severity: 'error',
          summary: 'Edición no disponible',
          detail: 'No se identificó el microanálisis existente. Recargue e intente nuevamente.',
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

      const conclution =
        formData.value.observation === 'Característico de Cannabis'
          ? 'Se identifican estructuras compatibles con especie vegetal del género Cannabis'
          : 'No se identifican estructuras compatibles con especie vegetal del género Cannabis'
      try {
        const payload = {
          ttgland: formData.value.ttgland || null,
          ttnogland: formData.value.ttnogland || null,
          stomas: formData.value.stomas || null,
          celepi: formData.value.celepi || null,
          observation: formData.value.observation || null,
          conclution: conclution || null,
          date: formData.value.date ? formatDate(formData.value.date) : null,
          aumento: formData.value.aumento || null,
          celresi: originalMicroanalysis.value?.celresi ?? null,
          cris: originalMicroanalysis.value?.cris ?? null,
          analysis: props.analysis,
          user: { id: parseInt(localStorage.getItem('user_id')) || 1 },
        }

        const oldData = buildMicroanalysisSnapshot(originalMicroanalysis.value)
        const newData = buildMicroanalysisSnapshot(payload)

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
        let savedMicroanalysis

        if (existingMicroanalysisId.value) {
          const { data } = await microanalysisService.update(existingMicroanalysisId.value, payload)
          savedMicroanalysis = data || { ...payload, id: existingMicroanalysisId.value }
        } else {
          const { data } = await microanalysisService.create(payload)
          savedMicroanalysis = data || payload
        }

        // Convertir resultado mostrado a Positivo/Negativo para guardar en micro
        let savedResult = 'NEGATIVO'
        if (formData.value.observation === 'Característico de Cannabis') {
          savedResult = 'POSITIVO'
        }

        // Al editar se conserva la etapa actual para no invalidar el examen químico.
        let updatedAnalysis = props.analysis
        try {
          const currentState = String(props.analysis.state || '').toUpperCase()
          const nextState =
            currentState !== 'MACRO_COMPLETADO' ? props.analysis.state : 'MICRO_COMPLETADO'

          const { data } = await analysisService.update(props.analysis.id, {
            ...props.analysis,
            state: nextState,
            micro: savedResult,
            user: { id: parseInt(localStorage.getItem('user_id')) || 1 },
          })
          updatedAnalysis = data || updatedAnalysis
        } catch (stateErr) {
          console.warn('No se pudo actualizar el estado del análisis:', stateErr)
          toast.add({
            severity: 'warn',
            summary: 'Actualización parcial',
            detail:
              'El microanálisis fue guardado, pero no se pudo actualizar su resultado general.',
            life: 5000,
          })
        }

        if (isEditing.value) {
          try {
            await microanalysisHistoryService.create({
              microanalysis: savedMicroanalysis,
              analysis: updatedAnalysis,
              oldData,
              newData: buildMicroanalysisSnapshot(savedMicroanalysis),
              changedByUser: { id: parseInt(localStorage.getItem('user_id')) || 1 },
              changeReason: changeReason.value.trim(),
            })
          } catch (historyError) {
            console.error('Error registrando historial de microanálisis:', historyError)
            toast.add({
              severity: 'warn',
              summary: 'Historial no registrado',
              detail:
                'El microanálisis fue actualizado, pero no se pudo registrar su historial.',
              life: 5000,
            })
          }
        }

        toast.add({
          severity: 'success',
          summary: isEditing.value ? 'Actualizado' : 'Guardado',
          detail: isEditing.value
            ? 'Microanálisis actualizado correctamente'
            : 'Microanálisis guardado. Proceda con Examen Químico',
          life: 3000,
        })

        emit('saved')
        closeDialog()
      } catch (error) {
        console.error('Error guardando microanálisis:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar el microanálisis',
          life: 3000,
        })
      } finally {
        isSaving.value = false
      }
    }

    return {
      formData,
      isSaving,
      isPreviewing,
      isLoadingData,
      loadError,
      existingMicroanalysisId,
      isEditing,
      changeReason,
      reasonTouched,
      dateTouched,
      hasValidDate,
      statusOptions,
      resultOptions,
      closeDialog,
      previewReport,
      submit,
      formatDate,
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
