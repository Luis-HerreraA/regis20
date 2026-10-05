const RESPONSE_COLLECTION_KEYS = ['content', 'items', 'results', 'data']

const SENSITIVE_FIELDS = new Set([
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
])

export const ANALYSIS_HISTORY_FIELD_LABELS = {
  number_protocol: 'Número de protocolo',
  description: 'Descripción',
  date_analysis: 'Fecha del análisis',
  gradeFrac: 'Grado de fragmentación',
  gradeHum: 'Grado de humedad',
  color: 'Color',
  smell: 'Olor',
  composition: 'Composición',
  result: 'Resultado',
  macro: 'Resultado macroanalítico',
  micro: 'Resultado microanalítico',
  state: 'Estado',
  has_palmed_leaves: 'Hojas palmeadas',
  has_leaf_remains: 'Restos de hojas',
  has_stems: 'Tallos',
  has_roots: 'Raíces',
  has_seeds: 'Semillas',
  has_inflorescences: 'Inflorescencias',
  ttgland: 'Tricomas glandulares',
  ttnogland: 'Tricomas no glandulares',
  stomas: 'Estomas',
  celepi: 'Células epidérmicas',
  celresi: 'Células resiníferas',
  cris: 'Cristales',
  conclution: 'Conclusión',
  observation: 'Observación',
  date: 'Fecha',
  aumento: 'Aumento utilizado',
  method: 'Método',
}

const isPlainObject = (value) => {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

const parseHistoryData = (value) => {
  if (isPlainObject(value)) return value
  if (typeof value !== 'string') return {}

  try {
    const parsedValue = JSON.parse(value)
    return isPlainObject(parsedValue) ? parsedValue : {}
  } catch {
    return {}
  }
}

const findCollection = (value, depth = 0) => {
  if (Array.isArray(value)) return value
  if (!isPlainObject(value) || depth > 3) return null

  for (const key of RESPONSE_COLLECTION_KEYS) {
    if (key in value) {
      const collection = findCollection(value[key], depth + 1)
      if (collection !== null) return collection
    }
  }

  return null
}

export const normalizeHistoryResponse = (payload) => findCollection(payload) ?? []

export const getHistoryAnalysisId = (historyRecord) => {
  return (
    historyRecord?.analysis?.id ??
    historyRecord?.microanalysis?.analysis?.id ??
    historyRecord?.chemicalTest?.analysis?.id ??
    null
  )
}

const toTimestamp = (value) => {
  const timestamp = new Date(value || 0).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

export const filterHistoryByAnalysisId = (historyRecords, analysisId) => {
  if (analysisId === null || analysisId === undefined) return []

  return normalizeHistoryResponse(historyRecords)
    .filter((record) => String(getHistoryAnalysisId(record)) === String(analysisId))
    .sort((first, second) => toTimestamp(second.changedAt) - toTimestamp(first.changedAt))
}

const flattenHistoryData = (value, prefix = '', result = {}) => {
  const parsedValue = parseHistoryData(value)

  Object.entries(parsedValue).forEach(([key, fieldValue]) => {
    if (SENSITIVE_FIELDS.has(key)) return

    const path = prefix ? `${prefix}.${key}` : key
    if (isPlainObject(fieldValue)) {
      flattenHistoryData(fieldValue, path, result)
      return
    }

    result[path] = fieldValue
  })

  return result
}

const valuesAreEqual = (first, second) => {
  if (first === second) return true

  try {
    return JSON.stringify(first) === JSON.stringify(second)
  } catch {
    return false
  }
}

const humanizeFieldName = (fieldPath, labels) => {
  const fieldName = fieldPath.split('.').at(-1)
  if (labels[fieldPath]) return labels[fieldPath]
  if (labels[fieldName]) return labels[fieldName]

  return fieldName
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (character) => character.toUpperCase())
}

export const getHistoryChanges = (
  historyRecord,
  labels = ANALYSIS_HISTORY_FIELD_LABELS,
) => {
  const oldData = flattenHistoryData(historyRecord?.oldData)
  const newData = flattenHistoryData(historyRecord?.newData)
  const fields = new Set([...Object.keys(oldData), ...Object.keys(newData)])

  return [...fields]
    .filter((field) => !valuesAreEqual(oldData[field], newData[field]))
    .map((field) => ({
      field,
      label: humanizeFieldName(field, labels),
      oldValue: oldData[field] ?? null,
      newValue: newData[field] ?? null,
    }))
}

export const formatHistoryValue = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (Array.isArray(value)) return value.join(', ')
  if (isPlainObject(value)) return JSON.stringify(value)
  return String(value)
}
