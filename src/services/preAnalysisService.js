import axiosClient from './axiosClient'

const excludePreAnalysisWithoutReception = (response) => {
  if (Array.isArray(response.data)) {
    response.data = response.data.filter((preAnalysis) => preAnalysis?.reception != null)
  } else if (Array.isArray(response.data?.content)) {
    response.data.content = response.data.content.filter(
      (preAnalysis) => preAnalysis?.reception != null,
    )
  }

  return response
}

export default {
  // ✅ Obtener todos los usuarios
  getAll() {
    return axiosClient.get('/api/v1/pre_analysis').then(excludePreAnalysisWithoutReception)
  },

  // ✅ Obtener usuario por ID
  getById(id) {
    return axiosClient.get(`/api/v1/pre_analysis/${id}`)
  },

  // ✅ Crear usuario
  create(data) {
    return axiosClient.post(`/api/v1/pre_analysis`, data)
  },

  // ✅ Actualizar usuario
  update(id, data) {
    return axiosClient.put(`/api/v1/pre_analysis/${id}`, data)
  },

  // ✅ Eliminar usuario
  delete(id) {
    return axiosClient.delete(`/api/v1/pre_analysis/${id}`)
  },


  // ✅ Obtener usuario por RUT
  getByRut(rut) {
    return axiosClient.get(`/api/v1/pre_analysis/findByRut/${rut}`)
  },
}
