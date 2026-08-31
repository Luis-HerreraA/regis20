<template>
  <div>
    <div class="card flex justify-center">
      <Button label="Recepcionar" icon="pi pi-file-import" @click="openDialog" />

      <Dialog
        v-model:visible="visible"
        maximizable
        modal
        :style="{ width: '70rem' }"
        header="Recepción de Documento"
      >
        <template #header>
          <span class="text-xl font-semibold">Recepción de Documento</span>
        </template>

        <!-- Loader -->
        <div
          v-if="isLoading"
          class="flex justify-content-center align-items-center"
          style="height: 250px"
        >
          <ProgressSpinner />
        </div>

        <!-- Formulario -->
        <div v-else class="dialog-content">
          <!-- Datos del Oficio -->
          <div class="section-title">📄 Datos del Oficio</div>
          <div class="grid formgrid p-fluid">
            <div class="field col-12 md:col-2">
              <label>N° Acta</label>
              <InputText v-model="form.number" class=" " placeholder="N° de acta" readonly />
            </div>

            <div class="field col-12 md:col-2">
              <label>N° Oficio</label>
              <InputText v-model="form.of_number" class=" " />
            </div>

            <div class="field col-12 md:col-2">
              <label>Número de Parte</label>
              <InputText v-model="form.nparte" class=" " placeholder="N° de parte" />
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
          <div class="section-title">👮‍♂️ Datos del Policía</div>
          <div class="grid formgrid p-fluid">
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
              <InputText v-model="form.police.firstName" class=" " />
            </div>

            <div class="field col-12 md:col-3">
              <label>Segundo Nombre</label>
              <InputText v-model="form.police.secondName" class=" " />
            </div>

            <div class="field col-12 md:col-3">
              <label>Apellido Paterno</label>
              <InputText v-model="form.police.firstLastName" class=" " />
            </div>

            <div class="field col-12 md:col-3">
              <label>Apellido Materno</label>
              <InputText v-model="form.police.secondLastName" class=" " />
            </div>

            <div class="field col-12 md:col-3">
              <label>Correo</label>
              <InputText v-model="form.police.email" type="email" class=" " />
            </div>

            <div class="field col-12 md:col-3">
              <label>Teléfono</label>
              <InputText v-model="form.police.cellphone" class=" " />
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

          <!-- Sustancias -->
          <div class="section-title mt-4">💊 Sustancias Asociadas</div>

          <!-- Primera fila: tipo y packaging -->
          <div class="grid formgrid p-fluid align-items-end">
            <div class="field col-12 md:col-6">
              <label>Tipo de Sustancia</label>
              <Dropdown
                v-model="newSubstance.substanceType"
                :options="substancesTypes"
                optionLabel="name"
                optionValue="id"
                placeholder="Seleccione sustancia"
                class="w-full"
                :filter="true"
              />
            </div>

            <div class="field col-12 md:col-6">
              <label>Contenedor</label>
              <Dropdown
                v-model="newSubstance.packaging"
                :options="packagings"
                optionLabel="name"
                optionValue="id"
                placeholder="Seleccione contenedor"
                class="w-full"
                :filter="true"
              />
            </div>
          </div>

          <!-- ⚖️ Segunda fila: pesos y unidad -->
          <div class="grid formgrid p-fluid align-items-end">
            <div class="field col-12 md:col-2">
              <label>Tipo de Medcion</label>
              <Dropdown
                v-model="newSubstance.measurement_type"
                :options="unityOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccione tipo de medición"
                class="w-full"
                :filter="true"
              />
            </div>

            <div class="field col-12 md:col-3" v-show="!isUnitMeasurement">
              <label>Peso Bruto</label>
              <InputNumber
                v-model="newSubstance.weight"
                :min="0"
                mode="decimal"
                :maxFractionDigits="2"
                class="w-full"
              />
            </div>

            <div class="field col-12 md:col-3" v-show="!isUnitMeasurement">
              <label>Peso Neto</label>
              <InputNumber
                v-model="newSubstance.weight_net"
                :min="0"
                mode="decimal"
                :maxFractionDigits="2"
                class="w-full"
              />
            </div>

            <div class="field col-12 md:col-3" v-show="newSubstance.measurement_type === 'OTROS'">
              <label>Otra unidad</label>
              <InputText
                v-model="newSubstance.other_unity"
                placeholder="Ej: cápsulas, frascos..."
                class="w-full"
              />
            </div>

            <div class="field col-12 md:col-3" v-show="isUnitMeasurement">
              <label>Cantidad</label>
              <InputNumber
                v-model="newSubstance.unit_quantity"
                :min="0"
                mode="decimal"
                :maxFractionDigits="2"
                class="w-full"
              />
            </div>

            <div class="field col-12 md:col-2">
              <label>NUE</label>
              <InputText
                v-model="newSubstance.nue"
                placeholder="Número único de evidencia"
                class="w-full"
              />
            </div>
          </div>

          <!-- 🔢 Tercera fila: NUE y descripción -->
          <div class="grid formgrid p-fluid align-items-end mt-2">
            <div class="field col-12 md:col-9">
              <label>Descripción</label>
              <Textarea
                v-model="newSubstance.description"
                rows="2"
                autoResize
                placeholder="Descripción de la sustancia..."
                class="w-full"
              />
            </div>
            <div class="field col-12 md:col-3 text-center">
              <Button
                icon="pi pi-plus"
                label="Agregar"
                @click="addSubstance"
                :disabled="!isNewSubstanceValid"
                class="mt-4 w-full"
              />
            </div>
          </div>

          <!-- Tabla de sustancias -->
          <DataTable :value="form.substances" responsiveLayout="scroll" class="mt-3">
            <Column field="nsubstance" header="N°"></Column>
            <Column field="nue" header="NUE"></Column>
            <Column field="substanceType" header="Tipo de Sustancia">
              <template #body="slotProps">
                {{ getSubstanceName(slotProps.data.substanceType) }}
              </template>
            </Column>
            <Column field="weight" header="Peso (gr)">
              <template #body="slotProps">
                {{
                  isUnitMeasurementType(slotProps.data.measurement_type)
                    ? '-'
                    : Number(slotProps.data.weight || 0).toFixed(2)
                }}
              </template>
            </Column>
            <Column field="weight_net" header="Peso Neto (gr)">
              <template #body="slotProps">
                {{
                  isUnitMeasurementType(slotProps.data.measurement_type)
                    ? '-'
                    : Number(slotProps.data.weight_net || 0).toFixed(2)
                }}
              </template>
            </Column>
            <Column field="measurement_type" header="Tipo de Medcion"></Column>
            <Column field="unit_quantity" header="Cantidad">
              <template #body="slotProps">
                {{
                  slotProps.data.unit_quantity === null ||
                  slotProps.data.unit_quantity === undefined ||
                  slotProps.data.unit_quantity === ''
                    ? '-'
                    : slotProps.data.unit_quantity
                }}
              </template>
            </Column>
            <Column field="packaging" header="Contenedor">
              <template #body="slotProps">
                {{ getPackagingName(slotProps.data.packaging) }}
              </template>
            </Column>
            <Column field="commune" header="Comuna">
              <template #body="slotProps">
                {{ getCommuneName(slotProps.data.commune) }}
              </template>
            </Column>
            <Column field="description" header="Descripción">
              <template #body="slotProps">
                {{ slotProps.data.description ? slotProps.data.description : '-' }}
              </template>
            </Column>
            <Column header="Acciones" bodyStyle="text-align:center">
              <template #body="slotProps">
                <Button
                  icon="pi pi-copy"
                  severity="info"
                  text
                  title="Duplicar"
                  @click="duplicateSubstance(slotProps.index)"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  @click="removeSubstance(slotProps.index)"
                />
              </template>
            </Column>
          </DataTable>
        </div>
        <template #footer>
          <Button label="Cerrar" severity="secondary" @click="closeDialog" />
          <Button
            label="Guardar borrador"
            icon="pi pi-save"
            severity="info"
            @click="guardarBorrador"
            :loading="isSaving"
          />
          <Button label="Guardar" icon="pi pi-save" @click="guardarRecepcion" :loading="isSaving" />
        </template>
      </Dialog>
    </div>
  </div>
