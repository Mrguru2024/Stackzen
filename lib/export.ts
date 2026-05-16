import { formatCurrency } from './currency';

export type ExportFormat = 'csv' | 'json' | 'excel';

interface ExportOptions {
  format: ExportFormat;
  currency: string;
  dateFormat?: string;
}

export function formatDate(date: string | Date, format = 'YYYY-MM-DD'): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return format.replace('YYYY', year.toString()).replace('MM', month).replace('DD', day);
}

export function exportToCSV(data: any[], options: ExportOptions): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map(item =>
    headers.map(header => {
      const value = item[header];
      if (value instanceof Date || typeof value === 'string') {
        return formatDate(value, options.dateFormat);
      }
      if (typeof value === 'number' && header.toLowerCase().includes('amount')) {
        return formatCurrency(value, options.currency);
      }
      return value;
    })
  );

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

export function exportToJSON(data: any[], options: ExportOptions): string {
  const formattedData = data.map(item => {
    const formatted = { ...item };
    for (const [key, value] of Object.entries(item)) {
      if (value instanceof Date || typeof value === 'string') {
        formatted[key] = formatDate(value, options.dateFormat);
      }
      if (typeof value === 'number' && key.toLowerCase().includes('amount')) {
        formatted[key] = formatCurrency(value, options.currency);
      }
    }
    return formatted;
  });

  return JSON.stringify(formattedData, null, 2);
}

export function exportToExcel(data: any[], options: ExportOptions): string {
  // For Excel export, we'll use CSV format with BOM for Excel compatibility
  const csv = exportToCSV(data, options);
  return '\ufeff' + csv; // Add BOM for Excel UTF-8 compatibility
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportData(data: any[], filename: string, options: ExportOptions) {
  let content: string;
  let mimeType: string;

  switch (options.format) {
    case 'csv':
      content = exportToCSV(data, options);
      mimeType = 'text/csv';
      break;
    case 'json':
      content = exportToJSON(data, options);
      mimeType = 'application/json';
      break;
    case 'excel':
      content = exportToExcel(data, options);
      mimeType = 'text/csv';
      break;
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }

  downloadFile(content, filename, mimeType);
}
