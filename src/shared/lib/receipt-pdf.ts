import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatCurrencyVND } from '@/src/shared/lib/utils';

type ReceiptPdfItem = {
  productId: string;
  quantity: number;
  costPrice: number;
  salePrice: number;
  product?: {
    name?: string | null;
    sku?: string | null;
  } | null;
};

type ReceiptPdfPayload = {
  code: string;
  supplier?: string | null;
  note?: string | null;
  createdAt: string;
  items: ReceiptPdfItem[];
};

const createCell = (content: string, className = '') => `<td class="${className}">${content}</td>`;

export const exportReceiptPdf = async (receipt: ReceiptPdfPayload, locale: 'vi' | 'en' = 'vi') => {
  const totalQuantity = receipt.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalCost = receipt.items.reduce((sum, item) => sum + item.quantity * item.costPrice, 0);

  const labels =
    locale === 'vi'
      ? {
          title: 'PHIẾU NHẬP KHO',
          code: 'Mã phiếu',
          supplier: 'Nhà cung cấp',
          date: 'Ngày nhập',
          note: 'Ghi chú',
          product: 'Sản phẩm',
          quantity: 'Số lượng',
          importCost: 'Giá nhập',
          salePrice: 'Giá bán',
          lineTotal: 'Thành tiền',
          totalQuantity: 'Tổng số lượng',
          grandTotal: 'Tổng cộng',
          unit: 'đ',
        }
      : {
          title: 'INVENTORY RECEIPT',
          code: 'Receipt code',
          supplier: 'Supplier',
          date: 'Received date',
          note: 'Note',
          product: 'Product',
          quantity: 'Quantity',
          importCost: 'Cost price',
          salePrice: 'Sale price',
          lineTotal: 'Line total',
          totalQuantity: 'Total quantity',
          grandTotal: 'Grand total',
          unit: '',
        };

  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-99999px';
  wrapper.style.top = '0';
  wrapper.style.width = '1120px';
  wrapper.style.background = '#f5f7fb';
  wrapper.style.padding = '40px';
  wrapper.style.zIndex = '-1';

  const rows = receipt.items
    .map(
      (item, index) => `
        <tr>
          ${createCell(String(index + 1), 'center')}
          ${createCell(item.product?.name || item.productId)}
          ${createCell(item.product?.sku || '')}
          ${createCell(String(item.quantity), 'right')}
          ${createCell(formatCurrencyVND(item.costPrice), 'right')}
          ${createCell(formatCurrencyVND(item.salePrice), 'right')}
          ${createCell(formatCurrencyVND(item.quantity * item.costPrice), 'right strong')}
        </tr>
      `
    )
    .join('');

  wrapper.innerHTML = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #0f172a;">
      <div style="background: linear-gradient(135deg, #0f172a, #1d4ed8); color: #ffffff; border-radius: 28px; padding: 28px 32px;">
        <div style="display:flex; justify-content:space-between; gap:24px; align-items:flex-start;">
          <div>
            <div style="font-size:12px; font-weight:700; letter-spacing:0.24em; opacity:0.86;">TIỆM BÁCH HOÁ HAI TỤI MÌNH</div>
            <h1 style="margin:12px 0 8px; font-size:34px; line-height:1.1;">${labels.title}</h1>
            <div style="font-size:14px; opacity:0.92;">${labels.code}: <strong>${receipt.code}</strong></div>
          </div>
          <div style="min-width:320px; background: rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.16); border-radius:20px; padding:18px 20px;">
            <div style="display:grid; gap:8px; font-size:14px;">
              <div><strong>${labels.supplier}:</strong> ${receipt.supplier || '-'}</div>
              <div><strong>${labels.date}:</strong> ${new Date(receipt.createdAt).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')}</div>
              <div><strong>${labels.note}:</strong> ${receipt.note || '-'}</div>
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top:24px; background:#ffffff; border:1px solid #dbe3f0; border-radius:28px; padding:24px; box-shadow:0 18px 40px rgba(15,23,42,0.08);">
        <table style="width:100%; border-collapse:collapse; font-size:14px;">
          <thead>
            <tr>
              <th class="center">STT</th>
              <th>${labels.product}</th>
              <th>SKU</th>
              <th class="right">${labels.quantity}</th>
              <th class="right">${labels.importCost}</th>
              <th class="right">${labels.salePrice}</th>
              <th class="right">${labels.lineTotal}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div style="margin-top:24px; display:flex; justify-content:flex-end;">
          <div style="width:340px; border:1px solid #dbe3f0; border-radius:22px; overflow:hidden;">
            <div style="display:flex; justify-content:space-between; padding:14px 18px; border-bottom:1px solid #e2e8f0; background:#f8fafc;">
              <span style="font-size:13px; color:#475569;">${labels.totalQuantity}</span>
              <strong>${totalQuantity}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding:18px; background:#eff6ff;">
              <span style="font-size:13px; color:#1e3a8a; font-weight:700;">${labels.grandTotal}</span>
              <strong style="font-size:22px; color:#1d4ed8;">${formatCurrencyVND(totalCost)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
    <style>
      th, td { border-bottom: 1px solid #e2e8f0; padding: 14px 12px; vertical-align: top; }
      th { background: #eff6ff; color: #1e3a8a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.14em; text-align: left; }
      td { color: #0f172a; }
      .center { text-align: center; }
      .right { text-align: right; white-space: nowrap; }
      .strong { font-weight: 700; }
    </style>
  `;

  document.body.appendChild(wrapper);

  try {
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#f5f7fb',
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const imageWidth = pdfWidth - margin * 2;
    const imageHeight = (canvas.height * imageWidth) / canvas.width;
    const imageData = canvas.toDataURL('image/png');

    let heightLeft = imageHeight;
    let position = margin;

    pdf.addImage(imageData, 'PNG', margin, position, imageWidth, imageHeight, undefined, 'FAST');
    heightLeft -= pdfHeight - margin * 2;

    while (heightLeft > 0) {
      pdf.addPage();
      position = margin - (imageHeight - heightLeft);
      pdf.addImage(imageData, 'PNG', margin, position, imageWidth, imageHeight, undefined, 'FAST');
      heightLeft -= pdfHeight - margin * 2;
    }

    pdf.save(`${receipt.code}.pdf`);
  } finally {
    document.body.removeChild(wrapper);
  }
};
