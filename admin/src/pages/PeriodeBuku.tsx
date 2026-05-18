import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Loader2,
  Plus,
  Lock,
  LockOpen,
  Trash2,
  BookOpen,
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
import { FormField } from "@/components/ui/form-field";
import { api } from "@/lib/api";
import { rules, validate, type FieldErrors } from "@/lib/validation";
import { useToast } from "@/hooks/useToast";

interface PeriodeBukuItem {
  id: string;
  tahun: number;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: "buka" | "tutup";
  keterangan?: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  buka: {
    label: "Terbuka",
    className:
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900",
  },
  tutup: {
    label: "Ditutup",
    className:
      "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-950/30 dark:text-slate-400 dark:border-slate-900",
  },
};

export default function PeriodeBukuPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    tahun: new Date().getFullYear().toString(),
    tanggalMulai: `${new Date().getFullYear()}-01-01`,
    tanggalSelesai: `${new Date().getFullYear()}-12-31`,
    keterangan: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["periode-buku"],
    queryFn: () => api<{ data: PeriodeBukuItem[] }>("/api/periode-buku"),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api("/api/periode-buku", {
        method: "POST",
        body: JSON.stringify({
          tahun: Number(form.tahun),
          tanggalMulai: form.tanggalMulai,
          tanggalSelesai: form.tanggalSelesai,
          keterangan: form.keterangan || undefined,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periode-buku"] });
      setCreateOpen(false);
      setForm({
        tahun: new Date().getFullYear().toString(),
        tanggalMulai: `${new Date().getFullYear()}-01-01`,
        tanggalSelesai: `${new Date().getFullYear()}-12-31`,
        keterangan: "",
      });
      setErrors({});
      toast("Periode buku berhasil dibuat", "success");
    },
    onError: (err: Error) => toast(err.message || "Gagal membuat periode buku", "error"),
  });

  const tutupMutation = useMutation({
    mutationFn: (id: string) => api(`/api/periode-buku/${id}/tutup`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periode-buku"] });
      toast("Periode buku ditutup", "success");
    },
    onError: (err: Error) => toast(err.message || "Gagal menutup periode buku", "error"),
  });

  const bukaMutation = useMutation({
    mutationFn: (id: string) => api(`/api/periode-buku/${id}/buka`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periode-buku"] });
      toast("Periode buku dibuka kembali", "success");
    },
    onError: (err: Error) => toast(err.message || "Gagal membuka periode buku", "error"),
  });

  const hapusMutation = useMutation({
    mutationFn: (id: string) => api(`/api/periode-buku/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periode-buku"] });
      toast("Periode buku berhasil dihapus", "success");
    },
    onError: (err: Error) => toast(err.message || "Gagal menghapus periode buku", "error"),
  });

  const handleCreate = () => {
    const errs = validate(
      { tahun: form.tahun },
      { tahun: [rules.required("Tahun"), rules.minLength(4, "Tahun")] }
    );
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    createMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Periode Buku
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola periode akuntansi & tutup buku tahunan
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <Dialog open={createOpen} onOpenChange={(v) => { setCreateOpen(v); if (!v) setErrors({}); }}>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-9"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Periode Baru
            </Button>
            <DialogContent className="border-0 shadow-xl max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Buat Periode Buku Baru
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <FormField label="Tahun" required error={errors.tahun}>
                  <Input
                    type="number"
                    min="2020"
                    max="2099"
                    value={form.tahun}
                    onChange={(e) => { setForm({ ...form, tahun: e.target.value }); setErrors((p) => ({ ...p, tahun: "" })); }}
                  />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Tanggal Mulai" required>
                    <Input
                      type="date"
                      value={form.tanggalMulai}
                      onChange={(e) => setForm({ ...form, tanggalMulai: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Tanggal Selesai" required>
                    <Input
                      type="date"
                      value={form.tanggalSelesai}
                      onChange={(e) => setForm({ ...form, tanggalSelesai: e.target.value })}
                    />
                  </FormField>
                </div>
                <FormField label="Keterangan">
                  <Input
                    value={form.keterangan}
                    onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                    placeholder="Periode tahun buku..."
                  />
                </FormField>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleCreate}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    Simpan
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <Card className="border border-border shadow-sm" noHover>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              Daftar Periode Buku
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
                        Tahun
                      </th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                        Periode
                      </th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                        Keterangan
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
                    {data?.data?.map((p) => {
                      const cfg = statusConfig[p.status] || statusConfig.buka;
                      return (
                        <tr
                          key={p.id}
                          className="border-b border-border/50 hover:bg-muted/60 transition-colors"
                        >
                          <td className="py-3 px-3 font-semibold text-foreground">
                            {p.tahun}
                          </td>
                          <td className="py-3 px-3 text-muted-foreground">
                            {p.tanggalMulai} — {p.tanggalSelesai}
                          </td>
                          <td className="py-3 px-3 text-muted-foreground">
                            {p.keterangan || "-"}
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
                              {p.status === "buka" ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8 text-muted-foreground hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-950/30"
                                  onClick={() => tutupMutation.mutate(p.id)}
                                  title="Tutup Buku"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                  onClick={() => bukaMutation.mutate(p.id)}
                                  title="Buka Buku"
                                >
                                  <LockOpen className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              {p.status === "buka" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                  onClick={() => {
                                    if (confirm("Hapus periode buku ini?")) {
                                      hapusMutation.mutate(p.id);
                                    }
                                  }}
                                  title="Hapus"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {(!data?.data || data.data.length === 0) && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">
                          Belum ada periode buku. Klik "Periode Baru" untuk membuat.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {data?.data?.map((p) => {
                  const cfg = statusConfig[p.status] || statusConfig.buka;
                  return (
                    <div
                      key={p.id}
                      className="p-4 rounded-xl bg-card border border-border shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-foreground text-lg">
                            {p.tahun}
                          </p>
                        </div>
                        <Badge
                          className={`${cfg.className} font-medium text-[11px] px-2 py-0.5 shrink-0`}
                          variant="outline"
                        >
                          {cfg.label}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {p.tanggalMulai} — {p.tanggalSelesai}
                      </div>
                      {p.keterangan && (
                        <div className="mt-1 text-sm text-muted-foreground">
                          {p.keterangan}
                        </div>
                      )}
                      <div className="mt-3 flex gap-2">
                        {p.status === "buka" ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-8 text-xs text-slate-600 border-slate-200 dark:border-slate-900"
                              onClick={() => tutupMutation.mutate(p.id)}
                            >
                              <Lock className="w-3 h-3 mr-1" />
                              Tutup Buku
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-8 text-xs text-red-600 border-red-200 dark:border-red-900"
                              onClick={() => {
                                if (confirm("Hapus periode buku ini?")) {
                                  hapusMutation.mutate(p.id);
                                }
                              }}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Hapus
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs text-emerald-600 border-emerald-200 dark:border-emerald-900"
                            onClick={() => bukaMutation.mutate(p.id)}
                          >
                            <LockOpen className="w-3 h-3 mr-1" />
                            Buka Buku
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {(!data?.data || data.data.length === 0) && (
                  <div className="py-12 text-center text-muted-foreground text-sm">
                    Belum ada periode buku.
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
