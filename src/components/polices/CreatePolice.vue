<template>
  <div class="card flex justify-center">
    <Toast />
    <Button label="Crear Policía" @click="openDialog">
      <template #icon>
        <font-awesome-icon icon="fa-solid fa-plus" />
      </template>
    </Button>

    <Dialog
      v-model:visible="visible"
      :style="{ width: '40rem', padding: '0.5rem' }"
      modal
      :headerStyle="{ padding: '1rem 1.5rem' }"
      :transition-options="{ name: 'fade', duration: 300 }"
    >
      <template #header>
        <span class="text-xl font-semibold">Crear Policía</span>
      </template>

      <!-- Spinner mientras se guarda -->
      <div
        v-if="isLoading"
        class="flex justify-content-center align-items-center"
        style="height: 200px"
      >
        <ProgressSpinner />
      </div>

      <!-- Formulario solo cuando no está cargando -->
      <div v-else class="dialog-content">
        <div class="flex flex-column gap-1">
          <!-- Información Personal -->
          <div class="grid grid-nogutter gap-1">
            <div class="col-12 field">
              <label for="firstName">Primer Nombre *</label>
              <InputText
                id="firstName"
                v-model="form.firstName"
                class="w-full"
                placeholder="Primer nombre"
              />
            </div>
            <div class="col-12 field">
              <label for="secondName">Segundo Nombre</label>
              <InputText
                id="secondName"
                v-model="form.secondName"
                class="w-full"
                placeholder="Segundo nombre"
              />
            </div>
          </div>

          <div class="grid grid-nogutter gap-1">
            <div class="col-12 field">
              <label for="firstLastName">Primer Apellido *</label>
              <InputText
                id="firstLastName"
                v-model="form.firstLastName"
                class="w-full"
                placeholder="Primer apellido"
              />
            </div>
            <div class="col-12 field">
              <label for="secondLastName">Segundo Apellido</label>
              <InputText
                id="secondLastName"
                v-model="form.secondLastName"
                class="w-full"
                placeholder="Segundo apellido"
              />
            </div>
          </div>

          <div class="grid grid-nogutter gap-1">
            <div class="col-12 field">
              <label for="rut">RUT *</label>
              <InputText id="rut" v-model="form.rut" class="w-full" placeholder="12345678-9" />
            </div>
            <div class="col-12 field">
              <label for="cellphone">Celular *</label>
              <InputText
                id="cellphone"
                v-model="form.cellphone"
                class="w-full"
                placeholder="912345678"
              />
            </div>
          </div>

          <div class="field">
            <label for="email">Email *</label>
            <InputText
              id="email"
              v-model="form.email"
              class="w-full"
              placeholder="correo@ejemplo.cl"
              type="email"
            />
          </div>

          <!-- Información Institucional -->
          <div class="grid grid-nogutter gap-1">
            <div class="col-12 field">
              <label for="institutionType">Tipo de Institución *</label>
              <Dropdown
                id="institutionType"
                v-model="form.institutionType"
                :options="institutionTypes"
                optionLabel="name"
                placeholder="Seleccione tipo"
                class="w-full"
                :filter="true"
                @change="onInstitutionTypeChange"
              />
            </div>
            <div class="col-12 field">
              <label for="grade">Grado *</label>
              <Dropdown
                id="grade"
                v-model="form.grade"
                :options="grades"
                optionLabel="name"
                placeholder="Seleccione grado"
                class="w-full"
                :filter="true"
                :disabled="!form.institutionType"
              />
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cerrar" severity="secondary" @click="closeDialog" :disabled="isLoading" />
        <Button label="Guardar" @click="savePolice" :loading="isLoading" />
      </template>
    </Dialog>
  </div>
</template>

<script>
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import policeService from '@/services/policesService'
import institutionTypeService from '@/services/institutionTypesService'
import gradeService from '@/services/gradesService'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import ProgressSpinner from 'primevue/progressspinner'
import Toast from 'primevue/toast'
import { formatRut, validateRut } from '@/others/verificationRut'

