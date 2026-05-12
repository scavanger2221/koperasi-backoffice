import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Loader2, UserX, UserCheck, Pencil, Users, ChevronRight, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";

interface AnggotaItem {
  id: string;
  noAnggota: string;
  nama: string;
  nik: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  noTelepon: string;
  alamat: string;
  pekerjaan?: string;
  email?: string;
  status: string;
  tanggalDaftar: string;
}

function KartuAnggota({ a }: { a: AnggotaItem }) {
  return (
    <div className="w-[340px] mx-auto bg-white text-gray-900 rounded-xl border-2 border-emerald-600 overflow-hidden shadow-lg print:shadow-none">
      <div className="bg-emerald-600 text-white px-5 py-4">
        <p className="text-xs font-medium opacity-90">KARTU ANGGOTA KOPERASI</p>
        <p className="text-lg font-bold mt-0.5">Koperasi Backoffice</p>
      </div>
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xl font-bold">
            {a.nama.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-lg leading-tight">{a.nama}</p>
            <p className="text-sm text-gray-500">{a.noAnggota}</p>
          </div>
        </div>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between border-b border-gray-100 pb-1">
            <span className="text-gray-500">NIK</span>
            <span className="font-medium">{a.nik}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-1">
            <span className="text-gray-500">Telp</span>
            <span className="font-medium">{a.noTelepon}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-1">
            <span className="text-gray-500">Alamat</span>
            <span className="font-medium text-right max-w-[180px]">{a.alamat}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-1">
            <span className="text-gray-500">Tgl Daftar</span>
            <span className="font-medium">{formatDate(a.tanggalDaftar)}</span>
          </div>
          <div className="flex justify-between pt-0.5">
            <span className="text-gray-500">Status</span>
            <span className={`font-bold ${a.status === "aktif" ? "text-emerald-600" : "text-gray-500"}`}>
              {a.status === "aktif" ? "AKTIF" : a.status.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="pt-2 border-t border-dashed border-gray-200">
          <p className="text-[10px] text-center text-gray-400">Kartu ini adalah milik anggota koperasi. Jika ditemukan, mohon dikembalikan ke kantor koperasi.</p>
        </div>
      </div>
    </div>
  );
}

export default function Anggota() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [printId, setPrintId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: printDetail } = useQuery({
    queryKey: ["anggota-print", printId],
    queryFn: () => api<{ data: AnggotaItem }>(`/api/anggota/${printId}`),
    enabled: !!printId && printOpen,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["anggota", search],
    queryFn: () =>
      api<{ data: AnggotaItem[]; meta: any }>(`/api/anggota?search=${encodeURIComponent(search)}`),
  });

  const { data: detailData } = useQuery({
    queryKey: ["anggota-detail", editingId],
    queryFn: () => api<{ data: AnggotaItem }>(`/api/anggota/${editingId}`),
    enabled: !!editingId && editOpen,
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
      toast(
        vars.action === "activate" ? "Anggota diaktifkan" : "Anggota dinonaktifkan",
        "success"
      );
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
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    createMutation.mutate({
      nama: form.get("nama"),
      nik: form.get("nik"),
      tempatLahir: form.get("tempatLahir"),
      tanggalLahir: form.get("tanggalLahir"),
      alamat: form.get("alamat"),
      pekerjaan: form.get("pekerjaan"),
      noTelepon: form.get("noTelepon"),
      email: form.get("email"),
    });
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingId) return;
    const form = new FormData(e.currentTarget);
    const body: any = {};
    const fields = ["nama", "nik", "tempatLahir", "tanggalLahir", "alamat", "pekerjaan", "noTelepon", "email"];
    for (const f of fields) {
      const v = form.get(f);
      if (v) body[f] = v;
    }
    updateMutation.mutate({ id: editingId, body });
  };

  const handleToggle = (id: string, currentStatus: string) => {
    const action = currentStatus === "aktif" ? "deactivate" : "activate";
    toggleMutation.mutate({ id, action });
  };

  const handlePrint = () => {
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        body * { visibility: hidden !important; }
        #print-card, #print-card * { visibility: visible !important; }
        #print-card { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      aktif: { label: "Aktif", className: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" },
      menunggu_verifikasi: { label: "Pending", className: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
      nonaktif: { label: "Nonaktif", className: "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300" },
      ditolak: { label: "Ditolak", className: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400" },
    };
    const s = map[status] || { label: status, className: "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300" };
    return <Badge className={`${s.className} font-medium text-[11px] px-2 py-0.5 border-0`}>{s.label}</Badge>;
  };

  const editForm = detailData?.data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Daftar Anggota</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Kelola data anggota koperasi</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900">
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Anggota
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-0 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-lg">Tambah Anggota Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Nama Lengkap</Label>
                  <Input name="nama" className="h-10 bg-muted border-gray-200 dark:border-gray-700" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">NIK</Label>
                  <Input name="nik" maxLength={16} className="h-10 bg-muted border-gray-200 dark:border-gray-700" required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Tempat Lahir</Label>
                  <Input name="tempatLahir" className="h-10 bg-muted border-gray-200 dark:border-gray-700" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Tanggal Lahir</Label>
                  <Input name="tanggalLahir" type="date" className="h-10 bg-muted border-gray-200 dark:border-gray-700" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Alamat</Label>
                <Input name="alamat" className="h-10 bg-muted border-gray-200 dark:border-gray-700" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Pekerjaan</Label>
                  <Input name="pekerjaan" className="h-10 bg-muted border-gray-200 dark:border-gray-700" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">No Telepon</Label>
                  <Input name="noTelepon" className="h-10 bg-muted border-gray-200 dark:border-gray-700" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Email (opsional)</Label>
                <Input name="email" type="email" className="h-10 bg-muted border-gray-200 dark:border-gray-700" />
              </div>
              <Button type="submit" className="w-full h-10 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Anggota"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Print Dialog */}
      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent className="max-w-md border-0 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg">Kartu Anggota</DialogTitle>
          </DialogHeader>
          <div id="print-card" className="py-2">
            {printDetail?.data ? (
              <KartuAnggota a={printDetail.data} />
            ) : (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
              </div>
            )}
          </div>
          <Button onClick={handlePrint} className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Printer className="w-4 h-4 mr-1.5" />
            Cetak Kartu
          </Button>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-0 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg">Edit Anggota</DialogTitle>
          </DialogHeader>
          {editForm ? (
            <form onSubmit={handleEdit} className="space-y-4 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Nama Lengkap</Label>
                  <Input name="nama" defaultValue={editForm.nama} className="h-10 bg-muted border-gray-200 dark:border-gray-700" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">NIK</Label>
                  <Input name="nik" defaultValue={editForm.nik} maxLength={16} className="h-10 bg-muted border-gray-200 dark:border-gray-700" required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Tempat Lahir</Label>
                  <Input name="tempatLahir" defaultValue={editForm.tempatLahir} className="h-10 bg-muted border-gray-200 dark:border-gray-700" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Tanggal Lahir</Label>
                  <Input name="tanggalLahir" defaultValue={editForm.tanggalLahir} type="date" className="h-10 bg-muted border-gray-200 dark:border-gray-700" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Alamat</Label>
                <Input name="alamat" defaultValue={editForm.alamat} className="h-10 bg-muted border-gray-200 dark:border-gray-700" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Pekerjaan</Label>
                  <Input name="pekerjaan" defaultValue={editForm.pekerjaan} className="h-10 bg-muted border-gray-200 dark:border-gray-700" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">No Telepon</Label>
                  <Input name="noTelepon" defaultValue={editForm.noTelepon} className="h-10 bg-muted border-gray-200 dark:border-gray-700" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Email</Label>
                <Input name="email" defaultValue={editForm.email || ""} type="email" className="h-10 bg-muted border-gray-200 dark:border-gray-700" />
              </div>
              <Button type="submit" className="w-full h-10 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Perubahan"}
              </Button>
            </form>
          ) : (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data?.meta?.total ?? 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Anggota</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data?.data?.filter(a => a.status === "aktif").length ?? 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Anggota Aktif</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data?.data?.filter(a => a.status === "menunggu_verifikasi").length ?? 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Menunggu Verifikasi</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="Cari nama atau nomor anggota..."
              className="pl-9 h-10 bg-muted border-gray-200 dark:border-gray-700 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Anggota</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Kontak</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Tanggal Daftar</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data?.map((a) => (
                      <tr key={a.id} className="border-b border-gray-200/80 dark:border-gray-700/50 hover:bg-muted/60 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                              {a.nama.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{a.nama}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{a.noAnggota}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <p className="text-foreground">{a.noTelepon}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{a.nik}</p>
                        </td>
                        <td className="py-3 px-3">{statusBadge(a.status)}</td>
                        <td className="py-3 px-3 text-gray-500 dark:text-gray-400">{formatDate(a.tanggalDaftar)}</td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-500 dark:text-gray-400 hover:text-foreground hover:bg-muted" onClick={() => openEdit(a.id)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30" onClick={() => openPrint(a.id)} title="Cetak Kartu">
                              <Printer className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`w-8 h-8 ${a.status === "aktif" ? "text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" : "text-gray-500 dark:text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"}`}
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
                        <td colSpan={5} className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                          Tidak ada data anggota
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {data?.data?.map((a) => (
                  <div key={a.id} className="p-4 rounded-xl bg-card border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {a.nama.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{a.nama}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{a.noAnggota}</p>
                        </div>
                      </div>
                      {statusBadge(a.status)}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200/80 dark:border-gray-700/50 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Telepon</p>
                        <p className="text-foreground">{a.noTelepon}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Daftar</p>
                        <p className="text-foreground">{formatDate(a.tanggalDaftar)}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => openEdit(a.id)}>
                        <Pencil className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950/30" onClick={() => openPrint(a.id)}>
                        <Printer className="w-3 h-3 mr-1" />
                        Kartu
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`flex-1 h-8 text-xs ${a.status === "aktif" ? "text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900 dark:hover:bg-emerald-950/30"}`}
                        onClick={() => handleToggle(a.id, a.status)}
                      >
                        {a.status === "aktif" ? <UserX className="w-3 h-3 mr-1" /> : <UserCheck className="w-3 h-3 mr-1" />}
                        {a.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                    </div>
                  </div>
                ))}
                {(!data?.data || data.data.length === 0) && (
                  <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                    Tidak ada data anggota
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
