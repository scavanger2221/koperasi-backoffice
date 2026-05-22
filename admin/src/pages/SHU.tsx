import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PiggyBank,
  Loader2,
  CheckCircle,
  FileCheck,
  Share2,
  Eye,
  Trash2,
  Calculator,
  Check,
  Users,
  FileDown,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormField } from "@/components/ui/form-field";
import { api, downloadBlob } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";
import { rules, validate, type FieldErrors } from "@/lib/validation";
import { useToast } from "@/hooks/useToast";

interface ShuItem {
  id: string;
  periode: string;
  totalShu: string;
  totalPendapatan: string;
  totalBiaya: string;
  alokasiAnggota: string;
  alokasiCadangan: string;
  alokasiPengurus: string;
  alokasiPendidikan: string;
  alokasiSosial: string;
  alokasiLain: string;
  danaAnggota: string;
  danaCadangan: string;
  danaPengurus: string;
  danaPendidikan: string;
  danaSosial: string;
  danaLain: string;
  totalSimpanan: string;
  totalTransaksi: string;
  status: "draft" | "dikonfirmasi" | "disahkan" | "dibagikan";
  keterangan?: string;
  createdAt: string;
}

interface ShuAnggotaItem {
  id: string;
  shuId: string;
  anggotaId: string;
  jma: string;
  jua: string;
  total: string;
  simpananAnggota: string;
  transaksiAnggota: string;
  status: string;
  anggota?: { nama: string; noAnggota: string };
}

interface ShuDetail extends ShuItem {
  anggotaList: ShuAnggotaItem[];
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900",
  },
  dikonfirmasi: {
    label: "Dikonfirmasi",
    className:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900",
  },
  disahkan: {
    label: "Disahkan",
    className:
      "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900",
  },
  dibagikan: {
    label: "Dibagikan",
    className:
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900",
  },
};

const statusSteps = [
  { key: "draft", label: "Draft" },
  { key: "dikonfirmasi", label: "Dikonfirmasi" },
  { key: "disahkan", label: "Disahkan" },
  { key: "dibagikan", label: "Dibagikan" },
];

