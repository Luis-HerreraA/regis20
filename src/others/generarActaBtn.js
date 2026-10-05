import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatRut } from '@/others/verificationRut'

const addDraftWatermark = (doc) => {
  const totalPages = doc.getNumberOfPages()

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page)
    doc.saveGraphicsState()
    doc.setGState(new doc.GState({ opacity: 0.14 }))
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(80)
    doc.setTextColor(180, 0, 0)
    doc.text('BORRADOR', 125, 160, { align: 'center', angle: 45 })
    doc.restoreGraphicsState()
  }
}

export const generarActaPDF = (form, substances, draftPreviewWindow = null) => {
  const [day, month, year] = form.date_reception.split('-')
  const [ofday, ofmonth, ofyear] = form.of_number_date.split('-')

  const fecha = new Date(year, month - 1, day).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const fecha2 = new Date(ofyear, ofmonth - 1, ofday).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  console.log(fecha) // "22 de febrero de 2026"
  console.log(fecha2) // "22 de febrero de 2026"
  const doc = new jsPDF('p', 'mm', 'a4')
  const policeName =
    `${form.police?.firstName || ''} ${form.police?.firstLastName || ''}`.trim() || '—'
  const policeRut = formatRut(form.police?.rut) || '—'
  const policeGrade = form.police?.grade?.name || '—'
  const policeInstitution = form.police?.institutionType?.institution?.name || '—'
  const policeCommune = form.police?.institutionType?.commune?.name || '—'
  const policeInstitutionType = form.police?.institutionType?.name || '—'
  // === Encabezado ===
  const logo = new Image()
  logo.src = '/ssm/logo-ssm.png'

  doc.addImage(logo, 'JPEG', 15, 10, 25, 25, undefined, 'FAST')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('ACTA DE RECEPCIÓN N°', 70, 20)
  doc.text(`${form.number}`, 130, 20)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text('Punta Arenas,', 130, 28)
  doc.text(fecha, 155, 28)

  doc.setFontSize(10)
  doc.text(
    `El Servicio de Salud Magallanes, en conformidad al Artículo N° 41 y 43 de la ley 20.000, recepciona`,
    15,
    45,
  )
  doc.text(
    `Ord N° ${form.of_number} con fecha ${fecha2} - ${(form.police?.institutionType?.name || '').toUpperCase()} ${(form.police?.institutionType?.institution?.name || '').toUpperCase()} - ${
      form.police?.institutionType?.commune?.name || '—'
    }`,
    15,
    51,
  )

  // === Tabla de Sustancias ===
  const receptionSubstances = substances || []
  const hasUnitQuantity = receptionSubstances.some((s) => {
    const quantity = s.unit_quantity ?? s.unity_quantity
    return quantity !== null && quantity !== undefined && quantity !== ''
  })

  const columns = [
    { header: 'Sustancia Nº', dataKey: 'n' },
    { header: 'Presunto', dataKey: 'presunto' },
    { header: 'NUE', dataKey: 'nue' },
    { header: 'Unidad de Medición', dataKey: 'measurement_type' },
    ...(hasUnitQuantity ? [{ header: 'Cantidad (Unidad)', dataKey: 'cantidad' }] : []),
    { header: 'Peso Bruto', dataKey: 'peso' },
    { header: 'Peso Neto', dataKey: 'peso_neto' },
    { header: 'Descripción muestra', dataKey: 'descripcion' },
  ]

  const data = receptionSubstances.map((s) => ({
    n: s.nsubstance || '—',
    presunto: s.substanceType?.name || s.substanceTypeName || '—',
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

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(`N° Informe Oficial: ${form.nparte || '—'}`, 195, 58, { align: 'right' })
  doc.setFont('helvetica', 'normal')

  autoTable(doc, {
    head: [columns.map((c) => c.header)],
    body: data.map((d) => columns.map((column) => d[column.dataKey])),
    startY: 63,
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
  doc.text(`${policeName}`, 20, y)
  doc.text(`${form.user_destination.username || ' '}`, 130, y)

  y += 5
  doc.text(`RUT: ${policeRut}`, 20, y)
  doc.text(`RUT: ${formatRut(form.user_destination?.rut) || '—'}`, 130, y)

  y += 5
  doc.text(`${policeGrade}`, 20, y)
  doc.text('Servicio de Salud Magallanes', 130, y)

  y += 5
  doc.text(`${policeInstitutionType}`, 20, y)
  doc.text(`${policeInstitution}`, 20, y + 5)
  doc.text(`${policeCommune}`, 20, y + 10)

  if (form.state === 'BORRADOR') addDraftWatermark(doc)

  if (form.state === 'BORRADOR') {
    const previewWindow = draftPreviewWindow || window.open('', '_blank')

    if (!previewWindow) throw new Error('El navegador bloqueó la pestaña de vista previa')

    previewWindow.location.href = doc.output('bloburl')
    return
  }

  // === Guardar archivo definitivo ===
  const filename = `Acta_Recepcion_${form.number}.pdf`
  doc.save(filename, { compress: true })
}
