import PDFDocument from 'pdfkit'

function fmtMoney(v) {
  if (v === null || v === undefined || v === '') return '-'
  const n = Number(v)
  if (!Number.isFinite(n)) return String(v)
  return `$${n.toFixed(2)}`
}

function fmtPlain(v) {
  if (v === null || v === undefined || v === '') return '-'
  return String(v)
}

export function generateCashBatchPdf({
  title,
  submitter,
  submittedAt,
  values,
}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' })
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // Header stripe
    doc
      .rect(0, 0, doc.page.width, 6)
      .fill('#6366f1')
    doc.fillColor('#000')

    // Title
    doc
      .moveDown(1)
      .font('Helvetica-Bold')
      .fontSize(22)
      .text(title, { align: 'center' })

    doc
      .moveDown(0.25)
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#666')
      .text(`Generated ${submittedAt}`, { align: 'center' })

    doc.moveDown(1.5).fillColor('#000')

    // Submitter card
    const startX = 50
    const cardY = doc.y
    const cardWidth = doc.page.width - 100
    doc
      .roundedRect(startX, cardY, cardWidth, 60, 6)
      .fillAndStroke('#f8fafc', '#e2e8f0')
    doc
      .fillColor('#475569')
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('Submitted by', startX + 14, cardY + 10)
    doc
      .fillColor('#0f172a')
      .font('Helvetica')
      .fontSize(12)
      .text(
        `${submitter.name || '—'}  <${submitter.email}>`,
        startX + 14,
        cardY + 25
      )
    if (values.date) {
      doc
        .fillColor('#475569')
        .fontSize(10)
        .text(`Report date: ${values.date}`, startX + 14, cardY + 43)
    }
    doc.y = cardY + 72
    doc.fillColor('#000')

    // Amount rows
    const rows = [
      { label: 'Opening Cash', value: fmtMoney(values.opening_cash) },
      {
        label: 'Total Cash Received',
        value: fmtMoney(values.total_cash_received),
      },
      {
        label: 'Total Check Received',
        value: fmtMoney(values.total_check_received),
      },
      {
        label: 'Total (Cash + Check)',
        value: fmtMoney(values.total),
        bold: true,
      },
      {
        label: 'Closing Balance in Till',
        value: fmtMoney(values.closing_balance),
        bold: true,
      },
      { label: 'EXT NO', value: fmtPlain(values.ext_no) },
    ]

    const colLabelX = startX
    const colValueX = startX + cardWidth - 160
    const rowHeight = 28
    rows.forEach((r, i) => {
      const y = doc.y
      if (i % 2 === 0) {
        doc
          .rect(startX, y - 4, cardWidth, rowHeight)
          .fill('#f8fafc')
        doc.fillColor('#000')
      }
      doc
        .fillColor('#475569')
        .font('Helvetica')
        .fontSize(11)
        .text(r.label, colLabelX + 10, y + 4, {
          width: colValueX - colLabelX - 20,
        })
      doc
        .fillColor(r.bold ? '#4338ca' : '#0f172a')
        .font(r.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(12)
        .text(r.value, colValueX, y + 4, {
          width: 160,
          align: 'right',
        })
      doc.y = y + rowHeight
    })

    // Remarks
    if (values.remarks) {
      doc
        .moveDown(1.2)
        .fillColor('#475569')
        .font('Helvetica-Bold')
        .fontSize(11)
        .text('Remarks', startX, doc.y)
      doc
        .fillColor('#0f172a')
        .font('Helvetica')
        .fontSize(11)
        .text(values.remarks, startX, doc.y + 4, {
          width: cardWidth,
        })
    }

    doc.end()
  })
}
