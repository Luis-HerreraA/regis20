import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { addDraftWatermark, openPdfPreview } from '@/others/pdfPreview.js'

/**
 * Genera un informe consolidado con múltiples análisis del mismo acta
 * @param {Array} analyses - Array de análisis seleccionados
 * @param {number|string} reservedNumber - Número reservado del informe
 * @param {Object} options - Opciones de salida
 * @param {boolean} options.preview - Abre el PDF en una pestaña en vez de descargarlo
 * @param {boolean} options.draft - Agrega la marca de agua de borrador
 */
export const generarInformeConsolidadoPDF = (
  analyses,
  reservedNumber,
  { preview = false, draft = false } = {},
) => {
  if (!analyses || analyses.length === 0) {
    console.error('No hay análisis para generar el informe')
    return
  }

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20

  // Cargar y agregar logo optimizado
  const logo = new Image()
  logo.src = '/ssm/logo-ssm.png' // Ruta pública
  doc.addImage(logo, 'JPEG', 15, 10, 20, 20, undefined, 'FAST')

  // ENCABEZADO
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('RESERVADO.:', pageWidth - margin - 50, 35, { align: 'right' })
  doc.text(String(reservedNumber || '—'), pageWidth - margin, 35, { align: 'right' })

  let yPos = 45

  // Información del acta (del primer análisis ya que todos son del mismo acta)
  const firstAnalysis = analyses[0]
  const actaNumber = firstAnalysis.preAnalysis?.reception?.number || 'N/A'
  const policeData = firstAnalysis.preAnalysis?.reception?.police || {}
  const ord = firstAnalysis.preAnalysis?.reception?.of_number || {}
  const institutionData = policeData.institutionType || {}
  const commune = institutionData.commune?.name || '—'

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  // Calcular posición para alinear a la derecha (cuadro ANT)
  const rightBoxX = pageWidth - margin - 80

  doc.text('ANT.:', rightBoxX, yPos)
  doc.text(`Acta de Recepción Nº`, rightBoxX + 10, yPos)
  doc.text(actaNumber.toString(), pageWidth - margin - 5, yPos, { align: 'right' })

  yPos += 6
  doc.text('Ordinario Nº', rightBoxX + 10, yPos)
  const policeName = ` ${policeData.institutionType.name || ''}`.trim() || '—'
  doc.text(ord, pageWidth - margin - 5, yPos, { align: 'right' })

  yPos += 6
  doc.text(policeName, rightBoxX + 10, yPos)
  doc.text(commune, pageWidth - margin - 5, yPos, { align: 'right' })

  yPos += 6
  const institution = 'Parte / Inf. Policial'
  doc.text(institution, rightBoxX + 10, yPos)
  doc.text('0', pageWidth - margin - 5, yPos, { align: 'right' })

  yPos += 10
  doc.text('MAT.', rightBoxX, yPos)
  doc.text('Informa resultado de análisis', rightBoxX + 10, yPos)

  yPos += 10
  const today = new Date().toLocaleDateString('es-CL')
  doc.text(`Punta Arenas,`, pageWidth - margin - 60, yPos)
  doc.text(today, pageWidth - margin - 5, yPos, { align: 'right' })

  yPos += 15

  // DE: / A:
  doc.setFont('helvetica', 'bold')
  doc.text('DE:', margin, yPos)
  doc.setFont('helvetica', 'bold')
  doc.text('DIRECTOR SERVICIO SALUD MAGALLANES', margin + 15, yPos)

  yPos += 8
  doc.setFont('helvetica', 'bold')
  doc.text('A:', margin, yPos)
  doc.setFont('helvetica', 'bold')
  doc.text('FISCALÍA LOCAL', margin + 15, yPos)
  yPos += 5
  doc.text('PRESENTE', margin + 15, yPos)

  yPos += 12

  // Párrafo principal
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  const mainText = `De acuerdo a documento del antecedente, adjunto remito a Ud., copia de los siguientes protocolos de análisis y su respectivo resultado`
  const mainLines = doc.splitTextToSize(mainText, pageWidth - margin * 2)
  doc.text(mainLines, margin, yPos)
  yPos += mainLines.length * 5

  yPos += 3
  const secondText = `Se remite copia de los documentos del antecedente, e informe sobre la acción de la Cannabis en el organismo, emitido por el Instituto de Salud Pública de Chile.`
  const secondLines = doc.splitTextToSize(secondText, pageWidth - margin * 2)
  doc.text(secondLines, margin, yPos)
  yPos += secondLines.length * 5

  yPos += 10

  // TABLA DE ANÁLISIS
  const tableData = analyses.map((analysis) => {
    const protocolNumber = analysis.id || 'N/A'
    const sampleNumber = analysis.preAnalysis?.substance?.nue || 'N/A'
    const result = analysis.result || 'N/A'
    return [protocolNumber.toString(), sampleNumber.toString(), result]
  })

  autoTable(doc, {
    startY: yPos,
    head: [['PROTOCOLO Nº', 'MUESTRA N', 'RESULTADO']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      halign: 'center',
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
      0: { halign: 'center' },
      1: { halign: 'center' },
      2: { halign: 'center' },
    },
    margin: { left: margin + 20, right: margin + 20 },
  })

  yPos = doc.lastAutoTable.finalY + 10

  // Saludo final
  doc.text('Saluda atentantamente a usted,', margin + 10, yPos)

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

  // Línea decorativa roja y azul
  doc.setLineWidth(2)
  // Línea roja
  doc.setDrawColor(0, 0, 255)
  doc.line(margin, yPos + 2, margin + 10, yPos + 2)
  // Línea azul
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

  if (draft) addDraftWatermark(doc)

  if (preview) {
    openPdfPreview(doc)
    return
  }

  // Generar y descargar PDF con compresión
  const fileName = `Informe_Consolidado_Acta_${actaNumber}_${Date.now()}.pdf`
  doc.save(fileName, { compress: true })
}
