import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, Wallet, HandCoins, AlertTriangle, ArrowUpRight, Activity, UserPlus, CircleDollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";
import { Link } from "react-router-dom";

interface RingkasanData {
  totalAnggota: number;
  totalSimpanan: number;
  totalPinjamanAktif: number;
  totalPinjaman: number;
  totalTunggakan: number;
  jumlahAngsuranTunggakan: number;
}

const quickActions = [
  { label: "Anggota", icon: UserPlus, path: "/anggota", color: "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400" },
  { label: "Simpanan", icon: CircleDollarSign, path: "/simpanan", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400" },
  { label: "Pinjaman", icon: HandCoins, path: "/pinjaman", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400" },
];

export default function Dashboard() {
  const { data: ringkasan } = useQuery({
    queryKey: ["dashboard-ringkasan"],
    queryFn: () => api<{ data: RingkasanData }>("/api/dashboard/ringkasan"),
  });

  const stats = [
    {
      label: "Anggota Aktif",
      value: ringkasan?.data.totalAnggota ?? 0,
      change: "+2 bulan ini",
      icon: Users,
      gradient: "from-blue-500 to-indigo-600",
      light: "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400",
    },
    {
      label: "Total Simpanan",
      value: formatRupiah(ringkasan?.data.totalSimpanan ?? 0),
      change: "+12% vs bulan lalu",
      icon: Wallet,
      gradient: "from-emerald-500 to-teal-600",
      light: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400",
    },
    {
      label: "Pinjaman Aktif",
      value: ringkasan?.data.totalPinjamanAktif ?? 0,
      change: "Rp " + formatRupiah(ringkasan?.data.totalPinjaman ?? 0).replace("Rp", "").trim(),
      icon: HandCoins,
      gradient: "from-amber-500 to-orange-600",
      light: "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400",
    },
    {
      label: "Tunggakan",
      value: formatRupiah(ringkasan?.data.totalTunggakan ?? 0),
      change: `${ringkasan?.data.jumlahAngsuranTunggakan ?? 0} angsuran belum bayar`,
      icon: AlertTriangle,
      gradient: "from-red-500 to-rose-600",
      light: "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Ringkasan koperasi per hari ini</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card px-3 py-1.5 rounded-lg border border-border shadow-sm">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          <span>Live data</span>
        </div>
      </div>

      {/* Quick Actions — Mobile only */}
      <div className="lg:hidden">
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((a) => (
            <Link
              key={a.path}
              to={a.path}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border shadow-sm active:scale-95 transition-transform"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color}`}>
                <a.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-foreground">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Grid - Bento Style */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${s.gradient} opacity-[0.08] rounded-bl-full`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {s.label}
              </CardTitle>
              <div className={`p-1.5 rounded-lg ${s.light}`}>
                <s.icon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                {s.change}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Large Chart Area */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">Pertumbuhan Simpanan</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Total simpanan per bulan (dalam jutaan Rupiah)</p>
              </div>
              <select className="text-xs bg-muted border border-border rounded-lg px-2 py-1 text-muted-foreground">
                <option>6 Bulan</option>
                <option>1 Tahun</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-56 flex items-end justify-between gap-2 px-2">
              {[
                { month: "Jan", val: 25, h: 30 },
                { month: "Feb", val: 32, h: 42 },
                { month: "Mar", val: 28, h: 35 },
                { month: "Apr", val: 45, h: 58 },
                { month: "Mei", val: 38, h: 48 },
                { month: "Jun", val: 55, h: 72 },
                { month: "Jul", val: 48, h: 62 },
              ].map((d) => (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="relative w-full flex justify-center">
                    <div
                      className="w-full max-w-[48px] bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-md transition-all duration-300 group-hover:from-emerald-600 group-hover:to-teal-500"
                      style={{ height: `${d.h * 2}px` }}
                    />
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[10px] px-2 py-0.5 rounded-md">
                      {d.val}jt
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">{d.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Side Panel - Status */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground">Status Pinjaman</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Diajukan", count: 3, total: 12, color: "bg-amber-400", text: "text-amber-600 dark:text-amber-400" },
                { label: "Aktif", count: 6, total: 12, color: "bg-emerald-400", text: "text-emerald-600 dark:text-emerald-400" },
                { label: "Lunas", count: 4, total: 12, color: "bg-blue-400", text: "text-blue-600 dark:text-blue-400" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-foreground">{item.label}</span>
                    <span className={`text-sm font-bold ${item.text}`}>{item.count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{ width: `${(item.count / item.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rasio Kesehatan</p>
                  <p className="text-lg font-bold text-foreground">Sehat</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Likuiditas</p>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">245%</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Solvabilitas</p>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">180%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity — Desktop Table */}
      <Card className="border-0 shadow-sm hidden lg:block">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-foreground">Aktivitas Terkini</CardTitle>
            <button className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium">
              Lihat Semua
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Aktivitas</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Anggota</th>
                  <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Nominal</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { act: "Setoran Simpanan", user: "Budi Santoso", amt: 50000, status: "Selesai", statusColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400" },
                  { act: "Pengajuan Pinjaman", user: "Siti Aminah", amt: 12000000, status: "Diproses", statusColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400" },
                  { act: "Bayar Angsuran", user: "Budi Santoso", amt: 1120000, status: "Selesai", statusColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400" },
                  { act: "Pencairan Pinjaman", user: "Test User", amt: 12000000, status: "Aktif", statusColor: "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400" },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-3 font-medium text-foreground">{row.act}</td>
                    <td className="py-3 px-3 text-muted-foreground">{row.user}</td>
                    <td className="py-3 px-3 text-right font-medium text-foreground">{formatRupiah(row.amt)}</td>
                    <td className="py-3 px-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${row.statusColor}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity — Mobile Cards */}
      <div className="lg:hidden space-y-3">
        <h3 className="text-base font-semibold text-foreground">Aktivitas Terkini</h3>
        {[
          { act: "Setoran Simpanan", user: "Budi Santoso", amt: 50000, status: "Selesai", statusColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400" },
          { act: "Pengajuan Pinjaman", user: "Siti Aminah", amt: 12000000, status: "Diproses", statusColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400" },
          { act: "Bayar Angsuran", user: "Budi Santoso", amt: 1120000, status: "Selesai", statusColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400" },
          { act: "Pencairan Pinjaman", user: "Test User", amt: 12000000, status: "Aktif", statusColor: "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400" },
        ].map((row, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-foreground">{row.act}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{row.user}</p>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${row.statusColor}`}>
                  {row.status}
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground mt-2">{formatRupiah(row.amt)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
