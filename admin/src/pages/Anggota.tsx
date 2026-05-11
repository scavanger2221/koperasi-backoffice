import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Loader2, UserX, Pencil, Users, ChevronRight } from "lucide-react";
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

interface AnggotaItem {
  id: string;
  noAnggota: string;
  nama: string;
  nik: string;
  noTelepon: string;
  alamat: string;
  status: string;
  tanggalDaftar: string;
}

export default function Anggota() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["anggota", search],
    queryFn: () =>
      api<{ data: AnggotaItem[]; meta: any }>(`/api/anggota?search=${encodeURIComponent(search)}`),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api("/api/anggota", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anggota"] });
      setOpen(false);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api(`/api/anggota/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["anggota"] }),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      aktif: { label: "Aktif", className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" },
      menunggu_verifikasi: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900" },
      nonaktif: { label: "Nonaktif", className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900" },
      ditolak: { label: "Ditolak", className: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700" },
    };
    const s = map[status] || { label: status, className: "bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-300" };
    return <Badge className={`${s.className} font-medium text-[11px] px-2 py-0.5`} variant="outline">{s.label}</Badge>;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Daftar Anggota</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Kelola data anggota koperasi</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
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
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Nama Lengkap</Label>
                  <Input name="nama" className="h-10 bg-muted border-border" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">NIK</Label>
                  <Input name="nik" maxLength={16} className="h-10 bg-muted border-border" required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Tempat Lahir</Label>
                  <Input name="tempatLahir" className="h-10 bg-muted border-border" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Tanggal Lahir</Label>
                  <Input name="tanggalLahir" type="date" className="h-10 bg-muted border-border" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Alamat</Label>
                <Input name="alamat" className="h-10 bg-muted border-border" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Pekerjaan</Label>
                  <Input name="pekerjaan" className="h-10 bg-muted border-border" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">No Telepon</Label>
                  <Input name="noTelepon" className="h-10 bg-muted border-border" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Email (opsional)</Label>
                <Input name="email" type="email" className="h-10 bg-muted border-border" />
              </div>
              <Button type="submit" className="w-full h-10 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Anggota"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
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
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data?.data?.filter(a => a.status === "aktif").length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Anggota Aktif</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data?.data?.filter(a => a.status === "menunggu_verifikasi").length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Menunggu Verifikasi</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau nomor anggota..."
              className="pl-9 h-10 bg-muted border-border text-sm"
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
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Anggota</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Kontak</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Tanggal Daftar</th>
                      <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data?.map((a) => (
                      <tr key={a.id} className="border-b border-border/50 hover:bg-muted/60 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                              {a.nama.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{a.nama}</p>
                              <p className="text-xs text-muted-foreground">{a.noAnggota}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <p className="text-foreground">{a.noTelepon}</p>
                          <p className="text-xs text-muted-foreground">{a.nik}</p>
                        </td>
                        <td className="py-3 px-3">{statusBadge(a.status)}</td>
                        <td className="py-3 px-3 text-muted-foreground">{formatDate(a.tanggalDaftar)}</td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted">
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                              onClick={() => deactivateMutation.mutate(a.id)}
                            >
                              <UserX className="w-3.5 h-3.5" />
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

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {data?.data?.map((a) => (
                  <div key={a.id} className="p-4 rounded-xl bg-card border border-border shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {a.nama.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{a.nama}</p>
                          <p className="text-xs text-muted-foreground">{a.noAnggota}</p>
                        </div>
                      </div>
                      {statusBadge(a.status)}
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Telepon</p>
                        <p className="text-foreground">{a.noTelepon}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Daftar</p>
                        <p className="text-foreground">{formatDate(a.tanggalDaftar)}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs">
                        <Pencil className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
                        onClick={() => deactivateMutation.mutate(a.id)}
                      >
                        <UserX className="w-3 h-3 mr-1" />
                        Nonaktifkan
                      </Button>
                    </div>
                  </div>
                ))}
                {(!data?.data || data.data.length === 0) && (
                  <div className="py-12 text-center text-muted-foreground text-sm">
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
