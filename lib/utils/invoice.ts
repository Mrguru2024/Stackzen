// Utility to calculate invoice total from line items
export function calculateInvoiceTotal(lineItems: { amount: number }[]): number {
  return lineItems.reduce((acc, item) => acc + (item.amount ?? 0), 0);
}

// Utility to generate a PDF from a DOM element (by id)
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generateInvoicePDF(elementId: string, filename: string) {
  const previewElement = document.getElementById(elementId);
  if (!previewElement) return;
  const canvas = await html2canvas(previewElement, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pageWidth;
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(filename);
}
