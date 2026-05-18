import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Loader2,
  Save,
  Plus,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { api } from "@/lib/api";
import { rules, validate, type FieldErrors } from "@/lib/validation";
import { useToast } from "@/hooks/useToast";

interface KoperasiData {
  id: string;
  nama: string;
  alamat?: string;
  badanHukum?: string;
  jenis: string;
  logo?: string;
  noTelepon?: string;
  email?: string;
  website?: string;
  kota?: string;
  provinsi?: string;
}

const jenisOptions: Record<string, string> = {
  ksp: "KSP (Simpan Pinjam)",
  ksu: "KSU (Serba Usaha)",
  kopdes: "Kopdes (Desa)",
  syariah: "Syariah",
};

export default function PengaturanPage() {
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    nama: "",
    alamat: "",
    badanHukum: "",
    jenis: "ksp",
    logo: "",
    noTelepon: "",
    email: "",
    website: "",
    kota: "",
    provinsi: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: koperasiData, isLoading } = useQuery({
    queryKey: ["koperasi"],
    queryFn: () => api<{ data: KoperasiData | null }>("/api/koperasi"),
  });

  const koperasi = koperasiData?.data;

  const createMutation = useMutation({
    mutationFn: () =>
      api("/api/koperasi", {
        method: "POST",
        body: JSON.stringify(form),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["koperasi"] });
      setCreateOpen(false);
      resetForm();
      toast("Data koperasi berhasil disimpan", "success");
    },
    onError: (err: Error) => toast(err.message || "Gagal menyimpan data koperasi", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      api("/api/koperasi", {
        method: "PATCH",
        body: JSON.stringify(form),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["koperasi"] });
      setEditOpen(false);
      resetForm();
      toast("Data koperasi berhasil diperbarui", "success");
    },
    onError: (err: Error) => toast(err.message || "Gagal memperbarui data koperasi", "error"),
  });

  const resetForm = () => {
    setForm({
      nama: "",
      alamat: "",
      badanHukum: "",
      jenis: "ksp",
      logo: "",
      noTelepon: "",
      email: "",
      website: "",
      kota: "",
      provinsi: "",
    });
    setErrors({});
  };

  const openEdit = () => {
    if (koperasi) {
      setForm({
        nama: koperasi.nama || "",
        alamat: koperasi.alamat || "",
        badanHukum: koperasi.badanHukum || "",
        jenis: koperasi.jenis || "ksp",
        logo: koperasi.logo || "",
        noTelepon: koperasi.noTelepon || "",
        email: koperasi.email || "",
        website: koperasi.website || "",
        kota: koperasi.kota || "",
        provinsi: koperasi.provinsi || "",
      });
      setErrors({});
      setEditOpen(true);
    }
  };

  const handleSubmit = (isCreate: boolean) => {
    const errs = validate(
      { nama: form.nama },
      { nama: [rules.required("Nama koperasi"), rules.minLength(3, "Nama koperasi")] }
    );
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (isCreate) {
      createMutation.mutate();
    } else {
      updateMutation.mutate();
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Pengaturan Koperasi
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola profil dan identitas koperasi
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          {!koperasi ? (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-9"
              onClick={() => { resetForm(); setCreateOpen(true); }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Buat Data
            </Button>
          ) : (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-9"
              onClick={openEdit}
            >
              <Save className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : koperasi ? (
        <div className="space-y-4">
          {/* Profil Card */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{koperasi.nama}</h2>
                <Badge
                  className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900 font-medium text-[11px] px-2 py-0.5 mt-1"
                  variant="outline"
                >
                  {jenisOptions[koperasi.jenis] || koperasi.jenis}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Info Details */}
          <Card className="border border-border shadow-sm" noHover>
            <CardHeader className="pb-3">
              <h3 className="text-sm font-semibold text-foreground">Informasi Koperasi</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {koperasi.badanHukum && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Badan Hukum</p>
                      <p className="text-sm font-medium text-foreground">{koperasi.badanHukum}</p>
                    </div>
                  </div>
                )}
                {koperasi.alamat && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Alamat</p>
                      <p className="text-sm font-medium text-foreground">{koperasi.alamat}</p>
                    </div>
                  </div>
                )}
                {koperasi.kota && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Kota</p>
                      <p className="text-sm font-medium text-foreground">{koperasi.kota}</p>
                    </div>
                  </div>
                )}
                {koperasi.provinsi && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Provinsi</p>
                      <p className="text-sm font-medium text-foreground">{koperasi.provinsi}</p>
                    </div>
                  </div>
                )}
                {koperasi.noTelepon && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Telepon</p>
                      <p className="text-sm font-medium text-foreground">{koperasi.noTelepon}</p>
                    </div>
                  </div>
                )}
                {koperasi.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium text-foreground">{koperasi.email}</p>
                    </div>
                  </div>
                )}
                {koperasi.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Website</p>
                      <p className="text-sm font-medium text-foreground">{koperasi.website}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border border-border shadow-sm" noHover>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-sm">
              Belum ada data koperasi. Klik "Buat Data" untuk mengisi profil koperasi.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(v) => { setCreateOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="border-0 shadow-xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              Buat Data Koperasi
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <FormField label="Nama Koperasi" required error={errors.nama}>
              <Input
                value={form.nama}
                onChange={(e) => { setForm({ ...form, nama: e.target.value }); setErrors((p) => ({ ...p, nama: "" })); }}
                placeholder="Koperasi Simpan Pinjam..."
              />
            </FormField>
            <FormField label="Jenis Koperasi">
              <Select
                value={form.jenis}
                onValueChange={(v) => setForm({ ...form, jenis: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(jenisOptions).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Kota">
                <Input
                  value={form.kota}
                  onChange={(e) => setForm({ ...form, kota: e.target.value })}
                  placeholder="Jakarta"
                />
              </FormField>
              <FormField label="Provinsi">
                <Input
                  value={form.provinsi}
                  onChange={(e) => setForm({ ...form, provinsi: e.target.value })}
                  placeholder="DKI Jakarta"
                />
              </FormField>
            </div>
            <FormField label="Alamat">
              <Input
                value={form.alamat}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                placeholder="Jl. Merdeka No. 123"
              />
            </FormField>
            <FormField label="Badan Hukum">
              <Input
                value={form.badanHukum}
                onChange={(e) => setForm({ ...form, badanHukum: e.target.value })}
                placeholder="No. AHU-12345.AH.01.27"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Telepon">
                <Input
                  value={form.noTelepon}
                  onChange={(e) => setForm({ ...form, noTelepon: e.target.value })}
                  placeholder="021-12345678"
                />
              </FormField>
              <FormField label="Email">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="koperasi@example.com"
                />
              </FormField>
            </div>
            <FormField label="Website">
              <Input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://koperasi.example.com"
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }}>Batal</Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleSubmit(true)}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="border-0 shadow-xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              Edit Data Koperasi
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <FormField label="Nama Koperasi" required error={errors.nama}>
              <Input
                value={form.nama}
                onChange={(e) => { setForm({ ...form, nama: e.target.value }); setErrors((p) => ({ ...p, nama: "" })); }}
              />
            </FormField>
            <FormField label="Jenis Koperasi">
              <Select
                value={form.jenis}
                onValueChange={(v) => setForm({ ...form, jenis: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(jenisOptions).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Kota">
                <Input
                  value={form.kota}
                  onChange={(e) => setForm({ ...form, kota: e.target.value })}
                  placeholder="Jakarta"
                />
              </FormField>
              <FormField label="Provinsi">
                <Input
                  value={form.provinsi}
                  onChange={(e) => setForm({ ...form, provinsi: e.target.value })}
                  placeholder="DKI Jakarta"
                />
              </FormField>
            </div>
            <FormField label="Alamat">
              <Input
                value={form.alamat}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
              />
            </FormField>
            <FormField label="Badan Hukum">
              <Input
                value={form.badanHukum}
                onChange={(e) => setForm({ ...form, badanHukum: e.target.value })}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Telepon">
                <Input
                  value={form.noTelepon}
                  onChange={(e) => setForm({ ...form, noTelepon: e.target.value })}
                />
              </FormField>
              <FormField label="Email">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </FormField>
            </div>
            <FormField label="Website">
              <Input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setEditOpen(false); resetForm(); }}>Batal</Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleSubmit(false)}
                disabled={updateMutation.isPending}
              >
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
