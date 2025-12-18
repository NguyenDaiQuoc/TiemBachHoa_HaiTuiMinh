/**
 * Export utilities for Excel and PDF
 * Using SheetJS for Excel and html2pdf for PDF
 */

export const exportToExcel = async (data: any[], filename: string) => {
  // Dynamically import SheetJS
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPDF = async (
  data: any[],
  filename: string,
  columns: string[],
  title?: string
) => {
  // Dynamically import jsPDF and html2canvas
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF();
  
  // Add title if provided
  if (title) {
    doc.setFontSize(16);
    doc.text(title, 14, 15);
  }

  // Prepare table data
  const tableData = data.map((row) =>
    columns.map((col) => {
      const val = row[col];
      if (typeof val === 'number') return val.toLocaleString('vi-VN');
      return val || '';
    })
  );

  // Add table
  autoTable(doc, {
    head: [columns],
    body: tableData,
    startY: title ? 25 : 10,
    margin: { top: 10 },
    styles: {
      fontSize: 10,
      cellPadding: 3,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
    },
  });

  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(
      `Trang ${i}/${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`${filename}.pdf`);
};

export const exportToCSV = (data: any[], filename: string, columns?: string[]) => {
  const keys = columns || (data.length > 0 ? Object.keys(data[0]) : []);
  const header = keys.join(',');
  const rows = data.map((row) =>
    keys
      .map((key) => {
        const val = row[key] || '';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(',')
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
