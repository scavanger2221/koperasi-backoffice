import { eq, desc } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { db } from "../lib/db.js";
import { shu, shuAnggota, anggota } from "../../database/schema/index.js";

function rupiah(n: number | string): string {
  const num = typeof n === "string" ? Number(n) : n;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num || 0);
}

export class ExportService {
  // ── XLSX: Rekap semua SHU ──────────────────────────────────────
  async exportSHURekapXLSX(): Promise<Buffer> {
    const list = await db.select().from(shu).orderBy(desc(shu.periode));

    const wb = new ExcelJS.Workbook();
    wb.creator = "Koperasi Backoffice";
    wb.created = new Date();

    const ws = wb.addWorksheet("Rekap SHU");

    // Title row
    ws.mergeCells("A1:G1");
    const titleCell = ws.getCell("A1");
    titleCell.value = "REKAP SISA HASIL USAHA (SHU)";
    titleCell.font = { name: "Calibri", size: 14, bold: true };
    titleCell.alignment = { horizontal: "center" };
    ws.getRow(1).height = 30;

    // Header row
    const headers = ["Periode", "Total SHU", "Dana Anggota", "Dana Cadangan", "Dana Pengurus", "Dana Pendidikan & Sosial", "Status"];
    const headerRow = ws.addRow(headers);
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
      cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Data rows
    for (const s of list) {
      const row = ws.addRow([
        s.periode,
        Number(s.totalShu),
        Number(s.danaAnggota),
        Number(s.danaCadangan),
        Number(s.danaPengurus),
        Number(s.danaPendidikan) + Number(s.danaSosial),
        s.status.charAt(0).toUpperCase() + s.status.slice(1),
      ]);
      row.height = 20;
      row.eachCell((cell, col) => {
        cell.font = { name: "Calibri", size: 10 };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
        if (col >= 2 && col <= 6) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: "right" };
        } else {
          cell.alignment = { horizontal: "center" };
        }
      });
    }

    // Column widths
    ws.getColumn(1).width = 12;
    ws.getColumn(2).width = 18;
    ws.getColumn(3).width = 18;
    ws.getColumn(4).width = 18;
    ws.getColumn(5).width = 18;
    ws.getColumn(6).width = 22;
    ws.getColumn(7).width = 16;

    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  // ── XLSX: Detail SHU per Anggota ──────────────────────────────
  async exportSHUDetailXLSX(shuId: string): Promise<Buffer> {
    const s = await db.select().from(shu).where(eq(shu.id, shuId)).get();
    if (!s) throw new HTTPException(404, { message: "SHU tidak ditemukan" });

    const anggotaList = await db
      .select({
        id: shuAnggota.id,
        anggotaId: shuAnggota.anggotaId,
        jma: shuAnggota.jma,
        jua: shuAnggota.jua,
        total: shuAnggota.total,
        simpananAnggota: shuAnggota.simpananAnggota,
        transaksiAnggota: shuAnggota.transaksiAnggota,
        status: shuAnggota.status,
        anggotaNama: anggota.nama,
        anggotaNo: anggota.noAnggota,
      })
      .from(shuAnggota)
      .innerJoin(anggota, eq(shuAnggota.anggotaId, anggota.id))
      .where(eq(shuAnggota.shuId, shuId))
      .orderBy(desc(anggota.nama));

    const wb = new ExcelJS.Workbook();
    wb.creator = "Koperasi Backoffice";
    wb.created = new Date();

    const ws = wb.addWorksheet(`SHU ${s.periode}`);

    // Title
    ws.mergeCells("A1:H1");
    const titleCell = ws.getCell("A1");
    titleCell.value = `RINCIAN SHU PERIODE ${s.periode}`;
    titleCell.font = { name: "Calibri", size: 14, bold: true };
    titleCell.alignment = { horizontal: "center" };
    ws.getRow(1).height = 30;

    // Summary section
    ws.mergeCells("A2:H2");
    ws.getCell("A2").value = `Total SHU: ${rupiah(s.totalShu)} | Dana Anggota: ${rupiah(s.danaAnggota)} (${s.alokasiAnggota}%) | Status: ${s.status}`;
    ws.getCell("A2").font = { name: "Calibri", size: 10, italic: true, color: { argb: "FF6B7280" } };
    ws.getCell("A2").alignment = { horizontal: "center" };
    ws.getRow(2).height = 22;

    // Blank row
    ws.addRow([]);

    // Headers
    const headers = ["No", "No Anggota", "Nama", "Simpanan", "Transaksi", "JMA", "JUA", "Total SHU"];
    const headerRow = ws.addRow(headers);
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
      cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Data
    for (let i = 0; i < anggotaList.length; i++) {
      const a = anggotaList[i];
      const row = ws.addRow([
        i + 1,
        a.anggotaNo,
        a.anggotaNama,
        Number(a.simpananAnggota),
        Number(a.transaksiAnggota),
        Number(a.jma),
        Number(a.jua),
        Number(a.total),
      ]);
      row.height = 20;
      row.eachCell((cell, col) => {
        cell.font = { name: "Calibri", size: 10 };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
        if (col >= 4 && col <= 8) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: "right" };
        } else if (col === 1) {
          cell.alignment = { horizontal: "center" };
        }
      });
    }

    // Total row
    const totalRow = ws.addRow([
      "",
      "",
      "TOTAL",
      anggotaList.reduce((s, a) => s + Number(a.simpananAnggota), 0),
      anggotaList.reduce((s, a) => s + Number(a.transaksiAnggota), 0),
      anggotaList.reduce((s, a) => s + Number(a.jma), 0),
      anggotaList.reduce((s, a) => s + Number(a.jua), 0),
      anggotaList.reduce((s, a) => s + Number(a.total), 0),
    ]);
    totalRow.height = 22;
    totalRow.eachCell((cell, col) => {
      cell.font = { name: "Calibri", size: 10, bold: true };
      cell.border = {
        top: { style: "medium" },
        bottom: { style: "medium" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
      if (col >= 4 && col <= 8) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: "right" };
      } else if (col <= 3) {
        cell.alignment = { horizontal: "center" };
      }
    });

    // Column widths
    ws.getColumn(1).width = 6;
    ws.getColumn(2).width = 15;
    ws.getColumn(3).width = 30;
    ws.getColumn(4).width = 16;
    ws.getColumn(5).width = 16;
    ws.getColumn(6).width = 16;
    ws.getColumn(7).width = 16;
    ws.getColumn(8).width = 16;

    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  // ── PDF: Detail SHU per Anggota ────────────────────────────────
  async exportSHUDetailPDF(shuId: string): Promise<Buffer> {
    const s = await db.select().from(shu).where(eq(shu.id, shuId)).get();
    if (!s) throw new HTTPException(404, { message: "SHU tidak ditemukan" });

    const anggotaList = await db
      .select({
        id: shuAnggota.id,
        anggotaId: shuAnggota.anggotaId,
        jma: shuAnggota.jma,
        jua: shuAnggota.jua,
        total: shuAnggota.total,
        simpananAnggota: shuAnggota.simpananAnggota,
        transaksiAnggota: shuAnggota.transaksiAnggota,
        status: shuAnggota.status,
        anggotaNama: anggota.nama,
        anggotaNo: anggota.noAnggota,
      })
      .from(shuAnggota)
      .innerJoin(anggota, eq(shuAnggota.anggotaId, anggota.id))
      .where(eq(shuAnggota.shuId, shuId))
      .orderBy(desc(anggota.nama));

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {});

    // Font — use built-in fonts
    const fontSize = (size: number) => size;

    // ── Header ──
    doc.fontSize(16).font("Helvetica-Bold").text("RINCIAN SISA HASIL USAHA (SHU)", { align: "center" });
    doc.fontSize(12).font("Helvetica-Bold").text(`Periode ${s.periode}`, { align: "center" });
    doc.moveDown(0.5);

    // ── Summary Info ──
    const statusLabel = s.status.charAt(0).toUpperCase() + s.status.slice(1);
    doc.fontSize(9).font("Helvetica");
    doc.text(`Total SHU    : ${rupiah(s.totalShu)}`, { continued: false });
    doc.text(`Dana Anggota : ${rupiah(s.danaAnggota)} (${s.alokasiAnggota}%)`, { continued: false });
    doc.text(`Dana Cadangan: ${rupiah(s.danaCadangan)} (${s.alokasiCadangan}%)`, { continued: false });
    doc.text(`Status       : ${statusLabel}`);
    doc.moveDown(0.5);

    // ── Column Headers ──
    const tableTop = doc.y;
    const colWidths = [25, 70, 150, 90, 90, 90, 90];
    const headers = ["No", "Anggota", "Nama", "Simpanan", "Transaksi", "JMA+JUA", "Total"];
    const startX = 40;

    doc.fontSize(8).font("Helvetica-Bold");
    let xPos = startX;
    doc.rect(startX, tableTop - 4, colWidths.reduce((a, b) => a + b, 0), 16).fill("#059669");
    doc.fillColor("#FFFFFF");
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], xPos + 3, tableTop, {
        width: colWidths[i] - 6,
        align: i === 0 ? "center" : i <= 2 ? "left" : "right",
        lineBreak: false,
      });
      xPos += colWidths[i];
    }
    doc.fillColor("#000000");
    doc.font("Helvetica");

    // ── Data Rows ──
    let yPos = tableTop + 16;
    for (let i = 0; i < anggotaList.length; i++) {
      const a = anggotaList[i];
      const rowData = [
        String(i + 1),
        a.anggotaNo,
        a.anggotaNama,
        rupiah(a.simpananAnggota),
        rupiah(a.transaksiAnggota),
        `${rupiah(a.jma)} / ${rupiah(a.jua)}`,
        rupiah(a.total),
      ];

      // Check page break
      if (yPos > 720) {
        doc.addPage();
        yPos = 40;
      }

      // Row background
      if (i % 2 === 0) {
        doc.rect(startX, yPos - 4, colWidths.reduce((a, b) => a + b, 0), 16).fill("#F3F4F6");
      }

      xPos = startX;
      doc.fontSize(8).font("Helvetica");
      for (let j = 0; j < rowData.length; j++) {
        doc.fillColor("#000000").text(rowData[j], xPos + 3, yPos, {
          width: colWidths[j] - 6,
          align: j === 0 ? "center" : j <= 2 ? "left" : "right",
          lineBreak: false,
        });
        xPos += colWidths[j];
      }

      // Horizontal line
      doc.moveTo(startX, yPos + 12)
        .lineTo(startX + colWidths.reduce((a, b) => a + b, 0), yPos + 12)
        .strokeColor("#E5E7EB")
        .stroke();

      yPos += 16;
    }

    // ── Total Row ──
    if (anggotaList.length > 0) {
      yPos += 4;
      const totalSimpanan = anggotaList.reduce((s, a) => s + Number(a.simpananAnggota), 0);
      const totalTransaksi = anggotaList.reduce((s, a) => s + Number(a.transaksiAnggota), 0);
      const totalJMA = anggotaList.reduce((s, a) => s + Number(a.jma), 0);
      const totalJUA = anggotaList.reduce((s, a) => s + Number(a.jua), 0);
      const totalAll = anggotaList.reduce((s, a) => s + Number(a.total), 0);

      const totalData = ["", "", "TOTAL", rupiah(totalSimpanan), rupiah(totalTransaksi), `${rupiah(totalJMA)} / ${rupiah(totalJUA)}`, rupiah(totalAll)];

      doc.fontSize(8).font("Helvetica-Bold");
      xPos = startX;
      doc.rect(startX, yPos - 4, colWidths.reduce((a, b) => a + b, 0), 16).fill("#059669");
      doc.fillColor("#FFFFFF");
      for (let j = 0; j < totalData.length; j++) {
        doc.text(totalData[j], xPos + 3, yPos, {
          width: colWidths[j] - 6,
          align: j === 0 ? "center" : j <= 2 ? "left" : "right",
          lineBreak: false,
        });
        xPos += colWidths[j];
      }
    }

    // ── Footer ──
    doc.fillColor("#9CA3AF").fontSize(8).font("Helvetica");
    doc.text(
      `Dicetak pada ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
      40,
      750,
      { align: "center" }
    );

    doc.end();

    return new Promise((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }
}

export const exportService = new ExportService();
