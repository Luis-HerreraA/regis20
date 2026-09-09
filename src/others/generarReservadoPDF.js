import jsPDF from 'jspdf'
import reservedsService from '@/services/reservedsService.js'
import { addDraftWatermark, openPdfPreview } from '@/others/pdfPreview.js'

/**
 * Genera un documento de reservado para un análisis con números de Fiscalía Local e ISP
 * @param {Object} analysis - Análisis con información completa
 * @param {Array} reserveds - Array de números reservados (fiscal e ISP)
 */
export const generarReservadoPDF = async (
  analysis,
  reserveds,
  { preview = false, draft = false, previewWindow = null, analyses: previewAnalyses } = {},
) => {
  console.log(analysis)

  if (!analysis) {
    console.error('No hay análisis para generar el documento')
    return
  }

  if (!reserveds || reserveds.length === 0) {
    console.error('No hay números reservados para generar el documento')
    return
  }

  // Cargar análisis asociados al número reservado ISP
  const reservedISP = reserveds.find((r) => r.isp === true || r.isp === 'true')
  let analyses = previewAnalyses || []
  if (!previewAnalyses && reservedISP) {
    try {
      const { data } = await reservedsService.getByNumberPaginated(reservedISP.number)
      analyses = data.content || data || []
      console.log('✅ Análisis cargados:', analyses)
    } catch (error) {
      console.error('❌ Error cargando análisis:', error)
    }
  }

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20

  // Cargar y agregar logo
  const logo = new Image()
  logo.src = '/ssm/logo-ssm.png' // Ruta pública
  doc.addImage(logo, 'JPEG', 15, 10, 20, 20, undefined, 'FAST')

  // Marca X en la esquina superior izquierda
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('X', 15, 45)

  // ENCABEZADO - RESERVADO
  doc.setFontSize(11)
  console.log(reservedISP)

  const reservedNumber = reservedISP.number

  doc.text('RESERVADO.:', pageWidth - margin - 60, 35)
  doc.text(String(reservedNumber), pageWidth - margin - 15, 35, { align: 'right' })
  doc.text('.-', pageWidth - margin - 5, 35, { align: 'right' })

  let yPos = 45

  // Información del acta
  const actaNumber = analysis.preAnalysis?.reception?.number || 'X'
  const policeData = analysis.preAnalysis?.reception?.police || {}
  const ord = analysis.preAnalysis?.reception?.of_number || 'X'
  const institutionData = policeData.institutionType || {}
  const commune = institutionData.commune?.name || 'COMUNA'
  const partNumber = analysis.preAnalysis?.reception?.nparte || '0'

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  // Calcular posición para alinear a la derecha (cuadro ANT)
  const rightBoxX = pageWidth - margin - 80

  doc.text('ANT.:', rightBoxX, yPos)
  doc.text(`Acta de Recepción Nº`, rightBoxX + 10, yPos)
  doc.text(actaNumber.toString(), pageWidth - margin - 15, yPos, { align: 'right' })

  yPos += 6
  doc.text('Ordinario Nº', rightBoxX + 10, yPos)
  doc.text(ord.toString(), pageWidth - margin - 5, yPos, { align: 'right' })

  yPos += 6
  doc.text(institutionData.name, rightBoxX + 10, yPos)
  doc.text(commune, pageWidth - margin - 5, yPos, { align: 'right' })

  yPos += 6
  doc.text('Parte / Inf. Policial', rightBoxX + 10, yPos)
  doc.text(partNumber.toString(), pageWidth - margin - 5, yPos, { align: 'right' })

  yPos += 10
  doc.text('MAT.:', rightBoxX, yPos)
  doc.text('Informa resultado de análisis', rightBoxX + 10, yPos)

  yPos += 10
  const dateText = `DÍA-MES-AÑO`
  doc.text(`Punta Arenas,`, pageWidth - margin - 60, yPos)
  doc.text(dateText, pageWidth - margin - 5, yPos, { align: 'right' })

  yPos += 20

  // DE: / A:
  doc.setFont('helvetica', 'bold')
  doc.text('DE:', margin, yPos)
  doc.text('DIRECTOR SERVICIO SALUD MAGALLANES', margin + 15, yPos)

  yPos += 8
  doc.text('A:', margin, yPos)
  doc.text('DEPARTAMENTO SALUD AMBIENTAL', margin + 15, yPos)

  yPos += 5
  doc.text('SUBDEPARTAMENTO DE SUSTANCIAS ILÍCITAS', margin + 15, yPos)

  yPos += 5
  doc.text('INSTITUTO SALUD PÚBLICA', margin + 15, yPos)

  yPos += 5
  doc.text('MARATON Nº 1000', margin + 15, yPos)

  yPos += 5
  doc.text('ÑUÑOA, SANTIAGO', margin + 15, yPos)

  yPos += 15

  // Párrafo principal
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const mainText = `De acuerdo a los antecedentes adjuntos, remito a Ud., para su análisis:`
  const mainLines = doc.splitTextToSize(mainText, pageWidth - margin * 2 - 20)
  doc.text(mainLines, margin + 15, yPos)
  yPos += mainLines.length * 6

  yPos += 10

  // MUESTRAS - iterar sobre los análisis cargados
  if (analyses.length > 0) {
    analyses.forEach((analysisItem, index) => {
      console.log(analysisItem) // Verificar si hay espacio suficiente para la muestra y el pie de firma (necesitamos ~80px)

      // Verificar si hay espacio suficiente para la muestra y el pie de firma (necesitamos ~80px)
      if (yPos > pageHeight - 90) {
        doc.addPage()
        yPos = 20
      }

      doc.setFont('helvetica', 'bold')
      const substanceName =
        analysisItem.analysis.preAnalysis?.substance?.substanceType?.name || 'N/A'
      const weight = analysisItem.analysis.preAnalysis?.weight_sampled || 0
      doc.text(`MUESTRA N° ${index + 1}: `, margin + 30, yPos)

      doc.setFont('helvetica', 'normal')
      doc.text(`${weight} gr - ${substanceName}`, margin + 60, yPos)
      yPos += 8
    })
  } else {
    // Fallback si no hay análisis cargados
    doc.setFont('helvetica', 'bold')
    doc.text('MUESTRA N° 1: ', margin + 30, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text('CANTIDAD NETA Y DESCRIPCIÓN MUESTRA', margin + 60, yPos)
    yPos += 8
  }

  yPos += 5

  // Verificar espacio antes del texto de solicitud
  if (yPos > pageHeight - 90) {
    doc.addPage()
    yPos = 20
  }

  // Texto de solicitud
  const requestText = 'Se solicita remitir resultado de análisis: FISCALÍA LOCAL'
  doc.text(requestText, margin + 30, yPos)

  yPos += 15

  // Saludo final
  doc.text('Saluda atentamente a usted,', margin + 20, yPos)

  // PIE DE PÁGINA - FIRMA
  yPos = pageHeight - 60
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('DIRECTOR', pageWidth / 2, yPos, { align: 'center' })
  yPos += 5
  doc.text('SERVICIO DE SALUD MAGALLANES', pageWidth / 2, yPos, { align: 'center' })

  yPos += 15
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('DISTRIBUCIÓN.:', margin, yPos)
  yPos += 4
  doc.setFont('helvetica', 'bold')
  doc.text('DSSM', margin, yPos)

  // Línea decorativa azul y roja
  doc.setLineWidth(2)
  // Línea azul
  doc.setDrawColor(0, 0, 255)
  doc.line(margin, yPos + 2, margin + 10, yPos + 2)
  // Línea roja
  doc.setDrawColor(255, 0, 0)
  doc.line(margin + 10, yPos + 2, margin + 30, yPos + 2)

  // Footer final
  yPos = pageHeight - 10
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const footerText =
    'Lautaro Navarro N° 525 - Casilla N° 527 - Fono 61 2294000 - E-mail: direccion.ssm@redsalud.gob.cl - PUNTA ARENAS'
  doc.text(footerText, pageWidth / 2, yPos, { align: 'center' })

  // Generar y descargar PDF
  const fileName = `Reservado_ISP_Acta_${actaNumber}_Analisis_${analysis.id}_${Date.now()}.pdf`

  if (draft) addDraftWatermark(doc)

  if (preview) {
    openPdfPreview(doc, previewWindow)
    return
  }

  doc.save(fileName, { compress: true })
}

/**
 * Genera un documento de reservado para Fiscalía Local
 * @param {Object} analysis - Análisis con información completa
 * @param {Array} reserveds - Array de números reservados (fiscal e ISP)
 */
export const generarReservadoFiscaliaPDF = async (
  analysis,
  reserveds,
  { preview = false, draft = false, previewWindow = null, analyses: previewAnalyses } = {},
) => {
  if (!analysis) {
    console.error('No hay análisis para generar el documento')
    return
  }

  if (!reserveds || reserveds.length === 0) {
    console.error('No hay números reservados para generar el documento')
    return
  }

  // Cargar análisis asociados al número reservado fiscal
  const reservedFiscal = reserveds.find((r) => r.fiscal === true || r.fiscal === 'true')
  let analyses = previewAnalyses || []
  if (!previewAnalyses && reservedFiscal) {
    try {
      const { data } = await reservedsService.getByNumberPaginated(reservedFiscal.number)
      analyses = data.content || data || []
      console.log('✅ Análisis cargados:', analyses)
    } catch (error) {
      console.error('❌ Error cargando análisis:', error)
    }
  }

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20

  // Cargar y agregar logo
  const logo = new Image()
  logo.src = '/ssm/logo-ssm.png' // Ruta pública
  doc.addImage(logo, 'JPEG', 15, 10, 20, 20, undefined, 'FAST')

  // Marca X en la esquina superior izquierda
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('X', 15, 45)

  // ENCABEZADO - RESERVADO
  doc.setFontSize(11)
  const reservedISPForFiscalia = reserveds.find((r) => r.isp === true || r.isp === 'true')

  const reservedNumber = reservedFiscal ? reservedFiscal.number : 'X'

  doc.text('RESERVADO.:', pageWidth - margin - 60, 35)
  doc.text(String(reservedNumber), pageWidth - margin - 15, 35, { align: 'right' })
  doc.text('.-', pageWidth - margin - 5, 35, { align: 'right' })

  let yPos = 45

  // Información del acta
  const actaNumber = analysis.preAnalysis?.reception?.number || 'X'
  const policeData = analysis.preAnalysis?.reception?.police || {}
  const ord = analysis.preAnalysis?.reception?.of_number || 'X'
  const institutionData = policeData.institutionType || {}
  const commune = institutionData.commune?.name || 'COMUNA'
  const partNumber = analysis.preAnalysis?.reception?.part_number || '0'

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  // Calcular posición para alinear a la derecha (cuadro ANT)
  const rightBoxX = pageWidth - margin - 80

  doc.text('ANT.:', rightBoxX, yPos)
  doc.text(`Acta de Recepción Nº`, rightBoxX + 10, yPos)
  doc.text(actaNumber.toString(), pageWidth - margin - 15, yPos, { align: 'right' })

  yPos += 6
  doc.text('Ordinario Nº', rightBoxX + 10, yPos)
  doc.text(ord.toString(), pageWidth - margin - 5, yPos, { align: 'right' })

  yPos += 6
  doc.text(institutionData.name, rightBoxX + 10, yPos)
  doc.text(commune, pageWidth - margin - 5, yPos, { align: 'right' })

  yPos += 6
  doc.text('Parte / Inf. Policial', rightBoxX + 10, yPos)
  doc.text(partNumber.toString(), pageWidth - margin - 5, yPos, { align: 'right' })

  yPos += 10
  doc.text('MAT.:', rightBoxX - 5, yPos)
  doc.text('Informa resultado de análisis', rightBoxX + 10, yPos)

  yPos += 10
  const dateText = `DÍA-MES-AÑO`
  doc.text(`Punta Arenas,`, pageWidth - margin - 60, yPos)
  doc.text(dateText, pageWidth - margin - 5, yPos, { align: 'right' })

  yPos += 20

  // DE: / A:
  doc.setFont('helvetica', 'bold')
  doc.text('DE:', margin, yPos)
  doc.text('DIRECTOR SERVICIO SALUD MAGALLANES', margin + 15, yPos)

  yPos += 8
  doc.text('A:', margin, yPos)
  doc.text('FISCALÍA LOCAL', margin + 15, yPos)

  yPos += 5
  doc.text('PRESENTE', margin + 15, yPos)

  yPos += 15

  // Párrafo principal
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const mainText = `Junto con saludar, y en relación con documento Acta de Recepción N°${actaNumber} se informa que las siguientes muestras fueron remitidas al I.S.P. para su correspondiente análisis mediante Reservado Nº ${reservedISPForFiscalia ? reservedISPForFiscalia.number : 'X'}     , quienes enviarán los resultados directamente a: FISCALÍA LOCAL`
  const mainLines = doc.splitTextToSize(mainText, pageWidth - margin * 2 - 20)
  doc.text(mainLines, margin + 15, yPos)
  yPos += mainLines.length * 6

  yPos += 10

  // MUESTRAS - iterar sobre los análisis cargados
  if (analyses.length > 0) {
    analyses.forEach((analysisItem, index) => {
      console.log(analysisItem) // Verificar si hay espacio suficiente para la muestra y el pie de firma (necesitamos ~80px)
      if (yPos > pageHeight - 90) {
        doc.addPage()
        yPos = 20
      }

      doc.setFont('helvetica', 'bold')
      const substanceName =
        analysisItem.analysis?.preAnalysis?.substance?.substanceType?.name || 'N/A'
      const weight = analysisItem.analysis?.preAnalysis?.weight_sampled || 0
      doc.text(`MUESTRA N° ${index + 1}: `, margin + 30, yPos)

      doc.setFont('helvetica', 'normal')
      doc.text(`${weight} gr - ${substanceName}`, margin + 60, yPos)
      yPos += 8
    })
  } else {
    // Fallback si no hay análisis cargados
    doc.setFont('helvetica', 'bold')
    doc.text('MUESTRA N° 1: ', margin + 30, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text('CANTIDAD NETA Y DESCRIPCIÓN MUESTRA', margin + 60, yPos)
    yPos += 8
  }

  yPos += 10

  // Verificar espacio antes del saludo final
  if (yPos > pageHeight - 90) {
    doc.addPage()
    yPos = 20
  }

  // Saludo final
  doc.text('Se despide atentamente a usted,', margin + 30, yPos)

  // PIE DE PÁGINA - FIRMA
  yPos = pageHeight - 60
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('DIRECTOR', pageWidth / 2, yPos, { align: 'center' })
  yPos += 5
  doc.text('SERVICIO DE SALUD MAGALLANES', pageWidth / 2, yPos, { align: 'center' })

  yPos += 15
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('DISTRIBUCIÓN.:', margin, yPos)
  yPos += 4
  doc.setFont('helvetica', 'bold')
  doc.text('DSSM', margin, yPos)

  // Línea decorativa azul y roja
  doc.setLineWidth(2)
  // Línea azul
  doc.setDrawColor(0, 0, 255)
  doc.line(margin, yPos + 2, margin + 10, yPos + 2)
  // Línea roja
  doc.setDrawColor(255, 0, 0)
  doc.line(margin + 10, yPos + 2, margin + 30, yPos + 2)

  // Footer final
  yPos = pageHeight - 10
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const footerText =
    'Lautaro Navarro N° 525 - Casilla N° 527 - Fono 61 2294000 - E-mail: direccion.ssm@redsalud.gob.cl - PUNTA ARENAS'
  doc.text(footerText, pageWidth / 2, yPos, { align: 'center' })

  // Generar y descargar PDF
  const fileName = `Reservado_Fiscalia_Acta_${actaNumber}_Analisis_${analysis.id}_${Date.now()}.pdf`

  if (draft) addDraftWatermark(doc)

  if (preview) {
    openPdfPreview(doc, previewWindow)
    return
  }

  doc.save(fileName, { compress: true })
}
