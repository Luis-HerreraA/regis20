import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { addDraftWatermark, openPdfPreview } from '@/others/pdfPreview.js'

/**
 * Genera el reporte de microanálisis (microscopía) en PDF
 * @param {Object} analysis - Datos del análisis completo con información de micro
 */
export const generarReporteMicroanalisisPDF = (
  analysis,
  micro,
  { preview = false, draft = false, previewWindow = null } = {},
) => {
  console.log(analysis)
  console.log(micro)
  if (!analysis.micro && !draft) {
    console.error('No hay datos de microanálisis para generar el reporte')
    return
  }

  const microRecord =
    micro?.data?.content?.[0] || micro?.data?.[0] || micro?.content?.[0] || micro?.[0] || micro

  if (!microRecord) {
    console.error('No hay detalle de microanálisis para generar el reporte')
    return
  }

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20

  // Cargar y agregar logo optimizado
  const logo = new Image()
  logo.src = '/ssm/logo-ssm.png'
  // Reducir calidad de imagen para optimizar tamaño
  doc.addImage(logo, 'JPEG', margin, 10, 20, 20, undefined, 'FAST')

  // TÍTULO
  let yPos = 50
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Informe de Microscopía', pageWidth / 2, yPos, { align: 'center' })

  yPos += 5
  doc.setFontSize(12)
  doc.text('Cannabis Sativa', pageWidth / 2, yPos, { align: 'center' })

  // Línea separadora
  yPos += 5
  doc.setLineWidth(0.5)
  doc.line(margin, yPos, pageWidth - margin, yPos)

  yPos += 15

  // DATOS GENERALES - Tabla
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Datos Generales', margin, yPos)

  yPos += 5

  const actaNumber = analysis.preAnalysis?.reception?.number || 'N/A'
  const sampleNumber = analysis.preAnalysis?.substance?.nue || 'N/A'

  const datosGenerales = [
    ['Laboratorio:', 'Servicio de Salud Magallanes'],
    ['Analista:', microRecord.user?.username || 'N/A'],
    ['Fecha:', microRecord.date || 'N/A'],
    ['Número de Acta:', actaNumber],
    ['Número de Muestra:', microRecord.analysis?.preAnalysis?.substance?.nsubstance || 'N/A'],
  ]

  autoTable(doc, {
    startY: yPos,
    body: datosGenerales,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 80 },
    },
    margin: { left: 40, right: 40 },
  })

  yPos = doc.lastAutoTable.finalY + 10

  // PREPARACIÓN Y OBSERVACIÓN
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Preparación y Observación', margin, yPos)

  yPos += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  doc.text(
    `- Tipo de muestra: Sustancia vegetal ${microRecord.analysis?.gradeFrac || 'N/A'}`,
    margin,
    yPos,
  )
  yPos += 5
  doc.text(`- Tipo de observación: Directa en seco (sin medio de montaje)`, margin, yPos)
  yPos += 5
  doc.text(`- Aumento utilizado: ${microRecord.aumento || 'N/A'}`, margin, yPos)

  yPos += 10

  // ESTRUCTURAS OBSERVADAS - Tabla
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Estructuras Observadas', margin, yPos)

  yPos += 5

  const estructurasData = [
    ['Estructura', 'Observada'],
    ['Tricomas glandulares', microRecord.ttgland || 'N/A'],
    ['Tricomas no glandulares', microRecord.ttnogland || 'N/A'],
    ['Estomas', microRecord.stomas || 'N/A'],
    ['Células epidérmicas', microRecord.celepi || 'N/A'],
    //  ['Células con resina', micro.data[0].celresi || 'N/A'],
    //  ['Cristales (oxalato de calcio)', micro.data[0].cris || 'N/A'],
  ]

  autoTable(doc, {
    startY: yPos,
    head: [estructurasData[0]],
    body: estructurasData.slice(1),
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      halign: 'left',
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.3,
      lineColor: [100, 100, 100],
    },
    bodyStyles: {
      lineWidth: 0.3,
      lineColor: [150, 150, 150],
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 'auto' },
    },
    margin: { left: margin, right: margin },
  })

  yPos = doc.lastAutoTable.finalY + 10

  // CONCLUSIÓN
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Conclusión', margin, yPos)

  yPos += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  const conclusion = microRecord.conclution || 'Sin conclusión registrada'
  const conclusionLines = doc.splitTextToSize(conclusion, pageWidth - margin * 2)
  doc.text(conclusionLines, pageWidth / 2, yPos, { align: 'center' })

  yPos += conclusionLines.length * 5 + 15

  // FIRMA DEL ANALISTA
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  // Línea para firma
  const signatureLineY = yPos + 10
  const signatureImage = new Image()
  signatureImage.src = '/firma/Jaime.jpg'
  doc.line(pageWidth / 2 - 40, signatureLineY, pageWidth / 2 + 40, signatureLineY)
  doc.addImage(signatureImage, 'JPEG', pageWidth / 2 - 28, signatureLineY - 20, 56, 16)

  yPos = signatureLineY + 5
  doc.text('Firma del analista:', pageWidth / 2, yPos, { align: 'center' })

  yPos += 10
  doc.setFont('helvetica', 'bold')
  doc.text(`Fecha: ${microRecord.date || 'N/A'}`, margin, yPos)

  // PIE DE PÁGINA
  yPos = pageHeight - 10
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const footerText =
    'Lautaro Navarro N° 525 - Casilla N° 527 - Fono 61 2294000 - E-mail: direccion.ssm@redsalud.gob.cl - PUNTA ARENAS'
  doc.text(footerText, pageWidth / 2, yPos, { align: 'center' })

  // Generar y descargar PDF con compresión
  const fileName = `Informe_Microscopia_Acta_${actaNumber}_Muestra_${sampleNumber}_${Date.now()}.pdf`

  if (draft) addDraftWatermark(doc)

  if (preview) {
    openPdfPreview(doc, previewWindow)
    return
  }

  doc.save(fileName, { compress: true })
}
