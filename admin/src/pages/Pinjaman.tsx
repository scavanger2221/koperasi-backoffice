import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HandCoins, Loader2, CheckCircle, Banknote, Eye, Plus, Calendar, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { FormField } from "@/components/ui/form-field";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";
import { rules, validate, type FieldErrors } from "@/lib/validation";
import { useToast } from "@/hooks/useToast";

interface AngsuranItem {
  id: string;
  angsuranKe: number;
  tanggalJatuhTempo: string;
  tanggalBayar: string | null;
  jumlahPokok: string;
  jumlahBunga: string;
  denda: string;
  totalBayar: string;
  status: string;
  metodeBayar: string | null;
}

interface PinjamanDetail extends PinjamanItem {
  angsuran: AngsuranItem[];
  tanggalAcc: string | null;
  tanggalPencairan: string | null;
}

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

interface AnggotaItem {
  id: string;
  noAnggota: string;
  nama: string;
  status: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  diajukan: { label: "Diajukan", className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900" },
  disetujui: { label: "Disetujui", className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900" },
  aktif: { label: "Aktif", className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" },
  lunas: { label: "Lunas", className: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700" },
  ditolak: { label: "Ditolak", className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900" },
  macet: { label: "Macet", className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900" },
};

export default function PinjamanPage() {
  const [tab, setTab] = useState("all");
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<PinjamanItem | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Form state
  const [form, setForm] = useState({
    anggotaId: "",
    jumlah: "",
    bungaPersen: "12",
    jangkaWaktu: "12",
    jenisBunga: "flat",
    keterangan: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["pinjaman", tab],
    queryFn: () =>
      api<{ data: PinjamanItem[] }>(`/api/pinjaman?${tab !== "all" ? `status=${tab}` : ""}`),
  });

  const { data: anggotaData } = useQuery({
    queryKey: ["anggota-dropdown"],
    queryFn: () => api<{ data: AnggotaItem[] }>("/api/anggota?limit=100"),
    enabled: createOpen,
  });

  const activeAnggota = anggotaData?.data?.filter((a) => a.status === "aktif") ?? [];

  const approveMutation = useMutation({
    mutationFn: (id: string) => api(`/api/pinjaman/${id}/approve`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinjaman"] });
      queryClient.invalidateQueries({ queryKey: ["pinjaman-detail"] });
      toast("Pinjaman disetujui", "success");
    },
    onError: () => toast("Gagal menyetujui pinjaman", "error"),
  });

  const cairMutation = useMutation({
    mutationFn: (id: string) => api(`/api/pinjaman/${id}/cair`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinjaman"] });
      queryClient.invalidateQueries({ queryKey: ["pinjaman-detail"] });
      toast("Pinjaman dicairkan", "success");
    },
    onError: () => toast("Gagal mencairkan pinjaman", "error"),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) =>
      api("/api/pinjaman", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinjaman"] });
      setCreateOpen(false);
      setErrors({});
      setForm({
        anggotaId: "",
        jumlah: "",
        bungaPersen: "12",
        jangkaWaktu: "12",
        jenisBunga: "flat",
        keterangan: "",
      });
      toast("Pinjaman berhasil diajukan", "success");
    },
    onError: () => toast("Gagal mengajukan pinjaman", "error"),
  });

  const { data: detailQuery, isLoading: detailLoading } = useQuery({
    queryKey: ["pinjaman-detail", selected?.id],
    queryFn: () => api<{ data: PinjamanDetail }>(`/api/pinjaman/${selected!.id}`),
    enabled: !!selected && detailOpen,
  });

  const bayarMutation = useMutation({
    mutationFn: (body: { pinjamanId: string; tanggalBayar: string; metodeBayar: string }) =>
      api("/api/pinjaman/bayar", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinjaman"] });
      queryClient.invalidateQueries({ queryKey: ["pinjaman-detail"] });
      toast("Angsuran berhasil dibayar", "success");
    },
    onError: () => toast("Gagal membayar angsuran", "error"),
  });

  const openDetail = (p: PinjamanItem) => {
    setSelected(p);
    setDetailOpen(true);
  };

  const handleBayar = (pinjamanId: string) => {
    const today = new Date().toISOString().split("T")[0];
    bayarMutation.mutate({ pinjamanId, tanggalBayar: today, metodeBayar: "tunai" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errs = validate(form, {
      anggotaId: [rules.required("Anggota")],
      jumlah: [rules.required("Jumlah pinjaman"), rules.positiveNumber("Jumlah pinjaman")],
      bungaPersen: [rules.required("Bunga"), rules.range(0, 100, "Bunga")],
      jangkaWaktu: [rules.required("Tenor"), rules.range(1, 60, "Tenor")],
    });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    createMutation.mutate({
      anggotaId: form.anggotaId,
      jumlah: form.jumlah,
      bungaPersen: form.bungaPersen,
      jangkaWaktu: Number(form.jangkaWaktu),
      jenisBunga: form.jenisBunga,
      keterangan: form.keterangan || undefined,
    });
  };

  const totalPinjaman = data?.data?.reduce((acc, p) => acc + Number(p.jumlah), 0) ?? 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Pinjaman</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Kelola pengajuan dan pinjaman anggota</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <span className="text-sm font-bold text-foreground bg-card px-3 py-1.5 rounded-lg border border-border shadow-sm">
            Total: {formatRupiah(totalPinjaman)}
          </span>
          <Dialog open={createOpen} onOpenChange={(v) => {
            setCreateOpen(v);
            if (!v) setErrors({});
          }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white h-9">
                <Plus className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Tambah Pinjaman</span>
                <span className="sm:hidden">Tambah</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="border-0 shadow-xl max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg flex items-center gap-2">
                  <HandCoins className="w-5 h-5 text-emerald-600" />
                  Tambah Pinjaman Baru
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2" noValidate>
                {/* Anggota */}
                <FormField label="Anggota" required error={errors.anggotaId}>
                  <SearchableSelect
                    value={form.anggotaId}
                    onValueChange={(v) => {
                      setForm((f) => ({ ...f, anggotaId: v }));
                      setErrors((prev) => ({ ...prev, anggotaId: "" }));
                    }}
                    options={activeAnggota.map((a) => ({
                      value: a.id,
                      label: `${a.nama}`,
                      searchLabel: `${a.nama} ${a.noAnggota}`,
                      hint: a.noAnggota,
                    }))}
                    placeholder="Pilih anggota..."
                    emptyText="Tidak ada anggota aktif"
                  />
                </FormField>

                {/* Jumlah */}
                <FormField label="Jumlah Pinjaman" required error={errors.jumlah}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground z-10">Rp</span>
                    <Input
                      type="number"
                      min="100000"
                      step="100000"
                      placeholder="5.000.000"
                      className="pl-10"
                      value={form.jumlah}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, jumlah: e.target.value }));
                        setErrors((prev) => ({ ...prev, jumlah: "" }));
                      }}
                    />
                  </div>
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Bunga */}
                  <FormField label="Bunga (%/tahun)" required error={errors.bungaPersen}>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="12"
                        value={form.bungaPersen}
                        onChange={(e) => {
                          setForm((f) => ({ ...f, bungaPersen: e.target.value }));
                          setErrors((prev) => ({ ...prev, bungaPersen: "" }));
                        }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  </FormField>

                  {/* Tenor */}
                  <FormField label="Tenor (bulan)" required error={errors.jangkaWaktu}>
                    <div className="relative">
                      <Input
                        type="number"
                        min="1"
                        max="60"
                        placeholder="12"
                        value={form.jangkaWaktu}
                        onChange={(e) => {
                          setForm((f) => ({ ...f, jangkaWaktu: e.target.value }));
                          setErrors((prev) => ({ ...prev, jangkaWaktu: "" }));
                        }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">bln</span>
                    </div>
                  </FormField>
                </div>

                {/* Jenis Bunga */}
                <FormField label="Jenis Bunga">
                  <Select
                    value={form.jenisBunga}
                    onValueChange={(v) => setForm((f) => ({ ...f, jenisBunga: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">Flat</SelectItem>
                      <SelectItem value="efektif">Efektif</SelectItem>
                      <SelectItem value="anuitas">Anuitas</SelectItem>
                      <SelectItem value="syariah">Syariah</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                {/* Keterangan */}
                <FormField label="Keterangan">
                  <textarea
                    rows={2}
                    placeholder="Opsional..."
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    value={form.keterangan}
                    onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
                  />
                </FormField>

                {/* Preview */}
                {form.jumlah && form.bungaPersen && form.jangkaWaktu && (
                  <div className="p-3 rounded-lg bg-muted border border-border text-sm space-y-1">
                    <p className="text-muted-foreground text-xs uppercase font-medium">Estimasi Angsuran</p>
                    <p className="font-semibold text-foreground">
                      {formatRupiah(
                        Math.ceil(
                          (Number(form.jumlah) * (1 + (Number(form.bungaPersen) / 100) * (Number(form.jangkaWaktu) / 12))) /
                            Number(form.jangkaWaktu)
                        )
                      )} / bulan
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total: {formatRupiah(
                        Math.ceil(
                          Number(form.jumlah) * (1 + (Number(form.bungaPersen) / 100) * (Number(form.jangkaWaktu) / 12))
                        )
                      )}
                    </p>
                  </div>
                )}

                {Object.keys(errors).length > 0 && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-3 text-xs text-red-700 dark:text-red-400">
                    Harap perbaiki <strong>{Object.keys(errors).length}</strong> field yang bermasalah sebelum menyimpan
                  </div>
                )}

                {createMutation.isError && (
                  <p className="text-sm text-red-600">
                    Gagal membuat pinjaman. Periksa data dan coba lagi.
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setCreateOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={createMutation.isPending || !form.anggotaId || !form.jumlah}
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Simpan"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
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
        <DialogContent className="border-0 shadow-xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Detail Pinjaman</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : detailQuery?.data ? (
            <div className="space-y-4 mt-2">
              {/* Info cards */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2.5 rounded-lg bg-muted border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase">No Pinjaman</p>
                  <p className="font-semibold text-foreground">{detailQuery.data.noPinjaman}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-muted border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase">Anggota</p>
                  <p className="font-semibold text-foreground">{detailQuery.data.anggota?.nama || "-"}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-muted border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase">Jumlah</p>
                  <p className="font-semibold text-foreground">{formatRupiah(detailQuery.data.jumlah)}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-muted border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase">Angsuran/Bln</p>
                  <p className="font-semibold text-foreground">{formatRupiah(detailQuery.data.angsuranPerBulan)}</p>
                </div>
              </div>

              {/* Progress */}
              {detailQuery.data.angsuran && detailQuery.data.angsuran.length > 0 && (
                <div className="p-3 rounded-lg bg-card border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-foreground">Progres Pembayaran</span>
                    <span className="text-xs text-muted-foreground">
                      {detailQuery.data.angsuran.filter((a) => a.status === "lunas").length} / {detailQuery.data.angsuran.length} angsuran
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all"
                      style={{
                        width: `${(detailQuery.data.angsuran.filter((a) => a.status === "lunas").length / detailQuery.data.angsuran.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Angsuran schedule */}
              {detailQuery.data.angsuran && detailQuery.data.angsuran.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    Jadwal Angsuran
                  </p>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {detailQuery.data.angsuran.map((a) => {
                      const isLate = a.status === "belum_lunas" && new Date(a.tanggalJatuhTempo) < new Date();
                      return (
                        <div
                          key={a.id}
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-sm ${
                            a.status === "lunas"
                              ? "bg-emerald-950/20 border-emerald-900/30"
                              : isLate
                              ? "bg-red-950/20 border-red-900/30"
                              : "bg-card border-border"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              a.status === "lunas"
                                ? "bg-emerald-600 text-white"
                                : isLate
                                ? "bg-red-600 text-white"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {a.status === "lunas" ? <Check className="w-3 h-3" /> : a.angsuranKe}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {formatRupiah(a.totalBayar)}
                                {Number(a.denda) > 0 && (
                                  <span className="text-red-400 text-xs ml-1">+ {formatRupiah(a.denda)} denda</span>
                                )}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Jatuh tempo: {new Date(a.tanggalJatuhTempo).toLocaleDateString("id-ID")}
                                {a.tanggalBayar && (
                                  <span className="text-emerald-400 ml-1">
                                    · Dibayar: {new Date(a.tanggalBayar).toLocaleDateString("id-ID")}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          {a.status === "belum_lunas" && (
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => handleBayar(detailQuery.data.id)}
                              disabled={bayarMutation.isPending}
                            >
                              {bayarMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Bayar"}
                            </Button>
                          )}
                          {a.status === "lunas" && (
                            <span className="text-[10px] text-emerald-400 font-medium">Lunas</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(!detailQuery.data.angsuran || detailQuery.data.angsuran.length === 0) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <AlertCircle className="w-4 h-4" />
                  Jadwal angsuran belum dibuat. Cairkan pinjaman terlebih dahulu.
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
