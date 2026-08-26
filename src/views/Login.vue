<template>
  <div class="login-container">
    <div class="login-content">
      <div class="logo-section">
        <img src="/ssm/logo-ssm.png" alt="Logo" class="logo" />
        <div class="app-name">REGIS20</div>
        <div class="app-tagline">Sistema LEY 20.000</div>
      </div>

      <div class="login-form">
        <div class="form-header">
          <h3>Iniciar Sesión</h3>
        </div>

        <form @submit.prevent="conectar">
          <div class="field">
            <label for="email">Correo Electrónico</label>
            <InputText
              id="email"
              v-model="user.email"
              type="email"
              placeholder="Ingresa tu correo electrónico"
              class="w-full"
              :class="{ 'p-invalid': errors.email }"
            />
            <small class="p-error" v-if="errors.email">{{ errors.email }}</small>
          </div>

          <div class="field">
            <label for="password">Contraseña</label>
            <Password
              id="password"
              v-model="user.password"
              placeholder="Ingresa tu contraseña"
              :feedback="false"
              toggleMask
              class="w-full"
              :class="{ 'p-invalid': errors.password }"
              inputClass="w-full"
            />
            <small class="p-error" v-if="errors.password">{{ errors.password }}</small>
          </div>

          <Button
            type="submit"
            label="Iniciar Sesión"
            class="w-full"
            :loading="isLoading"
          />
        </form>

        <small class="p-error" v-if="error" style="margin-top: 10px; display: block;">
          {{ error }}
        </small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import axiosClient from '@/services/axiosClient'
import usersService from '@/services/usersService'
import { startSession } from '@/services/sessionService'

defineOptions({ name: 'LoginPage' })

const router = useRouter()

const user = reactive({
  email: "",
  password: "",
  grant_type: "password"
})

const errors = reactive({
  email: "",
  password: ""
})

const isLoading = ref(false)
const error = ref("")

const validateForm = () => {
  errors.email = user.email ? "" : "El correo electrónico es requerido"
  errors.password = user.password ? "" : "La contraseña es requerida"
  return !errors.email && !errors.password
}

// Función para cargar datos del usuario
const cargarDatosUsuario = async () => {
  try {
    console.log('🔍 Buscando usuario con email:', user.email);

    // Llamar al servicio para obtener datos del usuario
    const response = await usersService.getByEmail(user.email);
    
    if (response.data && response.data.length > 0) {
      const userData = response.data[0];
      console.log('✅ Datos del usuario obtenidos:', userData);
      
      // Guardar datos en localStorage
      localStorage.setItem("user_id", userData.id);
      localStorage.setItem("userName", userData.username || `${userData.firstName} ${userData.firstLastName}`);
      localStorage.setItem("userEmail", userData.email);
      localStorage.setItem("userRut", userData.rut);
      
      // También guardar datos completos si los necesitas
      localStorage.setItem("userData", JSON.stringify(userData));

      console.log('✅ Datos del usuario guardados en localStorage');
      return true;
    } else {
      console.warn('⚠️ No se encontraron datos del usuario');
      return false;
    }
  } catch (error) {
    console.error('❌ Error al cargar datos del usuario:', error);
    return false;
  }
}

const conectar = async () => {
  if (!validateForm()) return

  error.value = ""
  isLoading.value = true

  try {
    // 1. Primero hacer login
    const response = await axiosClient.post("auth/login", {
      email: user.email,
      password: user.password,
    })
    
    const data = response.data
    console.log('✅ Login exitoso:', data);
    
    // 2. Iniciar una sesión nueva y guardar email
    startSession(data.token, data.expires_in ?? data.expiresIn)
    localStorage.setItem("mail", user.email)

    // 3. Cargar datos adicionales del usuario
    const datosCargados = await cargarDatosUsuario()
    
    if (datosCargados) {
      console.log('✅ Todos los datos cargados correctamente');
      // 4. Redireccionar al home
      router.push("/inicio")
    } else {
      console.warn('⚠️ Login exitoso pero no se pudieron cargar datos adicionales');
      // Aún así redireccionar, pero mostrar mensaje
      router.push("/inicio")
    }
    
  } catch (err) {
    console.error('❌ Error en login:', err);
    if (err.response?.status === 403) {
      error.value = "No autorizado. Contacte al administrador."
    } else {
      error.value = "Usuario y/o contraseña incorrecta"
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--surface-ground);
  padding: 1rem;
}

.login-content {
  width: 100%;
  max-width: 400px;
}

.logo-section {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  height: 80px;
  margin-bottom: 1rem;
}

.app-name {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.app-tagline {
  color: var(--text-color-secondary);
  font-size: 1rem;
}

.login-form {
  background: var(--surface-card);
  padding: 2rem;
  border-radius: var(--border-radius);
  border: 1px solid var(--surface-border);
}

.form-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.form-header h3 {
  color: var(--text-color);
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.field {
  margin-bottom: 1.5rem;
}

.field label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-color);
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .login-container {
    padding: 1rem;
  }
  
  .login-form {
    padding: 1.5rem;
  }
  
  .logo {
    height: 60px;
  }
  
  .app-name {
    font-size: 1.75rem;
  }
}

@media (max-width: 480px) {
  .login-form {
    padding: 1rem;
  }
  
  .logo {
    height: 50px;
  }
  
  .app-name {
    font-size: 1.5rem;
  }
}
</style>
