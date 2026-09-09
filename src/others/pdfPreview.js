export const addDraftWatermark = (doc) => {
  const totalPages = doc.getNumberOfPages()

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page)
    doc.saveGraphicsState()
    doc.setGState(new doc.GState({ opacity: 0.14 }))
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(64)
    doc.setTextColor(180, 0, 0)
    doc.text(
      'BORRADOR',
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() / 2,
      { align: 'center', angle: 45 },
    )
    doc.restoreGraphicsState()
  }
}

export const openPdfPreview = (doc, previewWindow = null) => {
  const targetWindow = previewWindow || window.open('', '_blank')

  if (!targetWindow) throw new Error('El navegador bloqueó la pestaña de previsualización')

  targetWindow.location.href = doc.output('bloburl')
}

export const parsePdfDate = (value) => {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  const ddmmyyyyMatch = String(value).match(/^(\d{2})-(\d{2})-(\d{4})$/)
  const date = ddmmyyyyMatch
    ? new Date(
        Number(ddmmyyyyMatch[3]),
        Number(ddmmyyyyMatch[2]) - 1,
        Number(ddmmyyyyMatch[1]),
      )
    : new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}
