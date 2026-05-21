import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, Wallet, HandCoins, AlertTriangle, Activity, BookOpen, Receipt, BarChart3, PiggyBank, Building2, ClipboardList, UserCog, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
  { label: "Buku Kas", icon: BookOpen, path: "/buku-kas", color: "bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400" },
  { label: "Tagihan", icon: Receipt, path: "/tagihan", color: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400" },
  { label: "Laporan", icon: BarChart3, path: "/laporan", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400" },
  { label: "SHU", icon: PiggyBank, path: "/shu", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" },
  { label: "RAT", icon: Building2, path: "/rat", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
  { label: "Audit Log", icon: ClipboardList, path: "/audit", color: "bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400" },
  { label: "Pengguna", icon: UserCog, path: "/users", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
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
      glow: "bg-blue-500",
    },
    {
      label: "Total Simpanan",
      value: formatRupiah(r?.totalSimpanan ?? 0),
      icon: Wallet,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-100 dark:bg-emerald-950/30",
      glow: "bg-emerald-500",
    },
    {
      label: "Pinjaman Aktif",
      value: r?.totalPinjamanAktif ?? 0,
      sub: r?.totalPinjaman ? `Rp ${formatRupiah(r.totalPinjaman).replace("Rp", "").trim()}` : undefined,
      icon: HandCoins,
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-100 dark:bg-amber-950/30",
      glow: "bg-amber-500",
    },
    {
      label: "Tunggakan",
      value: formatRupiah(r?.totalTunggakan ?? 0),
      sub: r?.jumlahAngsuranTunggakan ? `${r.jumlahAngsuranTunggakan} angsuran belum bayar` : undefined,
      icon: AlertTriangle,
      iconColor: "text-red-600 dark:text-red-400",
      iconBg: "bg-red-100 dark:bg-red-950/30",
      glow: "bg-red-500",
    },
  ];

  const chartData = simpananBulanan?.data ?? [];

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
          <p className="text-sm text-muted-foreground mt-0.5">Ringkasan koperasi per hari ini</p>
        </div>
      </div>

      {/* Quick Actions — Links to secondary pages */}
      <Card className="border border-border shadow-sm" noHover>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">Menu Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {quickActions.map((a) => (
              <Link
                key={a.path}
                to={a.path}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card border border-border/60 hover:border-primary/50 hover:bg-primary/5 hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color} shadow-sm`}>
                  <a.icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-foreground text-center leading-tight mt-1">{a.label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label} className="relative overflow-hidden border border-border shadow-sm card-hover">
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[40px] opacity-15 dark:opacity-20 -mr-10 -mt-10 pointer-events-none ${s.glow}`} />
                <CardHeader className="relative flex flex-row items-center justify-between pb-2 z-10">
                  <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    {s.label}
                  </CardTitle>
                  <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center shadow-sm`}>
                    <s.icon className={`w-5 h-5 ${s.iconColor}`} />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-2xl font-black tracking-tight text-foreground">{s.value}</div>
                  {s.sub && (
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground font-medium">
                      <Activity className="w-3 h-3 text-primary" />
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
            <Card className="lg:col-span-2 border border-border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">Pertumbuhan Simpanan</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Total simpanan per bulan (dalam jutaan Rupiah)</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                    Belum ada data simpanan
                  </div>
                ) : (
                  <div className="h-64 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/50" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor' }} className="text-muted-foreground" dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor' }} className="text-muted-foreground" dx={-10} />
                        <Tooltip
                          cursor={{ fill: 'currentColor', className: 'text-muted/20 dark:text-muted/10' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-card border border-border shadow-lg rounded-xl p-3">
                                  <p className="text-xs text-muted-foreground font-medium mb-1">{payload[0].payload.label}</p>
                                  <p className="text-sm font-bold text-foreground">Rp {payload[0].value} Juta</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="totalJuta"
                          fill="var(--color-primary)"
                          radius={[6, 6, 0, 0]}
                          className="fill-primary"
                          animationDuration={1500}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Side Panel - Status */}
            <div className="space-y-4">
              <Card className="border border-border shadow-sm">
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

              <Card className="border border-border shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Rasio Kesehatan</p>
                      <p className="text-xl font-black text-foreground tracking-tight">Sehat</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Likuiditas</p>
                      <p className="text-sm font-black text-primary">{(r?.totalPinjaman ?? 0) > 0 ? `${Math.round((r!.totalSimpanan / r!.totalPinjaman) * 100)}%` : "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Solvabilitas</p>
                      <p className="text-sm font-black text-primary">{(r?.totalPinjaman ?? 0) > 0 ? `${Math.round(((r!.totalSimpanan + r!.totalPinjaman) / r!.totalPinjaman) * 100)}%` : "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Activity */}
          <Card className="border border-border shadow-sm" noHover>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-foreground">Aktivitas Terkini</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  Belum ada aktivitas
                </div>
              ) : (
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
                      {recentActivity.map((row, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-muted/40 transition-colors group">
                          <td className="py-3 px-3 font-medium text-foreground group-hover:text-primary transition-colors">{row.act}</td>
                          <td className="py-3 px-3 text-muted-foreground">{row.user}</td>
                          <td className="py-3 px-3 text-right font-semibold text-foreground">{formatRupiah(row.amt)}</td>
                          <td className="py-3 px-3">
                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md ${row.statusColor}`}>
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
