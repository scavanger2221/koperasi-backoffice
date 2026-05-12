import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Loader2, ArrowDownLeft, ArrowUpRight, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";

interface BukuKasItem {
  id: string;
  tanggal: string;
  noJurnal: string;
  keterangan: string;
  debit: string;
  kredit: string;
  saldo: number;
}

export default function BukuKasPage() {
  const [filter, setFilter] = useState("bulan-ini");

  const getDateRange = () => {
    const today = new Date();
    if (filter === "hari-ini") {
      const d = today.toISOString().split("T")[0];
      return { mulai: d, selesai: d };
    }
    if (filter === "minggu-ini") {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      return { mulai: start.toISOString().split("T")[0], selesai: today.toISOString().split("T")[0] };
    }
    if (filter === "bulan-ini") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { mulai: start.toISOString().split("T")[0], selesai: today.toISOString().split("T")[0] };
    }
    return {};
  };

  const range = getDateRange();

  const { data, isLoading } = useQuery({
    queryKey: ["buku-kas", filter],
    queryFn: () =>
      api<{ data: BukuKasItem[] }>(`/api/jurnal/buku-kas?${range.mulai ? `tanggalMulai=${range.mulai}&tanggalSelesai=${range.selesai}` : ""}`),
  });

  const items = data?.data ?? [];
  const totalDebit = items.reduce((acc, i) => acc + Number(i.debit), 0);
  const totalKredit = items.reduce((acc, i) => acc + Number(i.kredit), 0);
  const saldoAkhir = items.length > 0 ? items[items.length - 1].saldo : 0;

  const exportCSV = () => {
    const headers = ["Tanggal", "No Jurnal", "Keterangan", "Debit", "Kredit", "Saldo"];
    const rows = items.map((i) => [
      i.tanggal,
      i.noJurnal,
      i.keterangan,
      i.debit,
      i.kredit,
      i.saldo,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `buku-kas-${filter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filters = [
    { value: "hari-ini", label: "Hari Ini" },
    { value: "minggu-ini", label: "Minggu Ini" },
    { value: "bulan-ini", label: "Bulan Ini" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Buku Kas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Pencatatan transaksi kas masuk dan keluar</p>
      </div>

      {/* Stats — Dashboard-style cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Kas Masuk
            </CardTitle>
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatRupiah(totalDebit)}</div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Kas Keluar
            </CardTitle>
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatRupiah(totalKredit)}</div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Saldo Akhir
            </CardTitle>
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatRupiah(saldoAkhir)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f.value
                ? "bg-emerald-600 text-white"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Daftar Transaksi Kas</span>
            {items.length > 0 && (
              <button
                onClick={exportCSV}
                className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            )}
          </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Tanggal</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">No Jurnal</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Keterangan</th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Debit</th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Kredit</th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-muted/60 transition-colors">
                      <td className="py-3 px-3 text-foreground">{new Date(item.tanggal).toLocaleDateString("id-ID")}</td>
                      <td className="py-3 px-3 font-medium text-foreground">{item.noJurnal}</td>
                      <td className="py-3 px-3 text-foreground">{item.keterangan}</td>
                      <td className="py-3 px-3 text-right text-emerald-400 font-medium">
                        {Number(item.debit) > 0 ? formatRupiah(item.debit) : "-"}
                      </td>
                      <td className="py-3 px-3 text-right text-red-400 font-medium">
                        {Number(item.kredit) > 0 ? formatRupiah(item.kredit) : "-"}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-foreground">{formatRupiah(item.saldo)}</td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                        Tidak ada transaksi kas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
