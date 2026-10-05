import axiosClient from './axiosClient'

export const createHistoryService = (endpoint) => ({
  getAll(params = {}) {
    return axiosClient.get(endpoint, { params })
  },

  getById(id) {
    return axiosClient.get(`${endpoint}/${id}`)
  },

  getByAnalysisId(analysisId) {
    return axiosClient.get(`${endpoint}/by-analysis/${analysisId}`)
  },

  create(data) {
    return axiosClient.post(endpoint, data)
  },
})
