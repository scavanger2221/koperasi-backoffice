import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Loader2, UserX, UserCheck, Pencil, Users, ChevronRight, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormField } from "@/components/ui/form-field";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { rules, validate, type FieldErrors } from "@/lib/validation";
import { useToast } from "@/hooks/useToast";

interface AnggotaItem {
  id: string;
  noAnggota: string;
  nama: string;
  nik: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  jenisKelamin: string;
  agama?: string;
  statusKawin?: string;
  pendidikanTerakhir?: string;
  noTelepon: string;
  alamat: string;
  pekerjaan?: string;
  email?: string;
  status: string;
  tanggalDaftar: string;
}

const PENDIDIKAN_OPTIONS = [
  { value: "", label: "Pilih" },
  { value: "SD", label: "SD" },
  { value: "SMP", label: "SMP" },
  { value: "SMA", label: "SMA/SMK" },
  { value: "D1", label: "D1" },
  { value: "D3", label: "D3" },
  { value: "S1", label: "S1" },
  { value: "S2", label: "S2" },
  { value: "S3", label: "S3" },
];

function KartuAnggota({ a }: { a: AnggotaItem }) {
  return (
    <div className="w-full mx-auto bg-card text-foreground rounded-xl border-2 border-primary overflow-hidden shadow-lg print:shadow-none print:border-gray-800 print:bg-white">
      <div className="bg-primary text-primary-foreground px-6 py-4 print:bg-gray-800 print:text-white" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium opacity-90 print:opacity-100">KARTU ANGGOTA KOPERASI</p>
            <p className="text-xl font-bold mt-0.5">Koperasi Backoffice</p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center print:bg-white print:text-gray-800" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-white print:text-gray-800">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex gap-6">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-primary/15 flex items-center justify-center text-primary text-3xl font-bold print:bg-green-100 print:text-green-800" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
              {a.nama.charAt(0)}
            </div>
            <p className="text-center font-bold text-lg mt-2 leading-tight">{a.nama}</p>
            <p className="text-center text-sm text-muted-foreground print:text-gray-600">{a.noAnggota}</p>
          </div>

          <div className="flex-1 space-y-2 text-sm">
            <div className="flex justify-between border-b border-border pb-1.5">
              <span className="text-muted-foreground print:text-gray-600">NIK</span>
              <span className="font-medium">{a.nik}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-1.5">
              <span className="text-muted-foreground print:text-gray-600">JK</span>
              <span className="font-medium">{a.jenisKelamin === "laki_laki" ? "Laki-laki" : "Perempuan"}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-1.5">
              <span className="text-muted-foreground print:text-gray-600">Telp</span>
              <span className="font-medium">{a.noTelepon}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-1.5">
              <span className="text-muted-foreground print:text-gray-600">Alamat</span>
              <span className="font-medium text-right max-w-[260px] truncate">{a.alamat}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-1.5">
              <span className="text-muted-foreground print:text-gray-600">Tgl Daftar</span>
              <span className="font-medium">{formatDate(a.tanggalDaftar)}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-muted-foreground print:text-gray-600">Status</span>
              <span className={`font-bold ${a.status === "aktif" ? "text-primary print:text-green-800" : "text-muted-foreground print:text-gray-600"}`}>
                {a.status === "aktif" ? "AKTIF" : a.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-dashed border-border print:border-gray-400">
          <p className="text-[10px] text-center text-muted-foreground print:text-gray-500">
            Kartu ini adalah milik anggota koperasi. Jika ditemukan, mohon dikembalikan ke kantor koperasi.
          </p>
        </div>
      </div>
    </div>
  );
}

function AnggotaForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  isPending,
}: {
  mode: "create" | "edit";
  defaultValues?: AnggotaItem;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const values: Record<string, string> = {
      nama: (form.get("nama") as string) || "",
      nik: (form.get("nik") as string) || "",
      tempatLahir: (form.get("tempatLahir") as string) || "",
      tanggalLahir: (form.get("tanggalLahir") as string) || "",
      jenisKelamin: (form.get("jenisKelamin") as string) || "",
      alamat: (form.get("alamat") as string) || "",
      noTelepon: (form.get("noTelepon") as string) || "",
    };

    const errs = validate(values, {
      nama: [rules.required("Nama"), rules.minLength(3, "Nama")],
      nik: [rules.nik()],
      tempatLahir: [rules.required("Tempat Lahir")],
      tanggalLahir: [rules.required("Tanggal Lahir"), rules.minAge(17)],
      jenisKelamin: [rules.required("Jenis Kelamin")],
      alamat: [rules.required("Alamat"), rules.minLength(5, "Alamat")],
      noTelepon: [rules.phone()],
    });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    onSubmit(e);
  };

  const clearError = (field: string) => setErrors((p) => ({ ...p, [field]: "" }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Nama Lengkap" required error={errors.nama} className="col-span-2">
          <Input name="nama" placeholder="Masukkan nama lengkap" defaultValue={defaultValues?.nama || ""} className="h-10 bg-muted border-input" onChange={() => clearError("nama")} />
        </FormField>

        <FormField label="NIK" error={errors.nik} className="col-span-2" hint="16 digit angka">
          <Input name="nik" maxLength={16} placeholder="16 digit NIK" defaultValue={defaultValues?.nik || ""} className="h-10 bg-muted border-input" onChange={() => clearError("nik")} />
        </FormField>

        <FormField label="Jenis Kelamin" required error={errors.jenisKelamin}>
          <select name="jenisKelamin" defaultValue={defaultValues?.jenisKelamin || ""} onChange={() => clearError("jenisKelamin")} className="w-full h-10 rounded-lg border border-input bg-muted px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
            <option value="">Pilih</option>
            <option value="laki_laki">Laki-laki</option>
            <option value="perempuan">Perempuan</option>
          </select>
        </FormField>

        <FormField label="Status Kawin">
          <select name="statusKawin" defaultValue={defaultValues?.statusKawin || ""} className="w-full h-10 rounded-lg border border-input bg-muted px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
            <option value="">Pilih</option>
            <option value="belum_kawin">Belum Kawin</option>
            <option value="kawin">Kawin</option>
            <option value="cerai_hidup">Cerai Hidup</option>
            <option value="cerai_mati">Cerai Mati</option>
          </select>
        </FormField>

        <FormField label="Tempat Lahir" required error={errors.tempatLahir}>
          <Input name="tempatLahir" placeholder="Kota lahir" defaultValue={defaultValues?.tempatLahir || ""} className="h-10 bg-muted border-input" onChange={() => clearError("tempatLahir")} />
        </FormField>

        <FormField label="Tanggal Lahir" required error={errors.tanggalLahir} hint="Usia minimal 17 tahun">
          <Input type="date" name="tanggalLahir" defaultValue={defaultValues?.tanggalLahir || ""} className="h-10 bg-muted border-input" onChange={() => clearError("tanggalLahir")} />
        </FormField>

        <FormField label="Agama">
          <Input name="agama" placeholder="Islam, Kristen, dll" defaultValue={defaultValues?.agama || ""} className="h-10 bg-muted border-input" />
        </FormField>

        <FormField label="Pendidikan Terakhir">
          <select name="pendidikanTerakhir" defaultValue={defaultValues?.pendidikanTerakhir || ""} className="w-full h-10 rounded-lg border border-input bg-muted px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
            {PENDIDIKAN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Pekerjaan">
          <Input name="pekerjaan" placeholder="Contoh: PNS, Wiraswasta" defaultValue={defaultValues?.pekerjaan || ""} className="h-10 bg-muted border-input" />
        </FormField>

        <FormField label="No. Telepon/WA" error={errors.noTelepon} hint="Mulai dengan 0, 9-14 digit">
          <Input type="tel" name="noTelepon" placeholder="Contoh: 08123456789" defaultValue={defaultValues?.noTelepon || ""} className="h-10 bg-muted border-input" onChange={() => clearError("noTelepon")} />
        </FormField>

        <FormField label="Email" className="col-span-2">
          <Input type="email" name="email" placeholder="email@contoh.com" defaultValue={defaultValues?.email || ""} className="h-10 bg-muted border-input" />
        </FormField>

        <FormField label="Alamat Lengkap" required error={errors.alamat} className="col-span-2">
          <Input name="alamat" placeholder="Jalan, RT/RW, Desa/Kelurahan" defaultValue={defaultValues?.alamat || ""} className="h-10 bg-muted border-input" onChange={() => clearError("alamat")} />
        </FormField>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-3 text-xs text-red-700 dark:text-red-400">
          Harap perbaiki <strong>{Object.keys(errors).length}</strong> field yang bermasalah sebelum menyimpan
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isPending}>
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
          {mode === "create" ? "Simpan Anggota" : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  );
}

const JK_LABEL: Record<string, string> = { laki_laki: "L", perempuan: "P" };
const JK_COLOR: Record<string, string> = {
  laki_laki: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  perempuan: "bg-pink-100 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400",
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  aktif: { label: "Aktif", className: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" },
  menunggu_verifikasi: { label: "Pending", className: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
  nonaktif: { label: "Nonaktif", className: "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300" },
  ditolak: { label: "Ditolak", className: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_CONFIG[status] || { label: status, className: "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300" };
  return <Badge className={`${s.className} font-medium text-[11px] px-2 py-0.5 border-0`}>{s.label}</Badge>;
}

export default function Anggota() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [printId, setPrintId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; action: "activate" | "deactivate" } | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: printDetail } = useQuery({
    queryKey: ["anggota-print", printId],
    queryFn: () => api<{ data: AnggotaItem }>(`/api/anggota/${printId}`),
    enabled: !!printId && printOpen,
    staleTime: 30_000,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["anggota", debouncedSearch, page],
    queryFn: async () => {
      const res = await api<{ data: AnggotaItem[]; meta: any }>(`/api/anggota?search=${encodeURIComponent(debouncedSearch)}&page=${page}&limit=20`);
      setTotal(res.meta?.total ?? 0);
      return res;
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const { data: detailData } = useQuery({
    queryKey: ["anggota-detail", editingId],
    queryFn: () => api<{ data: AnggotaItem }>(`/api/anggota/${editingId}`),
    enabled: !!editingId && editOpen,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api("/api/anggota", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anggota"] });
      setCreateOpen(false);
      toast("Anggota berhasil ditambahkan", "success");
    },
    onError: () => toast("Gagal menambahkan anggota", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      api(`/api/anggota/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anggota"] });
      queryClient.invalidateQueries({ queryKey: ["anggota-detail"] });
      setEditOpen(false);
      setEditingId(null);
      toast("Data anggota berhasil diperbarui", "success");
    },
    onError: () => toast("Gagal memperbarui anggota", "error"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "activate" | "deactivate" }) =>
      api(`/api/anggota/${id}/${action}`, { method: "PATCH" }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["anggota"] });
      toast(vars.action === "activate" ? "Anggota diaktifkan" : "Anggota dinonaktifkan", "success");
    },
    onError: () => toast("Gagal mengubah status anggota", "error"),
  });

  const openEdit = (id: string) => {
    setEditingId(id);
    setEditOpen(true);
  };

  const openPrint = (id: string) => {
    setPrintId(id);
    setPrintOpen(true);
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    const form = new FormData(e.currentTarget);
    const body: Record<string, any> = {};
    for (const [key, val] of form.entries()) {
      if (val && String(val).trim()) body[key] = String(val).trim();
    }
    createMutation.mutate(body);
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!editingId) return;
    const form = new FormData(e.currentTarget);
    const body: Record<string, any> = {};
    for (const [key, val] of form.entries()) {
      if (val && String(val).trim()) body[key] = String(val).trim();
    }
    updateMutation.mutate({ id: editingId, body });
  };

  const handleToggle = (id: string, currentStatus: string) => {
    const action = currentStatus === "aktif" ? "deactivate" : "activate";
    setConfirmTarget({ id, action });
    setConfirmOpen(true);
  };

  const confirmToggle = () => {
    if (confirmTarget) {
      toggleMutation.mutate({ id: confirmTarget.id, action: confirmTarget.action });
    }
  };

  const activeCount = useMemo(() => data?.data?.filter((a) => a.status === "aktif").length ?? 0, [data?.data]);
  const pendingCount = useMemo(() => data?.data?.filter((a) => a.status === "menunggu_verifikasi").length ?? 0, [data?.data]);

  const handlePrint = () => {
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        @page { size: auto; margin: 0mm; }
        body * { visibility: hidden !important; }
        #print-card, #print-card * { visibility: visible !important; }
        #print-card {
          position: absolute;
          left: 50%; top: 50%;
          transform: translate(-50%, -50%);
          width: 100%; max-width: 800px;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Daftar Anggota</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Kelola data anggota koperasi</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Anggota
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-0 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Tambah Anggota Baru
              </DialogTitle>
            </DialogHeader>
            <AnggotaForm mode="create" onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} isPending={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent className="max-w-2xl border-0 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Printer className="w-5 h-5 text-emerald-600" />
              Kartu Anggota
            </DialogTitle>
          </DialogHeader>
          <div id="print-card" className="py-2">
            {printDetail?.data ? (
              <KartuAnggota a={printDetail.data} />
            ) : (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <Button onClick={handlePrint} className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Printer className="w-4 h-4 mr-1.5" />
            Cetak Kartu
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) setEditingId(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-0 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Pencil className="w-5 h-5 text-emerald-600" />
              Edit Anggota
            </DialogTitle>
          </DialogHeader>
          {detailData?.data ? (
            <AnggotaForm mode="edit" defaultValues={detailData.data} onSubmit={handleEdit} onCancel={() => { setEditOpen(false); setEditingId(null); }} isPending={updateMutation.isPending} />
          ) : (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data?.meta?.total ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total Anggota</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Anggota Aktif</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Menunggu Verifikasi</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border shadow-sm" noHover>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau nomor anggota..."
              className="pl-9 h-10 bg-background border-input focus:border-primary focus:ring-primary/20 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Gagal memuat data anggota.{" "}
              <button onClick={() => refetch()} className="text-primary underline">Coba lagi</button>
            </div>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Anggota</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Info</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Kontak</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                      <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data?.map((a) => (
                      <tr key={a.id} className={`border-b border-border/50 hover:bg-muted/60 transition-colors row-status row-status-${a.status}`}>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                              {a.nama.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-semibold text-foreground">{a.nama}</p>
                                {a.jenisKelamin && (
                                  <Badge className={`${JK_COLOR[a.jenisKelamin] || "bg-gray-100"} text-[9px] px-1 py-0 font-medium`}>
                                    {JK_LABEL[a.jenisKelamin] || ""}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{a.noAnggota}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <p className="text-xs text-foreground">{a.tempatLahir}, {a.tanggalLahir ? formatDate(a.tanggalLahir) : "-"}</p>
                          {a.pekerjaan && <p className="text-xs text-muted-foreground">{a.pekerjaan}</p>}
                          {a.pendidikanTerakhir && <p className="text-[10px] text-muted-foreground/70">{a.pendidikanTerakhir}</p>}
                        </td>
                        <td className="py-3 px-3">
                          <p className="text-foreground text-xs">{a.noTelepon}</p>
                          <p className="text-[10px] text-muted-foreground">{a.nik}</p>
                        </td>
                        <td className="py-3 px-3">{<StatusBadge status={a.status} />}</td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => openEdit(a.id)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30" onClick={() => openPrint(a.id)} title="Cetak Kartu">
                              <Printer className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`w-8 h-8 ${a.status === "aktif" ? "text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"}`}
                              onClick={() => handleToggle(a.id, a.status)}
                              title={a.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}
                            >
                              {a.status === "aktif" ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!data?.data || data.data.length === 0) && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">
                          Tidak ada data anggota
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden space-y-3">
                {data?.data?.map((a) => (
                  <div key={a.id} className="p-5 rounded-2xl bg-card border border-border shadow-sm active:scale-[0.98] transition-transform">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {a.nama.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-foreground">{a.nama}</p>
                            {a.jenisKelamin && (
                              <Badge className={`${JK_COLOR[a.jenisKelamin] || "bg-gray-100"} text-[9px] px-1 py-0 font-medium`}>
                                {JK_LABEL[a.jenisKelamin] || ""}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{a.noAnggota}</p>
                        </div>
                      </div>
                      {<StatusBadge status={a.status} />}
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/80 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Tempat/Tgl Lahir</p>
                        <p className="text-foreground text-xs">{a.tempatLahir}, {a.tanggalLahir ? formatDate(a.tanggalLahir) : "-"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Telepon</p>
                        <p className="text-foreground text-xs">{a.noTelepon}</p>
                      </div>
                      {a.pekerjaan && (
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Pekerjaan</p>
                          <p className="text-foreground text-xs">{a.pekerjaan}</p>
                        </div>
                      )}
                      {a.pendidikanTerakhir && (
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Pendidikan</p>
                          <p className="text-foreground text-xs">{a.pendidikanTerakhir}</p>
                        </div>
                      )}
                      {a.agama && (
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Agama</p>
                          <p className="text-foreground text-xs">{a.agama}</p>
                        </div>
                      )}
                      {a.statusKawin && (
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Status Kawin</p>
                          <p className="text-foreground text-xs capitalize">{a.statusKawin.replace(/_/g, " ")}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="flex-auto h-10 text-xs" onClick={() => openEdit(a.id)}>
                        <Pencil className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className="flex-auto h-10 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950/30" onClick={() => openPrint(a.id)}>
                        <Printer className="w-3 h-3 mr-1" /> Kartu
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`flex-auto h-10 text-xs ${a.status === "aktif" ? "text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900 dark:hover:bg-emerald-950/30"}`}
                        onClick={() => handleToggle(a.id, a.status)}
                      >
                        {a.status === "aktif" ? <UserX className="w-3 h-3 mr-1" /> : <UserCheck className="w-3 h-3 mr-1" />}
                        {a.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                    </div>
                  </div>
                ))}
                {(!data?.data || data.data.length === 0) && (
                  <div className="py-12 text-center text-muted-foreground text-sm">Tidak ada data anggota</div>
                )}
              </div>

              {total > 20 && (
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-border mt-4">
                  <p className="text-sm text-muted-foreground">
                    Halaman {page} dari {Math.ceil(total / 20)} (total {total} anggota)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>Sebelumnya</Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(total / 20)}>Selanjutnya</Button>
                  </div>
                </div>
              )}
            </>
          )}

          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title={confirmTarget?.action === "deactivate" ? "Nonaktifkan Anggota?" : "Aktifkan Anggota?"}
            description={confirmTarget?.action === "deactivate" ? "Anggota yang dinonaktifkan tidak dapat mengakses sistem. Data transaksi tetap tersimpan." : "Anggota akan dapat mengakses sistem kembali."}
            variant="warning"
            onConfirm={confirmToggle}
            disabled={toggleMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
