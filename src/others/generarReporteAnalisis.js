import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { addDraftWatermark, openPdfPreview } from '@/others/pdfPreview.js'

/**
 * Convierte HTML a texto plano con formato para jsPDF
 * @param {string} html - Texto HTML del WYSIWYG
 * @returns {Array} Array de objetos con texto y estilo
 */
const parseHtmlToTextSegments = (html) => {
  if (!html) return []

  // Crear un elemento temporal para parsear el HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html

  const segments = []

  const parseNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim()
      if (text) {
        segments.push({ text, bold: false, italic: false })
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase()
      const isBold = tagName === 'strong' || tagName === 'b'
      const isItalic = tagName === 'em' || tagName === 'i'

      if (tagName === 'br') {
        segments.push({ text: '\n', bold: false, italic: false })
      } else if (tagName === 'p' || tagName === 'div') {
        node.childNodes.forEach((child) => parseNode(child))
        segments.push({ text: '\n', bold: false, italic: false })
      } else {
        node.childNodes.forEach((child) => {
          if (child.nodeType === Node.TEXT_NODE) {
            const text = child.textContent.trim()
            if (text) {
              segments.push({ text, bold: isBold, italic: isItalic })
            }
          } else {
            parseNode(child)
          }
        })
      }
    }
  }

  tempDiv.childNodes.forEach((node) => parseNode(node))

  return segments
}

const usesUnitMeasurement = (measurementType) => {
  const normalizedType = String(measurementType || '')
    .trim()
    .toLowerCase()

  return normalizedType.includes('unidad') || normalizedType.includes('paquete')
}

/**
 * Genera el reporte de análisis en PDF según la plantilla oficial
 * @param {Object} analysis - Datos del análisis completo
 * @param {Object} options - Opciones de salida del documento
 * @param {boolean} options.preview - Abre el PDF en una pestaña nueva
 * @param {boolean} options.draft - Agrega la marca de agua de borrador
 * @param {Window|null} options.previewWindow - Pestaña reservada para la previsualización
 */
