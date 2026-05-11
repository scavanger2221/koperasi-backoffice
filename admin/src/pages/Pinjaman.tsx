import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HandCoins, Loader2, CheckCircle, Banknote, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";

interface PinjamanItem {
  id: string;
  noPinjaman: string;
  anggotaId: string;
  nama?: string;
  jumlah: string;
  bungaPersen: string;
  jangkaWaktu: number;
  status: string;
  tanggalPengajuan: string;
  angsuranPerBulan: string;
  anggota?: { nama: string; noAnggota: string };
}

const statusConfig: Record<string, { label: string; className: string }> = {
  diajukan: { label: "Diajukan", className: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900" },
  disetujui: { label: "Disetujui", className: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900" },
  aktif: { label: "Aktif", className: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" },
  lunas: { label: "Lunas", className: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700" },
  ditolak: { label: "Ditolak", className: "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900" },
  macet: { label: "Macet", className: "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900" },
};

export default function PinjamanPage() {
  const [tab, setTab] = useState("all");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<PinjamanItem | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["pinjaman", tab],
    queryFn: () =>
      api<{ data: PinjamanItem[] }>(`/api/pinjaman?${tab !== "all" ? `status=${tab}` : ""}`),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api(`/api/pinjaman/${id}/approve`, { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pinjaman"] }),
  });

  const cairMutation = useMutation({
    mutationFn: (id: string) => api(`/api/pinjaman/${id}/cair`, { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pinjaman"] }),
  });

  const openDetail = (p: PinjamanItem) => {
    setSelected(p);
    setDetailOpen(true);
  };

  const totalPinjaman = data?.data?.reduce((acc, p) => acc + Number(p.jumlah), 0) ?? 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Pinjaman</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Kelola pengajuan dan pinjaman anggota</p>
        </div>
        <span className="text-sm font-bold text-foreground bg-card px-3 py-1.5 rounded-lg border border-border shadow-sm self-start">
          Total: {formatRupiah(totalPinjaman)}
        </span>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-card border border-border shadow-sm h-auto flex-wrap">
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="diajukan">Diajukan</TabsTrigger>
          <TabsTrigger value="aktif">Aktif</TabsTrigger>
          <TabsTrigger value="lunas">Lunas</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <HandCoins className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Daftar Pinjaman</span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">No Pinjaman</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Anggota</th>
                      <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Jumlah</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Tenor</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                      <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data?.map((p) => {
                      const s = statusConfig[p.status] || statusConfig.diajukan;
                      return (
                        <tr key={p.id} className="border-b border-border/50 hover:bg-muted/60 transition-colors">
                          <td className="py-3 px-3 font-semibold text-foreground">{p.noPinjaman}</td>
                          <td className="py-3 px-3">
                            <p className="font-medium text-foreground">{p.anggota?.nama || "-"}</p>
                            <p className="text-xs text-muted-foreground">{p.anggota?.noAnggota || p.anggotaId}</p>
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-foreground">{formatRupiah(p.jumlah)}</td>
                          <td className="py-3 px-3 text-muted-foreground">{p.jangkaWaktu} bulan</td>
                          <td className="py-3 px-3">
                            <Badge className={`${s.className} font-medium text-[11px] px-2 py-0.5`} variant="outline">
                              {s.label}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => openDetail(p)}>
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              {p.status === "diajukan" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                  onClick={() => approveMutation.mutate(p.id)}
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              {p.status === "disetujui" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                  onClick={() => cairMutation.mutate(p.id)}
                                >
                                  <Banknote className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {(!data?.data || data.data.length === 0) && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                          Tidak ada data pinjaman
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {data?.data?.map((p) => {
                  const s = statusConfig[p.status] || statusConfig.diajukan;
                  return (
                    <div key={p.id} className="p-4 rounded-xl bg-card border border-border shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{p.noPinjaman}</p>
                          <p className="text-xs text-muted-foreground">{p.anggota?.nama || "-"}</p>
                        </div>
                        <Badge className={`${s.className} font-medium text-[11px] px-2 py-0.5 shrink-0`} variant="outline">
                          {s.label}
                        </Badge>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Jumlah</p>
                          <p className="text-foreground font-semibold">{formatRupiah(p.jumlah)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Tenor</p>
                          <p className="text-foreground">{p.jangkaWaktu} bulan</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Bunga</p>
                          <p className="text-foreground">{p.bungaPersen}%/tahun</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Angsuran</p>
                          <p className="text-foreground">{formatRupiah(p.angsuranPerBulan)}/bln</p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => openDetail(p)}>
                          <Eye className="w-3 h-3 mr-1" />
                          Detail
                        </Button>
                        {p.status === "diajukan" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900 dark:hover:bg-emerald-950/30"
                            onClick={() => approveMutation.mutate(p.id)}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Setuju
                          </Button>
                        )}
                        {p.status === "disetujui" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950/30"
                            onClick={() => cairMutation.mutate(p.id)}
                          >
                            <Banknote className="w-3 h-3 mr-1" />
                            Cairkan
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {(!data?.data || data.data.length === 0) && (
                  <div className="py-12 text-center text-muted-foreground text-sm">
                    Tidak ada data pinjaman
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="border-0 shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Detail Pinjaman</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm mt-2">
              {[
                { label: "No Pinjaman", value: selected.noPinjaman },
                { label: "Anggota", value: selected.anggota?.nama || selected.anggotaId },
                { label: "Jumlah", value: formatRupiah(selected.jumlah) },
                { label: "Bunga", value: `${selected.bungaPersen}% / tahun` },
                { label: "Tenor", value: `${selected.jangkaWaktu} bulan` },
                { label: "Angsuran/Bulan", value: formatRupiah(selected.angsuranPerBulan) },
              ].map((item) => (
                <div key={item.label} className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-foreground">{item.value}</span>
                </div>
              ))}
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Status</span>
                <Badge className={`${statusConfig[selected.status]?.className} font-medium text-[11px] px-2 py-0.5`} variant="outline">
                  {statusConfig[selected.status]?.label}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
