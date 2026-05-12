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
  { label: "Anggota", icon: UserPlus, path: "/anggota", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" },
  { label: "Simpanan", icon: CircleDollarSign, path: "/simpanan", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" },
  { label: "Pinjaman", icon: HandCoins, path: "/pinjaman", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
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
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-100 dark:bg-blue-950/30",
    },
    {
      label: "Total Simpanan",
      value: formatRupiah(ringkasan?.data.totalSimpanan ?? 0),
      change: "+12% vs bulan lalu",
      icon: Wallet,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-100 dark:bg-emerald-950/30",
    },
    {
      label: "Pinjaman Aktif",
      value: ringkasan?.data.totalPinjamanAktif ?? 0,
      change: "Rp " + formatRupiah(ringkasan?.data.totalPinjaman ?? 0).replace("Rp", "").trim(),
      icon: HandCoins,
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-100 dark:bg-amber-950/30",
    },
    {
      label: "Tunggakan",
      value: formatRupiah(ringkasan?.data.totalTunggakan ?? 0),
      change: `${ringkasan?.data.jumlahAngsuranTunggakan ?? 0} angsuran belum bayar`,
      icon: AlertTriangle,
      iconColor: "text-red-600 dark:text-red-400",
      iconBg: "bg-red-100 dark:bg-red-950/30",
    },
  ];

  const chartData = [
    { month: "Jan", val: 25, h: 30 },
    { month: "Feb", val: 32, h: 42 },
    { month: "Mar", val: 28, h: 35 },
    { month: "Apr", val: 45, h: 58 },
    { month: "Mei", val: 38, h: 48 },
    { month: "Jun", val: 55, h: 72 },
    { month: "Jul", val: 48, h: 62 },
  ];

  const maxVal = Math.max(...chartData.map((d) => d.val));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Ringkasan koperasi per hari ini</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-card px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
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
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-gray-200 dark:border-gray-700 shadow-sm active:scale-95 transition-transform"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color}`}>
                <a.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-foreground">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {s.label}
              </CardTitle>
              <div className={`w-10 h-10 rounded-full ${s.iconBg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                <ArrowUpRight className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                {s.change}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Large Chart Area */}
        <Card className="lg:col-span-2 border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">Pertumbuhan Simpanan</CardTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total simpanan per bulan (dalam jutaan Rupiah)</p>
              </div>
              <select className="text-xs bg-muted border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-gray-500 dark:text-gray-400">
                <option>6 Bulan</option>
                <option>1 Tahun</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {/* Y-axis gridlines */}
            <div className="relative h-56">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="border-t border-gray-100 dark:border-gray-800 w-full" />
                ))}
              </div>
              <div className="absolute inset-0 flex items-end justify-between gap-2 px-2">
                {chartData.map((d) => (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="relative w-full flex justify-center">
                      <span className="absolute -top-5 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                        {d.val}jt
                      </span>
                      <div
                        className="w-full max-w-[48px] bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg transition-all duration-300 group-hover:from-emerald-600 group-hover:to-teal-500"
                        style={{ height: `${(d.val / maxVal) * 180}px` }}
                      />
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{d.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Side Panel - Status */}
        <div className="space-y-4">
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground">Status Pinjaman</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Diajukan", count: 3, total: 12, color: "bg-amber-400", text: "text-amber-700 dark:text-amber-400" },
                { label: "Aktif", count: 6, total: 12, color: "bg-emerald-400", text: "text-emerald-700 dark:text-emerald-400" },
                { label: "Lunas", count: 4, total: 12, color: "bg-blue-400", text: "text-blue-700 dark:text-blue-400" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-foreground">{item.label}</span>
                    <span className={`text-sm font-bold ${item.text}`}>{item.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{ width: `${(item.count / item.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Rasio Kesehatan</p>
                  <p className="text-lg font-bold text-foreground">Sehat</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium">Likuiditas</p>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">245%</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium">Solvabilitas</p>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">180%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity — Desktop Table */}
      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm hidden lg:block">
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
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Aktivitas</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Anggota</th>
                  <th className="text-right py-3 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Nominal</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { act: "Setoran Simpanan", user: "Budi Santoso", amt: 50000, status: "Selesai", statusColor: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" },
                  { act: "Pengajuan Pinjaman", user: "Siti Aminah", amt: 12000000, status: "Diproses", statusColor: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
                  { act: "Bayar Angsuran", user: "Budi Santoso", amt: 1120000, status: "Selesai", statusColor: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" },
                  { act: "Pencairan Pinjaman", user: "Test User", amt: 12000000, status: "Aktif", statusColor: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-gray-200/80 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-3 font-medium text-foreground">{row.act}</td>
                    <td className="py-3 px-3 text-gray-500 dark:text-gray-400">{row.user}</td>
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
          { act: "Setoran Simpanan", user: "Budi Santoso", amt: 50000, status: "Selesai", statusColor: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" },
          { act: "Pengajuan Pinjaman", user: "Siti Aminah", amt: 12000000, status: "Diproses", statusColor: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
          { act: "Bayar Angsuran", user: "Budi Santoso", amt: 1120000, status: "Selesai", statusColor: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" },
          { act: "Pencairan Pinjaman", user: "Test User", amt: 12000000, status: "Aktif", statusColor: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" },
        ].map((row, i) => (
          <Card key={i} className="border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-foreground">{row.act}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{row.user}</p>
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
