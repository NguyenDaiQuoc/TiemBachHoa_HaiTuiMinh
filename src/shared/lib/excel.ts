const escapeCell = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const downloadExcelTable = (filename: string, sheetName: string, rows: string[][]) => {
  const tableRows = rows
    .map(
      (row, rowIndex) =>
        `<tr>${row
          .map((cell) => `<${rowIndex === 0 ? 'th' : 'td'} style="border:1px solid #d4d4d8;padding:8px;">${escapeCell(cell)}</${rowIndex === 0 ? 'th' : 'td'}>`)
          .join('')}</tr>`
    )
    .join('');

  const workbook = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${escapeCell(
          sheetName
        )}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      </head>
      <body>
        <table>${tableRows}</table>
      </body>
    </html>
  `;

  const blob = new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.xls') ? filename : `${filename}.xls`;
  anchor.click();
  URL.revokeObjectURL(url);
};
