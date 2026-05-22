import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormField } from "@/components/ui/form-field";
import { Plus, AlertTriangle, CheckCircle, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { rules, validate, type FieldErrors } from "@/lib/validation";
import { formatRupiah } from "@/lib/utils";

interface Tagihan {
  id: string;
  anggotaId: string;
  periode: string;
  jenis: string;
  jumlah: string;
  status: string;
  tanggalBayar: string | null;
  anggota: { nama: string; noAnggota: string } | null;
}

interface Summary {
  belum_bayar: number;
  lunas: number;
  tunggakan: number;
  totalBelumBayar: number;
  totalLunas: number;
  totalTunggakan: number;
  periode: string;
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    lunas: { label: "Lunas", className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" },
    tunggakan: { label: "Tunggakan", className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900" },
    belum_bayar: { label: "Belum Bayar", className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900" },
  };
  const s = map[status] || { label: status, className: "bg-muted text-muted-foreground border-border" };
  return <Badge className={`${s.className} font-medium text-[11px] px-2 py-0.5`} variant="outline">{s.label}</Badge>;
}

export default function TagihanPage() {
  const [periodeFilter, setPeriodeFilter] = useState(new Date().toISOString().slice(0, 7));
  const [generatePeriode, setGeneratePeriode] = useState(new Date().toISOString().slice(0, 7));
  const [generateJumlah, setGenerateJumlah] = useState("50000");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ type: "bayar" | "generate"; id?: string } | null>(null);
  const { toast } = useToast();

  const { data: summaryQuery } = useQuery({
    queryKey: ["tagihan-summary", periodeFilter],
    queryFn: () => api<{ data: Summary }>(`/api/tagihan/summary?periode=${periodeFilter}`),
    staleTime: 30_000,
  });

  const summary = summaryQuery?.data;

  const { data: tagihanData, isLoading, refetch } = useQuery({
    queryKey: ["tagihan", periodeFilter],
    queryFn: () => api<{ data: Tagihan[] }>(`/api/tagihan?periode=${periodeFilter}&limit=100`),
    staleTime: 30_000,
  });

  const tagihan: Tagihan[] = tagihanData?.data ?? [];

  const confirmAction = async () => {
    if (!confirmTarget) return;
    if (confirmTarget.type === "bayar" && confirmTarget.id) {
      try {
        const tanggalBayar = new Date().toISOString().split("T")[0];
        await api("/api/tagihan/bayar", {
          method: "POST",
          body: JSON.stringify({ tagihanId: confirmTarget.id, tanggalBayar }),
        });
        refetch();
        toast("Tagihan berhasil dibayar", "success");
      } catch {
        toast("Gagal membayar tagihan", "error");
      }
    } else if (confirmTarget.type === "generate") {
      try {
        await api("/api/tagihan/generate", {
          method: "POST",
          body: JSON.stringify({ periode: generatePeriode, jumlah: generateJumlah }),
        });
        setDialogOpen(false);
        setErrors({});
        refetch();
        toast("Tagihan berhasil digenerate", "success");
      } catch {
        toast("Gagal generate tagihan", "error");
      }
    }
  };

  const handleGenerate = () => {
    const errs = validate(
      { periode: generatePeriode, jumlah: generateJumlah },
      {
        periode: [rules.required("Periode")],
        jumlah: [rules.required("Jumlah"), rules.positiveNumber("Jumlah")],
      }
    );
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setConfirmTarget({ type: "generate" });
    setConfirmOpen(true);
  };

  const handleBayar = (id: string) => {
    setConfirmTarget({ type: "bayar", id });
    setConfirmOpen(true);
  };

  const handleCekTunggakan = async () => {
    try {
      await api("/api/tagihan/cek-tunggakan", { method: "POST" });
      refetch();
      toast("Tunggakan berhasil diperbarui", "success");
    } catch {
      toast("Gagal cek tunggakan", "error");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Tagihan Simpanan Wajib</h1>
          <p className="text-muted-foreground text-sm mt-1">Kelola tagihan simpanan wajib bulanan anggota</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => {
        setDialogOpen(v);
        if (!v) setErrors({});
      }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Generate Tagihan</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Tagihan Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <FormField label="Periode" required error={errors.periode} hint="Format: YYYY-MM">
                <Input
                  value={generatePeriode}
                  onChange={(e) => {
                    setGeneratePeriode(e.target.value);
                    setErrors((prev) => ({ ...prev, periode: "" }));
                  }}
                  placeholder="2026-05"
                />
              </FormField>
              <FormField label="Jumlah per Anggota" required error={errors.jumlah}>
                <Input
                  value={generateJumlah}
                  onChange={(e) => {
                    setGenerateJumlah(e.target.value);
                    setErrors((prev) => ({ ...prev, jumlah: "" }));
                  }}
                  type="number"
                  min="1000"
                  step="5000"
                />
              </FormField>
              <Button onClick={handleGenerate} className="w-full">
                Generate
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-border shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{summary.belum_bayar + summary.lunas + summary.tunggakan}</p>
                <p className="text-xs text-muted-foreground">Total Tagihan</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{summary.belum_bayar}</p>
                <p className="text-xs text-muted-foreground">Belum Bayar</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{summary.lunas}</p>
                <p className="text-xs text-muted-foreground">Lunas</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{summary.tunggakan}</p>
                <p className="text-xs text-muted-foreground">Tunggakan</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border border-border shadow-sm" noHover>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Filter Periode</span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Input type="month" value={periodeFilter} onChange={(e) => setPeriodeFilter(e.target.value)} className="flex-1 min-w-[140px] max-w-[180px]" />
          <Button variant="outline" onClick={handleCekTunggakan}>
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            Cek Tunggakan
          </Button>
        </CardContent>
        <CardContent>
          {isLoading && <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>}
          {!isLoading && (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">No Anggota</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Nama</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Periode</th>
                      <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Jumlah</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                      <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tagihan.map((t) => (
                      <tr key={t.id} className={`border-b border-border/50 hover:bg-muted/60 transition-colors row-status row-status-${t.status}`}>
                        <td className="py-3 px-3 font-mono text-xs">{t.anggota?.noAnggota}</td>
                        <td className="py-3 px-3">{t.anggota?.nama}</td>
                        <td className="py-3 px-3">{t.periode}</td>
                        <td className="py-3 px-3 text-right font-semibold text-foreground">{formatRupiah(Number(t.jumlah))}</td>
                        <td className="py-3 px-3">{statusBadge(t.status)}</td>
                        <td className="py-3 px-3 text-right">
                          {t.status !== "lunas" && (
                            <Button size="sm" variant="outline" onClick={() => handleBayar(t.id)}>
                              <AlertTriangle className="w-3 h-3 mr-1" />Bayar
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {tagihan.length === 0 && (
                      <tr><td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">Tidak ada data tagihan untuk periode ini</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {tagihan.map((t) => (
                  <div key={t.id} className="p-5 rounded-2xl bg-card border border-border shadow-sm active:scale-[0.98] transition-transform">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{t.anggota?.nama}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{t.anggota?.noAnggota}</p>
                      </div>
                      {statusBadge(t.status)}
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Periode</p>
                        <p className="text-foreground font-medium">{t.periode}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Jumlah</p>
                        <p className="text-foreground font-semibold">{formatRupiah(Number(t.jumlah))}</p>
                      </div>
                    </div>
                    {t.status !== "lunas" && (
                      <div className="mt-3">
                        <Button size="sm" className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleBayar(t.id)}>
                          <AlertTriangle className="w-4 h-4 mr-1.5" />Bayar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                {tagihan.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground text-sm">Tidak ada data tagihan untuk periode ini</div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={confirmOpen && confirmTarget?.type === "bayar"}
        onOpenChange={(v) => { setConfirmOpen(v); if (!v) setConfirmTarget(null); }}
        title="Bayar Tagihan?"
        description="Tagihan akan ditandai lunas dan dicatat dalam jurnal."
        confirmLabel="Ya, Bayar"
        variant="success"
        onConfirm={confirmAction}
      />

      <ConfirmDialog
        open={confirmOpen && confirmTarget?.type === "generate"}
        onOpenChange={(v) => { setConfirmOpen(v); if (!v) setConfirmTarget(null); }}
        title="Generate Tagihan?"
        description={`Tagihan akan dibuat untuk ${generatePeriode} dengan jumlah ${formatRupiah(Number(generateJumlah))} per anggota.`}
        confirmLabel="Ya, Generate"
        variant="warning"
        onConfirm={confirmAction}
      />
    </div>
  );
}
