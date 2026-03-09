import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const generarActaPDF = (form, receptionResponse) => {
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
    )} - ${form.police.institution.name.toUpperCase()} - ${
      form.police.institutionType.commune.name
    }`,
    15,
    51,
  )

  // === Tabla de Sustancias ===
  const columns = [
    { header: 'Muestra Nº', dataKey: 'n' },
    { header: 'Presunto', dataKey: 'presunto' },
    { header: 'NUE', dataKey: 'nue' },
    { header: 'Tipo de Medición', dataKey: 'measurement_type' },
    { header: 'Cantidad', dataKey: 'cantidad' },
    { header: 'Peso Bruto', dataKey: 'peso' },
    { header: 'Peso Neto', dataKey: 'peso_neto' },
    { header: 'Descripción muestra', dataKey: 'descripcion' },
  ]
  console.log(form.substances)

  const data = form.substances.map((s, i) => ({
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
    body: data.map((d) => Object.values(d)),
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
  doc.text(`${form.user_destination.username || ' '}`, 130, y)

  y += 5
  doc.text(`RUT: ${form.police.rut}`, 20, y)
  doc.text(`RUT: ${form.user_destination.rut || ' '}`, 130, y)

  y += 5
  doc.text(`Grado: ${form.police.grade.name || '-'}`, 20, y)
  doc.text('Servicio de Salud Magallanes', 130, y)

  y += 5
  doc.text(`Unidad: ${form.police.institution.name || '-'}`, 20, y)
  doc.text(`Comuna: ${form.police.institutionType.commune.name || '-'}`, 20, y + 5)

  // === Guardar archivo ===
  const filename = `Acta_Recepcion_${form.number}.pdf`
  doc.save(filename, { compress: true })
}
