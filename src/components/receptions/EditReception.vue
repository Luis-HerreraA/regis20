<template>
  <div>
    <!-- Botón editar en la fila -->
    <Button
      icon="pi pi-pencil"
      class="p-button-text p-button-warning"
      v-tooltip="'Editar recepción'"
      @click="openDialog"
    />

    <Dialog v-model:visible="visible" maximizable modal :style="{ width: '70rem' }">
      <template #header>
        <span class="text-xl font-semibold">✏️ Editar Recepción {{ flagLabelEdit }}</span>
      </template>

      <!-- Loader -->
      <div
        v-if="isLoading"
        class="flex justify-content-center align-items-center"
        style="height: 250px"
      >
        <ProgressSpinner />
      </div>

      <!-- Formulario (idéntico al Create) -->
      <div v-else class="dialog-content">
        <!-- Datos del Oficio -->
        <div class="section-title">📄 Datos del Oficio</div>
        <div class="grid formgrid p-fluid">
          <div class="field col-12 md:col-2">
            <label>N° Acta</label>
            <InputText v-model="form.number" placeholder="N° de acta" readonly />
          </div>

          <div class="field col-12 md:col-2">
            <label>N° Oficio</label>
            <InputText v-model="form.of_number" />
          </div>

          <div class="field col-12 md:col-2">
            <label>Número de Parte</label>
            <InputText v-model="form.nparte" placeholder="N° de parte" />
          </div>

          <div class="field col-12 md:col-3">
            <label>Fecha Oficio</label>
            <Calendar v-model="form.of_number_date" dateFormat="dd/mm/yy" showIcon />
          </div>

          <div class="field col-12 md:col-3">
            <label>Fecha Recepción</label>
            <Calendar v-model="form.date_reception" dateFormat="dd/mm/yy" showIcon />
          </div>
        </div>

        <!-- Datos del Policía -->
        <div v-if="form.state === 'BORRADOR'" class="section-title">👮‍♂️ Datos del Policía</div>
        <div v-if="form.state === 'BORRADOR'" class="grid formgrid p-fluid">
          <div class="field col-12 md:col-3">
            <label>RUT</label>
            <div class="p-inputgroup">
              <InputText
                v-model="form.police.rut"
                placeholder="Ej: 12.345.678-9"
                :class="{ 'p-invalid': rutError }"
              />
              <Button icon="pi pi-search" @click="buscarPolicia" :loading="buscandoPolicia" />
            </div>
            <small v-if="rutError" class="p-error">{{ rutError }}</small>
          </div>

          <div class="field col-12 md:col-3">
            <label>Nombre</label>
            <InputText v-model="form.police.firstName" />
          </div>

          <div class="field col-12 md:col-3">
            <label>Segundo Nombre</label>
            <InputText v-model="form.police.secondName" />
          </div>

          <div class="field col-12 md:col-3">
            <label>Apellido Paterno</label>
            <InputText v-model="form.police.firstLastName" />
          </div>

          <div class="field col-12 md:col-3">
            <label>Apellido Materno</label>
            <InputText v-model="form.police.secondLastName" />
          </div>

          <div class="field col-12 md:col-3">
            <label>Correo</label>
            <InputText v-model="form.police.email" type="email" />
          </div>

          <div class="field col-12 md:col-3">
            <label>Teléfono</label>
            <InputText v-model="form.police.cellphone" />
          </div>

          <div class="field col-12 md:col-3">
            <label>Grado</label>
            <Dropdown
              v-model="form.police.grade"
              :options="grades"
              optionLabel="name"
              placeholder="Seleccione grado"
              class="w-full"
              :filter="true"
            />
          </div>

          <div class="field col-12">
            <label>Institución</label>
            <Dropdown
              v-model="form.police.institution"
              :options="institutions"
              optionLabel="name"
              placeholder="Seleccione una institución"
              class="w-full"
            />
          </div>

          <div class="field col-12 md:col-6">
            <label>Tipo de Institución</label>
            <Dropdown
              v-model="form.police.institutionType"
              :options="institutionTypes"
              optionLabel="name"
              placeholder="Seleccione tipo"
              class="w-full"
              :filter="true"
            />
          </div>

          <div class="field col-12 md:col-6">
            <label>Comuna</label>
            <Dropdown
              v-model="form.police.institutionType.commune.id"
              :options="communes"
              optionLabel="name"
              optionValue="id"
              placeholder="Seleccione comuna"
              class="w-full"
              :filter="true"
            />
          </div>
        </div>

        <!-- Datos del Policía (solo lectura si es FINALIZADO) -->
        <div v-if="form.state !== 'BORRADOR'" class="section-title">
          👮‍♂️ Datos del Policía (Solo Lectura)
        </div>
        <div v-if="form.state !== 'BORRADOR'" class="grid formgrid p-fluid">
          <div class="field col-12 md:col-3">
            <label>RUT</label>
            <InputText v-model="form.police.rut" readonly />
          </div>
          <div class="field col-12 md:col-3">
            <label>Nombre</label>
            <InputText v-model="form.police.firstName" readonly />
          </div>
          <div class="field col-12 md:col-3">
            <label>Segundo Nombre</label>
            <InputText v-model="form.police.secondName" readonly />
          </div>
          <div class="field col-12 md:col-3">
            <label>Apellido Paterno</label>
            <InputText v-model="form.police.firstLastName" readonly />
          </div>
          <div class="field col-12 md:col-3">
            <label>Apellido Materno</label>
            <InputText v-model="form.police.secondLastName" readonly />
          </div>
          <div class="field col-12 md:col-3">
            <label>Correo</label>
            <InputText v-model="form.police.email" readonly />
          </div>
          <div class="field col-12 md:col-3">
            <label>Teléfono</label>
            <InputText v-model="form.police.cellphone" readonly />
          </div>
          <div class="field col-12 md:col-3">
            <label>Grado</label>
            <InputText :value="form.police.grade?.name || ''" readonly />
          </div>
          <div class="field col-12">
            <label>Institución</label>
            <InputText :value="form.police.institutionType.institution?.name || ''" readonly />
          </div>
          <div class="field col-12 md:col-6">
            <label>Tipo de Institución</label>
            <InputText :value="form.police.institutionType?.name || ''" readonly />
          </div>
          <div class="field col-12 md:col-6">
            <label>Comuna</label>
            <InputText :value="form.police.institutionType?.commune?.name || ''" readonly />
          </div>
        </div>

        <!-- 💊 Sustancias Asociadas -->
        <div
          v-if="canEditSubstances"
          class="section-title mt-4 mb-3 text-lg font-semibold flex items-center gap-2"
        >
          💊 Sustancias Asociadas
        </div>

        <!-- Formulario para agregar/editar sustancias -->
        <div v-if="canEditSubstances" class="grid formgrid p-fluid align-items-end">
          <div class="field col-12">
            <label>Tipo de Sustancia</label>
            <Dropdown
              v-model="editingSubstance.substanceType"
              :options="substancesTypes"
              optionLabel="name"
              optionValue="id"
              placeholder="Seleccione sustancia"
              class="w-full"
              :filter="true"
            />
          </div>
        </div>

        <div v-if="canEditSubstances" class="grid formgrid p-fluid align-items-end">
          <div class="field col-12 md:col-3">
            <label>Tipo de Medición</label>
            <Dropdown
              v-model="editingSubstance.measurement_type"
              :options="unityOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccione tipo de medición"
              class="w-full"
              :filter="true"
            />
          </div>

          <div class="field col-12 md:col-2">
            <label>{{ isUnitMeasurement ? 'Peso bruto referencial (g)' : 'Peso bruto (g) *' }}</label>
            <InputNumber
              v-model="editingSubstance.weight"
              :min="0"
              mode="decimal"
              :maxFractionDigits="2"
              class="w-full"
            />
          </div>

          <div class="field col-12 md:col-2">
            <label>{{ isUnitMeasurement ? 'Peso neto referencial (g)' : 'Peso neto (g)' }}</label>
            <InputNumber
              v-model="editingSubstance.weight_net"
              :min="0"
              mode="decimal"
              :maxFractionDigits="2"
              class="w-full"
            />
          </div>

          <div v-show="editingSubstance.measurement_type === 'OTROS'" class="field col-12 md:col-2">
            <label>Otra unidad</label>
            <InputText
              v-model="editingSubstance.other_unity"
              placeholder="Ej: cápsulas, frascos..."
              class="w-full"
            />
          </div>

          <div class="field col-12 md:col-2">
            <label>
              {{ isUnitMeasurement ? 'Cantidad recepcionada (unidades) *' : 'Unidades referenciales' }}
            </label>
            <InputNumber
              v-model="editingSubstance.unit_quantity"
              :min="0"
              mode="decimal"
              :maxFractionDigits="0"
              class="w-full"
            />
          </div>

          <div class="field col-12 md:col-3">
            <label>NUE</label>
            <InputText
              v-model="editingSubstance.nue"
              placeholder="Número único de evidencia"
              class="w-full"
            />
          </div>
        </div>

        <div v-if="canEditSubstances" class="grid formgrid p-fluid align-items-end mt-2">
          <div class="field col-12 md:col-9">
            <label>Descripción</label>
            <Textarea
              v-model="editingSubstance.description"
              rows="2"
              autoResize
              placeholder="Descripción de la sustancia..."
              class="w-full"
            />
          </div>

          <div class="field col-12 md:col-3 text-center">
            <Button
              :icon="editingSubstanceIndex === null ? 'pi pi-plus' : 'pi pi-save'"
              :label="editingSubstanceIndex === null ? 'Agregar' : 'Actualizar'"
              @click="applyEditingSubstance"
              :disabled="!isEditingSubstanceValid"
              class="mt-4 w-full"
            />
          </div>
        </div>

        <!-- 💊 Sustancias sin permiso de edición -->
        <div
          v-if="!canEditSubstances"
          class="section-title mt-4 mb-3 text-lg font-semibold flex items-center gap-2"
        >
          💊 Sustancias Asociadas (Solo Lectura)
        </div>

        <!-- Tabla de sustancias -->
        <DataTable :value="form.substances" responsiveLayout="scroll" class="mt-3">
          <!-- N° -->
          <Column field="nsubstance" header="N°"></Column>

          <!-- NUE -->
          <Column field="nue" header="NUE"></Column>

          <!-- Tipo de Sustancia -->
          <Column field="substanceType" header="Tipo de Sustancia">
            <template #body="slotProps">
              {{ getSubstanceName(slotProps.data.substanceType) }}
            </template>
          </Column>

          <!-- Peso Bruto -->
          <Column field="weight" header="Peso Bruto (gr)">
            <template #body="slotProps">
              {{
                slotProps.data.weight === null ||
                slotProps.data.weight === undefined ||
                slotProps.data.weight === ''
                  ? '-'
                  : Number(slotProps.data.weight).toFixed(2)
              }}
            </template>
          </Column>

          <!-- Peso Neto -->
          <Column field="weight_net" header="Peso Neto (gr)">
            <template #body="slotProps">
              {{
                slotProps.data.weight_net === null ||
                slotProps.data.weight_net === undefined ||
                slotProps.data.weight_net === ''
                  ? '-'
                  : Number(slotProps.data.weight_net).toFixed(2)
              }}
            </template>
          </Column>

          <Column field="measurement_type" header="Tipo de Medición"></Column>

          <!-- Cantidad de unidades -->
          <Column field="unit_quantity" header="Cantidad">
            <template #body="slotProps">
              {{ slotProps.data.unit_quantity ?? '—' }}
            </template>
          </Column>

          <!-- Comuna -->
          <Column field="commune" header="Comuna">
            <template #body="slotProps">
              {{ getCommuneName(slotProps.data.commune) }}
            </template>
          </Column>

          <!-- Descripción -->
          <Column field="description" header="Descripción">
            <template #body="slotProps">
              {{ slotProps.data.description || '—' }}
            </template>
          </Column>

          <!-- Acciones de sustancias -->
          <Column
            v-if="canEditSubstances"
            header="Acciones"
            bodyStyle="text-align:center; white-space: nowrap;"
          >
            <template #body="slotProps">
              <Button
                icon="pi pi-copy"
                severity="info"
                text
                v-tooltip="'Duplicar sustancia'"
                @click="duplicateSubstance(slotProps.index)"
              />
              <Button
                icon="pi pi-pencil"
                class="p-button-text p-button-plain"
                v-tooltip="'Editar sustancia'"
                @click="startEditSubstance(slotProps.index)"
              />
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                v-tooltip="'Eliminar sustancia'"
                @click="removeSubstance(slotProps.index)"
              />
            </template>
          </Column>
        </DataTable>
      </div>
      <div class="w-full mb-1">
        <div v-if="isReceptionEditMode" class="w-full mb-1">
          <label class="font-medium">📝 Descripción del cambio</label>
          <Textarea
            v-model="editDescription"
            rows="1"
            placeholder="Describe brevemente el motivo de la edición..."
            class="w-full"
            :class="{ 'p-invalid': showValidationError && !editDescription }"
          />
          <small v-if="showValidationError && !editDescription" class="p-error">
            Debes ingresar una descripción antes de guardar.
          </small>
        </div>
      </div>
      <template #footer>
        <Button label="Cerrar" severity="secondary" @click="closeDialog" />

        <!-- Botón para guardar borrador -->
        <Button
          v-if="form.state === 'BORRADOR'"
          label="Guardar borrador"
          severity="info"
          icon="pi pi-save"
          @click="guardarBorrador"
          :loading="isSaving"
        />

        <Button
          v-if="form.state === 'BORRADOR'"
          label="Completar Recepción"
          icon="pi pi-save"
          @click="completarRecepcion"
          :loading="isSaving"
        />

        <!-- Botón para guardar edición final -->
        <Button
          v-if="isReceptionEditMode"
          label="Guardar edición"
          icon="pi pi-save"
          @click="guardarEdicion"
          :loading="isSaving"
          :disabled="!editDescription"
        />
      </template>
    </Dialog>
  </div>
