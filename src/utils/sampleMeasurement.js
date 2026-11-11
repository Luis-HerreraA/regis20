const normalizeName = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

const unitTypes = new Set([
  'metanfetamina',
  'mdma/extasis',
  'lsd',
  'fentanilo',
  'ketamina ampollas',
  'comprimido desconocido',
  'resina de cannabis',
  'semilla de cannabis',
])

const gramTypes = new Set([
  'cocaina',
  'cannabis',
  'pasta base',
  'heroina',
  'marihuana',
  'ketamina polvo',
  'sustancia desconocida',
  'fragmentos de comprimido',
  'hongos',
])

const getName = (substanceOrName) =>
  typeof substanceOrName === 'string'
    ? substanceOrName
    : substanceOrName?.substanceType?.name ||
      substanceOrName?.substanceTypeName ||
      substanceOrName?.substance_type?.name ||
      ''

export const getSampleMeasurementType = (substanceOrName, stage = 'sampling') => {
  const name = normalizeName(getName(substanceOrName))

  if (name === 'plantas cannabis') return stage === 'sampling' ? 'GRAMOS' : 'UNIDADES'
  if (unitTypes.has(name)) return 'UNIDADES'
  if (gramTypes.has(name)) return 'GRAMOS'

  // Mantiene el comportamiento existente para tipos no incluidos en la tabla.
  const currentType = typeof substanceOrName === 'object'
    ? substanceOrName?.measurement_type
    : null
  return currentType || 'GRAMOS'
}

export const hasConfiguredSampleMeasurement = (substanceOrName) => {
  const name = normalizeName(getName(substanceOrName))
  return name === 'plantas cannabis' || unitTypes.has(name) || gramTypes.has(name)
}

export const isUnitMeasurement = (measurementType) => {
  const normalized = normalizeName(measurementType)
  return normalized.includes('unidad') || normalized.includes('paquete')
}

const getUnitQuantity = (substance) =>
  Number(substance?.unit_quantity ?? substance?.unitQuantity ?? substance?.unity_quantity ?? 0)

export const getSamplingAvailable = (substance) => {
  const samplingType = getSampleMeasurementType(substance, 'sampling')
  return isUnitMeasurement(samplingType)
    ? getUnitQuantity(substance)
    : Number(substance?.weight_net ?? substance?.weight ?? 0)
}

export const getDestructionAvailable = (substance) => {
  const destructionType = getSampleMeasurementType(substance, 'destruction')
  return isUnitMeasurement(destructionType)
    ? getUnitQuantity(substance)
    : Number(substance?.weight_net ?? substance?.weight ?? 0)
}