export default {
  name: 'CreatePolice',
  components: { InputText, Button, Dialog, Dropdown, ProgressSpinner, Toast },
  emits: ['created'],

  setup(props, { emit }) {
    const visible = ref(false)
    const isLoading = ref(false)
    const institutionTypes = ref([])
    const allGrades = ref([]) // Almacena todos los grados
    const toast = useToast()

    const form = reactive({
      firstName: '',
      secondName: '',
      firstLastName: '',
      secondLastName: '',
      rut: '',
      email: '',
      cellphone: '',
      institutionType: null,
      grade: null,
    })

    // ✅ Computed para filtrar grados por institutionType seleccionado
    const filteredGrades = computed(() => {
      if (!form.institutionType) return []
      return allGrades.value.filter(
        (grade) => grade.institutionType?.id === form.institutionType.id,
      )
    })
    const cleanRut = (value) => value.replace(/^0+|[^0-9kK]+/g, '').toUpperCase()

    const fetchInstitutionTypes = async () => {
      try {
        const { data } = await institutionTypeService.getAll()
        institutionTypes.value = data
      } catch (error) {
        console.error('❌ Error cargando tipos de institución:', error)
      }
    }

    const fetchGrades = async () => {
      try {
        const { data } = await gradeService.getAll()
        allGrades.value = data
      } catch (error) {
        console.error('❌ Error cargando grados:', error)
      }
    }

    const onInstitutionTypeChange = () => {
      // Limpiar el grado seleccionado cuando cambia el tipo de institución
      form.grade = null
    }

    const openDialog = async () => {
      visible.value = true
      if (institutionTypes.value.length === 0) {
        await fetchInstitutionTypes()
      }
      if (allGrades.value.length === 0) {
        await fetchGrades()
      }
    }

    const closeDialog = () => {
      visible.value = false
      resetForm()
    }

    const resetForm = () => {
      form.firstName = ''
      form.secondName = ''
      form.firstLastName = ''
      form.secondLastName = ''
      form.rut = ''
      form.email = ''
      form.cellphone = ''
      form.institutionType = null
      form.grade = null
    }

    const savePolice = async () => {
      if (
        !form.firstName.trim() ||
        !form.firstLastName.trim() ||
        !form.rut.trim() ||
        !form.email.trim() ||
        !form.cellphone.trim() ||
        !form.institutionType ||
        !form.grade
      ) {
        toast.add({
          severity: 'error',
          summary: 'Campos faltantes',
          detail: 'Por favor completa todos los campos marcados con *',
          life: 3000,
        })
        return
      }
      const rutLimpio = cleanRut(form.rut)
      // 🔎 Validación real
      if (!validateRut(rutLimpio)) {
        toast.add({
          severity: 'error',
          summary: 'RUT inválido',
          detail: 'Por favor verifica que el RUT sea correcto',
          life: 3000,
        })
        return
      }
      try {
        isLoading.value = true

        const payload = {
          firstName: form.firstName.trim(),
          secondName: form.secondName.trim(),
          firstLastName: form.firstLastName.trim(),
          secondLastName: form.secondLastName.trim(),
          rut: rutLimpio, // ← SE ENVÍA SIN FORMATO
          email: form.email.trim(),
          cellphone: form.cellphone.trim(),
          institutionType: form.institutionType,
          grade: form.grade,
        }

        console.log('📤 Payload enviado:', payload)

        const { data } = await policeService.create(payload)
        toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Policía creada correctamente',
          life: 3000,
        })
        emit('created')
        closeDialog()
      } catch (e) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ocurrió un error al crear la policía',
          life: 3000,
        })
        console.error('❌ Error al crear policía:', e)
      } finally {
        isLoading.value = false
      }
    }

    // Formatear visualmente el RUT mientras el usuario escribe (se envía sin puntos ni guión)
    watch(
      () => form.rut,
      (newVal) => {
        if (!newVal) return
        const formatted = formatRut(newVal)
        if (formatted !== newVal) {
          form.rut = formatted
        }
      },
    )

    return {
      visible,
      form,
      institutionTypes,
      grades: filteredGrades,
      isLoading,
      openDialog,
      closeDialog,
      savePolice,
      onInstitutionTypeChange,
      cleanRut,
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
}

.field label {
  font-weight: 500;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

:deep(.p-inputtext) {
  width: 100%;
}
</style>
