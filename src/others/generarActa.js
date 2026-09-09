import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import usersService from '@/services/usersService'

const addDraftWatermark = (doc) => {
  const totalPages = doc.getNumberOfPages()

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page)
    doc.saveGraphicsState()
    doc.setGState(new doc.GState({ opacity: 0.14 }))
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(54)
    doc.setTextColor(180, 0, 0)
    doc.text('BORRADOR', 105, 148, { align: 'center', angle: 45 })
    doc.restoreGraphicsState()
  }
}

export const generarActaPDF = async (form) => {
  const draftPreviewWindow = form.state === 'BORRADOR' ? window.open('', '_blank') : null

  if (form.state === 'BORRADOR' && !draftPreviewWindow) {
    throw new Error('El navegador bloqueó la pestaña de vista previa')
  }

  const userDestinationId = form.user_destination?.id

  if (!userDestinationId) {
    throw new Error('No se encontró el ID del usuario que recibe')
  }

  const { data: userDestination } = await usersService.getById(userDestinationId)
  const userDestinationName =
    userDestination.username ||
    [userDestination.firstName, userDestination.firstLastName, userDestination.secondLastName]
      .filter(Boolean)
      .join(' ') ||
    '—'
  const userDestinationRut = userDestination.rut || '—'

  const doc = new jsPDF('p', 'mm', 'a4')

  // === Encabezado ===
  const logo = new Image()
  logo.src = '/ssm/logo-ssm.png' // Ruta pública
  doc.addImage(logo, 'JPEG', 15, 10, 25, 25, undefined, 'FAST')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('ACTA DE RECEPCIÓN N°', 70, 20)
  doc.text(`${form.number}`, 130, 20)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text('Punta Arenas,', 130, 28)
  doc.text(
    new Date(form.date_reception).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    155,
    28,
  )

  doc.setFontSize(10)
  doc.text(
    `El Servicio de Salud Magallanes, en conformidad al Artículo N° 41 y 43 de la ley 20.000, recepciona`,
    15,
    45,
  )
  doc.text(
    `Ord N° ${form.of_number} con fecha ${new Date(form.of_number_date).toLocaleDateString(
      'es-CL',
    )} - ${form.police.institutionType.name.toUpperCase()} ${form.police.institution.name.toUpperCase()} - ${
      form.police.institutionType.commune.name
    }`,
    15,
    51,
  )

  // === Tabla de Sustancias ===
  const substances = form.substances || []
  const hasUnitQuantity = substances.some((s) => {
    const quantity = s.unit_quantity ?? s.unity_quantity
    return quantity !== null && quantity !== undefined && quantity !== ''
  })

  const columns = [
    { header: 'Muestra Nº', dataKey: 'n' },
    { header: 'Presunto', dataKey: 'presunto' },
    { header: 'NUE', dataKey: 'nue' },
    { header: 'Unidad de Medición', dataKey: 'measurement_type' },
    ...(hasUnitQuantity ? [{ header: 'Cantidad (Unidad)', dataKey: 'cantidad' }] : []),
    { header: 'Peso Bruto', dataKey: 'peso' },
    { header: 'Peso Neto', dataKey: 'peso_neto' },
    { header: 'Descripción muestra', dataKey: 'descripcion' },
  ]
  console.log(substances)

  const data = substances.map((s) => ({
    n: s.nsubstance || '—',
    presunto: s.substanceTypeName || '—',
    nue: s.nue || '—',
    measurement_type:
      s.measurement_type ||
      (String(s.unity || '')
        .toUpperCase()
        .includes('UNIDAD') ||
      String(s.unity || '')
        .toUpperCase()
        .includes('PAQUETE')
        ? 'UNIDAD'
        : 'PESO'),
    cantidad: s.unit_quantity ?? s.unity_quantity ?? '—',
    peso: s.weight ? Number(s.weight).toFixed(2) : '—',
    peso_neto: s.weight_net ? Number(s.weight_net).toFixed(2) : '—',
    descripcion: s.description || '—',
  }))

  autoTable(doc, {
    head: [columns.map((c) => c.header)],
    body: data.map((d) => columns.map((column) => d[column.dataKey])),
    startY: 60,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.3,
      lineColor: [100, 100, 100],
    },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
  })

  let y = doc.lastAutoTable.finalY + 15

  // === Firmas ===
  doc.setFontSize(10)
  doc.text('Funcionario que entrega', 20, y)
  doc.text('Funcionario que recibe', 130, y)

  y += 6
  doc.setFont('helvetica', 'normal')
  doc.text(`${form.police.firstName} ${form.police.firstLastName}`, 20, y)
  doc.text(userDestinationName, 130, y)

  y += 5
  doc.text(`RUT: ${form.police.rut}`, 20, y)
  doc.text(`RUT: ${userDestinationRut}`, 130, y)

  y += 5
  doc.text(`${form.police.grade.name || '-'}`, 20, y)
  doc.text('Servicio de Salud Magallanes', 130, y)

  y += 5
  doc.text(`${form.police.institutionType.name || '-'}`, 20, y)
  doc.text(`${form.police.institution.name || '-'}`, 20, y + 5)
  doc.text(`${form.police.institutionType.commune.name || '-'}`, 20, y + 10)

  if (form.state === 'BORRADOR') addDraftWatermark(doc)

  if (form.state === 'BORRADOR') {
    draftPreviewWindow.location.href = doc.output('bloburl')
    return
  }

  // === Guardar archivo definitivo ===
  const filename = `Acta_Recepcion_${form.number}.pdf`
  doc.save(filename, { compress: true })
}
