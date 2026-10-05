<template>
  <div :class="showTrigger ? 'card flex justify-center' : null">
    <PrimeButton
      v-if="showTrigger"
      :icon="isEditing ? 'pi pi-pencil' : 'pi pi-cog'"
      :class="[
        'p-button-rounded p-button-outlined',
        isEditing ? 'p-button-warning' : 'p-button-success',
      ]"
      @click="openDialog"
      v-tooltip.top="isEditing ? 'Editar macroanálisis' : 'Macroanálisis'"
    />
    <PrimeDialog
      v-model:visible="visible"
      :style="{ width: '700px' }"
      modal
      :headerStyle="{ padding: '1rem 1.5rem' }"
      :transition-options="{ name: 'fade', duration: 200 }"
      @hide="handleClose"
    >
      <template #header>
        <span class="text-xl font-semibold">
          {{ isEditing ? 'Editar macroanálisis' : 'Macroanálisis' }}
        </span>
      </template>

      <div class="dialog-content">
        <!-- DATOS FIJOS: tarjeta mejorada -->
        <Card class="mb-3 p-card-compact">
          <template #title>
            <div class="flex align-items-center justify-content-between w-full">
              <div class="flex align-items-center gap-3">
                <span class="text-base">Macroanalisis</span>
              </div>
              <Tag :value="form.state || '—'" :severity="stateSeverity(form.state)" />
            </div>
          </template>
          <template #content>
            <div class="grid">
              <div class="col-12 md:col-6">
                <div class="field small">
                  <label class="muted">Recepción</label>
                  <div class="value">#{{ form.preAnalysis?.reception?.number || '—' }}</div>
                </div>
                <div class="field small">
                  <label class="muted">Usuario</label>
                  <div class="value">
                    {{
                      form.user?.firstName
                        ? form.user.firstName + ' ' + (form.user.lastName || '')
                        : '—'
                    }}
                  </div>
                </div>
              </div>

              <div class="col-12 md:col-6">
                <div class="field small">
                  <label class="muted">{{
                    getSampledFieldLabel(form.preAnalysis?.substance)
                  }}</label>
                  <div class="value">{{ form.preAnalysis?.weight_sampled ?? '—' }}</div>
                </div>
                <div class="field small">
                  <label class="muted">Sustancia</label>
                  <div class="value">
                    {{ form.preAnalysis?.substance?.substanceType?.name || '—' }}
                  </div>
                </div>
                <div class="field small">
                  <label class="muted">Tipo de medición</label>
                  <div class="value">
                    {{ form.preAnalysis?.substance?.measurement_type || '—' }}
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <hr class="my-3" />

        <!-- CAMPOS EDITABLES -->
        <h3 class="font-semibold mb-2">
          {{ isEditing ? 'Modificar análisis' : 'Completar análisis' }}
        </h3>

        <div class="grid formgrid">
          <div class="col-12 md:col-6 field">
            <label>N° Protocolo</label>
            <InputText v-model="form.number_protocol" />
          </div>

          <div class="col-12 md:col-6 field">
            <label>Fecha análisis</label>
            <Calendar v-model="form.date_analysis" dateFormat="dd/mm/yy" showIcon />
          </div>

          <div class="col-12 md:col-6 field">
            <label>Color</label>
            <Dropdown
              v-model="form.color"
              :options="colorOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccione color"
            />
          </div>

          <div class="col-12 md:col-6 field">
            <label>Olor</label>
            <Dropdown
              v-model="form.smell"
              :options="smellOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccione olor"
            />
          </div>

          <!-- NUEVOS CAMPOS -->
          <div class="col-12 md:col-6 field">
            <label>Grado de fragmentación</label>
            <Dropdown
              v-model="form.gradeFrac"
              :options="gradeFracOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccione grado de fragmentación"
            />
          </div>

          <div class="col-12 md:col-6 field">
            <label>Grado de humedad</label>
            <Dropdown
              v-model="form.gradeHum"
              :options="gradeHumOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccione grado de humedad"
            />
          </div>

          <div class="col-12 md:col-6 field">
            <label>Resultado</label>
            <Dropdown
              v-model="form.result"
              :options="resultOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccione resultado"
            />
          </div>

          <div v-if="isEditing" class="col-12 field">
            <label for="macro-change-reason">Motivo de la modificación *</label>
            <PrimeTextarea
              id="macro-change-reason"
              v-model="changeReason"
              rows="3"
              maxlength="500"
              autoResize
              placeholder="Describa brevemente por qué se modifica el macroanálisis"
              :class="{ 'p-invalid': reasonTouched && !changeReason.trim() }"
              @blur="reasonTouched = true"
            />
            <small v-if="reasonTouched && !changeReason.trim()" class="p-error">
              El motivo de la modificación es obligatorio.
            </small>
          </div>
        </div>

        <hr class="my-3" />

        <!-- PARTES DE LA PLANTA -->
        <h3 class="font-semibold mb-3">Partes de la planta</h3>
        <div class="grid formgrid">
          <div class="col-12 md:col-4 field">
            <div class="flex align-items-center">
              <Checkbox v-model="form.has_palmed_leaves" :binary="true" inputId="palmed_leaves" />
              <label for="palmed_leaves" class="ml-2">Hojas palmeadas</label>
            </div>
          </div>

          <div class="col-12 md:col-4 field">
            <div class="flex align-items-center">
              <Checkbox v-model="form.has_leaf_remains" :binary="true" inputId="leaf_remains" />
              <label for="leaf_remains" class="ml-2">Restos de hojas</label>
            </div>
          </div>

          <div class="col-12 md:col-4 field">
            <div class="flex align-items-center">
              <Checkbox v-model="form.has_stems" :binary="true" inputId="stems" />
              <label for="stems" class="ml-2">Tallos</label>
            </div>
          </div>

          <div class="col-12 md:col-4 field">
            <div class="flex align-items-center">
              <Checkbox v-model="form.has_roots" :binary="true" inputId="roots" />
              <label for="roots" class="ml-2">Raíces</label>
            </div>
          </div>

          <div class="col-12 md:col-4 field">
            <div class="flex align-items-center">
              <Checkbox v-model="form.has_seeds" :binary="true" inputId="seeds" />
              <label for="seeds" class="ml-2">Semillas</label>
            </div>
          </div>

          <div class="col-12 md:col-4 field">
            <div class="flex align-items-center">
              <Checkbox v-model="form.has_inflorescences" :binary="true" inputId="inflorescences" />
              <label for="inflorescences" class="ml-2">Inflorescencias</label>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <PrimeButton
          label="Previsualizar"
          icon="pi pi-eye"
          severity="info"
          outlined
          @click="previewReport"
          :loading="isPreviewing"
          :disabled="isSaving"
        />
        <PrimeButton
          :label="isEditing ? 'Actualizar' : 'Guardar'"
          severity="success"
          @click="submit"
          :loading="isSaving"
          :disabled="isSaving"
        />
        <PrimeButton
          label="Cerrar"
          severity="secondary"
          @click="closeDialog"
          :disabled="isSaving"
        />
      </template>
    </PrimeDialog>

  </div>
