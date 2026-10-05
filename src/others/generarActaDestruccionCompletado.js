import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { addDraftWatermark, openPdfPreview, parsePdfDate } from '@/others/pdfPreview.js'

const isUnitMeasurement = (detail) => {
  const measurementType = String(
    detail?.measurement_type || detail?.substance?.measurement_type || '',
  ).toLowerCase()
  return measurementType.includes('unidad') || measurementType.includes('paquete')
}

const formatDetailAmount = (detail) => {
  if (isUnitMeasurement(detail)) {
    const amount = Number(detail?.unit_quantity ?? detail?.weight ?? 0)
    return `${Math.trunc(amount)} unidades`
  }

  return `${Number(detail?.weight || 0).toFixed(2)} gramos neto`
}

/**
 * Genera el acta de destrucción para estado COMPLETADO
 * @param {Object} destructionHeader - Header de destrucción con información completa
 * @param {Array} destructionDetails - Array de detalles de destrucción con sustancias
 */
export const generarActaDestruccionCompletadoPDF = async (
  destructionHeader,
  destructionDetails,
  { preview = false, draft = false, previewWindow = null } = {},
) => {
  if (!destructionHeader) {
    console.error('No hay datos de destrucción para generar el documento')
    return
  }

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20

  // Cargar y agregar logo
  const logo = new Image()
  logo.src = '/ssm/logo-ssm.png'
  doc.addImage(logo, 'JPEG', 15, 10, 30, 30, undefined, 'FAST')

  let yPos = 55

  // TÍTULO
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(
    `ACTA DE DESTRUCCIÓN Nº ${destructionHeader.act_number || '00/(año)'}`,
    pageWidth / 2,
    yPos,
    { align: 'center' },
  )

  yPos += 15

  // Fecha y lugar
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  const dateObj = parsePdfDate(destructionHeader.date_destruction)
  const fechaTexto = dateObj
    ? `En Punta Arenas, a ${dateObj.getDate()} de ${dateObj.toLocaleDateString('es-CL', { month: 'long' })} del ${dateObj.getFullYear()}.`
    : 'En Punta Arenas, a (día) de (mes) del (año).'
  doc.text(fechaTexto, margin, yPos)

  yPos += 12

  // Párrafo principal
  const parrafo1 = `Teniendo presente lo dispuesto en la ley 20.000, en presencia de los funcionarios que más abajo se indican, se procede a la destrucción de:`
  const lineas1 = doc.splitTextToSize(parrafo1, pageWidth - margin * 2)
  doc.text(lineas1, margin, yPos)
  yPos += lineas1.length * 6 + 10

  // Tabla de muestras
  if (destructionDetails && destructionDetails.length > 0) {
    const muestrasData = destructionDetails.map((detail, index) => [
      `MUESTRA Nº ${index + 1}.`,
      detail.substance?.substanceType?.name || '—',
      formatDetailAmount(detail),
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['', 'Nombre presunta sustancia', 'Cantidad']],
      body: muestrasData,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fontStyle: 'bold',
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
      },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold' },
        1: { cellWidth: 80 },
        2: { cellWidth: 'auto', halign: 'left' },
      },
      margin: { left: margin, right: margin },
    })

    yPos = doc.lastAutoTable.finalY + 10
  } else {
    doc.setFont('helvetica', 'bold')
    doc.text('MUESTRA Nº XX.', margin, yPos)
    yPos += 6
    doc.setFont('helvetica', 'normal')
    doc.text('Nombre presunta sustancia', margin + 10, yPos)
    doc.text(': _______________', margin + 60, yPos)
    yPos += 6
    doc.text('Cantidad', margin + 10, yPos)
    doc.text(': 0,00 gramos neto', margin + 60, yPos)
    yPos += 12
  }

  // Verificar espacio para el resto del contenido
  if (yPos > pageHeight - 120) {
    doc.addPage()
    yPos = 20
  }

  // Método de destrucción
  doc.setFont('helvetica', 'bold')
  doc.text(
    `MÉTODO DE DESTRUCCIÓN DE LA SUSTANCIA: ${destructionHeader.methodDestruction?.name || 'Incineración'}.`,
    margin,
    yPos,
  )
  yPos += 12

  doc.setFont('helvetica', 'normal')

  // Información de la primera sustancia para Ord. y Acta
  const firstDetail = destructionDetails?.[0]
  const ordNumber = firstDetail?.substance?.reception?.of_number || 'XX'
  const actaNumber = firstDetail?.substance?.reception?.number || 'XX'
  const policeUnit =
    firstDetail?.substance?.reception?.police?.institutionType?.name || 'Unidad Policial'
  const commune =
    firstDetail?.substance?.reception?.police?.institutionType?.commune?.name || 'ciudad'

  // Formatear fechas
  const ofNumberDate = firstDetail?.substance?.reception?.of_number_date
  const receptionDate = firstDetail?.substance?.reception?.date_reception

  const formatDate = (date) => {
    if (!date) return '(día) de (mes) de (año)'
    const d = new Date(date)
    const day = d.getDate()
    const month = d.toLocaleDateString('es-ES', { month: 'long' })
    const year = d.getFullYear()
    return `${day} de ${month} de ${year}`
  }

  const parrafo2 = `Ord. Nº ${ordNumber} de fecha ${formatDate(ofNumberDate)}, de ${policeUnit}, ${commune}), Acta de Recepción Nº ${actaNumber} de fecha ${formatDate(receptionDate)}, del Servicio de Salud Magallanes a la Fiscalía de Punta Arenas.`
  const lineas2 = doc.splitTextToSize(parrafo2, pageWidth - margin * 2)
  doc.text(lineas2, margin, yPos)
  yPos += lineas2.length * 6 + 8

  const parrafo3 = `Copia de esta Acta se envía a Fiscalía correspondiente.`
  doc.text(parrafo3, margin, yPos)
  yPos += 15

  // Verificar espacio para firmas (más restrictivo para mantener todo junto)
  if (yPos > pageHeight - 80) {
    doc.addPage()
    yPos = 20
  }

  // FIRMAS
  doc.setFont('helvetica', 'bold')
  doc.text('PARA CONSTANCIA FIRMAN', pageWidth / 2, yPos, { align: 'center' })
  yPos += 25

  // Primera fila de firmas
  const firma1X = 50
  const firma2X = pageWidth - 80

  // Químico Farmacéutico
  doc.line(firma1X - 25, yPos, firma1X + 35, yPos)
  doc.setFontSize(9)
  doc.text('QUÍMICO FARMACÉUTICO', firma1X + 5, yPos + 6, { align: 'center' })
  doc.text('SERVICIO SALUD MAGALLANES', firma1X + 5, yPos + 11, { align: 'center' })

  // Ministro de Fe
  doc.line(firma2X - 25, yPos, firma2X + 35, yPos)
  doc.text('MINISTRO DE FE', firma2X + 5, yPos + 6, { align: 'center' })
  doc.text('SERVICIO SALUD MAGALLANES', firma2X + 5, yPos + 11, { align: 'center' })

  yPos += 35

  // Segunda fila - Asesor Jurídico (centrado)
  const firmaJuridicoX = pageWidth / 2
  doc.line(firmaJuridicoX - 30, yPos, firmaJuridicoX + 30, yPos)
  doc.text('ASESOR JURÍDICO', firmaJuridicoX, yPos + 6, { align: 'center' })
  doc.text('SERVICIO SALUD MAGALLANES', firmaJuridicoX, yPos + 11, { align: 'center' })

  yPos += 20

  // Asistencia medios de comunicación
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('ASISTENCIA MEDIOS DE COMUNICACIÓN: (SI/NO)', margin, yPos)

  if (draft) addDraftWatermark(doc)

  if (preview) {
    openPdfPreview(doc, previewWindow)
    return
  }

  // Guardar PDF
  const fileName = `Acta_Destruccion_${destructionHeader.act_number}_${Date.now()}.pdf`
  doc.save(fileName, { compress: true })
}
