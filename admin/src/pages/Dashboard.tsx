import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, Wallet, HandCoins, AlertTriangle, Activity, UserPlus, CircleDollarSign, Loader2 } from "lucide-react";
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

interface SimpananBulanan {
  label: string;
  month: string;
  year: string;
  total: number;
  totalJuta: number;
}

interface PinjamanStatus {
  diajukan: number;
  disetujui: number;
  aktif: number;
  lunas: number;
  ditolak: number;
  macet: number;
  total: number;
}

interface AktivitasData {
  anggotaBaru: any[];
  simpananBaru: any[];
  pinjamanBaru: any[];
}

const quickActions = [
  { label: "Anggota", icon: UserPlus, path: "/anggota", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" },
  { label: "Simpanan", icon: CircleDollarSign, path: "/simpanan", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" },
  { label: "Pinjaman", icon: HandCoins, path: "/pinjaman", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
];

export default function Dashboard() {
  const { data: ringkasan, isLoading: loadingRingkasan } = useQuery({
    queryKey: ["dashboard-ringkasan"],
    queryFn: () => api<{ data: RingkasanData }>("/api/dashboard/ringkasan"),
  });

  const { data: simpananBulanan, isLoading: loadingChart } = useQuery({
    queryKey: ["dashboard-simpanan-per-bulan"],
    queryFn: () => api<{ data: SimpananBulanan[] }>("/api/dashboard/simpanan-per-bulan"),
  });

  const { data: pinjamanStatus, isLoading: loadingStatus } = useQuery({
    queryKey: ["dashboard-pinjaman-status"],
    queryFn: () => api<{ data: PinjamanStatus }>("/api/dashboard/pinjaman-status"),
  });

  const { data: aktivitas, isLoading: loadingAktivitas } = useQuery({
    queryKey: ["dashboard-aktivitas"],
    queryFn: () => api<{ data: AktivitasData }>("/api/dashboard/aktivitas"),
  });

  const r = ringkasan?.data;

  const stats = [
    {
      label: "Anggota Aktif",
      value: r?.totalAnggota ?? 0,
      icon: Users,
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-100 dark:bg-blue-950/30",
    },
    {
      label: "Total Simpanan",
      value: formatRupiah(r?.totalSimpanan ?? 0),
      icon: Wallet,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-100 dark:bg-emerald-950/30",
    },
    {
      label: "Pinjaman Aktif",
      value: r?.totalPinjamanAktif ?? 0,
      sub: r?.totalPinjaman ? `Rp ${formatRupiah(r.totalPinjaman).replace("Rp", "").trim()}` : undefined,
      icon: HandCoins,
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-100 dark:bg-amber-950/30",
    },
    {
      label: "Tunggakan",
      value: formatRupiah(r?.totalTunggakan ?? 0),
      sub: r?.jumlahAngsuranTunggakan ? `${r.jumlahAngsuranTunggakan} angsuran belum bayar` : undefined,
      icon: AlertTriangle,
      iconColor: "text-red-600 dark:text-red-400",
      iconBg: "bg-red-100 dark:bg-red-950/30",
    },
  ];

  const chartData = simpananBulanan?.data ?? [];
  const maxVal = chartData.length > 0 ? Math.max(...chartData.map((d) => d.totalJuta)) : 1;

  const pinjamanStatusList = [
    { label: "Diajukan", count: pinjamanStatus?.data.diajukan ?? 0, total: pinjamanStatus?.data.total ?? 1, color: "bg-amber-400", text: "text-amber-700 dark:text-amber-400" },
    { label: "Aktif", count: pinjamanStatus?.data.aktif ?? 0, total: pinjamanStatus?.data.total ?? 1, color: "bg-emerald-400", text: "text-emerald-700 dark:text-emerald-400" },
    { label: "Lunas", count: pinjamanStatus?.data.lunas ?? 0, total: pinjamanStatus?.data.total ?? 1, color: "bg-blue-400", text: "text-blue-700 dark:text-blue-400" },
  ];

  // Build recent activity from real data
  const recentActivity: { act: string; user: string; amt: number; status: string; statusColor: string }[] = [];

  if (aktivitas?.data) {
    for (const a of aktivitas.data.simpananBaru.slice(0, 3)) {
      recentActivity.push({
        act: "Setoran Simpanan",
        user: a.anggota?.nama || "-",
        amt: Number(a.jumlah),
        status: "Selesai",
        statusColor: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
      });
    }
    for (const p of aktivitas.data.pinjamanBaru.slice(0, 3)) {
      const statusMap: Record<string, { label: string; color: string }> = {
        diajukan: { label: "Diproses", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
        disetujui: { label: "Disetujui", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" },
        aktif: { label: "Aktif", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" },
        lunas: { label: "Lunas", color: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" },
      };
      const s = statusMap[p.status] || { label: p.status, color: "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300" };
      recentActivity.push({
        act: "Pengajuan Pinjaman",
        user: p.anggota?.nama || "-",
        amt: Number(p.jumlah),
        status: s.label,
        statusColor: s.color,
      });
    }
  }

  const isLoading = loadingRingkasan || loadingChart || loadingStatus || loadingAktivitas;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Ringkasan koperasi per hari ini</p>
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

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
        </div>
      ) : (
        <>
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
                  {s.sub && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <Activity className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      {s.sub}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-5 lg:grid-cols-3">
            {/* Chart Area */}
            <Card className="lg:col-span-2 border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">Pertumbuhan Simpanan</CardTitle>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total simpanan per bulan (dalam jutaan Rupiah)</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-56 text-sm text-gray-500 dark:text-gray-400">
                    Belum ada data simpanan
                  </div>
                ) : (
                  <div className="relative h-56">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="border-t border-gray-100 dark:border-gray-800 w-full" />
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-end justify-between gap-2 px-2">
                      {chartData.map((d) => (
                        <div key={d.label} className="flex-1 flex flex-col items-center gap-2 group">
                          <div className="relative w-full flex justify-center">
                            <span className="absolute -top-5 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                              {d.totalJuta}jt
                            </span>
                            <div
                              className="w-full max-w-[48px] bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg transition-all duration-300 group-hover:from-emerald-600 group-hover:to-teal-500"
                              style={{ height: `${Math.max((d.totalJuta / maxVal) * 180, 4)}px` }}
                            />
                          </div>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{d.month}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Side Panel - Status */}
            <div className="space-y-4">
              <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-foreground">Status Pinjaman</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pinjamanStatusList.map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-foreground">{item.label}</span>
                        <span className={`text-sm font-bold ${item.text}`}>{item.count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all`}
                          style={{ width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%` }}
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
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{(r?.totalPinjaman ?? 0) > 0 ? `${Math.round((r!.totalSimpanan / r!.totalPinjaman) * 100)}%` : "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium">Solvabilitas</p>
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{(r?.totalPinjaman ?? 0) > 0 ? `${Math.round(((r!.totalSimpanan + r!.totalPinjaman) / r!.totalPinjaman) * 100)}%` : "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Activity */}
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-foreground">Aktivitas Terkini</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                  Belum ada aktivitas
                </div>
              ) : (
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
                      {recentActivity.map((row, i) => (
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
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
