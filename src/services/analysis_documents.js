import axiosClient from './axiosClient'

export default {
  getAll() {
    return axiosClient.get('/api/v1/analysis_documents')
  },

  getById(id) {
    return axiosClient.get(`/api/v1/analysis_documents/${id}`)
  },

  getByAnalysisId(analysisId) {
    return axiosClient.get(`/api/v1/analysis_documents/by-analysis/${analysisId}`)
  },

  create(data) {
    return axiosClient.post(`/api/v1/analysis_documents`, data)
  },

  upload(analysisId, userId, file, description = '') {
    const formData = new FormData()
    formData.append('file', file)

    return axiosClient.post('/api/v1/analysis_documents/upload', formData, {
      params: {
        analysis_id: analysisId,
        user_id: userId,
        description: description || undefined,
      },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  download(id) {
    return axiosClient.get(`/api/v1/analysis_documents/download/${id}`, {
      responseType: 'blob',
    })
  },

  update(id, data) {
    return axiosClient.put(`/api/v1/analysis_documents/${id}`, data)
  },

  delete(id) {
    return axiosClient.delete(`/api/v1/analysis_documents/${id}`)
  },
}
