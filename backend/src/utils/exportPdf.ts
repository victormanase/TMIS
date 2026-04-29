import PDFDocument from 'pdfkit';
import { Response } from 'express';

type AnyRecord = Record<string, unknown>;

function pdfHeader(doc: PDFKit.PDFDocument, title: string, filters: Record<string, string>) {
  doc.fontSize(18).font('Helvetica-Bold').text(`TMIS — ${title}`, { align: 'center' });
  doc.moveDown(0.4);
  doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
  if (filters.dateFrom || filters.dateTo) {
    doc.text(`Period: ${filters.dateFrom ?? ''} — ${filters.dateTo ?? ''}`, { align: 'center' });
  }
  doc.moveDown();
}

function drawTableHeader(
  doc: PDFKit.PDFDocument,
  headers: string[],
  colWidths: number[]
) {
  const y = doc.y;
  let x = doc.page.margins.left;
  doc.fontSize(9).font('Helvetica-Bold');
  headers.forEach((h, i) => {
    doc.text(h, x, y, { width: colWidths[i], align: 'left' });
    x += colWidths[i];
  });
  doc.moveDown(0.3);
  doc.moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();
  doc.moveDown(0.2);
}

function drawTableRow(
  doc: PDFKit.PDFDocument,
  cells: string[],
  colWidths: number[]
) {
  if (doc.y > doc.page.height - 80) doc.addPage();
  const rowY = doc.y;
  let x = doc.page.margins.left;
  doc.fontSize(8).font('Helvetica');
  cells.forEach((c, i) => {
    doc.text(c, x, rowY, { width: colWidths[i], align: 'left' });
    x += colWidths[i];
  });
  doc.moveDown(0.4);
}

// ─── Rental Report PDF ────────────────────────────────────────────────────────

export function exportRentalPdf(
  res: Response,
  summary: { totalRent: number; totalServiceCharge: number; grandTotal: number; paymentCount: number },
  payments: AnyRecord[],
  filters: Record<string, string>
) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="rental-report.pdf"');
  doc.pipe(res);

  pdfHeader(doc, 'Rental Report', filters);

  doc.fontSize(12).font('Helvetica-Bold').text('Summary');
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica');
  doc.text(`Rent Collections:   TSh ${summary.totalRent.toLocaleString()}`);
  doc.text(`Service Charges:    TSh ${summary.totalServiceCharge.toLocaleString()}`);
  doc.moveDown(0.2);
  doc.fontSize(11).font('Helvetica-Bold').text(`Grand Total: TSh ${summary.grandTotal.toLocaleString()}`);
  doc.text(`Total Payments: ${summary.paymentCount}`);
  doc.moveDown();

  if (payments.length > 0) {
    doc.fontSize(12).font('Helvetica-Bold').text('Payment Details');
    doc.moveDown(0.3);

    const headers = ['Date', 'Tenant', 'Unit', 'Property', 'Type', 'Period', 'Amount (TSh)'];
    const colWidths = [65, 90, 45, 85, 75, 90, 80];
    drawTableHeader(doc, headers, colWidths);

    for (const p of payments) {
      const periodStart = p.periodStart ? new Date(p.periodStart as string).toLocaleDateString() : '';
      const periodEnd = p.periodEnd ? new Date(p.periodEnd as string).toLocaleDateString() : '';
      drawTableRow(doc, [
        p.paymentDate ? new Date(p.paymentDate as string).toLocaleDateString() : '',
        `${(p as any).tenant?.firstName} ${(p as any).tenant?.lastName}`,
        String((p as any).unit?.unitNumber ?? ''),
        String((p as any).unit?.property?.name ?? ''),
        String(p.paymentType ?? ''),
        `${periodStart}–${periodEnd}`,
        Number(p.amount ?? 0).toLocaleString(),
      ], colWidths);
    }
  }

  doc.end();
}

// ─── AirBnB Report PDF ────────────────────────────────────────────────────────

export function exportAirbnbPdf(
  res: Response,
  summary: { bookingCount: number; totalNights: number; totalDiscount: number; totalRevenue: number },
  bookings: AnyRecord[],
  filters: Record<string, string>
) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="airbnb-report.pdf"');
  doc.pipe(res);

  pdfHeader(doc, 'AirBnB Bookings Report', filters);

  doc.fontSize(12).font('Helvetica-Bold').text('Summary');
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica');
  doc.text(`Total Bookings: ${summary.bookingCount}`);
  doc.text(`Total Nights:   ${summary.totalNights}`);
  doc.text(`Total Discount: TSh ${summary.totalDiscount.toLocaleString()}`);
  doc.moveDown(0.2);
  doc.fontSize(11).font('Helvetica-Bold').text(`Total Revenue: TSh ${summary.totalRevenue.toLocaleString()}`);
  doc.moveDown();

  if (bookings.length > 0) {
    doc.fontSize(12).font('Helvetica-Bold').text('Booking Details');
    doc.moveDown(0.3);

    const headers = ['Guest', 'Unit', 'Property', 'Check-In', 'Check-Out', 'Nights', 'Rate/Night', 'Discount', 'Source', 'Total (TSh)'];
    const colWidths = [75, 40, 70, 55, 55, 35, 55, 50, 65, 60];
    drawTableHeader(doc, headers, colWidths);

    for (const b of bookings) {
      const src = (b as any).bookingSource;
      const srcLabel = src === 'OTHER' && (b as any).bookingSourceOther
        ? (b as any).bookingSourceOther
        : { SELF_BOOKING: 'Self Booking', BOOKING_COM: 'Booking.com', OTHER: 'Others' }[src as string] ?? src;
      drawTableRow(doc, [
        String((b as any).guestName ?? ''),
        String((b as any).unit?.unitNumber ?? ''),
        String((b as any).unit?.property?.name ?? ''),
        b.startDate ? new Date(b.startDate as string).toLocaleDateString() : '',
        b.endDate ? new Date(b.endDate as string).toLocaleDateString() : '',
        String(b.days ?? ''),
        `TSh ${Number(b.dailyRate ?? 0).toLocaleString()}`,
        `TSh ${Number(b.discount ?? 0).toLocaleString()}`,
        srcLabel,
        Number(b.totalAmount ?? 0).toLocaleString(),
      ], colWidths);
    }
  }

  doc.end();
}

// ─── Occupancy Report PDF ─────────────────────────────────────────────────────

export function exportOccupancyPdf(
  res: Response,
  summary: { total: number; occupied: number; vacant: number; occupancyRate: number },
  units: AnyRecord[]
) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="occupancy-report.pdf"');
  doc.pipe(res);

  pdfHeader(doc, 'Occupancy Report', {});

  doc.fontSize(12).font('Helvetica-Bold').text('Summary');
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica');
  doc.text(`Total Units: ${summary.total}`);
  doc.text(`Occupied:    ${summary.occupied}`);
  doc.text(`Vacant:      ${summary.vacant}`);
  doc.text(`Occupancy Rate: ${summary.occupancyRate}%`);
  doc.moveDown();

  const headers = ['Property', 'Unit No.', 'Type', 'Bedrooms', 'Status', 'Tenant'];
  const colWidths = [110, 60, 70, 60, 70, 110];
  drawTableHeader(doc, headers, colWidths);

  for (const u of units) {
    drawTableRow(doc, [
      String((u as any).property?.name ?? ''),
      String(u.unitNumber ?? ''),
      String(u.unitType ?? ''),
      String(u.bedrooms ?? ''),
      String(u.status ?? ''),
      u.currentTenant
        ? `${(u as any).currentTenant.firstName} ${(u as any).currentTenant.lastName}`
        : '—',
    ], colWidths);
  }

  doc.end();
}
