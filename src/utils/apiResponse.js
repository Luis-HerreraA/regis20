const COLLECTION_KEYS = ['content', 'data', 'items', 'results']

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

const findCollection = (payload, depth = 0) => {
  if (Array.isArray(payload)) return payload
  if (!isObject(payload) || depth > 3) return null

  for (const key of COLLECTION_KEYS) {
    if (key in payload) {
      const collection = findCollection(payload[key], depth + 1)
      if (collection !== null) return collection
    }
  }

  return null
}

export const normalizeApiCollection = (payload) => findCollection(payload) ?? []

export const filterByAnalysisId = (records, analysisId) => {
  if (analysisId === null || analysisId === undefined) return []

  return normalizeApiCollection(records).filter(
    (record) => String(record?.analysis?.id) === String(analysisId),
  )
}