</template>

<script>
import { ref, reactive, watch, computed } from 'vue'
import Calendar from 'primevue/calendar'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Textarea from 'primevue/textarea'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'

import recepcionService from '@/services/receptionsService'
import substancesService from '@/services/substancesService'
import policeService from '@/services/policesService'
import { formatRut, validateRut } from '@/others/verificationRut'

import institutionsService from '@/services/institutionsService'
import institutionTypesService from '@/services/institutionTypesService'
import communesService from '@/services/communesService'
import locationsService from '@/services/locationsService'
import substancesTypesService from '@/services/substancesTypesService'
import gradesService from '@/services/gradesService'
import receptionsHistoryService from '@/services/receptionsHistoryService'

export default {
  name: 'EditReception',
  props: {
    reception: { type: Object, required: true },
  },
  emits: ['updated'],
  components: {
    Calendar,
    InputText,
    Button,
    Dialog,
    Dropdown,
    InputNumber,
    DataTable,
    Column,
    Textarea,
    ProgressSpinner,
  },
  setup(props, { emit }) {
    // Helper para formato DD-MM-YYYY
    const formatDateOnly = (date) => {
      if (!date) return null
      let d = date
      if (typeof date === 'string') {
        d = new Date(date)
        if (isNaN(d)) return date // fallback: return as is
      }
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      return `${day}-${month}-${year}`
    }
    const visible = ref(false)
    const isLoading = ref(false)
    const isSaving = ref(false)
    const buscandoPolicia = ref(false)
    const rutError = ref('')
    const isNewPolice = ref(false)
    const toast = useToast()
    const DEFAULT_PACKAGING_ID = 13

    // dropdowns
    const institutions = ref([])
    const institutionTypes = ref([])
    const communes = ref([])
    const locations = ref([])
    const substancesTypes = ref([])
    const grades = ref([])
    const editDescription = ref('') // descripción del cambio
    const showValidationError = ref(false) // bandera si intenta guardar sin descripción

    // formulario (estructura igual al create)
    const form = reactive({
      id: null,
      number: '',
      of_number: '',
      nparte: '',
      of_number_date: null,
      date_reception: null,
      location: { id: 1 },
      state: null,
      police: {
        id: null,
        rut: '',
        firstName: '',
        secondName: '',
        firstLastName: '',
        secondLastName: '',
        email: '',
        cellphone: '',
        grade: { id: null, name: '' },
        institution: { id: null, name: '' },
        institutionType: {
          id: null,
          name: '',
          commune: { id: null, name: '' },
        },
      },
      user_origin: { id: 1 },
      user_destination: {
        id: parseInt(localStorage.getItem('user_id')) || 0,
        email: '',
      },
      substances: [],
    })

    const isReceptionEditMode = computed(() => form.state !== 'BORRADOR')
    const canEditSubstances = computed(() => {
      return (
        form.state === 'BORRADOR' ||
        String(props.reception?.is_editable || '').toUpperCase() === 'SI'
      )
    })

    // edición/creación de una sustancia en el pequeño formulario
    const editingSubstance = reactive({
      id: null,
      nsubstance: null,
      nue: '',
      description: '',
      measurement_type: 'GRAMOS',
      unit_quantity: null,
      weight: null,
      weight_net: null,
      unity: null,
      other_unity: '',
      substanceType: null,
      packaging: DEFAULT_PACKAGING_ID,
      commune: null,
    })
    const editingSubstanceIndex = ref(null) // null = nueva, otherwise index en form.substances
    const deletedSubstanceIds = ref([])

    const unityOptions = [
      { label: 'Gramos', value: 'GRAMOS' },
      { label: 'Unidades', value: 'UNIDADES' },
    ]

    const normalizeValue = (value) =>
      String(value || '')
        .trim()
        .toLowerCase()

    const getResolvedMeasurementType = (substance) => {
      if (normalizeValue(substance.measurement_type) === 'otros') {
        return String(substance.other_unity || '').trim()
      }

      return substance.measurement_type
    }

    const isUnitMeasurementType = (measurementType) => {
      const normalizedMeasurementType = normalizeValue(measurementType)
      return (
        normalizedMeasurementType.includes('unidad') ||
        normalizedMeasurementType.includes('paquete')
      )
    }

    const normalizeMeasurementTypeForForm = (measurementType) => {
      if (isUnitMeasurementType(measurementType)) return 'UNIDADES'
      if (normalizeValue(measurementType).includes('gramo')) return 'GRAMOS'
      return measurementType || 'GRAMOS'
    }

    const isUnitMeasurement = computed(() =>
      isUnitMeasurementType(getResolvedMeasurementType(editingSubstance)),
    )

    const hasValue = (value) => value !== null && value !== undefined && value !== ''

    const validateSubstanceData = (substance, index = null) => {
      const rowLabel = index !== null ? `sustancia N°${index + 1}` : 'sustancia'

      if (!substance.substanceType) {
        toast.add({
          severity: 'warn',
          summary: 'Dato faltante',
          detail: `Debe seleccionar tipo de sustancia en ${rowLabel}.`,
          life: 3500,
        })
        return false
      }

      if (!normalizeValue(getResolvedMeasurementType(substance))) {
        toast.add({
          severity: 'warn',
          summary: 'Tipo de medición requerido',
          detail: `Debe seleccionar el tipo de medición en ${rowLabel}.`,
          life: 3500,
        })
        return false
      }

      if (
        isUnitMeasurementType(getResolvedMeasurementType(substance)) &&
        Number(substance.unit_quantity || 0) <= 0
      ) {
        toast.add({
          severity: 'warn',
          summary: 'Cantidad inválida',
          detail: `La cantidad debe ser mayor a 0 en ${rowLabel}.`,
          life: 3500,
        })
        return false
      }
      if (
        hasValue(substance.unit_quantity) &&
        (Number(substance.unit_quantity) <= 0 ||
          !Number.isInteger(Number(substance.unit_quantity)))
      ) {
        toast.add({
          severity: 'warn',
          summary: 'Cantidad inválida',
          detail: `La cantidad de unidades debe ser un número entero mayor a 0 en ${rowLabel}.`,
          life: 3500,
        })
        return false
      }

      const isUnit = isUnitMeasurementType(getResolvedMeasurementType(substance))

      if (!isUnit && Number(substance.weight || 0) <= 0) {
        toast.add({
          severity: 'warn',
          summary: 'Peso inválido',
          detail: `El peso bruto debe ser mayor a 0 en ${rowLabel}.`,
          life: 3500,
        })
        return false
      }

      if (isUnit && hasValue(substance.weight) && Number(substance.weight) <= 0) {
        toast.add({
          severity: 'warn',
          summary: 'Peso inválido',
          detail: `Si informa el peso bruto, debe ser mayor a 0 en ${rowLabel}.`,
          life: 3500,
        })
        return false
      }

      if (hasValue(substance.weight_net) && Number(substance.weight_net) <= 0) {
        toast.add({
          severity: 'warn',
          summary: 'Peso inválido',
          detail: `Si informa el peso neto, debe ser mayor a 0 en ${rowLabel}.`,
          life: 3500,
        })
        return false
      }

      if (
        hasValue(substance.weight) &&
        hasValue(substance.weight_net) &&
        Number(substance.weight_net) > Number(substance.weight)
      ) {
        toast.add({
          severity: 'warn',
          summary: 'Pesos inconsistentes',
          detail: `El peso neto no puede ser mayor al peso bruto en ${rowLabel}.`,
          life: 3500,
        })
        return false
      }

      return true
    }

    const isEditingSubstanceValid = computed(() => {
      if (!editingSubstance.substanceType) return false
      if (!normalizeValue(getResolvedMeasurementType(editingSubstance))) return false
      if (!isUnitMeasurement.value && Number(editingSubstance.weight || 0) <= 0) return false
      if (hasValue(editingSubstance.weight) && Number(editingSubstance.weight) <= 0) return false
      if (hasValue(editingSubstance.weight_net) && Number(editingSubstance.weight_net) <= 0)
        return false
      if (
        hasValue(editingSubstance.unit_quantity) &&
        (Number(editingSubstance.unit_quantity) <= 0 ||
          !Number.isInteger(Number(editingSubstance.unit_quantity)))
      )
        return false
      if (
        hasValue(editingSubstance.weight) &&
        hasValue(editingSubstance.weight_net) &&
        Number(editingSubstance.weight_net) > Number(editingSubstance.weight)
      )
        return false
      return !isUnitMeasurement.value || Number(editingSubstance.unit_quantity || 0) > 0
    })

    const validateFormBeforeSave = () => {
      if (rutError.value) {
        toast.add({
          severity: 'warn',
          summary: 'RUT inválido',
          detail: 'Corrija el RUT del policía antes de guardar.',
          life: 3500,
        })
        return false
      }

      for (let index = 0; index < form.substances.length; index += 1) {
        if (!validateSubstanceData(form.substances[index], index)) return false
      }

      return true
    }

    // cargar listas
    const fetchDropdownData = async () => {
      try {
        isLoading.value = true
        const [instRes, typeRes, commRes, locRes, subRes, gradesRes] = await Promise.all([
          institutionsService.getAll(),
          institutionTypesService.getAll(),
          communesService.getAll(),
          locationsService.getAll(),
          substancesTypesService.getAll(),
          gradesService.getAll(),
        ])

        institutions.value = instRes.data || []
        institutionTypes.value = typeRes.data || []
        communes.value = commRes.data || []
        locations.value = locRes.data || []
        substancesTypes.value = subRes.data || []
        grades.value = gradesRes.data || []
      } catch (err) {
        console.error('❌ Error cargando datos para dropdowns:', err)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se cargaron listas',
          life: 3000,
        })
      } finally {
        isLoading.value = false
      }
    }

    const getSubstanceName = (substanceId) => {
      const substance = substancesTypes.value.find((s) => s.id === substanceId)
      return substance ? substance.name : 'Desconocido'
    }
    const getSubstanceWeight = (weight) => {
      const substance = parseInt(weight)
      return substance.toFixed(2)
    }

    const getCommuneName = (communeId) => {
      const commune = communes.value.find((c) => c.id === communeId)
      return commune ? commune.name : 'Desconocido'
    }

    // formateo/validación RUT
    watch(
      () => form.police.rut,
      (newValue) => {
        if (!newValue) {
          rutError.value = ''
          return
        }
        form.police.rut = formatRut(newValue)
        if (!validateRut(form.police.rut)) {
          rutError.value = 'RUT inválido'
        } else {
          rutError.value = ''
        }
      },
    )

    watch(
      () => form.police.institutionType?.commune?.id,
      (communeId) => {
        const selectedCommuneId = communeId || null
        editingSubstance.commune = selectedCommuneId
        form.substances.forEach((substance) => {
          substance.commune = selectedCommuneId
        })
      },
    )

    // abrir diálogo: cargar listas y datos de la recepción
    const openDialog = async () => {
      visible.value = true
      await fetchDropdownData()
      await cargarDatosRecepcion()
      await cargarSustanciasPorRecepcion() // 👈 ahora sí trae las sustancias reales
    }

    const closeDialog = () => {
      visible.value = false
      resetForm()
    }

    const resetForm = () => {
      // reestablece el form a vacío (no borrar referencias a arrays)
      Object.assign(form, {
        id: null,
        number: '',
        of_number: '',
        nparte: '',
        of_number_date: null,
        date_reception: null,
        location: { id: 1 },
        state: null,
        police: {
          id: 0,
          rut: '',
          firstName: '',
          secondName: '',
          firstLastName: '',
          secondLastName: '',
          email: '',
          cellphone: '',
          grade: { id: null, name: '' },
          institution: { id: null, name: '' },
          institutionType: {
            id: null,
            name: '',
            commune: { id: null, name: '' },
          },
        },
        user_origin: { id: 1 },
        user_destination: {
          id: parseInt(localStorage.getItem('user_id')) || 0,
          email: '',
        },
        substances: [],
      })

      Object.assign(editingSubstance, {
        id: null,
        nsubstance: null,
        nue: '',
        description: '',
        measurement_type: 'GRAMOS',
        unit_quantity: null,
        weight: null,
        weight_net: null,
        unity: null,
        other_unity: '',
        substanceType: null,
        packaging: DEFAULT_PACKAGING_ID,
        commune: null,
      })
      editingSubstanceIndex.value = null
      deletedSubstanceIds.value = []
      isNewPolice.value = false
      rutError.value = ''
    }

    // carga la recepción + sustancias desde el API (usa recepcionService.getById)
    const cargarDatosRecepcion = async () => {
      try {
        isLoading.value = true
        if (!props.reception || !props.reception.id) {
          toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Recepción inválida',
            life: 3000,
          })
          return
        }

        const { data } = await recepcionService.getById(props.reception.id)
        // data debería contener la estructura completa que acepta el backend
        // hacemos assign para mantener la reactividad
        form.id = data.id
        form.number = data.number || ''
        form.of_number = data.of_number || ''
        form.nparte = data.nparte || ''
        form.of_number_date = data.of_number_date || null
        form.date_reception = data.date_reception || null
        form.location = data.location || { id: 1 }
        form.state = data.state || null

        // policía: si viene como objeto o id — adaptamos
        form.police = data.police
          ? {
              ...data.police,
              grade: data.police.grade || { id: null, name: '' },
              institution: data.police.institution ||
                data.police.institutionType?.institution || { id: null, name: '' },
              institutionType: {
                ...(data.police.institutionType || { id: null, name: '' }),
                commune: data.police.institutionType?.commune || { id: null, name: '' },
              },
            }
          : {
              id: 0,
              rut: '',
              firstName: '',
              secondName: '',
              firstLastName: '',
              secondLastName: '',
              email: '',
              cellphone: '',
              grade: { id: null, name: '' },
              institution: { id: null, name: '' },
              institutionType: { id: null, name: '', commune: { id: null, name: '' } },
            }

        form.user_origin = data.user_origin || { id: 1 }
        form.user_destination = data.user_destination || {
          id: parseInt(localStorage.getItem('user_id')) || 0,
          email: '',
        }

        // sustancias: si cada sustancia viene con nested ids (substanceType:{id:..}) — convertimos a la forma manejada por el formulario:
        form.substances = (data.substances || []).map((s) => ({
          ...s,
          id: s.id ?? null,
          nsubstance: s.nsubstance ?? null,
          nue: s.nue ?? s.nue ?? '',
          description: s.description ?? '',
          measurement_type: normalizeMeasurementTypeForForm(
            s.measurement_type ?? s.measurementType ?? s.unity,
          ),
          unit_quantity: s.unit_quantity ?? s.unitQuantity ?? s.unity_quantity ?? null,
          weight: s.weight ?? null,
          weight_net: s.weight_net ?? null,
          unity: s.unity ?? null,
          substanceType: s.substanceType ? s.substanceType.id : s.substanceType || null,
          packaging: DEFAULT_PACKAGING_ID,
          commune: s.commune ? s.commune.id : s.commune || null,
        }))
      } catch (e) {
        console.error('❌ Error cargando recepción:', e)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la recepción',
          life: 3000,
        })
      } finally {
        isLoading.value = false
      }
    }

    const cargarSustanciasPorRecepcion = async () => {
      try {
        if (!form.id) return
        const { data } = await substancesService.getByReceptionId(form.id)
        form.substances = (data || []).map((s) => ({
          ...s,
          id: s.id,
          nsubstance: s.nsubstance ?? null,
          nue: s.nue ?? '',
          description: s.description ?? '',
          measurement_type: normalizeMeasurementTypeForForm(
            s.measurement_type ?? s.measurementType ?? s.unity,
          ),
          unit_quantity: s.unit_quantity ?? s.unitQuantity ?? s.unity_quantity ?? null,
          weight: s.weight ?? null,
          weight_net: s.weight_net ?? null,
          unity: s.unity ?? null,
          substanceType: s.substanceType?.id ?? null,
          packaging: DEFAULT_PACKAGING_ID,
          commune: s.commune?.id ?? null,
        }))
      } catch (e) {
        console.error('❌ Error cargando sustancias por recepción:', e)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las sustancias',
          life: 3000,
        })
      }
    }

    // buscar policía por RUT (igual que create)
    const buscarPolicia = async () => {
      if (!form.police.rut || rutError.value) {
        console.warn('⚠️ RUT inválido o vacío')
        return
      }
      try {
        buscandoPolicia.value = true
        const datos = await policeService.getByRut(form.police.rut)
        const data = datos.data.content && datos.data.content.length ? datos.data.content[0] : null
        if (data) {
          isNewPolice.value = false
          form.police.id = data.id || 0
          form.police.firstName = data.firstName || ''
          form.police.secondName = data.secondName || ''
          form.police.firstLastName = data.firstLastName || ''
          form.police.secondLastName = data.secondLastName || ''
          form.police.email = data.email || ''
          form.police.cellphone = data.cellphone || ''

          if (data.grade && data.grade.id) form.police.grade = data.grade
          if (
            data.institutionType &&
            data.institutionType.institution &&
            data.institutionType.institution.id
          )
            form.police.institution = data.institutionType.institution
          if (data.institutionType && data.institutionType.id) {
            form.police.institutionType = data.institutionType
            if (data.institutionType.commune && data.institutionType.commune.id) {
              form.police.institutionType.commune = data.institutionType.commune
            }
          }
        } else {
          isNewPolice.value = true
          toast.add({
            severity: 'warn',
            summary: 'No encontrado',
            detail: 'No se encontró policía con ese RUT',
            life: 3000,
          })
        }
      } catch (e) {
        console.error('❌ Error al buscar policía:', e)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error buscando policía',
          life: 3000,
        })
      } finally {
        buscandoPolicia.value = false
      }
    }

    const crearPoliciaSiEsNuevo = async () => {
      if (!isNewPolice.value) return form.police

      const policePayload = {
        rut: form.police.rut,
        firstName: form.police.firstName,
        secondName: form.police.secondName,
        firstLastName: form.police.firstLastName,
        secondLastName: form.police.secondLastName,
        email: form.police.email,
        cellphone: form.police.cellphone,
        grade: form.police.grade?.id ? form.police.grade : null,
        institution: form.police.institution?.id ? form.police.institution : null,
        institutionType: form.police.institutionType?.id ? form.police.institutionType : null,
      }

      const { data } = await policeService.create(policePayload)
      form.police = {
        ...data,
        institution:
          data.institution || data.institutionType?.institution || form.police.institution,
      }
      isNewPolice.value = false
      return data
    }

    // agregar o actualizar la substancia temporal (desde el pequeño formulario de sustancia)
    const applyEditingSubstance = () => {
      if (!validateSubstanceData(editingSubstance)) return false

      const resolvedMeasurementType = getResolvedMeasurementType(editingSubstance)
      const currentSubstance =
        editingSubstanceIndex.value === null
          ? {}
          : form.substances[editingSubstanceIndex.value] || {}
      const sub = {
        ...currentSubstance,
        id: editingSubstance.id ?? null,
        nsubstance: editingSubstance.nsubstance ?? null,
        nue: editingSubstance.nue,
        description: String(editingSubstance.description || '').trim() || null,
        measurement_type: resolvedMeasurementType,
        unit_quantity: editingSubstance.unit_quantity,
        weight: editingSubstance.weight,
        weight_net: editingSubstance.weight_net,
        unity: editingSubstance.unity,
        substanceType: editingSubstance.substanceType,
        packaging: DEFAULT_PACKAGING_ID,
        commune: form.police.institutionType?.commune?.id || editingSubstance.commune || null,
      }

      if (editingSubstanceIndex.value === null) {
        // nueva - asignar siguiente número correlativo
        const nsubstance = form.substances.length + 1
        sub.nsubstance = nsubstance
        form.substances.push(sub)
      } else {
        // actualizar existente en la posición index
        form.substances.splice(editingSubstanceIndex.value, 1, sub)
      }

      // limpiar editor
      Object.assign(editingSubstance, {
        id: null,
        nsubstance: null,
        nue: '',
        description: '',
        measurement_type: 'GRAMOS',
        unit_quantity: null,
        weight: null,
        weight_net: null,
        unity: null,
        other_unity: '',
        substanceType: null,
        packaging: DEFAULT_PACKAGING_ID,
        commune: null,
      })
      editingSubstanceIndex.value = null
      return true
    }

    // comenzar a editar una sustancia existente (cargarla en editingSubstance)
    const startEditSubstance = (index) => {
      const s = form.substances[index]
      editingSubstance.id = s.id ?? null
      editingSubstance.nsubstance = s.nsubstance ?? null
      editingSubstance.nue = s.nue ?? ''
      editingSubstance.description = s.description ?? ''
      editingSubstance.measurement_type = normalizeMeasurementTypeForForm(
        s.measurement_type ?? s.measurementType ?? s.unity,
      )
      editingSubstance.unit_quantity = s.unit_quantity ?? s.unitQuantity ?? s.unity_quantity ?? null
      editingSubstance.weight = s.weight ?? null
      editingSubstance.weight_net = s.weight_net ?? null
      editingSubstance.unity = s.unity ?? null
      editingSubstance.other_unity = ''
      editingSubstance.substanceType = s.substanceType ?? null
      editingSubstance.packaging = DEFAULT_PACKAGING_ID
      editingSubstance.commune = s.commune ?? null
      editingSubstance.reception = form
      editingSubstanceIndex.value = index
      // scroll al formulario o focus si se desea (opcional)
    }

    const removeSubstance = (index) => {
      const substance = form.substances[index]
      if (substance?.id && !deletedSubstanceIds.value.includes(substance.id)) {
        deletedSubstanceIds.value.push(substance.id)
      }
      form.substances.splice(index, 1)

      // Renumerar todas las sustancias restantes
      form.substances.forEach((substance, idx) => {
        substance.nsubstance = idx + 1
      })

      // si se estaba editando esa fila, resetear el editor
      if (editingSubstanceIndex.value === index) {
        Object.assign(editingSubstance, {
          id: null,
          nsubstance: null,
          nue: '',
          description: '',
          measurement_type: 'GRAMOS',
          unit_quantity: null,
          weight: null,
          weight_net: null,
          unity: null,
          other_unity: '',
          substanceType: null,
          packaging: DEFAULT_PACKAGING_ID,
          commune: null,
        })
        editingSubstanceIndex.value = null
      }
    }

    const duplicateSubstance = (index) => {
      const duplicated = {
        ...form.substances[index],
        id: null,
      }

      form.substances.splice(index + 1, 0, duplicated)
      form.substances.forEach((substance, substanceIndex) => {
        substance.nsubstance = substanceIndex + 1
      })
    }

    const getRelationId = (value) => {
      if (value && typeof value === 'object') return value.id ?? null
      return value ?? null
    }

    const buildReceptionForSubstance = (savedReception = {}) => {
      const reception = JSON.parse(
        JSON.stringify({
          ...form,
          ...savedReception,
          id: savedReception?.id ?? form.id,
        }),
      )

      delete reception.substances
      return reception
    }

    const buildSubstancePayload = (substance, reception) => {
      const resolvedMeasurementType = getResolvedMeasurementType(substance)
      const substanceTypeId = getRelationId(substance.substanceType)
      const communeId = getRelationId(substance.commune)
      const unitQuantity = hasValue(substance.unit_quantity)
        ? String(substance.unit_quantity).trim()
        : null
      return {
        ...(substance.id ? { id: substance.id } : {}),
        nsubstance: substance.nsubstance ?? null,
        nue: substance.nue || null,
        description: substance.description || null,
        measurement_type: resolvedMeasurementType,
        unit_quantity: unitQuantity,
        // Compatibilidad con las variantes usadas por versiones anteriores del API.
        unitQuantity,
        unity_quantity: unitQuantity,
        weight: hasValue(substance.weight) ? Number(substance.weight) : null,
        weight_net: hasValue(substance.weight_net) ? Number(substance.weight_net) : null,
        unity: resolvedMeasurementType,
        reception,
        substanceType: substanceTypeId ? { id: substanceTypeId } : null,
        packaging: { id: DEFAULT_PACKAGING_ID },
        commune: communeId ? { id: communeId } : null,
        ...(substance.state ? { state: substance.state } : {}),
      }
    }

    const persistSubstances = async (reception) => {
      for (const substance of form.substances) {
        const substancePayload = buildSubstancePayload(substance, reception)
        const response = substance.id
          ? await substancesService.update(substance.id, substancePayload)
          : await substancesService.create(substancePayload)

        if (!substance.id && response?.data?.id) substance.id = response.data.id
      }
    }

    const normalizeComparableText = (value) => String(value ?? '').trim()
    const normalizeComparableNumber = (value) => {
      if (value === null || value === undefined || value === '') return null
      const number = Number(value)
      return Number.isNaN(number) ? normalizeComparableText(value) : number
    }

    const getSubstanceDifferences = (expected, actual) => {
      if (!actual) return ['registro no encontrado']

      const differences = []
      const textFields = ['nue', 'description', 'measurement_type']
      const numberFields = ['nsubstance', 'weight', 'weight_net']

      textFields.forEach((field) => {
        if (normalizeComparableText(expected[field]) !== normalizeComparableText(actual[field])) {
          differences.push(field)
        }
      })

      numberFields.forEach((field) => {
        if (
          normalizeComparableNumber(expected[field]) !== normalizeComparableNumber(actual[field])
        ) {
          differences.push(field)
        }
      })

      const expectedUnitQuantity =
        expected.unit_quantity ?? expected.unitQuantity ?? expected.unity_quantity
      const actualUnitQuantity =
        actual.unit_quantity ?? actual.unitQuantity ?? actual.unity_quantity
      if (
        normalizeComparableNumber(expectedUnitQuantity) !==
        normalizeComparableNumber(actualUnitQuantity)
      ) {
        differences.push('unit_quantity')
      }

      const expectedSubstanceTypeId = getRelationId(expected.substanceType)
      const actualSubstanceTypeId = getRelationId(actual.substanceType)
      if (String(expectedSubstanceTypeId ?? '') !== String(actualSubstanceTypeId ?? '')) {
        differences.push('substanceType')
      }

      return differences
    }

    const verifyPersistedSubstances = async (deletedIds = []) => {
      const { data } = await substancesService.getByReceptionId(form.id)
      const persistedSubstances = Array.isArray(data) ? data : data?.content || []
      const mismatches = []

      form.substances.forEach((expected) => {
        const actual = persistedSubstances.find(
          (persisted) => String(persisted.id) === String(expected.id),
        )
        const differences = getSubstanceDifferences(expected, actual)
        if (differences.length > 0) {
          mismatches.push(
            `sustancia ${expected.nsubstance ?? expected.id}: ${differences.join(', ')}`,
          )
        }
      })

      deletedIds.forEach((deletedId) => {
        if (persistedSubstances.some((substance) => String(substance.id) === String(deletedId))) {
          mismatches.push(`sustancia ${deletedId}: no fue eliminada`)
        }
      })

      return mismatches
    }

    const persistAndVerifySubstances = async (reception, deletedIds = []) => {
      await persistSubstances(buildReceptionForSubstance(reception))

      if (deletedIds.length > 0) {
        await Promise.all(
          deletedIds.map(async (id) => {
            try {
              await substancesService.delete(id)
            } catch (error) {
              // La verificación/reintento puede volver a pasar por una eliminación ya aplicada.
              if (error?.response?.status !== 404) throw error
            }
          }),
        )
      }

      return verifyPersistedSubstances(deletedIds)
    }

    const getSaveErrorMessage = (error, fallback) => {
      if (error?.persistedDifferences?.length) {
        return `El servidor no guardó: ${error.persistedDifferences.join('; ')}`
      }

      return error?.response?.data?.message || error?.response?.data?.error || fallback
    }

    // guardar edición: armar payload completo y llamar update
    // arriba en imports (añádelo si no está)
    // import receptionHistoryService from '@/services/receptionHistoryService'

    const guardarEdicion = async () => {
      // Si el usuario estaba editando una fila, incorpora esos cambios antes del guardado global.
      if (editingSubstanceIndex.value !== null && !applyEditingSubstance()) return

      if (!validateFormBeforeSave()) return

      // Validación previa: descripción obligatoria
      if (isReceptionEditMode.value) {
        if (!editDescription.value || !editDescription.value.trim()) {
          showValidationError.value = true
          toast.add({
            severity: 'warn',
            summary: 'Falta descripción',
            detail: 'Debes ingresar una breve descripción del motivo de la edición.',
            life: 3000,
          })
          return
        }
      }

      showValidationError.value = false
      isSaving.value = true

      try {
        // 1️⃣ Construir payload completo de la recepción
        const payload = {
          id: form.id,
          number: form.number,
          of_number: form.of_number,
          nparte: form.nparte,
          of_number_date: formatDateOnly(form.of_number_date),
          date_reception: formatDateOnly(form.date_reception),
          location: form.location && form.location.id ? { id: form.location.id } : null,
          state: 'EDITADO',
          is_editable: 'NO',
          police: {
            id: form.police.id,
            rut: form.police.rut,
            firstName: form.police.firstName,
            secondName: form.police.secondName,
            firstLastName: form.police.firstLastName,
            secondLastName: form.police.secondLastName,
            email: form.police.email,
            cellphone: form.police.cellphone,
            grade: form.police.grade && form.police.grade.id ? form.police.grade : null,
            institution:
              form.police.institution && form.police.institution.id
                ? form.police.institution
                : null,
            institutionType:
              form.police.institutionType && form.police.institutionType.id
                ? form.police.institutionType
                : null,
          },
          user_origin: form.user_origin ? form.user_origin : { id: 1 },
          user_destination:
            form.user_destination && form.user_destination.id ? form.user_destination : null,
        }

        const deletedIds = [...deletedSubstanceIds.value]

        // Replica el flujo que sí funciona en borrador: primero guarda la recepción en un
        // estado editable y utiliza exactamente esa respuesta para persistir las sustancias.
        const editableResponse = await recepcionService.update(payload.id, {
          ...payload,
          state: 'EDITABLE',
          is_editable: 'SI',
        })

        console.log('💊 Actualizando/creando sustancias asociadas...')
        const persistedDifferences = await persistAndVerifySubstances(
          editableResponse.data,
          deletedIds,
        )

        if (persistedDifferences.length > 0) {
          const persistenceError = new Error('El API no confirmó los cambios de sustancias')
          persistenceError.persistedDifferences = persistedDifferences
          throw persistenceError
        }

        deletedSubstanceIds.value = []

        // Sólo se cierra la edición después de comprobar los datos guardados por el API.
        console.log('📤 Cerrando edición de recepción:', payload)
        const response = await recepcionService.update(payload.id, payload)
        console.log('✅ Recepción actualizada correctamente:', response.data)

        // Registrar historial de edición SOLO SI todo lo anterior fue exitoso
        try {
          await receptionsHistoryService.create({
            reception: form,
            user: { id: parseInt(localStorage.getItem('user_id')) },
            description: editDescription.value.trim(),
          })
          console.log('🕒 Historial de edición guardado correctamente')
        } catch (histErr) {
          console.warn('⚠️ No se pudo registrar el historial:', histErr)
          toast.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'No se pudo registrar el historial de la edición.',
            life: 4000,
          })
        }

        // 5️⃣ Recargar desde backend para no propagar la respuesta previa a las sustancias.
        const { data: updatedReception } = await recepcionService.getById(form.id)
        emit('updated', updatedReception)

        toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Recepción y sustancias actualizadas correctamente',
          life: 3000,
        })

        // limpiar y cerrar
        editDescription.value = ''
        showValidationError.value = false
        closeDialog()
      } catch (error) {
        console.error('❌ Error al guardar edición:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: getSaveErrorMessage(error, 'No se pudo guardar la edición.'),
          life: 7000,
        })
      } finally {
        isSaving.value = false
      }
    }

    const updateDraft = async (state) => {
      if (editingSubstanceIndex.value !== null && !applyEditingSubstance()) return

      if (!validateFormBeforeSave()) return

      showValidationError.value = false
      isSaving.value = true

      try {
        await crearPoliciaSiEsNuevo()

        const receptionPayload = {
          id: form.id,
          number: form.number,
          of_number: form.of_number,
          nparte: form.nparte,
          of_number_date: formatDateOnly(form.of_number_date),
          date_reception: formatDateOnly(form.date_reception),
          location: form.location?.id ? { id: form.location.id } : null,
          state,
          police: form.police,
          is_editable: state === 'FINALIZADO' ? 'NO' : props.reception.is_editable,
          user_origin: form.user_origin || { id: 1 },
          user_destination: form.user_destination?.id ? form.user_destination : null,
        }

        const deletedIds = [...deletedSubstanceIds.value]
        const editableReceptionPayload =
          state === 'FINALIZADO'
            ? { ...receptionPayload, state: 'BORRADOR', is_editable: props.reception.is_editable }
            : receptionPayload
        let response = await recepcionService.update(form.id, editableReceptionPayload)
        const persistedDifferences = await persistAndVerifySubstances(response.data, deletedIds)

        if (persistedDifferences.length > 0) {
          const persistenceError = new Error('El API no confirmó los cambios de sustancias')
          persistenceError.persistedDifferences = persistedDifferences
          throw persistenceError
        }

        deletedSubstanceIds.value = []

        if (state === 'FINALIZADO') {
          response = await recepcionService.update(form.id, receptionPayload)
        }

        const { data: updatedReception } = await recepcionService.getById(form.id)
        emit('updated', updatedReception)
        toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail:
            state === 'BORRADOR'
              ? 'La recepción fue actualizada como borrador'
              : 'La recepción fue completada correctamente',
          life: 3000,
        })
        closeDialog()
      } catch (error) {
        console.error('Error actualizando la recepción:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: getSaveErrorMessage(
            error,
            state === 'BORRADOR'
              ? 'No se pudo actualizar el borrador'
              : 'No se pudo completar la recepción',
          ),
          life: 7000,
        })
      } finally {
        isSaving.value = false
      }
    }

    const guardarBorrador = () => updateDraft('BORRADOR')
    const completarRecepcion = () => updateDraft('FINALIZADO')

    const flagLabelEdit = computed(() => {
      if (form.state === 'BORRADOR') return '(Borrador)'
      if (form.state === 'FINALIZADO') return '(Finalizado)'
      if (form.state === 'EDITADO') return '(Editado)'
      return ''
    })

    return {
      visible,
      isLoading,
      isSaving,
      buscandoPolicia,
      rutError,
      institutions,
      institutionTypes,
      communes,
      locations,
      substancesTypes,
      grades,
      form,
      isReceptionEditMode,
      canEditSubstances,
      editingSubstance,
      editingSubstanceIndex,
      unityOptions,
      isUnitMeasurement,
      isEditingSubstanceValid,
      openDialog,
      closeDialog,
      buscarPolicia,
      flagLabelEdit,
      applyEditingSubstance,
      startEditSubstance,
      removeSubstance,
      duplicateSubstance,
      guardarEdicion,
      getSubstanceName,
      getCommuneName,
      getSubstanceWeight,
      editDescription,
      showValidationError,
      guardarBorrador,
      completarRecepcion,
    }
  },
}
</script>

<style scoped>
.field {
  margin-bottom: 1rem;
}
</style>