</template>
<script>
import { ref, reactive, watch, onMounted, computed } from 'vue'
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
import packagingsService from '@/services/packagingsService'
import preAnalysisService from '@/services/preAnalysisService'
import { generarActaPDF } from '@/others/generarActa'

export default {
  name: 'RecepcionComponent',
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

  emits: ['created'], // ✅ Agregar emisión de evento

  setup(props, { emit }) {
    // ✅ Recibir emit
    const visible = ref(false)
    const isLoading = ref(false)
    const isSaving = ref(false)
    const buscandoPolicia = ref(false)
    const rutError = ref('')
    const isNewPolice = ref(false) // 🟢 Banderín para saber si el policía es nuevo

    const toast = useToast()

    // Datos para dropdowns
    const institutions = ref([])
    const institutionTypes = ref([])
    const communes = ref([])
    const locations = ref([])
    const substancesTypes = ref([])
    const grades = ref([])
    const packagings = ref([])

    const form = reactive({
      number: '',
      of_number: '',
      nparte: '',
      of_number_date: null,
      date_reception: null,
      location: { id: 1 }, // ID predeterminado
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
      substances: [], // Cambiado de drugs a substances
    })

    const newSubstance = reactive({
      nue: '',
      description: '',
      measurement_type: 'GRAMOS',
      unit_quantity: null,
      weight: null,
      weight_net: null, // 🆕 peso neto
      unity: '', // 🆕 unidad de medida
      other_unity: '',
      substanceType: null,
      packaging: null,
      commune: null,
    })

    const unityOptions = [
      { label: 'Gramos', value: 'GRAMOS' },

      //  { label: 'Kilogramos', value: 'KILOGRAMOS' },
      //  { label: 'Mililitros', value: 'MILILITROS' },
      //  { label: 'Litros', value: 'LITROS' },
      //  { label: 'Paquete', value: 'PAQUETE' },
      //  { label: 'Unidad', value: 'UNIDAD' },
      //  { label: 'Otros', value: 'OTROS' },
    ]

    const normalizeValue = (value) =>
      String(value || '')
        .trim()
        .toLowerCase()

    const getResolvedUnity = (substance) => {
      if (normalizeValue(substance.unity) === 'otros') {
        return String(substance.other_unity || '').trim()
      }

      return substance.unity
    }

    const getResolvedMeasurementType = (substance) => {
      if (normalizeValue(substance.measurement_type) === 'otros') {
        return String(substance.other_unity || '').trim()
      }

      return substance.measurement_type
    }

    const isUnitMeasurementType = (measurementType) => {
      const normalizedMeasurementType = String(measurementType || '')
        .trim()
        .toLowerCase()

      return (
        normalizedMeasurementType.includes('unidad') ||
        normalizedMeasurementType.includes('paquete')
      )
    }

    const isUnitMeasurement = computed(() => {
      return isUnitMeasurementType(getResolvedMeasurementType(newSubstance))
    })

    const isNewSubstanceValid = computed(() => {
      if (!newSubstance.substanceType) return false

      if (!normalizeValue(newSubstance.measurement_type)) return false

      if (
        normalizeValue(newSubstance.measurement_type) === 'otros' &&
        !normalizeValue(newSubstance.other_unity)
      ) {
        return false
      }

      if (isUnitMeasurement.value) {
        return Number(newSubstance.unit_quantity || 0) > 0
      }

      return Number(newSubstance.weight || 0) > 0
    })

    const validateSubstanceData = (substance, index = null) => {
      const rowLabel = index !== null ? `sustancia N°${index + 1}` : 'sustancia'
      const isUnit = isUnitMeasurementType(getResolvedMeasurementType(substance))

      if (!substance.substanceType) {
        toast.add({
          severity: 'warn',
          summary: 'Dato faltante',
          detail: `Debe seleccionar tipo de sustancia en ${rowLabel}.`,
          life: 3500,
        })
        return false
      }

      if (!normalizeValue(substance.measurement_type)) {
        toast.add({
          severity: 'warn',
          summary: 'Tipo de medición requerido',
          detail: `Debe ingresar el tipo de medición en ${rowLabel} (ej: gramos, paquete).`,
          life: 3500,
        })
        return false
      }

      if (
        normalizeValue(substance.measurement_type) === 'otros' &&
        !normalizeValue(substance.other_unity)
      ) {
        toast.add({
          severity: 'warn',
          summary: 'Tipo de medición requerido',
          detail: `Debe especificar el otro tipo de medición en ${rowLabel}.`,
          life: 3500,
        })
        return false
      }

      if (isUnit) {
        if (Number(substance.unit_quantity || 0) <= 0) {
          toast.add({
            severity: 'warn',
            summary: 'Cantidad inválida',
            detail: `La cantidad debe ser mayor a 0 en ${rowLabel}.`,
            life: 3500,
          })
          return false
        }
      } else {
        if (Number(substance.weight || 0) <= 0) {
          toast.add({
            severity: 'warn',
            summary: 'Peso inválido',
            detail: `El peso bruto debe ser mayor a 0 en ${rowLabel}.`,
            life: 3500,
          })
          return false
        }

        if (
          substance.weight_net !== null &&
          substance.weight_net !== undefined &&
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
      }

      return true
    }

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

    const fetchDropdownData = async () => {
      try {
        isLoading.value = true
        const [instRes, typeRes, commRes, locRes, subRes, gradesRes, packRes] = await Promise.all([
          institutionsService.getAll(),
          institutionTypesService.getAll(),
          communesService.getAll(),
          locationsService.getAll(),
          substancesTypesService.getAll(),
          gradesService.getAll(),
          packagingsService.getAll(),
        ])

        institutions.value = instRes.data || []
        institutionTypes.value = typeRes.data || []
        communes.value = commRes.data || []
        locations.value = locRes.data || []
        substancesTypes.value = subRes.data || []
        grades.value = gradesRes.data || []
        packagings.value = packRes.data || []
      } catch (err) {
        console.error('❌ Error cargando datos para dropdowns:', err)
      } finally {
        isLoading.value = false
      }
    }

    const getSubstanceName = (substanceId) => {
      const substance = substancesTypes.value.find((s) => s.id === substanceId)
      return substance ? substance.name : 'Desconocido'
    }

    const getPackagingName = (packagingId) => {
      const packaging = packagings.value.find((p) => p.id === packagingId)
      return packaging ? packaging.name : 'Desconocido'
    }

    const getCommuneName = (communeId) => {
      const commune = communes.value.find((c) => c.id === communeId)
      return commune ? commune.name : 'Desconocido'
    }

    watch(
      () => form.police.rut,
      (newValue) => {
        if (!newValue) {
          rutError.value = ''
          return
        }
        form.police.rut = formatRut(newValue)

        // Validar formato
        if (!validateRut(form.police.rut)) {
          rutError.value = 'RUT inválido'
        } else {
          rutError.value = ''
        }
      },
    )

    watch(
      () => [newSubstance.measurement_type, newSubstance.other_unity],
      () => {
        if (isUnitMeasurement.value) {
          newSubstance.weight = null
          newSubstance.weight_net = null
        } else {
          newSubstance.unit_quantity = null
        }
      },
    )

    watch(
      () => form.police.institutionType?.commune?.id,
      (communeId) => {
        const selectedCommuneId = communeId || null
        newSubstance.commune = selectedCommuneId
        form.substances.forEach((substance) => {
          substance.commune = selectedCommuneId
        })
      },
    )

    const openDialog = async () => {
      visible.value = true
      isLoading.value = true
      try {
        if (institutions.value.length === 0) {
          await fetchDropdownData()
        }

        // Autocompletar número de acta: siguiente número del año actual con formato NN/YYYY
        try {
          const currentYear = new Date().getFullYear()
          const next = await getNextReceptionNumberForYear(currentYear)
          // Formato: 01/2025, 10/2025, etc.
          form.number = `${String(next).padStart(2, '0')}/${currentYear}`
          // establecer fecha de recepción por defecto hoy
          form.date_reception = new Date()
        } catch (err) {
          console.warn('No se pudo calcular número de acta automáticamente:', err)
        }
      } finally {
        isLoading.value = false
      }
    }

    const closeDialog = () => {
      visible.value = false
      isLoading.value = false
      resetForm()
    }

    const resetForm = () => {
      Object.assign(form, {
        number: '',
        of_number: '',
        of_number_date: null,
        date_reception: null,
        location: { id: 1 },
        police: {
          id: 0,
          rut: '',
          firstName: '',
          secondName: '',
          firstLastName: '',
          secondLastName: '',
          email: '',
          cellphone: '',
          grade: null,
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
      Object.assign(newSubstance, {
        nue: '',
        description: '',
        measurement_type: 'GRAMOS',
        unit_quantity: null,
        weight: null,
        substanceType: null,
        packaging: null,
        weight_net: null, // 🆕 peso neto
        unity: '',
        other_unity: '',
        commune: null,
      })
      isNewPolice.value = false
    }

    // Parsear fecha en formato dd-mm-yyyy a objeto Date
    const parseDateDDMMYYYY = (dateStr) => {
      if (!dateStr || typeof dateStr !== 'string') return null
      const parts = dateStr.split('-')
      if (parts.length !== 3) return null
      const [dayStr, monthStr, yearStr] = parts
      const day = parseInt(dayStr, 10)
      const month = parseInt(monthStr, 10)
      const year = parseInt(yearStr, 10)
      if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null
      const d = new Date(year, month - 1, day)
      return Number.isNaN(d.getTime()) ? null : d
    }

    // Obtener siguiente número de acta por año
    // Acepta números en formato "NN/YYYY" o solo número
    const getNextReceptionNumberForYear = async (year) => {
      try {
        const { data } = await recepcionService.getAll()
        const list = data.content || data || []

        const numbersThisYear = list
          .map((r) => {
            const date = r.date_reception ? parseDateDDMMYYYY(r.date_reception) : null
            // Extraer el número del formato "NN/YYYY" o usar como está
            let numValue = null
            if (r.number && typeof r.number === 'string') {
              // Si tiene formato "NN/YYYY", extraer la parte numérica
              const parts = r.number.split('/')
              if (parts.length === 2) {
                numValue = parseInt(parts[0], 10)
              } else {
                numValue = parseInt(r.number, 10)
              }
            } else if (typeof r.number === 'number') {
              numValue = r.number
            }
            return { number: numValue, date }
          })
          .filter((r) => r.date && r.date.getFullYear() === Number(year))
          .map((r) => r.number)
          .filter((n) => Number.isFinite(n) && n !== null)

        if (numbersThisYear.length === 0) return 1
        const max = Math.max(...numbersThisYear)
        return max + 1
      } catch (err) {
        console.error('Error calculando siguiente número de acta por año:', err)
        return 1
      }
    }

    const addSubstance = () => {
      if (!isNewSubstanceValid.value) return

      if (!validateSubstanceData(newSubstance)) return

      // Asignar número correlativo a la sustancia
      const nsubstance = form.substances.length + 1
      const substanceToAdd = {
        ...newSubstance,
        nsubstance,
        commune: form.police.institutionType?.commune?.id || null,
      }

      substanceToAdd.measurement_type = getResolvedMeasurementType(substanceToAdd)
      substanceToAdd.other_unity = ''
      substanceToAdd.description = String(substanceToAdd.description || '').trim() || null

      if (isUnitMeasurementType(getResolvedMeasurementType(substanceToAdd))) {
        substanceToAdd.weight = null
        substanceToAdd.weight_net = null
      } else {
        substanceToAdd.unit_quantity = null
      }

      form.substances.push(substanceToAdd)

      // Limpiar formulario de nueva sustancia
      Object.assign(newSubstance, {
        nue: '',
        description: '',
        measurement_type: 'GRAMOS',
        unit_quantity: null,
        weight: null,
        weight_net: null,
        unity: '',
        other_unity: '',
        substanceType: null,
        packaging: null,
        commune: null,
      })
    }

    const removeSubstance = (index) => {
      form.substances.splice(index, 1)

      // Renumerar todas las sustancias restantes
      form.substances.forEach((substance, idx) => {
        substance.nsubstance = idx + 1
      })
    }

    const duplicateSubstance = (index) => {
      const substanceToDuplicate = form.substances[index]
      const newSubstance = { ...substanceToDuplicate }

      // Calcular nuevo número de sustancia
      const nsubstance = form.substances.length + 1
      newSubstance.nsubstance = nsubstance

      // Agregar la sustancia duplicada después de la actual
      form.substances.splice(index + 1, 0, newSubstance)

      form.substances.forEach((substance, idx) => {
        substance.nsubstance = idx + 1
      })
    }

    const buscarPolicia = async () => {
      if (!form.police.rut || rutError.value) return
      try {
        buscandoPolicia.value = true
        const datos = await policeService.getByRut(form.police.rut)

        // Verificar si el content está vacío
        if (!datos.data.content || datos.data.content.length === 0) {
          // 🔴 No encontrado
          isNewPolice.value = true
          toast.add({
            severity: 'warn',
            summary: 'Policía no existe',
            detail:
              'El policía no se encuentra en la base de datos. Favor ingresar en la base de datos.',
            life: 4000,
          })
          return
        }

        let data = datos.data.content[0]
        console.log(data.institutionType)
        data = { ...data, institution: data.institutionType.institution }
        if (data) {
          // 🟢 Encontrado
          isNewPolice.value = false
          Object.assign(form.police, data)
          toast.add({
            severity: 'success',
            summary: 'Policía encontrado',
            detail: `${data.firstName} ${data.firstLastName}`,
            life: 3000,
          })
        } else {
          // 🔴 No encontrado
          isNewPolice.value = true
          toast.add({
            severity: 'warn',
            summary: 'No encontrado',
            detail:
              'El policía no se encuentra en la base de datos. Favor ingresar en la base de datos.',
            life: 4000,
          })
        }
      } catch (e) {
        console.error('❌ Error al buscar policía:', e)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ocurrió un problema al buscar el policía',
          life: 3000,
        })
      } finally {
        buscandoPolicia.value = false
      }
    }

    const crearPoliciaSiEsNuevo = async () => {
      if (!isNewPolice.value) return form.police // No crear, ya existe
      try {
        const nuevo = {
          rut: form.police.rut,
          firstName: form.police.firstName,
          secondName: form.police.secondName,
          firstLastName: form.police.firstLastName,
          secondLastName: form.police.secondLastName,
          email: form.police.email,
          cellphone: form.police.cellphone,
          grade: form.police.grade.id ? form.police.grade : null,
          institution: form.police.institution.id ? form.police.institution : null,
          institutionType: form.police.institutionType.id ? form.police.institutionType : null,
        }

        const response = await policeService.create(nuevo)
        form.police.id = response.data.id
        isNewPolice.value = false
        toast.add({
          severity: 'success',
          summary: 'Policía creado',
          detail: 'El registro del policía fue creado exitosamente',
          life: 3000,
        })
        return response.data
      } catch (e) {
        console.error('❌ Error al crear policía:', e)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear el policía',
          life: 3000,
        })
        throw e
      }
    }

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

    const guardarBorrador = async () => {
      try {
        if (!validateFormBeforeSave()) return

        isSaving.value = true

        // 1. Primero crear la recepción
        const receptionPayload = {
          number: form.number,
          of_number: form.of_number,
          nparte: form.nparte,
          of_number_date: formatDateOnly(form.of_number_date),
          date_reception: formatDateOnly(form.date_reception),
          state: 'BORRADOR',
          location: form.location.id ? { id: form.location.id } : null,
          police: {
            id: form.police.id,
            rut: form.police.rut,
            firstName: form.police.firstName,
            secondName: form.police.secondName,
            firstLastName: form.police.firstLastName,
            secondLastName: form.police.secondLastName,
            email: form.police.email,
            cellphone: form.police.cellphone,
            grade: form.police.grade.id ? form.police.grade : null,
            institution: form.police.institution.id ? form.police.institution : null,
            institutionType: form.police.institutionType.id ? form.police.institutionType : null,
          },
          user_origin: { id: 1 },
          user_destination: form.user_destination.id ? { id: form.user_destination.id } : null,
        }

        console.log('📤 Enviando recepción:', receptionPayload)
        const receptionResponse = await recepcionService.create(receptionPayload)
        const receptionId = receptionResponse.data.id
        console.log('✅ Recepción creada con ID:', receptionId)

        // 2. Luego crear las sustancias asociadas a esta recepción
        if (form.substances.length > 0) {
          const substancesPromises = form.substances.map((substance) => {
            const substancePayload = {
              nsubstance: substance.nsubstance,
              nue: substance.nue,
              description: substance.description,
              measurement_type: getResolvedMeasurementType(substance),
              unit_quantity: isUnitMeasurementType(getResolvedMeasurementType(substance))
                ? substance.unit_quantity
                : null,
              weight: substance.weight,
              weight_net: substance.weight_net, // 🆕
              reception: receptionResponse.data,
              substanceType: substance.substanceType ? { id: substance.substanceType } : null,
              packaging: substance.packaging ? { id: substance.packaging } : null,
              commune: form.police.institutionType?.commune?.id
                ? { id: form.police.institutionType.commune.id }
                : null,
            }
            return substancesService.create(substancePayload)
          })

          await Promise.all(substancesPromises)
          console.log('✅ Todas las sustancias creadas correctamente')
          form.substances = form.substances.map((s) => ({
            ...s,
            substanceTypeName: getSubstanceName(s.substanceType),
            packagingName: getPackagingName(s.packaging),
            communeName: getCommuneName(s.commune),
          }))
          console.log(form.substances)
          console.log('✅ Todas las sustancias creadas correctamente')
        }

        // ✅ EMITIR EVENTO PARA ACTUALIZAR LA TABLA
        emit('created', receptionResponse.data)

        toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'La recepción fue guardada como borrador',
          life: 3000,
        })

        closeDialog()
      } catch (e) {
        console.error('❌ Error al guardar borrador:', e)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar el borrador',
          life: 3000,
        })
      } finally {
        isSaving.value = false
      }
    }

    const guardarRecepcion = async () => {
      try {
        if (!validateFormBeforeSave()) return

        isSaving.value = true

        // 🟢 Si el policía no existía, primero crearlo
        await crearPoliciaSiEsNuevo()
        // 1. Primero crear la recepción
        const receptionPayload = {
          number: form.number,
          of_number: form.of_number,
          nparte: form.nparte,
          of_number_date: formatDateOnly(form.of_number_date),
          date_reception: formatDateOnly(form.date_reception),
          state: 'FINALIZADO',
          location: form.location.id ? { id: form.location.id } : null,
          police: form.police,
          is_editable: 'NO',
          user_origin: { id: 1 },
          user_destination: form.user_destination.id ? { id: form.user_destination.id } : null,
        }

        const receptionResponse = await recepcionService.create(receptionPayload)
        const receptionId = receptionResponse.data.id
        console.log('✅ Recepción creada con ID:', receptionId)

        // 2️⃣ Crear las sustancias asociadas
        let createdSubstances = []
        if (form.substances.length > 0) {
          const substancesPromises = form.substances.map((substance) => {
            const substancePayload = {
              nsubstance: substance.nsubstance,
              nue: substance.nue,
              description: substance.description,
              measurement_type: getResolvedMeasurementType(substance),
              unit_quantity: isUnitMeasurementType(getResolvedMeasurementType(substance))
                ? substance.unit_quantity
                : null,
              weight: substance.weight,
              weight_net: substance.weight_net, // 🆕
              reception: receptionResponse.data,
              substanceType: substance.substanceType ? { id: substance.substanceType } : null,
              packaging: substance.packaging ? { id: substance.packaging } : null,
              commune: form.police.institutionType?.commune?.id
                ? { id: form.police.institutionType.commune.id }
                : null,
            }
            return substancesService.create(substancePayload)
          })

          createdSubstances = await Promise.all(substancesPromises)
          console.log('✅ Sustancias creadas correctamente:', createdSubstances)
          // 3️⃣ Crear registros en pre-análisis para cada sustancia creada
          /*     const preAnalysisPromises = createdSubstances.map((sub) => {
                const preAnalysisPayload = {
                  weight_sampled: sub.data.weight_net, // o como corresponda
                  observation: "Pendiente de análisis", // puedes ajustar este texto
                  reception: receptionResponse.data,
                  substance: sub.data,
                  destination: {id:1},
                  methodDestruction: {id:1}, // si todavía no aplica
                  user: { id: localStorage.getItem('user_id') } // o el usuario actual logueado
                };

                console.log("📤 Creando pre-análisis:", preAnalysisPayload);
                return preAnalysisService.create(preAnalysisPayload);
              });

              await Promise.all(preAnalysisPromises);
              console.log("✅ Todos los registros de pre-análisis creados correctamente");*/

          form.substances = form.substances.map((s) => ({
            ...s,
            substanceTypeName: getSubstanceName(s.substanceType),
            packagingName: getPackagingName(s.packaging),
            communeName: getCommuneName(s.commune),
          }))

          //Generar el PDF automáticamente
          generarActaPDF(form, receptionResponse)
        }

        // ✅ EMITIR EVENTO PARA ACTUALIZAR LA TABLA
        emit('created', receptionResponse.data)

        toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Recepción creada correctamente',
          life: 3000,
        })

        closeDialog()
      } catch (e) {
        console.error('❌ Error al guardar recepción:', e)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear la recepción',
          life: 3000,
        })
      } finally {
        isSaving.value = false
      }
    }

    onMounted(() => {
      fetchDropdownData()
    })

    return {
      visible,
      isLoading,
      isSaving,
      buscandoPolicia,
      form,
      substancesTypes,
      institutions,
      institutionTypes,
      communes,
      locations,
      grades,
      packagings,
      rutError,
      isNewPolice,
      newSubstance,
      unityOptions,
      isUnitMeasurement,
      isUnitMeasurementType,
      isNewSubstanceValid,
      validateFormBeforeSave,
      openDialog,
      closeDialog,
      addSubstance,
      removeSubstance,
      duplicateSubstance,
      buscarPolicia,
      guardarRecepcion,
      formatDateOnly,
      getSubstanceName,
      getPackagingName,
      getCommuneName,
      guardarBorrador,
    }
  },
}
</script>

<style scoped>
.field {
  margin-bottom: 1rem;
}
</style>