export const generarReporteAnalisisPDF = (
  analysis,
  { preview = false, draft = false, previewWindow = null } = {},
) => {
  console.log(analysis)
  const positivo =
    'La Cannabis o marihuana es un producto vegetal que por su propia naturaleza contiene principios activos – en concreto el THC – que es un producto del metabolismo de la planta, de cuya composición forma parte con mayor o menor riqueza en cualquiera de sus partes y en mayor o menor proporción, según la calidad del cultivo, zona agrícola de procedencia y otras variables naturales. Si además, el producto vegetal no ha sufrido un proceso químico de purificación de los principios activos, no afecta la concentración de THC, por ende Cannabis 100% pura. La Muestra analizada corresponde en su totalidad a material vegetal con características propias de Cannabis, sin evidencia de mezcla con otros materiales herbáceos y/o proceso químico de purificación de principio activo, por lo que la muestra corresponde a Cannabis 100% pura.'
  const negativo =
    'En muestra analizada, no se detecta presencia de principios activos de cannabis – en concreto THC – por lo que la muestra es negativa (-)'
  const doc = new jsPDF({
    compress: true,
  })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20

  // Cargar y agregar logo con compresión
  const logo = new Image()
  logo.src = '/ssm/logo-ssm.png' // Ruta pública
  doc.addImage(logo, 'PNG', 15, 10, 25, 25, undefined, 'FAST')

  // ENCABEZADO PRINCIPAL
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  const protocolNumber = analysis.number_protocol || 'S/N'
  const title = `PROTOCOLO DE ANÁLISIS Nº ${protocolNumber}`

  // Obtener ancho del texto para subrayar
  const titleWidth = doc.getTextWidth(title)
  const titleX = pageWidth / 2 - titleWidth / 2

  doc.text(title, pageWidth / 2, 50, { align: 'center' })
  // Agregar línea de subrayado
  doc.setLineWidth(0.5)
  doc.line(titleX, 51.5, titleX + titleWidth, 51.5)

  // Información básica del acta
  let yPos = 60
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  const receptionNumber = analysis.preAnalysis?.reception?.number || 'N/A'
  const substance = analysis.preAnalysis?.substance
  const isUnitMeasurement = usesUnitMeasurement(substance?.measurement_type)
  const receivedForAnalysis = analysis.preAnalysis?.weight_sampled ?? 0
  const totalReceived = isUnitMeasurement
    ? (substance?.unit_quantity ?? substance?.unity_quantity ?? 0)
    : (substance?.weight_net ?? 0)
  const totalReceivedUnit = isUnitMeasurement ? 'unidades' : 'gr'
  const receptionDate =
    analysis.preAnalysis?.reception?.date_reception || new Date().toISOString().split('T')[0]

  doc.text('ACTA DE RECEPCIÓN Nº', margin, yPos)
  doc.text(`: ${receptionNumber}`, margin + 90, yPos)

  yPos += 6
  doc.text('CANTIDAD RECEPCIONADA PARA ANÁLISIS', margin, yPos)
  doc.text(`: ${receivedForAnalysis} gr`, margin + 90, yPos)

  yPos += 6
  doc.text('CANTIDAD RECEPCIONADA', margin, yPos)
  doc.text(`: ${totalReceived} ${totalReceivedUnit}`, margin + 90, yPos)

  yPos += 6
  doc.text('FECHA DE RECEPCIÓN', margin, yPos)
  doc.text(`: ${receptionDate}`, margin + 90, yPos)

  yPos += 12

  // SUSTANCIA Nº
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  const substanceN = analysis.preAnalysis?.substance?.nsubstance || 'N/A'
  doc.text(`SUSTANCIA DECOMISADA Nº ${substanceN}`, margin, yPos)
  yPos += 12

  // MUESTRA Nº
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(`MUESTRA ANALIZADA`, margin, yPos)
  yPos += 10

  // 1.- EXAMEN MACROSCÓPICO
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('1.- EXAMEN MACROSCÓPICO:', margin, yPos)
  doc.setFont('helvetica', 'normal')
  yPos += 6
  const fragmentationGrade = analysis.gradeFrac || 'N/A'
  const humidityGrade = analysis.gradeHum || 'N/A'
  const color = analysis.color || 'N/A'
  const smell = analysis.smell || 'N/A'

  // Construir texto de partes de la planta
  const plantParts = []
  if (analysis.has_palmed_leaves) plantParts.push('hojas palmeadas dentadas')
  if (analysis.has_leaf_remains) plantParts.push('restos de hojas')
  if (analysis.has_stems) plantParts.push('tallos')
  if (analysis.has_roots) plantParts.push('raíces')
  if (analysis.has_seeds) plantParts.push('semillas')
  if (analysis.has_inflorescences) plantParts.push('inflorescencias')

  let plantPartsText = ''
  if (plantParts.length > 0) {
    plantPartsText = ` Se observa ${plantParts.join(', ')}.`
  }

  const macroscopicText = `Materia de naturaleza herbosa, ${fragmentationGrade} y ${humidityGrade}.\nMuestra de color ${color} y olor ${smell}.${plantPartsText}`
  const macroscopicLines = doc.splitTextToSize(macroscopicText, pageWidth - margin * 2)
  doc.text(macroscopicLines, margin + 5, yPos)
  yPos += macroscopicLines.length * 5

  yPos += 6

  // 2.- EXAMEN MICROSCÓPICO
  doc.setFont('helvetica', 'bold')
  doc.text('2.- EXAMEN MICROSCÓPICO:', margin, yPos)
  doc.setFont('helvetica', 'normal')
  yPos += 6
  const microResult = String(analysis.micro || '')
    .trim()
    .toUpperCase()
  const microscopicText =
    microResult === 'NEGATIVO'
      ? 'No se observan estructuras características de Cannabis sativa.'
      : microResult === 'POSITIVO'
        ? 'Característico de Cannabis sativa.'
        : 'Pendiente de completar.'
  doc.text(microscopicText, margin + 15, yPos)

  yPos += 8

  // 3.- EXAMEN QUÍMICO
  doc.setFont('helvetica', 'bold')
  doc.text('3.- EXAMEN QUÍMICO:', margin, yPos)
  yPos += 6
  doc.setFont('helvetica', 'normal')
  doc.text('Método de Análisis: Fast Blue', margin + 15, yPos)
  yPos += 5
  const fastBlueResult =
    analysis.fast_blue_result || analysis.result || (draft ? 'Pendiente' : 'Positivo')
  doc.text(`Resultado: Reacción Cualitativa ${fastBlueResult}`, margin + 15, yPos)

  yPos += 8
  const fastBlueText =
    analysis.description ||
    'Formación de color rojo púrpura por reacción del reactivo Azul Sólido B (Fast Blue)\ncon compuestos cannabinoides.'
  const fastBlueLines = doc.splitTextToSize(fastBlueText, pageWidth - margin * 2 - 15)
  doc.text(fastBlueLines, margin + 15, yPos)
  yPos += fastBlueLines.length * 5

  yPos += 8

  // COMPOSICIÓN Y GRADO DE PUREZA
  doc.setFont('helvetica', 'bold')
  doc.text('Composición y grado de Pureza de la Muestra:', margin, yPos)
  doc.setFont('helvetica', 'normal')

  yPos += 6

  // Parsear HTML y renderizar con formato
  analysis.composition = ''
  if (
    analysis.macro === 'POSITIVO' &&
    analysis.micro === 'POSITIVO' &&
    analysis.result === 'POSITIVO'
  ) {
    analysis.composition = positivo
  } else if (
    analysis.macro === 'NEGATIVO' &&
    analysis.micro === 'NEGATIVO' &&
    analysis.result === 'NEGATIVO'
  ) {
    analysis.composition = negativo
  }
  const compositionHtml = analysis.composition || 'Sin información de composición registrada.'
  const segments = parseHtmlToTextSegments(compositionHtml)

  let currentX = margin
  const lineHeight = 5
  const maxWidth = pageWidth - margin * 2

  segments.forEach((segment) => {
    if (segment.text === '\n') {
      yPos += lineHeight
      currentX = margin
      return
    }

    // Configurar estilo
    const fontStyle = segment.bold ? 'bold' : segment.italic ? 'italic' : 'normal'
    doc.setFont('helvetica', fontStyle)

    // Dividir texto en palabras si es necesario
    const words = segment.text.split(' ')

    words.forEach((word, index) => {
      const wordWithSpace = index < words.length - 1 ? word + ' ' : word
      const wordWidth = doc.getTextWidth(wordWithSpace)

      // Si la palabra no cabe en la línea actual, saltar a la siguiente
      if (currentX + wordWidth > margin + maxWidth && currentX > margin) {
        yPos += lineHeight
        currentX = margin
      }

      doc.text(wordWithSpace, currentX, yPos)
      currentX += wordWidth
    })
  })

  yPos += lineHeight * 2

  // OBSERVACIÓN (si existe)
  if (analysis.observation) {
    yPos += 10
    doc.setFont('helvetica', 'bold')
    doc.text('Observación:', margin, yPos)
    doc.setFont('helvetica', 'normal')
    yPos += 6
    const observationLines = doc.splitTextToSize(analysis.observation, pageWidth - margin * 2)
    doc.text(observationLines, margin, yPos)
  }

  // PIE DE PÁGINA
  yPos = pageHeight - 50
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')

  const analystName = analysis.user?.username || 'N/A'
  const rawAnalysisDate = analysis.date_analysis || analysis.createdAt
  const analysisDate = rawAnalysisDate
    ? new Date(rawAnalysisDate).toLocaleDateString('es-CL')
    : new Date().toLocaleDateString('es-CL')

  // Sección final con nombre del analista
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(` ${analystName}`, pageWidth / 2, yPos, { align: 'center' })
  yPos += 4
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('QUÍMICO FARMACÉUTICO', pageWidth / 2, yPos, { align: 'center' })
  yPos += 3.5
  doc.setFont('helvetica', 'normal')
  doc.text('SERVICIO SALUD MAGALLANES', pageWidth / 2, yPos, { align: 'center' })

  yPos += 10
  doc.setFontSize(8)
  doc.text(`Punta Arenas, ${analysisDate}.`, margin, yPos)

  // Generar y abrir PDF
  const fileName = `Protocolo_Analisis_${protocolNumber}_${substanceN}_${Date.now()}.pdf`

  if (draft) addDraftWatermark(doc)

  if (preview) {
    openPdfPreview(doc, previewWindow)
    return
  }

  // Comprimir antes de guardar
  doc.save(fileName)
}
