<template>
  <Dialog
    :visible="visible"
    modal
    header="Microanálisis"
    :style="{ width: '700px' }"
    @update:visible="closeDialog"
  >
    <div class="p-fluid">
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
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" severity="secondary" @click="closeDialog" :disabled="isSaving" />
      <Button
        label="Previsualizar"
        icon="pi pi-eye"
        severity="info"
        outlined
        @click="previewReport"
        :loading="isPreviewing"
        :disabled="isSaving"
      />
      <Button
        label="Guardar"
        severity="success"
        @click="submit"
        :loading="isSaving"
        :disabled="isSaving"
      />
    </template>
  </Dialog>
</template>

<script>
import { computed, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Calendar from 'primevue/calendar'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import { useToast } from 'primevue/usetoast'
import microanalysisService from '@/services/microanalysisService.js'
import analysisService from '@/services/analysisService.js'
import { generarReporteMicroanalisisPDF } from '@/others/generarReporteMicroanalisis.js'

export default {
  name: 'MicroanalysisDialog',
  components: {
    Dialog,
    InputText,
    Calendar,
    Button,
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
    const existingMicroanalysisId = ref(null)
    const dateTouched = ref(false)

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
          dateTouched.value = false
          try {
            const { data } = await microanalysisService.getByAnalysisId(props.analysis.id)
            const microanalysis = data.content?.[0] || data?.[0]
            if (microanalysis) {
              existingMicroanalysisId.value = microanalysis.id
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
            }
          } catch (error) {
            console.error('Error cargando microanálisis:', error)
            existingMicroanalysisId.value = null
            resetForm()
          }
        }
      },
    )

    const resetForm = () => {
      existingMicroanalysisId.value = null
      dateTouched.value = false
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

      isSaving.value = true
      let conclution =
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
          analysis: props.analysis,
          user: { id: parseInt(localStorage.getItem('user_id')) || 1 },
        }

        console.log('📤 Enviando payload:', payload)

        if (existingMicroanalysisId.value) {
          // Actualizar existente
          await microanalysisService.update(existingMicroanalysisId.value, payload)
          toast.add({
            severity: 'success',
            summary: 'Actualizado',
            detail: 'Microanálisis actualizado correctamente',
            life: 3000,
          })
        } else {
          // Crear nuevo
          console.log('Creando nuevo microanálisis', payload)
          await microanalysisService.create(payload)
          toast.add({
            severity: 'success',
            summary: 'Guardado',
            detail: 'Microanálisis guardado. Proceda con Examen Químico',
            life: 3000,
          })
        }

        // Convertir resultado mostrado a Positivo/Negativo para guardar en micro
        let savedResult = 'NEGATIVO'
        if (formData.value.observation === 'Característico de Cannabis') {
          savedResult = 'POSITIVO'
        }

        // Actualizar estado del análisis a MICRO_COMPLETADO y guardar resultado en micro
        try {
          await analysisService.update(props.analysis.id, {
            ...props.analysis,
            state: 'MICRO_COMPLETADO',
            micro: savedResult,
            user: { id: parseInt(localStorage.getItem('user_id')) || 1 },
          })
        } catch (stateErr) {
          console.warn('No se pudo actualizar el estado del análisis:', stateErr)
        }

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
      existingMicroanalysisId,
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
</style>
