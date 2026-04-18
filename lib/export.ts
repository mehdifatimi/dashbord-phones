/**
 * Shared export utilities — CSV & PDF (print)
 * Usage:
 *   exportCSV(rows, columns, "sales_history")
 *   exportPrintPDF("section-id", "Rapport Historique")
 */

export interface ExportColumn<T> {
  label: string
  value: (row: T) => string | number
}

/** Download any array of objects as a UTF-8 CSV file */
export function exportCSV<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  if (!data.length) return
  const BOM = "\uFEFF" // UTF-8 BOM for Excel
  const header = columns.map((c) => `"${c.label}"`).join(",")
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const val = String(c.value(row)).replace(/"/g, '""')
        return `"${val}"`
      })
      .join(",")
  )
  const csv = BOM + [header, ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Open browser print dialog for a specific DOM element */
export function exportPrintPDF(
  contentId: string,
  title: string = "Rapport"
): void {
  const el = document.getElementById(contentId)
  if (!el) return

  const original = document.title
  document.title = title

  const printWindow = window.open("", "_blank", "width=900,height=700")
  if (!printWindow) return

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>${title}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; padding: 24px; }
        h1 { font-size: 22px; font-weight: 900; color: #1e1b4b; margin-bottom: 4px; }
        p.subtitle { font-size: 12px; color: #64748b; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        thead { background: #1e1b4b; color: #fff; }
        thead th { padding: 10px 12px; text-align: left; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        tbody tr:nth-child(odd) { background: #fff; }
        tbody td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; }
        .footer { margin-top: 24px; font-size: 10px; color: #94a3b8; text-align: right; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="subtitle">Exporté le ${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })} — Phone Shop</p>
      ${el.innerHTML}
      <div class="footer">Phone Shop Dashboard &mdash; Rapport généré automatiquement</div>
    </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    document.title = original
  }, 600)
}
