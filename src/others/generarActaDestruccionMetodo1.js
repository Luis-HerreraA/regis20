import jsPDF from 'jspdf'
import { addDraftWatermark, openPdfPreview, parsePdfDate } from '@/others/pdfPreview.js'

/**
 * Genera el acta de destrucción para método 1 (Incineración)
 * @param {Object} destructionHeader - Header de destrucción con información completa
 */
export const generarActaDestruccionMetodo1PDF = async (
  destructionHeader,
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
  doc.addImage(logo, 'JPEG', 15, 10, 25, 25, undefined, 'FAST')

  let yPos = 50

  // TÍTULO
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(`ACTA N. ª ${destructionHeader.act_number || 'XX_(año)'}`, pageWidth / 2, yPos, {
    align: 'center',
  })

  yPos += 20

  // Fecha y lugar
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  const destructionDate = parsePdfDate(destructionHeader.date_destruction)
  const formattedDate = destructionDate
    ? `${destructionDate.getDate()} de ${destructionDate.toLocaleDateString('es-CL', { month: 'long' })} de ${destructionDate.getFullYear()}`
    : '(día) de (mes) de (año)'
  const fechaTexto = `En Punta Arenas, a ${formattedDate}.`
  doc.text(fechaTexto, margin, yPos)

  yPos += 15

  // Párrafo principal
  const parrafo1 = `Teniendo presente lo dispuesto en la ley 20.000 y colaboración entre el Servicio de Salud Magallanes y (empresa colaboradora), en presencia de los funcionarios que más abajo se indican, se procede a la destrucción de materia relacionada equivalente a:`
  const lineas1 = doc.splitTextToSize(parrafo1, pageWidth - margin * 2)
  doc.text(lineas1, margin, yPos)
  yPos += lineas1.length * 6 + 10

  // Cantidad
  doc.text(
    `Cantidad:                           ${destructionHeader.weight || 'XXX'} gr. (Considera envoltorios y bolsas de transporte)`,
    margin,
    yPos,
  )
  yPos += 15

  // Procedimiento Fecha
  doc.text(`Procedimiento Fecha: ${formattedDate}`, margin, yPos)
  yPos += 15

  // Método de destrucción
  doc.text(
    `MÉTODO DE DESTRUCCIÓN DE LA SUSTANCIA: ${destructionHeader.methodDestruction?.name || 'Incineración'}.`,
    margin,
    yPos,
  )
  yPos += 15

  // Rango de actas
  doc.text(`Actas destrucción: desde XXX – hasta XXX`, margin, yPos)
  yPos += 15

  // Entrega de copias
  doc.text(
    `Se entrega copia de acta a funcionarios presentes para fines pertinentes.`,
    margin,
    yPos,
  )
  yPos += 30

  // FIRMAS
  doc.setFont('helvetica', 'bold')
  doc.text('PARA CONSTANCIA FIRMAN', pageWidth / 2, yPos, { align: 'center' })
  yPos += 30

  // Líneas de firma
  const firmaY = yPos
  const firma1X = 50
  const firma2X = pageWidth - 80

  // Primera firma
  doc.line(firma1X - 20, firmaY, firma1X + 40, firmaY)
  doc.setFontSize(10)
  doc.text('SERVICIO SALUD MAGALLANES', firma1X + 10, firmaY + 10, { align: 'center' })

  // Segunda firma
  doc.line(firma2X - 20, firmaY, firma2X + 40, firmaY)
  doc.text('CARABINEROS DE CHILE', firma2X + 10, firmaY + 10, { align: 'center' })
  doc.text('PUNTA ARENAS', firma2X + 10, firmaY + 16, { align: 'center' })

  if (draft) addDraftWatermark(doc)

  if (preview) {
    openPdfPreview(doc, previewWindow)
    return
  }

  // Guardar PDF
  const fileName = `Acta_Destruccion_Metodo1_${destructionHeader.act_number}_${Date.now()}.pdf`
  doc.save(fileName, { compress: true })
}
