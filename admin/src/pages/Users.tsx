import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users as UsersIcon, Plus, Loader2, Pencil, UserCheck, UserX } from "lucide-react";
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
import { FormField } from "@/components/ui/form-field";
import { api } from "@/lib/api";
import { rules, validate, type FieldErrors } from "@/lib/validation";
import { useToast } from "@/hooks/useToast";

interface UserItem {
  id: string;
  email: string;
  nama: string;
  role: string;
  aktif: boolean;
  lastLogin: string | null;
  createdAt: string;
}

const roleConfig: Record<string, { label: string; className: string }> = {
  super_admin: {
    label: "Super Admin",
    className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900",
  },
  admin: {
    label: "Admin",
    className: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900",
  },
  pengurus: {
    label: "Pengurus",
    className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900",
  },
  bendahara: {
    label: "Bendahara",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900",
  },
  pengawas: {
    label: "Pengawas",
    className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900",
  },
  anggota: {
    label: "Anggota",
    className: "bg-muted text-muted-foreground border-border",
  },
};

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "pengurus", label: "Pengurus" },
  { value: "bendahara", label: "Bendahara" },
  { value: "pengawas", label: "Pengawas" },
];

export default function UsersPage() {
  const [dialog, setDialog] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<UserItem | null>(null);
  const [form, setForm] = useState({ email: "", password: "", nama: "", role: "pengurus" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["users", page],
    queryFn: async () => {
      const res = await api<{ data: UserItem[]; meta?: any }>(`/api/users?page=${page}&limit=20`);
      setTotal((res as any).meta?.total ?? 0);
      return res;
    },
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: (d: typeof form) =>
      api("/api/users", { method: "POST", body: JSON.stringify(d) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDialog(null);
      setForm({ email: "", password: "", nama: "", role: "pengurus" });
      setErrors({});
      toast("User berhasil dibuat", "success");
    },
    onError: (err: any) => toast(err?.message || "Gagal membuat user", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof form> & { aktif?: boolean } }) =>
      api(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDialog(null);
      setErrors({});
      toast("User berhasil diperbarui", "success");
    },
    onError: (err: any) => toast(err?.message || "Gagal memperbarui user", "error"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, aktif }: { id: string; aktif: boolean }) =>
      aktif
        ? api(`/api/users/${id}/aktifkan`, { method: "PATCH" })
        : api(`/api/users/${id}`, { method: "DELETE" }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast(`User ${vars.aktif ? "diaktifkan" : "dinonaktifkan"}`, "success");
    },
    onError: (err: any) => toast(err?.message || "Gagal mengubah status user", "error"),
  });

  const openEdit = (user: UserItem) => {
    setSelected(user);
    setForm({ email: user.email, password: "", nama: user.nama, role: user.role });
    setDialog("edit");
  };

  const handleCreate = () => {
    const errs = validate(form, {
      nama: [rules.required("Nama"), rules.minLength(3, "Nama")],
      email: [rules.required("Email")],
      password: [rules.required("Password"), rules.minLength(6, "Password")],
      role: [rules.required("Role")],
    });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    createMutation.mutate(form);
  };

  const handleUpdate = () => {
    if (!selected) return;
    const payload: any = { nama: form.nama, email: form.email, role: form.role };
    updateMutation.mutate({ id: selected.id, data: payload });
  };

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Pengguna</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Kelola akun pengurus & karyawan koperasi</p>
        </div>
        <Dialog open={dialog === "create"} onOpenChange={(v) => { setDialog(v ? "create" : null); if (!v) { setErrors({}); setForm({ email: "", password: "", nama: "", role: "pengurus" }); } }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Pengguna
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-0 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-lg flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-emerald-600" />
                Tambah Pengguna Baru
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <FormField label="Nama" required error={errors.nama}>
                <Input
                  value={form.nama}
                  onChange={(e) => { setForm({ ...form, nama: e.target.value }); setErrors((prev) => ({ ...prev, nama: "" })); }}
                  placeholder="Nama lengkap"
                />
              </FormField>
              <FormField label="Email" required error={errors.email}>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors((prev) => ({ ...prev, email: "" })); }}
                  placeholder="email@koperasi.id"
                />
              </FormField>
              <FormField label="Password" required error={errors.password}>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors((prev) => ({ ...prev, password: "" })); }}
                  placeholder="Minimal 6 karakter"
                />
              </FormField>
              <FormField label="Role" required error={errors.role}>
                <select
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm"
                  value={form.role}
                  onChange={(e) => { setForm({ ...form, role: e.target.value }); setErrors((prev) => ({ ...prev, role: "" })); }}
                >
                  {roleOptions.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </FormField>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setDialog(null); setErrors({}); }}>Batal</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Simpan
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card className="border border-border shadow-sm" noHover>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <UsersIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Daftar Pengguna</span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Nama</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Email</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Role</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Terakhir Login</th>
                      <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data?.map((user) => {
                      const roleCfg = roleConfig[user.role] || roleConfig.anggota;
                      return (
                        <tr key={user.id} className="border-b border-border/50 hover:bg-muted/60 transition-colors">
                          <td className="py-3 px-3 font-semibold text-foreground">{user.nama}</td>
                          <td className="py-3 px-3 text-muted-foreground">{user.email}</td>
                          <td className="py-3 px-3">
                            <Badge className={`${roleCfg.className} font-medium text-[11px] px-2 py-0.5`} variant="outline">
                              {roleCfg.label}
                            </Badge>
                          </td>
                          <td className="py-3 px-3">
                            <Badge
                              className={`font-medium text-[11px] px-2 py-0.5 ${
                                user.aktif
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900"
                                  : "bg-muted text-muted-foreground border-border"
                              }`}
                              variant="outline"
                            >
                              {user.aktif ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-muted-foreground text-xs">{formatDate(user.lastLogin)}</td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 text-muted-foreground hover:text-foreground"
                                onClick={() => openEdit(user)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              {user.role !== "super_admin" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`w-8 h-8 ${user.aktif ? "text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"}`}
                                  onClick={() => toggleMutation.mutate({ id: user.id, aktif: !user.aktif })}
                                  title={user.aktif ? "Nonaktifkan" : "Aktifkan"}
                                >
                                  {user.aktif ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {(!data?.data || data.data.length === 0) && (
                      <tr><td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">Belum ada pengguna</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {data?.data?.map((user) => {
                  const roleCfg = roleConfig[user.role] || roleConfig.anggota;
                  return (
                    <div key={user.id} className="p-4 rounded-xl bg-card border border-border shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold">
                            {user.nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{user.nama}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <Badge className={`${roleCfg.className} font-medium text-[11px] px-2 py-0.5 shrink-0`} variant="outline">
                          {roleCfg.label}
                        </Badge>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge className={`font-medium text-[11px] px-2 py-0.5 ${user.aktif ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-muted text-muted-foreground border-border"}`} variant="outline">
                            {user.aktif ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEdit(user)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          {user.role !== "super_admin" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8"
                              onClick={() => toggleMutation.mutate({ id: user.id, aktif: !user.aktif })}
                            >
                              {user.aktif ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {total > 20 && (
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-border mt-4">
                  <p className="text-sm text-muted-foreground">
                    Halaman {page} dari {Math.ceil(total / 20)} (total {total} pengguna)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>Sebelumnya</Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(total / 20)}>Selanjutnya</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={dialog === "edit"} onOpenChange={(v) => { setDialog(v ? "edit" : null); if (!v) setErrors({}); }}>
        <DialogContent className="max-w-lg border-0 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Pencil className="w-5 h-5 text-emerald-600" />
              Edit Pengguna
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label="Nama" required error={errors.nama}>
              <Input value={form.nama} onChange={(e) => { setForm({ ...form, nama: e.target.value }); setErrors((prev) => ({ ...prev, nama: "" })); }} />
            </FormField>
            <FormField label="Email" required error={errors.email}>
              <Input type="email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors((prev) => ({ ...prev, email: "" })); }} />
            </FormField>
            <FormField label="Role" required error={errors.role}>
              <select
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm"
                value={form.role}
                onChange={(e) => { setForm({ ...form, role: e.target.value }); setErrors((prev) => ({ ...prev, role: "" })); }}
              >
                {roleOptions.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setDialog(null); setErrors({}); }}>Batal</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleUpdate} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
