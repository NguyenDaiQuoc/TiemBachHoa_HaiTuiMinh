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
  // Prefer dynamic ESM import; if bundler still includes jsPDF, fall back to loading UMD from CDN
  const loadScript = (src: string) =>
    new Promise<void>((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(s);
    });

  let jsPDFCtor: any = null;
  let autoTable: any = null;

  try {
    const mod = await import('jspdf');
    jsPDFCtor = mod.jsPDF || mod.default || mod;
  } catch (e) {
    // Load UMD build from CDN
    await loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js');
    // UMD exposes `window.jspdf` with `jsPDF` constructor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    jsPDFCtor = (w.jspdf && w.jspdf.jsPDF) || w.jsPDF || null;
  }

  try {
    const at = await import('jspdf-autotable');
    autoTable = at.default || at;
  } catch (e) {
    // Load autotable UMD; this file registers itself against jspdf global
    await loadScript('https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.4/dist/jspdf.plugin.autotable.js');
    const w = window as any;
    autoTable = w.jspdfAutoTable || w.autotable || null;
  }

  if (!jsPDFCtor) throw new Error('Failed to load jsPDF');

  const doc = new jsPDFCtor();
  
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
