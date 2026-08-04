import axiosClient from './axiosClient'

export default {
  // ✅ Obtener todos los usuarios
  getAll() {
    return axiosClient.get('/api/v1/microanalysis')
  },

  // ✅ Obtener usuario por ID
  getById(id) {
    return axiosClient.get(`/api/v1/microanalysis/${id}`)
  },

  // ✅ Crear usuario
  create(data) {
    return axiosClient.post(`/api/v1/microanalysis`, data)
  },

  // ✅ Actualizar usuario
  update(id, data) {
    return axiosClient.put(`/api/v1/microanalysis/${id}`, data)
  },
  // ✅ Obtener microanálisis por ID de análisis
  getByAnalysisId(id) {
    return axiosClient.get(`/api/v1/microanalysis/getByAnalysisId/${id}`)
  },

  // ✅ Eliminar usuario
  delete(id) {
    return axiosClient.delete(`/api/v1/microanalysis/${id}`)
  },
}