</template>

<script>
import { computed, ref } from 'vue'
import PrimeButton from 'primevue/button'
import PrimeDialog from 'primevue/dialog'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import PrimeTextarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import Checkbox from 'primevue/checkbox'
import { useToast } from 'primevue/usetoast'
import analysisHistoryService from '@/services/analysisHistoryService.js'
import analysisService from '@/services/analysisService'
import { generarReporteAnalisisPDF } from '@/others/generarReporteAnalisis.js'
import { getHistoryChanges } from '@/utils/analysisHistory.js'

export default {
  name: 'CompleteAnalysis',
  components: {
    PrimeButton,
    PrimeDialog,
    Card,
    Tag,
    InputText,
    PrimeTextarea,
    Dropdown,
    Checkbox,
  },
  props: {
    analysis: { type: Object, default: null },
    showTrigger: { type: Boolean, default: true },
  },
  emits: ['processed'],
  setup(props, { emit, expose }) {
    const visible = ref(false)
    const isEditing = computed(
      () => String(props.analysis?.state || '').toUpperCase() !== 'PENDIENTE',
    )

    // Form con valores editables
    const form = ref({})
    const originalAnalysis = ref(null)
    const changeReason = ref('')
    const reasonTouched = ref(false)

    // Opciones para el resultado
    const resultOptions = ref([
      { label: 'Característico de Cannabis', value: 'Característico de Cannabis' },
      { label: 'No Característico de Cannabis', value: 'No Característico de Cannabis' },
    ])

    // Opciones para color
    const colorOptions = ref([
      { label: 'Verde', value: 'Verde' },
      { label: 'Café', value: 'Café' },
      { label: 'Amarillo', value: 'Amarillo' },
      { label: 'Verde amarillo', value: 'Verde amarillo' },
      { label: 'Verde Café', value: 'Verde Café' },
    ])

    // Opciones para olor
    const smellOptions = ref([
      { label: 'Característico', value: 'Característico' },
      { label: 'No característico', value: 'No característico' },
    ])

    // Opciones para grado de humedad
    const gradeHumOptions = ref([
      { label: 'Seca', value: 'Seca' },
      { label: 'Fresca', value: 'Fresca' },
    ])

    // Opciones para grado de fragmentación
    const gradeFracOptions = ref([
      { label: 'Fragmentada', value: 'Fragmentada' },
      { label: 'Entera', value: 'Entera' },
      { label: 'Plantas pequeñas', value: 'Plantas pequeñas' },
      {
        label: 'Semillas de forma ovoide, testa dura y resistente',
        value: 'Semillas de forma ovoide, testa dura y resistente',
      },
    ])

    // Copia profunda del analysis cuando se abre el modal
    const openDialog = () => {
      originalAnalysis.value = JSON.parse(JSON.stringify(props.analysis || {}))
      form.value = JSON.parse(JSON.stringify(props.analysis || {}))
      changeReason.value = ''
      reasonTouched.value = false

      // El resultado se guarda como POSITIVO/NEGATIVO, pero el selector usa una descripción.
      const savedMacroResult = String(form.value.macro || '').toUpperCase()
      if (savedMacroResult === 'POSITIVO') {
        form.value.result = 'Característico de Cannabis'
      } else if (savedMacroResult === 'NEGATIVO') {
        form.value.result = 'No Característico de Cannabis'
      }

      if (form.value.date_analysis) {
        const parsedDate = new Date(form.value.date_analysis)
        if (!Number.isNaN(parsedDate.getTime())) form.value.date_analysis = parsedDate
      }

      visible.value = true
    }

    expose({ openDialog })

    const closeDialog = () => {
      visible.value = false
    }

    const handleClose = () => {
      visible.value = false
    }

    const toast = useToast()
    const isSaving = ref(false)
    const isPreviewing = ref(false)

    const normalizeDateForApi = (value) => {
      if (!(value instanceof Date)) return value || null
      return Number.isNaN(value.getTime()) ? null : value.toISOString()
    }

    const buildMacroSnapshot = (analysis) => ({
      number_protocol: analysis?.number_protocol ?? null,
      date_analysis: normalizeDateForApi(analysis?.date_analysis),
      gradeFrac: analysis?.gradeFrac ?? null,
      gradeHum: analysis?.gradeHum ?? null,
      color: analysis?.color ?? null,
      smell: analysis?.smell ?? null,
      macro: analysis?.macro ?? null,
      has_palmed_leaves: Boolean(analysis?.has_palmed_leaves),
      has_leaf_remains: Boolean(analysis?.has_leaf_remains),
      has_stems: Boolean(analysis?.has_stems),
      has_roots: Boolean(analysis?.has_roots),
      has_seeds: Boolean(analysis?.has_seeds),
      has_inflorescences: Boolean(analysis?.has_inflorescences),
    })

    const previewReport = () => {
      if (!form.value?.id) {
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
        const macroResult = form.value.result
          ? form.value.result === 'Característico de Cannabis'
            ? 'POSITIVO'
            : 'NEGATIVO'
          : null
        const previewData = {
          ...form.value,
          state: 'BORRADOR',
          macro: macroResult,
          result: null,
        }

        generarReporteAnalisisPDF(previewData, {
          preview: true,
          draft: true,
          previewWindow,
        })

        toast.add({
          severity: 'success',
          summary: 'Vista previa generada',
          detail: 'El borrador del reporte se abrió en una pestaña nueva',
          life: 3000,
        })
      } catch (error) {
        if (!previewWindow.closed) previewWindow.close()

        console.error('Error previsualizando reporte de análisis:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo previsualizar el reporte de análisis',
          life: 3000,
        })
      } finally {
        isPreviewing.value = false
      }
    }

    // Emitir los datos para guardar (y persistir en backend)
    const submit = async () => {
      if (!form.value || !form.value.id) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Análisis inválido', life: 3000 })
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
        // Convertir resultado mostrado a Positivo/Negativo para guardar en macro
        let savedResult = 'NEGATIVO'
        if (form.value.result === 'Característico de Cannabis') {
          savedResult = 'POSITIVO'
        }

        // Al editar se conserva la etapa actual para no invalidar los análisis posteriores.
        const payload = {
          ...form.value,
          date_analysis: normalizeDateForApi(form.value.date_analysis),
          state: isEditing.value ? props.analysis.state : 'MACRO_COMPLETADO',
          macro: savedResult,
          result: isEditing.value ? (props.analysis.result ?? null) : null,
          user: { id: parseInt(localStorage.getItem('user_id')) || 1 },
        }

        const oldData = buildMacroSnapshot(originalAnalysis.value)
        const newData = buildMacroSnapshot(payload)

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
        const { data } = await analysisService.update(form.value.id, payload)

        if (isEditing.value) {
          try {
            await analysisHistoryService.create({
              analysis: data || payload,
              oldData,
              newData: buildMacroSnapshot(data || payload),
              changedByUser: { id: parseInt(localStorage.getItem('user_id')) || 1 },
              changeReason: changeReason.value.trim(),
            })
          } catch (historyError) {
            console.error('Error registrando historial de macroanálisis:', historyError)
            toast.add({
              severity: 'warn',
              summary: 'Historial no registrado',
              detail:
                'El macroanálisis fue actualizado, pero no se pudo registrar su historial.',
              life: 5000,
            })
          }
        }

        toast.add({
          severity: 'success',
          summary: isEditing.value ? 'Actualizado' : 'Guardado',
          detail: isEditing.value
            ? 'Macroanálisis actualizado correctamente'
            : 'Macroanálisis completado. Proceda con el Microanálisis',
          life: 3000,
        })
        emit('processed', data || form.value)
        visible.value = false
      } catch (err) {
        console.error('Error guardando análisis:', err)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar el análisis',
          life: 4000,
        })
      } finally {
        isSaving.value = false
      }
    }

    const stateSeverity = (state) => {
      if (!state) return 'info'
      switch ((state || '').toString().toUpperCase()) {
        case 'PENDIENTE':
          return 'warning'
        case 'COMPLETADO':
        case 'FINALIZADO':
        case 'PROCESADO':
          return 'success'
        case 'BORRADOR':
          return 'info'
        case 'ERROR':
        case 'RECHAZADO':
          return 'danger'
        default:
          return 'info'
      }
    }

    const getSampledFieldLabel = (substance) => {
      const measurementType = String(substance?.measurement_type || '')
        .trim()
        .toLowerCase()

      if (measurementType.includes('unidad') || measurementType.includes('paquete')) {
        return 'Cantidad muestreada (und)'
      }

      return 'Peso muestreado (g)'
    }

    return {
      visible,
      form,
      resultOptions,
      colorOptions,
      smellOptions,
      gradeHumOptions,
      gradeFracOptions,
      openDialog,
      closeDialog,
      handleClose,
      submit,
      stateSeverity,
      getSampledFieldLabel,
      isSaving,
      isPreviewing,
      previewReport,
      isEditing,
      changeReason,
      reasonTouched,
    }
  },
}
</script>

<style scoped>
.dialog-content {
  padding: 0.5rem 0;
}

.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.75rem;
}

.field label {
  font-weight: 500;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
}

.value {
  font-weight: 600;
  color: #333;
}

.muted {
  color: #6b6b6b;
  font-size: 0.85rem;
}

.small label {
  font-size: 0.78rem;
  color: #6b6b6b;
}

.p-card-compact .p-card-body {
  padding: 0.75rem 0.75rem;
}
</style>
