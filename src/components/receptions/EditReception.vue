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
            <InputText v-model="form.number" placeholder="N° de acta" />
          </div>

          <div class="field col-12 md:col-2">
            <label>N° Oficio</label>
            <InputText v-model="form.of_number" />
          </div>

          <div class="field col-12 md:col-4">
            <label>Fecha Oficio</label>
            <Calendar v-model="form.of_number_date" dateFormat="dd/mm/yy" showIcon />
          </div>

          <div class="field col-12 md:col-4">
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
              v-model="form.police.grade.id"
              :options="grades"
              optionLabel="name"
              optionValue="id"
              placeholder="Seleccione grado"
              class="w-full"
              :filter="true"
            />
          </div>

          <div class="field col-12">
            <label>Institución</label>
            <Dropdown
              v-model="form.police.institutionType.institution.id"
              :options="institutions"
              optionLabel="name"
              optionValue="id"
              placeholder="Seleccione una institución"
              class="w-full"
            />
          </div>

          <div class="field col-12 md:col-6">
            <label>Tipo de Institución</label>
            <Dropdown
              v-model="form.police.institutionType.id"
              :options="institutionTypes"
              optionLabel="name"
              optionValue="id"
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

        <!-- 💊 Sustancias Asociadas (solo editable si es BORRADOR) -->
        <div
          v-if="form.state === 'BORRADOR'"
          class="section-title mt-4 mb-3 text-lg font-semibold flex items-center gap-2"
        >
          💊 Sustancias Asociadas
        </div>

        <!-- 🧩 Formulario para agregar/editar sustancias (solo si es BORRADOR) -->
        <div v-if="form.state === 'BORRADOR'" class="grid formgrid p-fluid align-items-end">
          <!-- Tipo de sustancia -->
          <div class="field col-12 md:col-3">
            <label>Tipo de Sustancia</label>
            <Dropdown
              v-model="editingSubstance.substanceType"
              :options="substancesTypes"
              optionLabel="name"
              optionValue="id"
              placeholder="Seleccione tipo"
              class="w-full"
              :filter="true"
            />
          </div>

          <!-- Peso bruto -->
          <div class="field col-12 md:col-2">
            <label>Peso Bruto (gr)</label>
            <InputNumber
              v-model="editingSubstance.weight"
              :min="0"
              mode="decimal"
              :maxFractionDigits="2"
              class="w-full"
            />
          </div>

          <!-- Peso neto -->
          <div class="field col-12 md:col-2">
            <label>Peso Neto (gr)</label>
            <InputNumber
              v-model="editingSubstance.weight_net"
              :min="0"
              mode="decimal"
              :maxFractionDigits="2"
              class="w-full"
            />
          </div>

          <!-- Cantidad de unidades -->
          <div class="field col-12 md:col-2">
            <label>Cantidad de unidades</label>
            <InputNumber
              v-model="editingSubstance.unit_quantity"
              :min="0"
              mode="decimal"
              :maxFractionDigits="2"
              class="w-full"
            />
          </div>

          <!-- Packaging -->
          <div class="field col-12 md:col-3">
            <label>Contenedor / Packaging</label>
            <Dropdown
              v-model="editingSubstance.packaging"
              :options="packagings"
              optionLabel="name"
              optionValue="id"
              placeholder="Seleccione contenedor"
              class="w-full"
              :filter="true"
            />
          </div>
        </div>

        <!-- 🧩 Fila 2: Comuna, NUE, Descripción, Botón (solo si es BORRADOR) -->
        <div v-if="form.state === 'BORRADOR'" class="grid formgrid p-fluid align-items-end mt-3">
          <!-- Comuna -->
          <div class="field col-12 md:col-3">
            <label>Comuna</label>
            <Dropdown
              v-model="editingSubstance.commune"
              :options="communes"
              optionLabel="name"
              optionValue="id"
              placeholder="Seleccione comuna"
              class="w-full"
              :filter="true"
            />
          </div>

          <!-- NUE -->
          <div class="field col-12 md:col-3">
            <label>NUE</label>
            <InputText
              v-model="editingSubstance.nue"
              placeholder="Número único de evidencia"
              class="w-full"
            />
          </div>

          <!-- Descripción -->
          <div class="field col-12 md:col-4">
            <label>Descripción</label>
            <Textarea
              v-model="editingSubstance.description"
              rows="2"
              autoResize
              placeholder="Descripción de la sustancia..."
              class="w-full"
            />
          </div>

          <!-- Botón agregar / actualizar -->
          <div class="field col-12 md:col-2 text-center">
            <Button
              :icon="editingSubstanceIndex === null ? 'pi pi-plus' : 'pi pi-save'"
              :label="editingSubstanceIndex === null ? 'Agregar' : 'Actualizar'"
              @click="applyEditingSubstance"
              :disabled="!editingSubstance.substanceType || !editingSubstance.weight"
              class="mt-4 w-full"
            />
          </div>
        </div>

        <!-- 💊 Sustancias (solo lectura si es FINALIZADO) -->
        <div
          v-if="form.state !== 'BORRADOR'"
          class="section-title mt-4 mb-3 text-lg font-semibold flex items-center gap-2"
        >
          💊 Sustancias Asociadas (Solo Lectura)
        </div>

        <!-- Tabla de sustancias (editable si es BORRADOR, lectura si es FINALIZADO) -->
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
              {{ Number(slotProps.data.weight || 0).toFixed(2) }}
            </template>
          </Column>

          <!-- Peso Neto -->
          <Column field="weight_net" header="Peso Neto (gr)">
            <template #body="slotProps">
              {{ Number(slotProps.data.weight_net || 0).toFixed(2) }}
            </template>
          </Column>

          <!-- Cantidad de unidades -->
          <Column field="unit_quantity" header="Cantidad">
            <template #body="slotProps">
              {{ slotProps.data.unit_quantity ?? '—' }}
            </template>
          </Column>

          <!-- Contenedor -->
          <Column field="packaging" header="Packaging">
            <template #body="slotProps">
              {{ getPackagingName(slotProps.data.packaging) }}
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

          <!-- Acciones (solo si es BORRADOR) -->
          <Column
            v-if="form.state === 'BORRADOR'"
            header="Acciones"
            bodyStyle="text-align:center; white-space: nowrap;"
          >
            <template #body="slotProps">
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
        <div
          v-if="form.state === 'FINALIZADO' || form.state === null || form.state === 'EDITABLE'"
          class="w-full mb-1"
        >
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
          label="Completar Recepción"
          icon="pi pi-save"
          @click="guardarBorrador"
          :loading="isSaving"
        />

        <!-- Botón para guardar edición final -->
        <Button
          v-if="form.state === 'FINALIZADO' || form.state === null || form.state === 'EDITABLE'"
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
import packagingsService from '@/services/packagingsService'
import receptionsHistoryService from '@/services/receptionsHistoryService'
import preAnalysisService from '@/services/preAnalysisService' // ✅ Asegúrate de importar esto

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
    const toast = useToast()

    // dropdowns
    const institutions = ref([])
    const institutionTypes = ref([])
    const communes = ref([])
    const locations = ref([])
    const substancesTypes = ref([])
    const grades = ref([])
    const packagings = ref([])
    const editDescription = ref('') // descripción del cambio
    const showValidationError = ref(false) // bandera si intenta guardar sin descripción

    // formulario (estructura igual al create)
    const form = reactive({
      id: null,
      number: '',
      of_number: '',
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

    // edición/creación de una sustancia en el pequeño formulario
    const editingSubstance = reactive({
      id: null,
      nsubstance: null,
      nue: '',
      description: '',
      measurement_type: null,
      unit_quantity: null,
      weight: null,
      weight_net: null,
      unity: null,
      substanceType: null,
      packaging: null,
      commune: null,
    })
    const editingSubstanceIndex = ref(null) // null = nueva, otherwise index en form.substances

    // cargar listas
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

    const getPackagingName = (packagingId) => {
      const packaging = packagings.value.find((p) => p.id === packagingId)
      return packaging ? packaging.name : 'Desconocido'
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
        nue: '',
        description: '',
        measurement_type: null,
        unit_quantity: null,
        weight: null,
        weight_net: null,
        unity: null,
        substanceType: null,
        packaging: null,
        commune: null,
      })
      editingSubstanceIndex.value = null
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
        form.of_number_date = data.of_number_date || null
        form.date_reception = data.date_reception || null
        form.location = data.location || { id: 1 }
        form.state = data.state || null

        // policía: si viene como objeto o id — adaptamos
        form.police = data.police
          ? { ...data.police }
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
          id: s.id ?? null,
          nsubstance: s.nsubstance ?? null,
          nue: s.nue ?? s.nue ?? '',
          description: s.description ?? '',
          measurement_type: s.measurement_type ?? s.measurementType ?? s.unity ?? null,
          unit_quantity: s.unit_quantity ?? s.unitQuantity ?? null,
          weight: s.weight ?? null,
          weight_net: s.weight_net ?? null,
          unity: s.unity ?? null,
          substanceType: s.substanceType ? s.substanceType.id : s.substanceType || null,
          packaging: s.packaging ? s.packaging.id : s.packaging || null,
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
          id: s.id,
          nsubstance: s.nsubstance ?? null,
          nue: s.nue ?? '',
          description: s.description ?? '',
          measurement_type: s.measurement_type ?? s.measurementType ?? s.unity ?? null,
          unit_quantity: s.unit_quantity ?? s.unitQuantity ?? null,
          weight: s.weight ?? null,
          weight_net: s.weight_net ?? null,
          unity: s.unity ?? null,
          substanceType: s.substanceType?.id ?? null,
          packaging: s.packaging?.id ?? null,
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

    // agregar o actualizar la substancia temporal (desde el pequeño formulario de sustancia)
    const applyEditingSubstance = () => {
      // validación mínima ya manejada por disabled del botón
      const sub = {
        id: editingSubstance.id ?? null,
        nsubstance: editingSubstance.nsubstance ?? null,
        nue: editingSubstance.nue,
        description: editingSubstance.description,
        measurement_type: editingSubstance.measurement_type,
        unit_quantity: editingSubstance.unit_quantity,
        weight: editingSubstance.weight,
        weight_net: editingSubstance.weight_net,
        unity: editingSubstance.unity,
        substanceType: editingSubstance.substanceType,
        packaging: editingSubstance.packaging,
        commune: editingSubstance.commune,
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
        measurement_type: null,
        unit_quantity: null,
        weight: null,
        weight_net: null,
        unity: null,
        substanceType: null,
        packaging: null,
        commune: null,
      })
      editingSubstanceIndex.value = null
    }

    // comenzar a editar una sustancia existente (cargarla en editingSubstance)
    const startEditSubstance = (index) => {
      const s = form.substances[index]
      editingSubstance.id = s.id ?? null
      editingSubstance.nsubstance = s.nsubstance ?? null
      editingSubstance.nue = s.nue ?? ''
      editingSubstance.description = s.description ?? ''
      editingSubstance.measurement_type = s.measurement_type ?? s.measurementType ?? s.unity ?? null
      editingSubstance.unit_quantity = s.unit_quantity ?? s.unitQuantity ?? null
      editingSubstance.weight = s.weight ?? null
      editingSubstance.weight_net = s.weight_net ?? null
      editingSubstance.unity = s.unity ?? null
      editingSubstance.substanceType = s.substanceType ?? null
      editingSubstance.packaging = s.packaging ?? null
      editingSubstance.commune = s.commune ?? null
      editingSubstance.reception = form
      editingSubstanceIndex.value = index
      // scroll al formulario o focus si se desea (opcional)
    }

    const removeSubstance = (index) => {
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
          measurement_type: null,
          unit_quantity: null,
          weight: null,
          weight_net: null,
          unity: null,
          substanceType: null,
          packaging: null,
          commune: null,
        })
        editingSubstanceIndex.value = null
      }
    }

    // guardar edición: armar payload completo y llamar update
    // arriba en imports (añádelo si no está)
    // import receptionHistoryService from '@/services/receptionHistoryService'

    const guardarEdicion = async () => {
      // Validación previa: descripción obligatoria
      if (form.state === 'FINALIZADO' || form.state === null || form.state === 'EDITABLE') {
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
          of_number_date: formatDateOnly(form.of_number_date),
          date_reception: formatDateOnly(form.date_reception),
          location: form.location && form.location.id ? { id: form.location.id } : null,
          state: 'EDITADO',
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

        console.log('📤 Actualizando recepción:', payload)
        const response = await recepcionService.update(payload.id, payload)
        console.log('✅ Recepción actualizada correctamente:', response.data)

        // 2️⃣ Procesar sustancias (crear/actualizar según tengan id)
        let createdSubstances = []
        if (form.substances && form.substances.length > 0) {
          console.log('💊 Actualizando/creando sustancias asociadas...')

          const promises = form.substances.map((s) => {
            const resolvedMeasurementType =
              s.measurement_type ?? s.measurementType ?? s.unity ?? null
            const substancePayload = {
              ...(s.id ? { id: s.id } : {}),
              nsubstance: s.nsubstance ?? null,
              nue: s.nue,
              description: s.description,
              measurement_type: resolvedMeasurementType,
              unit_quantity:
                s.unit_quantity !== undefined && s.unit_quantity !== null
                  ? Number(s.unit_quantity)
                  : null,
              weight: s.weight !== undefined && s.weight !== null ? Number(s.weight) : null,
              weight_net:
                s.weight_net !== undefined && s.weight_net !== null ? Number(s.weight_net) : null,
              unity: s.unity ?? resolvedMeasurementType,
              reception: form,
              substanceType: s.substanceType ? { id: s.substanceType } : null,
              packaging: s.packaging ? { id: s.packaging } : null,
              commune: s.commune ? { id: s.commune } : null,
            }

            if (s.id) {
              return substancesService.update(s.id, substancePayload)
            } else {
              return substancesService.create(substancePayload)
            }
          })

          const results = await Promise.all(promises)
          createdSubstances = results.map((result) => result.data)
          console.log('✅ Sustancias actualizadas/creadas correctamente')
        }
        // 🆕 3️⃣ CREAR PRE-ANÁLISIS PARA NUEVAS SUSTANCIAS EN RECEPCIONES FINALIZADAS
        if (createdSubstances.length > 0) {
          console.log('🔬 Creando registros de pre-análisis para nuevas sustancias...')

          const preAnalysisPromises = createdSubstances.map((substance) => {
            const preAnalysisPayload = {
              weight_sampled: substance.weight_net || 0,
              observation: 'Pendiente de análisis',
              reception: response.data,
              substance: substance,
              destination: { id: 1 },
              methodDestruction: { id: 1 },
              user: { id: parseInt(localStorage.getItem('user_id')) || 1 },
            }

            console.log('📤 Creando pre-análisis:', preAnalysisPayload)
            return preAnalysisService.create(preAnalysisPayload)
          })

          await Promise.all(preAnalysisPromises)
          console.log('✅ Pre-análisis creados para nuevas sustancias')
        }
        // 4️⃣  Registrar historial de edición SOLO SI todo lo anterior fue exitoso
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

        // 5️⃣ Emitir evento para recargar la lista principal
        emit('updated', response.data)

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
          detail: 'No se pudo guardar la edición (revisar consola).',
          life: 5000,
        })
      } finally {
        isSaving.value = false
      }
    }

    const guardarBorrador = async () => {
      showValidationError.value = false
      isSaving.value = true

      try {
        // 1️⃣ Construir payload completo de la recepción
        const payload = {
          id: form.id,
          number: form.number,
          of_number: form.of_number,
          of_number_date: formatDateOnly(form.of_number_date),
          date_reception: formatDateOnly(form.date_reception),
          location: form.location && form.location.id ? { id: form.location.id } : null,
          state: 'FINALIZADO', // ✅ Cambiar de BORRADOR a FINALIZADO
          police: form.police,
          user_origin: form.user_origin ? form.user_origin : { id: 1 },
          user_destination:
            form.user_destination && form.user_destination.id ? form.user_destination : null,
        }

        const response = await recepcionService.update(payload.id, payload)
        console.log('✅ Recepción actualizada correctamente:', response.data)

        // 2️⃣ Procesar sustancias (crear/actualizar según tengan id)
        let createdSubstances = []
        if (form.substances && form.substances.length > 0) {
          console.log('💊 Actualizando/creando sustancias asociadas...')
          const promises = form.substances.map((s) => {
            const resolvedMeasurementType =
              s.measurement_type ?? s.measurementType ?? s.unity ?? null
            const substancePayload = {
              ...(s.id ? { id: s.id } : {}),
              nsubstance: s.nsubstance ?? null,
              nue: s.nue,
              description: s.description,
              measurement_type: resolvedMeasurementType,
              unit_quantity:
                s.unit_quantity !== undefined && s.unit_quantity !== null
                  ? Number(s.unit_quantity)
                  : null,
              weight: s.weight !== undefined && s.weight !== null ? Number(s.weight) : null,
              weight_net:
                s.weight_net !== undefined && s.weight_net !== null ? Number(s.weight_net) : null,
              unity: s.unity ?? resolvedMeasurementType,
              reception: form,
              substanceType: s.substanceType ? { id: s.substanceType } : null,
              packaging: s.packaging ? { id: s.packaging } : null,
              commune: s.commune ? { id: s.commune } : null,
            }
            if (s.id) {
              return substancesService.update(s.id, substancePayload)
            } else {
              return substancesService.create(substancePayload)
            }
          })

          const results = await Promise.all(promises)
          createdSubstances = results.map((result) => result.data)
          console.log('✅ Sustancias actualizadas/creadas correctamente:', createdSubstances)
        }

        // 🆕 3️⃣ CREAR PRE-ANÁLISIS SOLO SI SE CAMBIA DE BORRADOR A FINALIZADO
        if (props.reception.state === 'BORRADOR' && createdSubstances.length > 0) {
          console.log('🔬 Creando registros de pre-análisis...')

          const preAnalysisPromises = createdSubstances.map((substance) => {
            const preAnalysisPayload = {
              weight_sampled: substance.weight_net || 0,
              observation: 'Pendiente de análisis',
              reception: response.data,
              substance: substance,
              destination: { id: 1 },
              methodDestruction: { id: 1 },
              user: { id: parseInt(localStorage.getItem('user_id')) || 1 },
            }

            console.log('📤 Creando pre-análisis:', preAnalysisPayload)
            return preAnalysisService.create(preAnalysisPayload)
          })

          await Promise.all(preAnalysisPromises)
          console.log('✅ Todos los registros de pre-análisis creados correctamente')
        }

        // 4️⃣ Emitir evento para recargar la lista principal
        emit('updated', response.data)

        toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Recepción completada y pre-análisis creados correctamente',
          life: 3000,
        })

        closeDialog()
      } catch (error) {
        console.error('❌ Error al guardar edición:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo completar la recepción',
          life: 5000,
        })
      } finally {
        isSaving.value = false
      }
    }

    const flagLabelEdit = computed(() => {
      if (form.state === 'BORRADOR') return '(Borrador)'
      if (form.state === 'FINALIZADO') return '(Finalizado)'
      if (form.state === 'FINALIZADO') return '(Editado)'
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
      packagings,
      form,
      editingSubstance,
      editingSubstanceIndex,
      openDialog,
      closeDialog,
      buscarPolicia,
      flagLabelEdit,
      applyEditingSubstance,
      startEditSubstance,
      removeSubstance,
      guardarEdicion,
      getSubstanceName,
      getPackagingName,
      getCommuneName,
      getSubstanceWeight,
      editDescription,
      showValidationError,
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
