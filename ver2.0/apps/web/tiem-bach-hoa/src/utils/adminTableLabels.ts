export default function addDataLabelsToTables() {
  try {
    if (typeof window === 'undefined') return;
    const tables = Array.from(document.querySelectorAll('table')) as HTMLTableElement[];
    tables.forEach(table => {
      const ths = Array.from(table.querySelectorAll('thead th')).map(t => t.textContent?.trim() || '');
      if (!ths.length) return;
      const rows = Array.from(table.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
      rows.forEach(r => {
        const cells = Array.from(r.querySelectorAll('td')) as HTMLTableCellElement[];
        cells.forEach((td, idx) => {
          try { td.setAttribute('data-label', ths[idx] || ''); } catch(e) { /* ignore */ }
        });
      });
    });
  } catch (err) {
    // noop
  }
}
