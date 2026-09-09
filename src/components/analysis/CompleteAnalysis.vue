<template>
  <div class="card flex justify-center">
    <Button
      icon="pi pi-cog"
      class="p-button-rounded p-button-success p-button-outlined"
      @click="openDialog"
      v-tooltip.top="'Macroanalisis'"
    />

    <Dialog
      v-model:visible="visible"
      :style="{ width: '700px' }"
      modal
      :headerStyle="{ padding: '1rem 1.5rem' }"
      :transition-options="{ name: 'fade', duration: 200 }"
      @hide="handleClose"
    >
      <template #header>
        <span class="text-xl font-semibold">Macroanalisis</span>
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
        <h3 class="font-semibold mb-2">Completar análisis</h3>

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
        <Button label="Cerrar" severity="secondary" @click="closeDialog" :disabled="isSaving" />
      </template>
    </Dialog>
  </div>
</template>

<script>
import { ref } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import Checkbox from 'primevue/checkbox'
import { useToast } from 'primevue/usetoast'
import analysisService from '@/services/analysisService'
import { generarReporteAnalisisPDF } from '@/others/generarReporteAnalisis.js'

export default {
  name: 'CompleteAnalysis',
  components: { Button, Dialog, Card, Tag, InputText, Textarea, Dropdown, Checkbox },
  props: {
    analysis: { type: Object, default: null },
  },
  emits: ['processed'],
  setup(props, { emit }) {
    const visible = ref(false)

    // Form con valores editables
    const form = ref({})

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
    ])

    // Copia profunda del analysis cuando se abre el modal
    const openDialog = () => {
      form.value = JSON.parse(JSON.stringify(props.analysis || {}))
      visible.value = true
    }

    const closeDialog = () => {
      visible.value = false
    }

    const handleClose = () => {
      visible.value = false
    }

    const toast = useToast()
    const isSaving = ref(false)
    const isPreviewing = ref(false)

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

      isSaving.value = true
      try {
        // Convertir resultado mostrado a Positivo/Negativo para guardar en macro
        let savedResult = 'NEGATIVO'
        if (form.value.result === 'Característico de Cannabis') {
          savedResult = 'POSITIVO'
        }

        // Cambiar estado a MACRO_COMPLETADO después del macroanalisis
        const payload = {
          ...form.value,
          state: 'MACRO_COMPLETADO',
          macro: savedResult,
          result: null,
          user: { id: parseInt(localStorage.getItem('user_id')) || 1 },
        }
        const { data } = await analysisService.update(form.value.id, payload)
        toast.add({
          severity: 'success',
          summary: 'Guardado',
          detail: 'Macroanalisis completado. Proceda con el Microanalisis',
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

    const editor = ref(null)

    // cuando se abre el diálogo, no necesita inicializar editor
    const openDialogOrig = openDialog
    const openDialogWrap = () => {
      openDialogOrig()
    }

    return {
      visible,
      form,
      resultOptions,
      colorOptions,
      smellOptions,
      gradeHumOptions,
      gradeFracOptions,
      openDialog: openDialogWrap,
      closeDialog,
      handleClose,
      submit,
      stateSeverity,
      getSampledFieldLabel,
      isSaving,
      isPreviewing,
      previewReport,
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