export default function SHUPage() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [hitungOpen, setHitungOpen] = useState(false);
  const [selected, setSelected] = useState<ShuItem | null>(null);
  const [periodeHitung, setPeriodeHitung] = useState(new Date().getFullYear().toString());
  const [hitungErrors, setHitungErrors] = useState<FieldErrors>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ type: "konfirmasi" | "sahkan" | "bagikan" | "hapus"; id: string } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["shu"],
    queryFn: () => api<{ data: ShuItem[] }>("/api/shu"),
  });

  const hitungMutation = useMutation({
    mutationFn: (periode: string) =>
      api("/api/shu/hitung", {
        method: "POST",
        body: JSON.stringify({ periode }),
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["shu"] });
      setHitungOpen(false);
      setHitungErrors({});
      toast(`SHU periode ${res?.data?.periode} berhasil dihitung`, "success");
    },
    onError: () => toast("Gagal menghitung SHU", "error"),
  });

  const konfirmasiMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/api/shu/${id}/konfirmasi`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shu"] });
      queryClient.invalidateQueries({ queryKey: ["shu-detail"] });
      toast("SHU dikonfirmasi", "success");
    },
    onError: () => toast("Gagal mengkonfirmasi SHU", "error"),
  });

  const sahkanMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/api/shu/${id}/sahkan`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shu"] });
      queryClient.invalidateQueries({ queryKey: ["shu-detail"] });
      toast("SHU disahkan", "success");
    },
    onError: () => toast("Gagal mengesahkan SHU", "error"),
  });

  const bagikanMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/api/shu/${id}/bagikan`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shu"] });
      queryClient.invalidateQueries({ queryKey: ["shu-detail"] });
      toast("SHU dibagikan ke anggota", "success");
    },
    onError: () => toast("Gagal membagikan SHU", "error"),
  });

  const hapusMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/api/shu/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shu"] });
      setDetailOpen(false);
      toast("SHU berhasil dihapus", "success");
    },
    onError: () => toast("Gagal menghapus SHU", "error"),
  });

  const { data: detailQuery, isLoading: detailLoading } = useQuery({
    queryKey: ["shu-detail", selected?.id],
    queryFn: () => api<{ data: ShuDetail }>(`/api/shu/${selected!.id}`),
    enabled: !!selected && detailOpen,
  });

  const openDetail = (s: ShuItem) => {
    setSelected(s);
    setDetailOpen(true);
  };

  const handleHitung = () => {
    const errs = validate(
      { periode: periodeHitung },
      { periode: [rules.year("Tahun buku")] }
    );
    setHitungErrors(errs);
    if (Object.keys(errs).length > 0) return;
    hitungMutation.mutate(periodeHitung);
  };

  const confirmAction = () => {
    if (!confirmTarget) return;
    switch (confirmTarget.type) {
      case "konfirmasi":
        konfirmasiMutation.mutate(confirmTarget.id);
        break;
      case "sahkan":
        sahkanMutation.mutate(confirmTarget.id);
        break;
      case "bagikan":
        bagikanMutation.mutate(confirmTarget.id);
        break;
      case "hapus":
        hapusMutation.mutate(confirmTarget.id);
        break;
    }
  };

  const currentStatusIndex = (status: string) => {
    return statusSteps.findIndex((s) => s.key === status);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            SHU (Sisa Hasil Usaha)
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Hitung & kelola pembagian SHU tahunan koperasi
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          {/* Export Rekap XLSX */}
          <Button
            variant="outline"
            className="h-9"
            onClick={() => downloadBlob("/api/shu/export/xlsx", "rekap-shu.xlsx")}
          >
            <FileDown className="w-4 h-4 mr-1" />
            Export XLSX
          </Button>
          <Dialog open={hitungOpen} onOpenChange={(v) => {
            setHitungOpen(v);
            if (!v) setHitungErrors({});
          }}>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-9"
              onClick={() => setHitungOpen(true)}
            >
              <Calculator className="w-4 h-4 mr-1" />
              Hitung SHU Baru
            </Button>
            <DialogContent className="border-0 shadow-xl max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-lg flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-600" />
                  Hitung SHU Periode
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <FormField
                  label="Tahun Buku"
                  required
                  error={hitungErrors.periode}
                  hint="SHU akan dihitung dari pendapatan - biaya sepanjang tahun ini"
                >
                  <Input
                    type="number"
                    min="2020"
                    max="2099"
                    placeholder="2026"
                    value={periodeHitung}
                    onChange={(e) => {
                      setPeriodeHitung(e.target.value);
                      setHitungErrors((prev) => ({ ...prev, periode: "" }));
                    }}
                  />
                </FormField>

                {hitungMutation.isError && (
                  <p className="text-sm text-red-600">
                    Gagal menghitung SHU. Pastikan tahun valid dan belum ada SHU untuk periode ini.
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setHitungOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleHitung}
                    disabled={hitungMutation.isPending || !periodeHitung}
                  >
                    {hitungMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        Menghitung...
                      </>
                    ) : (
                      "Hitung SHU"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      {data?.data && data.data.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-emerald-100">Total SHU</p>
              <p className="text-xl font-bold mt-1">
                {formatRupiah(
                  data.data.reduce((acc, s) => acc + Number(s.totalShu), 0)
                )}
              </p>
            </CardContent>
          </Card>
          <Card className="border border-border shadow-sm bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">Periode</p>
              <p className="text-xl font-bold text-foreground mt-1">
                {data.data.length} tahun
              </p>
            </CardContent>
          </Card>
          <Card className="border border-border shadow-sm bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">Draft / Aktif</p>
              <p className="text-xl font-bold text-foreground mt-1">
                {
                  data.data.filter(
                    (s) => s.status !== "dibagikan"
                  ).length
                }
              </p>
            </CardContent>
          </Card>
          <Card className="border border-border shadow-sm bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">Dibagikan</p>
              <p className="text-xl font-bold text-foreground mt-1">
                {
                  data.data.filter((s) => s.status === "dibagikan")
                    .length
                }
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card className="border border-border shadow-sm" noHover>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              Periode SHU
            </span>
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
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                        Periode
                      </th>
                      <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                        Total SHU
                      </th>
                      <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                        Dana Anggota
                      </th>
                      <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                        Cadangan
                      </th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data?.map((s) => {
                      const cfg = statusConfig[s.status] || statusConfig.draft;
                      return (
                        <tr
                          key={s.id}
                          className={`border-b border-border/50 hover:bg-muted/60 transition-colors row-status row-status-${s.status}`}
                        >
                          <td className="py-3 px-3 font-semibold text-foreground">
                            {s.periode}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-foreground">
                            {formatRupiah(s.totalShu)}
                          </td>
                          <td className="py-3 px-3 text-right text-foreground">
                            {formatRupiah(s.danaAnggota)}
                          </td>
                          <td className="py-3 px-3 text-right text-foreground">
                            {formatRupiah(s.danaCadangan)}
                          </td>
                          <td className="py-3 px-3">
                            <Badge
                              className={`${cfg.className} font-medium text-[11px] px-2 py-0.5`}
                              variant="outline"
                            >
                              {cfg.label}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                onClick={() => openDetail(s)}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              {s.status === "draft" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                  onClick={() => {
                                    setConfirmTarget({ type: "konfirmasi", id: s.id });
                                    setConfirmOpen(true);
                                  }}
                                  title="Konfirmasi SHU"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              {s.status === "dikonfirmasi" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8 text-muted-foreground hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                                  onClick={() => {
                                    setConfirmTarget({ type: "sahkan", id: s.id });
                                    setConfirmOpen(true);
                                  }}
                                  title="Sahkan SHU"
                                >
                                  <FileCheck className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              {s.status === "disahkan" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                  onClick={() => {
                                    setConfirmTarget({ type: "bagikan", id: s.id });
                                    setConfirmOpen(true);
                                  }}
                                  title="Bagikan SHU"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {(!data?.data || data.data.length === 0) && (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-12 text-center text-muted-foreground text-sm"
                        >
                          Belum ada data SHU. Klik "Hitung SHU Baru" untuk
                          memulai.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {data?.data?.map((s) => {
                  const cfg = statusConfig[s.status] || statusConfig.draft;
                  return (
                    <div
                      key={s.id}
                      className="p-5 rounded-2xl bg-card border border-border shadow-sm active:scale-[0.98] transition-transform"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-foreground text-lg">
                            {s.periode}
                          </p>
                        </div>
                        <Badge
                          className={`${cfg.className} font-medium text-[11px] px-2 py-0.5 shrink-0`}
                          variant="outline"
                        >
                          {cfg.label}
                        </Badge>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">
                            Total SHU
                          </p>
                          <p className="text-foreground font-semibold">
                            {formatRupiah(s.totalShu)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">
                            Dana Anggota
                          </p>
                          <p className="text-foreground font-semibold">
                            {formatRupiah(s.danaAnggota)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">
                            Cadangan
                          </p>
                          <p className="text-foreground">
                            {formatRupiah(s.danaCadangan)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">
                            Pendapatan
                          </p>
                          <p className="text-foreground">
                            {formatRupiah(s.totalPendapatan)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                            className="flex-auto h-10 text-xs"
                          onClick={() => openDetail(s)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Detail
                        </Button>
                        {s.status === "draft" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-auto h-10 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950/30"
                            onClick={() =>
                              konfirmasiMutation.mutate(s.id)
                            }
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Konfirmasi
                          </Button>
                        )}
                        {s.status === "dikonfirmasi" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-auto h-10 text-xs text-purple-600 border-purple-200 hover:bg-purple-50 dark:border-purple-900 dark:hover:bg-purple-950/30"
                            onClick={() =>
                              sahkanMutation.mutate(s.id)
                            }
                          >
                            <FileCheck className="w-3 h-3 mr-1" />
                            Sahkan
                          </Button>
                        )}
                        {s.status === "disahkan" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-auto h-10 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900 dark:hover:bg-emerald-950/30"
                            onClick={() =>
                              bagikanMutation.mutate(s.id)
                            }
                          >
                            <Share2 className="w-3 h-3 mr-1" />
                            Bagikan
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {(!data?.data || data.data.length === 0) && (
                  <div className="py-12 text-center text-muted-foreground text-sm">
                    Belum ada data SHU. Klik "Hitung SHU Baru" untuk memulai.
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

        {/* Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[90vh] overflow-y-auto border-0 shadow-xl pr-12">
            {detailLoading ? (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg flex items-center gap-2">
                    <PiggyBank className="w-5 h-5 text-emerald-600" />
                    Detail SHU
                  </DialogTitle>
                </DialogHeader>
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              </>
            ) : detailQuery?.data ? (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg flex items-center gap-2 pr-10">
                    <PiggyBank className="w-5 h-5 text-emerald-600" />
                    Detail SHU {detailQuery.data.periode}
                    <Badge
                      className={`${statusConfig[detailQuery.data.status].className} font-medium text-[11px] px-2 py-0.5 ml-2`}
                      variant="outline"
                    >
                      {statusConfig[detailQuery.data.status].label}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Status Progress Stepper */}
                  <div className="flex items-center justify-center gap-2 py-2">
                    {statusSteps.map((step, idx) => {
                      const currentIdx = currentStatusIndex(detailQuery.data.status);
                      const done = idx <= currentIdx;
                      return (
                        <div key={step.key} className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              done ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                          </div>
                          <span className={`text-xs font-medium ${done ? "text-foreground" : "text-muted-foreground"}`}>
                            {step.label}
                          </span>
                          {idx < statusSteps.length - 1 && (
                            <div className={`w-8 h-px mx-1 ${idx < currentIdx ? "bg-emerald-500" : "bg-border"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 flex items-center gap-3 rounded-xl bg-muted">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Total Pendapatan</p>
                        <p className="text-lg font-bold text-foreground truncate">
                          {formatRupiah(detailQuery.data.totalPendapatan)}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 flex items-center gap-3 rounded-xl bg-muted">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center shrink-0">
                        <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Total Biaya</p>
                        <p className="text-lg font-bold text-foreground truncate">
                          {formatRupiah(detailQuery.data.totalBiaya)}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 flex items-center gap-3 rounded-xl bg-muted sm:col-span-2 lg:col-span-1">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
                        <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">SHU Bersih</p>
                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 truncate">
                          {formatRupiah(detailQuery.data.totalShu)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Alokasi & Per-Anggota */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Alokasi SHU */}
                    <div className="p-4 rounded-xl bg-muted">
                      <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-emerald-600 rounded-full"></span>
                        Alokasi SHU
                      </p>
                      <div className="space-y-2">
                        {[
                          { label: "Dana Anggota", value: detailQuery.data.danaAnggota, pct: detailQuery.data.alokasiAnggota, color: "text-emerald-600 dark:text-emerald-400" },
                          { label: "Dana Cadangan", value: detailQuery.data.danaCadangan, pct: detailQuery.data.alokasiCadangan, color: "text-blue-600 dark:text-blue-400" },
                          { label: "Dana Pengurus", value: detailQuery.data.danaPengurus, pct: detailQuery.data.alokasiPengurus, color: "text-purple-600 dark:text-purple-400" },
                          { label: "Dana Pendidikan", value: detailQuery.data.danaPendidikan, pct: detailQuery.data.alokasiPendidikan, color: "text-amber-600 dark:text-amber-400" },
                          { label: "Dana Sosial", value: detailQuery.data.danaSosial, pct: detailQuery.data.alokasiSosial, color: "text-rose-600 dark:text-rose-400" },
                          { label: "Dana Lain-lain", value: detailQuery.data.danaLain, pct: detailQuery.data.alokasiLain, color: "text-gray-600 dark:text-gray-400" },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-card transition-colors">
                            <div className="flex items-center gap-2.5">
                              <span className="text-xs font-bold text-muted-foreground bg-card px-2 py-1 rounded-md font-mono">
                                {item.pct}%
                              </span>
                              <span className="text-sm font-medium text-foreground">{item.label}</span>
                            </div>
                            <span className={`text-sm font-semibold ${item.color}`}>
                              {formatRupiah(item.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Per-Anggota Rincian */}
                    {detailQuery.data.anggotaList && detailQuery.data.anggotaList.length > 0 && (
                      <div className="p-4 rounded-xl bg-muted">
                        <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          Rincian per Anggota
                        </p>
                        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                          {detailQuery.data.anggotaList.map((a) => (
                            <div
                              key={a.id}
                              className="flex items-center justify-between p-2.5 rounded-lg bg-card"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {a.anggota?.nama || "-"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {a.anggota?.noAnggota || ""} · JMA: {formatRupiah(a.jma)} · JUA: {formatRupiah(a.jua)}
                                </p>
                              </div>
                              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 ml-3 shrink-0">
                                {formatRupiah(a.total)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900 dark:hover:bg-emerald-950/30"
                      onClick={() => downloadBlob(`/api/shu/${selected!.id}/export/xlsx`, `shu-${selected!.periode}.xlsx`)}
                    >
                      <FileDown className="w-4 h-4 mr-1.5" />
                      XLSX
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
                      onClick={() => downloadBlob(`/api/shu/${selected!.id}/export/pdf`, `shu-${selected!.periode}.pdf`)}
                    >
                      <FileDown className="w-4 h-4 mr-1.5" />
                      PDF
                    </Button>
                    {detailQuery.data.status === "draft" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
                          onClick={() => {
                            setConfirmTarget({ type: "hapus", id: detailQuery.data.id });
                            setConfirmOpen(true);
                          }}
                          disabled={hapusMutation.isPending}
                        >
                          {hapusMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-1.5" />
                          )}
                          Hapus
                        </Button>
                        <Button
                          size="sm"
                          className="ml-auto bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => {
                            setConfirmTarget({ type: "konfirmasi", id: detailQuery.data.id });
                            setConfirmOpen(true);
                          }}
                          disabled={konfirmasiMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-1.5" />
                          Konfirmasi
                        </Button>
                      </>
                    )}
                    {detailQuery.data.status === "dikonfirmasi" && (
                      <Button
                        size="sm"
                        className="ml-auto bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => {
                          setConfirmTarget({ type: "sahkan", id: detailQuery.data.id });
                          setConfirmOpen(true);
                        }}
                        disabled={sahkanMutation.isPending}
                      >
                        <FileCheck className="w-4 h-4 mr-1.5" />
                        Sahkan SHU
                      </Button>
                    )}
                    {detailQuery.data.status === "disahkan" && (
                      <Button
                        size="sm"
                        className="ml-auto bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => {
                          setConfirmTarget({ type: "bagikan", id: detailQuery.data.id });
                          setConfirmOpen(true);
                        }}
                        disabled={bagikanMutation.isPending}
                      >
                        <Share2 className="w-4 h-4 mr-1.5" />
                        Bagikan ke Anggota
                      </Button>
                    )}
                    {detailQuery.data.status === "dibagikan" && (
                      <div className="ml-auto flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                        <Check className="w-4 h-4" />
                        SHU sudah dibagikan
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <DialogTitle className="sr-only">Detail SHU</DialogTitle>
            )}
          </DialogContent>
        </Dialog>


       {/* Confirm action dialog */}
       <ConfirmDialog
         open={confirmOpen}
         onOpenChange={(v) => { setConfirmOpen(v); if (!v) setConfirmTarget(null); }}
         title={
           confirmTarget?.type === "konfirmasi"
             ? "Konfirmasi SHU?"
             : confirmTarget?.type === "sahkan"
             ? "Sahkan SHU?"
             : confirmTarget?.type === "bagikan"
             ? "Bagikan SHU ke Anggota?"
             : "Hapus SHU?"
         }
         description={
           confirmTarget?.type === "konfirmasi"
             ? "SHU akan dikonfirmasi. Status akan berubah menjadi Dikonfirmasi."
             : confirmTarget?.type === "sahkan"
             ? "SHU akan disahkan. Data tidak dapat diubah lagi setelah disahkan."
             : confirmTarget?.type === "bagikan"
             ? "SHU akan dibagikan ke semua anggota. Proses ini tidak dapat dibatalkan."
             : "SHU akan dihapus secara permanen. Data yang terhapus tidak dapat dikembalikan."
         }
         confirmLabel="Ya, Lanjutkan"
         variant={
           confirmTarget?.type === "hapus"
             ? "destructive"
             : confirmTarget?.type === "bagikan"
             ? "warning"
             : "info"
         }
         onConfirm={confirmAction}
         disabled={konfirmasiMutation.isPending || sahkanMutation.isPending || bagikanMutation.isPending || hapusMutation.isPending}
       />

       {/* Mobile-only Detail Dialog - completely separate design */}
       <Dialog open={detailOpen && isMobile} onOpenChange={(v) => { if (!v) setDetailOpen(false); }}>
         <DialogContent className="max-w-full max-w-[360px] max-h-[100dvh] sm:h-auto sm:max-w-md overflow-y-auto border-0 shadow-xl rounded-none sm:rounded-lg p-3 pr-4">
              {detailLoading ? (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-base">Detail SHU</DialogTitle>
                  </DialogHeader>
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                </>
              ) : detailQuery?.data ? (
                <>
                  <DialogHeader className="pr-6">
                   <DialogTitle className="text-base flex items-center gap-2">
                     <PiggyBank className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                     <span className="truncate">{detailQuery.data.periode}</span>
                     <Badge
                       className={`${statusConfig[detailQuery.data.status].className} font-medium text-[10px] px-1.5 py-0.5 ml-auto flex-shrink-0`}
                       variant="outline"
                     >
                       {statusConfig[detailQuery.data.status].label}
                     </Badge>
                   </DialogTitle>
                 </DialogHeader>

                 <div className="space-y-4">

                {/* Stats in stacked single column on mobile */}
                <div className="grid grid-cols-1 gap-2">
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                    <p className="text-[10px] text-blue-700 dark:text-blue-300 uppercase font-semibold">Pendapatan</p>
                    <p className="text-sm font-bold text-blue-900 dark:text-blue-100 mt-1 break-all">
                      {formatRupiah(detailQuery.data.totalPendapatan)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30">
                    <p className="text-[10px] text-rose-700 dark:text-rose-300 uppercase font-semibold">Biaya</p>
                    <p className="text-sm font-bold text-rose-900 dark:text-rose-100 mt-1 break-all">
                      {formatRupiah(detailQuery.data.totalBiaya)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase font-semibold">SHU Bersih</p>
                    <p className="text-base font-bold text-emerald-700 dark:text-emerald-300 mt-1 break-all">
                      {formatRupiah(detailQuery.data.totalShu)}
                    </p>
                  </div>
                </div>

                {/* Status Progress */}
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1.5">Status</p>
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 -mx-1 px-1">
                    {statusSteps.map((step, idx) => {
                      const currentIdx = currentStatusIndex(detailQuery.data.status);
                      const done = idx <= currentIdx;
                      return (
                        <div key={step.key} className="flex items-center gap-1 flex-shrink-0">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                            done ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
                          }`}>
                            {done ? <Check className="w-3 h-3" /> : idx + 1}
                          </div>
                          <span className={`text-[9px] leading-tight max-w-[50px] ${done ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                            {step.label}
                          </span>
                          {idx < statusSteps.length - 1 && (
                            <div className={`w-3 h-px mx-0.5 flex-shrink-0 ${idx < currentIdx ? "bg-emerald-500" : "bg-border"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Alokasi - accordion style on mobile */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground">Alokasi SHU</p>
                  {[
                    { label: "Anggota", value: detailQuery.data.danaAnggota, pct: detailQuery.data.alokasiAnggota, color: "text-emerald-600" },
                    { label: "Cadangan", value: detailQuery.data.danaCadangan, pct: detailQuery.data.alokasiCadangan, color: "text-blue-600" },
                    { label: "Pengurus", value: detailQuery.data.danaPengurus, pct: detailQuery.data.alokasiPengurus, color: "text-purple-600" },
                    { label: "Pendidikan", value: detailQuery.data.danaPendidikan, pct: detailQuery.data.alokasiPendidikan, color: "text-amber-600" },
                    { label: "Sosial", value: detailQuery.data.danaSosial, pct: detailQuery.data.alokasiSosial, color: "text-rose-600" },
                    { label: "Lain-lain", value: detailQuery.data.danaLain, pct: detailQuery.data.alokasiLain, color: "text-gray-600" },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-muted">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-foreground truncate">{item.label}</span>
                        <span className="text-[9px] font-mono text-muted-foreground ml-2 flex-shrink-0">{item.pct}%</span>
                      </div>
                      <span className={`text-[11px] font-bold ${item.color} truncate block`}>{formatRupiah(item.value)}</span>
                    </div>
                  ))}
                </div>

                {/* Per-Anggota - condensed list */}
                {detailQuery.data.anggotaList && detailQuery.data.anggotaList.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1.5">Rincian per Anggota</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {detailQuery.data.anggotaList.map((a) => (
                        <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-card gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-medium text-foreground truncate">{a.anggota?.nama || "-"}</p>
                            <p className="text-[9px] text-muted-foreground truncate">
                              {a.anggota?.noAnggota || ""} · JMA: {formatRupiah(a.jma)}
                            </p>
                          </div>
                          <span className="text-[11px] font-bold text-emerald-600 ml-2 shrink-0 whitespace-nowrap">
                            {formatRupiah(a.total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions - full width buttons */}
                <div className="space-y-2 pt-3 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-emerald-600 border-emerald-200"
                    onClick={() => downloadBlob(`/api/shu/${selected!.id}/export/xlsx`, `shu-${selected!.periode}.xlsx`)}
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Export XLSX
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-red-600 border-red-200"
                    onClick={() => downloadBlob(`/api/shu/${selected!.id}/export/pdf`, `shu-${selected!.periode}.pdf`)}
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                  {detailQuery.data.status === "draft" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-red-600 border-red-200"
                        onClick={() => {
                          setConfirmTarget({ type: "hapus", id: detailQuery.data.id });
                          setConfirmOpen(true);
                        }}
                        disabled={hapusMutation.isPending}
                      >
                        {hapusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                        Hapus
                      </Button>
                      <Button
                        size="sm"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          setConfirmTarget({ type: "konfirmasi", id: detailQuery.data.id });
                          setConfirmOpen(true);
                        }}
                        disabled={konfirmasiMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Konfirmasi
                      </Button>
                    </>
                  )}
                  {detailQuery.data.status === "dikonfirmasi" && (
                    <Button
                      size="sm"
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => {
                        setConfirmTarget({ type: "sahkan", id: detailQuery.data.id });
                        setConfirmOpen(true);
                      }}
                      disabled={sahkanMutation.isPending}
                    >
                      <FileCheck className="w-4 h-4 mr-2" />
                      Sahkan SHU
                    </Button>
                  )}
                  {detailQuery.data.status === "disahkan" && (
                    <Button
                      size="sm"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        setConfirmTarget({ type: "bagikan", id: detailQuery.data.id });
                        setConfirmOpen(true);
                      }}
                      disabled={bagikanMutation.isPending}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Bagikan ke Anggota
                    </Button>
                  )}
                  {detailQuery.data.status === "dibagikan" && (
                    <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 font-medium py-2">
                      <Check className="w-4 h-4" />
                      SHU sudah dibagikan
                    </div>
                  )}
                 </div>
               </div>
               </>
              ) : (
                <DialogTitle className="sr-only">Detail SHU</DialogTitle>
              )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }
