import ExcelJS from 'exceljs';
import { Response } from 'express';

type AnyRecord = Record<string, unknown>;

function styleHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFAAAAAA' } } };
  });
  row.height = 20;
}

async function send(wb: ExcelJS.Workbook, res: Response, filename: string) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await wb.xlsx.write(res);
  res.end();
}

// ─── Rental Report Excel ──────────────────────────────────────────────────────

export async function exportRentalExcel(
  res: Response,
  summary: { totalRent: number; totalServiceCharge: number; grandTotal: number; paymentCount: number },
  payments: AnyRecord[]
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'TMIS';
  wb.created = new Date();

  const ws1 = wb.addWorksheet('Summary');
  ws1.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Amount (TSh)', key: 'amount', width: 22 },
  ];
  styleHeader(ws1.getRow(1));
  ws1.addRows([
    { metric: 'Rent Collections', amount: summary.totalRent },
    { metric: 'Service Charges', amount: summary.totalServiceCharge },
    { metric: 'Grand Total', amount: summary.grandTotal },
    { metric: 'Total Payments', amount: summary.paymentCount },
  ]);
  ws1.getRow(4).font = { bold: true };

  const ws2 = wb.addWorksheet('Payments');
  ws2.columns = [
    { header: 'Payment Date', key: 'date', width: 18 },
    { header: 'Tenant', key: 'tenant', width: 28 },
    { header: 'Phone', key: 'phone', width: 18 },
    { header: 'Unit', key: 'unit', width: 12 },
    { header: 'Property', key: 'property', width: 25 },
    { header: 'Type', key: 'type', width: 18 },
    { header: 'Period Start', key: 'periodStart', width: 18 },
    { header: 'Period End', key: 'periodEnd', width: 18 },
    { header: 'Amount (TSh)', key: 'amount', width: 18 },
    { header: 'Recorded By', key: 'recordedBy', width: 25 },
    { header: 'Notes', key: 'notes', width: 30 },
  ];
  styleHeader(ws2.getRow(1));
  for (const p of payments) {
    ws2.addRow({
      date: p.paymentDate,
      tenant: `${(p as any).tenant?.firstName} ${(p as any).tenant?.lastName}`,
      phone: (p as any).tenant?.phone ?? '',
      unit: (p as any).unit?.unitNumber,
      property: (p as any).unit?.property?.name,
      type: p.paymentType,
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      amount: Number(p.amount),
      recordedBy: `${(p as any).recordedBy?.firstName} ${(p as any).recordedBy?.lastName}`,
      notes: p.notes ?? '',
    });
  }

  await send(wb, res, 'rental-report.xlsx');
}

// ─── AirBnB Report Excel ──────────────────────────────────────────────────────

export async function exportAirbnbExcel(
  res: Response,
  summary: { bookingCount: number; totalNights: number; totalDiscount: number; totalRevenue: number },
  bookings: AnyRecord[]
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'TMIS';
  wb.created = new Date();

  const ws1 = wb.addWorksheet('Summary');
  ws1.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Value', key: 'value', width: 20 },
  ];
  styleHeader(ws1.getRow(1));
  ws1.addRows([
    { metric: 'Total Bookings', value: summary.bookingCount },
    { metric: 'Total Nights', value: summary.totalNights },
    { metric: 'Total Discount (TSh)', value: summary.totalDiscount },
    { metric: 'Total Revenue (TSh)', value: summary.totalRevenue },
  ]);
  ws1.getRow(5).font = { bold: true };

  const ws2 = wb.addWorksheet('Bookings');
  ws2.columns = [
    { header: 'Guest Name', key: 'tenant', width: 28 },
    { header: 'Phone', key: 'phone', width: 18 },
    { header: 'Unit', key: 'unit', width: 12 },
    { header: 'Property', key: 'property', width: 25 },
    { header: 'Check-In', key: 'startDate', width: 18 },
    { header: 'Check-Out', key: 'endDate', width: 18 },
    { header: 'Nights', key: 'days', width: 10 },
    { header: 'Daily Rate (TSh)', key: 'dailyRate', width: 18 },
    { header: 'Discount (TSh)', key: 'discount', width: 16 },
    { header: 'Total (TSh)', key: 'total', width: 18 },
    { header: 'Notes', key: 'notes', width: 30 },
  ];
  styleHeader(ws2.getRow(1));
  for (const b of bookings) {
    ws2.addRow({
      tenant: `${(b as any).tenant?.firstName} ${(b as any).tenant?.lastName}`,
      phone: (b as any).tenant?.phone ?? '',
      unit: (b as any).unit?.unitNumber,
      property: (b as any).unit?.property?.name,
      startDate: b.startDate,
      endDate: b.endDate,
      days: b.days,
      dailyRate: Number(b.dailyRate),
      discount: Number(b.discount),
      total: Number(b.totalAmount),
      notes: b.notes ?? '',
    });
  }

  await send(wb, res, 'airbnb-report.xlsx');
}

// ─── Occupancy Report Excel ───────────────────────────────────────────────────

export async function exportOccupancyExcel(
  res: Response,
  summary: { total: number; occupied: number; vacant: number; occupancyRate: number },
  units: AnyRecord[]
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'TMIS';

  const ws1 = wb.addWorksheet('Summary');
  ws1.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Value', key: 'value', width: 15 },
  ];
  styleHeader(ws1.getRow(1));
  ws1.addRows([
    { metric: 'Total Units', value: summary.total },
    { metric: 'Occupied', value: summary.occupied },
    { metric: 'Vacant', value: summary.vacant },
    { metric: 'Occupancy Rate', value: `${summary.occupancyRate}%` },
  ]);

  const ws2 = wb.addWorksheet('Units');
  ws2.columns = [
    { header: 'Property', key: 'property', width: 25 },
    { header: 'Unit No.', key: 'unitNumber', width: 12 },
    { header: 'Type', key: 'unitType', width: 15 },
    { header: 'Bedrooms', key: 'bedrooms', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Tenant', key: 'tenant', width: 28 },
    { header: 'Check-In Date', key: 'checkInDate', width: 18 },
    { header: 'Monthly Rent (TSh)', key: 'monthlyRent', width: 20 },
    { header: 'Service Charge (TSh)', key: 'serviceCharge', width: 22 },
  ];
  styleHeader(ws2.getRow(1));
  for (const u of units) {
    ws2.addRow({
      property: (u as any).property?.name,
      unitNumber: u.unitNumber,
      unitType: u.unitType,
      bedrooms: u.bedrooms,
      status: u.status,
      tenant: u.currentTenant
        ? `${(u as any).currentTenant.firstName} ${(u as any).currentTenant.lastName}`
        : '—',
      checkInDate: u.checkInDate ?? '',
      monthlyRent: Number(u.monthlyRent ?? 0),
      serviceCharge: Number(u.serviceCharge ?? 0),
    });
  }

  await send(wb, res, 'occupancy-report.xlsx');
}
