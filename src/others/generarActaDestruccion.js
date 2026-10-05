import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

  return `${Number(detail?.weight || 0).toFixed(2)} g`
}

export const generarActaDestruccionPDF = (destructionHeader, destructionDetails) => {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15

  // === Encabezado con logo ===
  const logo = new Image()
  logo.src = '/ssm/logo-ssm.png'
  doc.addImage(logo, 'JPEG', margin, 10, 25, 25, undefined, 'FAST')

  // Título principal
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  const title = `ACTA DE DESTRUCCIÓN N° ${destructionHeader.act_number || 'XXX/25'}`
  const titleWidth = doc.getTextWidth(title)
  doc.text(title, (pageWidth - titleWidth) / 2, 20)

  // Fecha y lugar
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  const fecha = destructionHeader.date_destruction
    ? new Date(destructionHeader.date_destruction).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })

  const locationText = `En Punta Arenas, a XX de XXXX de 202X.`
  doc.text(locationText, margin, 40)

  // Texto introductorio
  doc.setFontSize(10)
  let yPos = 45

  const introText = `Teniendo presente lo dispuesto en la ley 20.000, en presencia de los funcionarios que más adelante se identifican, se procede a la destrucción de:`
  const introLines = doc.splitTextToSize(introText, pageWidth - margin * 2)
  doc.text(introLines, margin, yPos)
  yPos += introLines.length * 5 + 5

  // Crear tabla con las muestras destruidas
  const tableData = (destructionDetails || []).map((detail, index) => [
    index + 1,
    detail.substance?.reception?.number || '—',
    detail.substance?.nue || '—',
    detail.substance?.substanceType?.name || '—',
    formatDetailAmount(detail),
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['N°', 'N° Acta', 'NUE', 'Sustancia', 'Cantidad']],
    body: tableData,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.3,
      lineColor: [100, 100, 100],
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
  })

  yPos = doc.lastAutoTable.finalY + 10

  // Método de destrucción
  const metodo = destructionHeader.methodDestruction?.name || 'Incineración'
  doc.setFont('helvetica', 'bold')
  doc.text('MÉTODO DE DESTRUCCIÓN DE LA SUSTANCIA:', margin, yPos)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 0, 0) // Rojo
  doc.text(metodo, margin + 95, yPos)
  doc.setTextColor(0, 0, 0) // Volver a negro
  yPos += 10

  // Texto de proceso
  const procesoText = `Proceso en presencia de policía local, tal cual se realiza con todas las muestras a destrucción.`
  const procesoLines = doc.splitTextToSize(procesoText, pageWidth - margin * 2)
  doc.text(procesoLines, margin, yPos)
  yPos += procesoLines.length * 5 + 5

  // Texto de envío a fiscalía
  doc.text('Copia de esta Acta se envía a Fiscalía correspondiente.', margin, yPos)
  yPos += 15

  // Sección de firmas
  doc.setFont('helvetica', 'bold')
  doc.text(
    'PARA CONSTANCIA FIRMAN',
    (pageWidth - doc.getTextWidth('PARA CONSTANCIA FIRMAN')) / 2,
    yPos,
  )
  yPos += 20

  // Firmas en dos columnas
  const col1X = margin + 20
  const col2X = pageWidth / 2 + 10

  // Químico Farmacéutico
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('QUÍMICO FARMACÉUTICO', col1X, yPos)
  doc.text('SERVICIO SALUD MAGALLANES', col1X, yPos + 5)

  // Ministro de Fe
  doc.text('MINISTRO DE FE', col2X, yPos)
  doc.text('SERVICIO SALUD MAGALLANES', col2X, yPos + 5)

  yPos += 40

  // Asesor Jurídico
  doc.text('ASESOR JURÍDICO', col1X, yPos)
  doc.text('SERVICIO SALUD MAGALLANES', col1X, yPos + 5)

  yPos += 15

  // Asistencia médico de coordinación
  doc.setFontSize(8)
  const asistenciaText = 'ASISTENCIA MÉDICO DE COORDINACIÓN, XXS (XX/XX)'
  doc.text(asistenciaText, (pageWidth - doc.getTextWidth(asistenciaText)) / 2, yPos)

  // Guardar PDF
  const filename = `Acta_Destruccion_${destructionHeader.act_number || 'XXX'}.pdf`
  doc.save(filename, { compress: true })
}
