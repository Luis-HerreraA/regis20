import axiosClient from './axiosClient.js'
import { filterByAnalysisId } from '../utils/apiResponse.js'

export default {
  // ✅ Obtener todos los exámenes químicos
  getAll() {
    return axiosClient.get('/api/v1/chemical_tests')
  },

  // ✅ Obtener examen químico por ID
  getById(id) {
    return axiosClient.get(`/api/v1/chemical_tests/${id}`)
  },

  // El API no expone una ruta by-analysis para chemical_tests.
  // Se consulta la colección válida y se conserva la interfaz esperada por el formulario.
  async getByAnalysisId(analysisId) {
    const response = await axiosClient.get('/api/v1/chemical_tests')

    return {
      ...response,
      data: filterByAnalysisId(response.data, analysisId),
    }
  },

  // ✅ Crear examen químico
  create(data) {
    return axiosClient.post(`/api/v1/chemical_tests`, data)
  },

  // ✅ Actualizar examen químico
  update(id, data) {
    return axiosClient.put(`/api/v1/chemical_tests/${id}`, data)
  },

  // ✅ Eliminar examen químico
  delete(id) {
    return axiosClient.delete(`/api/v1/chemical_tests/${id}`)
  },
}
