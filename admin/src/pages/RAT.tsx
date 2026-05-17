import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Loader2,
  CheckCircle,
  FileText,
  Users,
  Trash2,
  Eye,
  Plus,
  Send,
  Vote,
  AlertTriangle,
  Building2,
  Clock,
  BookOpen,
  Copy,
  Printer,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FormField } from "@/components/ui/form-field";
import { api } from "@/lib/api";
import { rules, validate, type FieldErrors } from "@/lib/validation";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";

// ── Types ──
interface RatItem {
  id: string;
  periode: string;
  status: "draft" | "dipublikasi" | "voting" | "disahkan" | "diperpanjang";
  tanggalRAT: string;
  tempat: string;
  totalAnggota: number;
  totalHadir: number;
  kuorum: boolean;
  catatan?: string;
  createdAt: string;
}

interface AgendaItem {
  id: string;
  ratId: string;
  judul: string;
  hasilVoting?: "setuju" | "ditolak" | "ditunda";
  suaraSetuju: number;
  suaraTolak: number;
  suaraDitunda: number;
  catatan?: string;
}

interface DokumenItem {
  id: string;
  ratId: string;
  nama: string;
  tipe: string;
  status: "disiapkan" | "final";
  url?: string;
  content?: string;
}

interface KehadiranItem {
  id: string;
  ratId: string;
  anggotaId: string;
  hadir: boolean;
  suratKuasa: boolean;
  anggota?: { nama: string; noAnggota: string };
}

interface RatDetail extends RatItem {
  agendaList: AgendaItem[];
  dokumenList: DokumenItem[];
  kehadiranList: KehadiranItem[];
}

interface AnggotaAktif {
  id: string;
  noAnggota: string;
  nama: string;
}

// ── Status helpers ──
const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900" },
  dipublikasi: { label: "Dipublikasi", className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900" },
  voting: { label: "Voting", className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900" },
  disahkan: { label: "Disahkan", className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" },
  diperpanjang: { label: "Diperpanjang", className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900" },
};

const tipeDokumenLabel: Record<string, string> = {
  lpj_pengurus: "LPJ Pengurus",
  laporan_keuangan: "Laporan Keuangan",
  laporan_pengawas: "Laporan Pengawas",
  shu: "Perhitungan SHU",
  rencana_kerja: "Rencana Kerja",
  rapb: "RAPB",
  notulensi: "Notulensi",
  lain: "Lainnya",
};

// ── Component ──
export default function RATPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const isAdmin = ["super_admin", "admin", "pengurus"].includes(user?.role ?? "");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"create" | "detail" | "viewDoc" | null>(null);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  // Document viewer
  const [selectedDokumen, setSelectedDokumen] = useState<DokumenItem | null>(null);

  // Form state
  const [form, setForm] = useState({ periode: "", tanggalRAT: "", tempat: "", catatan: "" });
  const [newAgenda, setNewAgenda] = useState("");
  const [kehadiranInput, setKehadiranInput] = useState<Record<string, boolean>>({});
  const [suratKuasaInput, setSuratKuasaInput] = useState<Record<string, boolean>>({});
  const [voteResults, setVoteResults] = useState<Record<string, "setuju" | "ditolak" | "ditunda">>({});
  const [voteCounts, setVoteCounts] = useState<Record<string, { setuju: number; tolak: number; ditunda: number }>>({});
  const [voteNotes, setVoteNotes] = useState<Record<string, string>>({});

  // Edit mode for RAT detail
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ tanggalRAT: "", tempat: "" });

  // ── Queries ──
  const { data: listData, isLoading } = useQuery({
    queryKey: ["rat"],
    queryFn: () => api<{ data: RatItem[] }>("/api/rat"),
  });

  const { data: detailData } = useQuery({
    queryKey: ["rat", selectedId],
    queryFn: () => api<{ data: RatDetail }>(`/api/rat/${selectedId}`),
    enabled: !!selectedId,
  });

  const { data: anggotaData } = useQuery({
    queryKey: ["rat-anggota-aktif"],
    queryFn: () => api<{ data: AnggotaAktif[] }>("/api/rat/anggota-aktif"),
    enabled: dialog === "detail" && !!selectedId && isAdmin,
  });

  const { data: dokumenData } = useQuery({
    queryKey: ["rat-dokumen", selectedId, selectedDokumen?.id],
    queryFn: () => api<{ data: DokumenItem }>(`/api/rat/${selectedId}/dokumen/${selectedDokumen?.id}`),
    enabled: dialog === "viewDoc" && !!selectedId && !!selectedDokumen?.id,
  });

  const detail: RatDetail | null = detailData?.data ?? null;
  const list: RatItem[] = listData?.data ?? [];
  const anggotaAktif: AnggotaAktif[] = anggotaData?.data ?? [];

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (d: typeof form) =>
      api("/api/rat", { method: "POST", body: JSON.stringify(d) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rat"] });
      setDialog(null);
      setForm({ periode: "", tanggalRAT: "", tempat: "", catatan: "" });
      toast("RAT berhasil dibuat", "success");
    },
    onError: (err: any) => toast(err?.message || "Gagal membuat RAT", "error"),
  });

  const actionMutation = useMutation({
    mutationFn: ({ action, body }: { action: string; body?: any }) =>
      api(`/api/rat/${selectedId}/${action}`, {
        method: action === "clone" ? "POST" : "PATCH",
        body: body ? JSON.stringify(body) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rat"] });
      queryClient.invalidateQueries({ queryKey: ["rat", selectedId] });
      setConfirmAction(null);
      const label = confirmAction === "publikasi" ? "RAT dipublikasi" :
        confirmAction === "mulai-voting" ? "Voting dimulai" :
        confirmAction === "sahkan" ? "RAT disahkan" :
        confirmAction === "perpanjang" ? "RAT diperpanjang" :
        confirmAction === "clone" ? "RAT ulang dibuat" : "Berhasil";
      toast(label, "success");
    },
    onError: (err: any) => {
      const label = confirmAction === "publikasi" ? "Gagal publikasi RAT" :
        confirmAction === "mulai-voting" ? "Gagal mulai voting" :
        confirmAction === "sahkan" ? "Gagal sahkan RAT" :
        confirmAction === "perpanjang" ? "Gagal perpanjang RAT" :
        confirmAction === "clone" ? "Gagal clone RAT" : "Gagal";
      toast(err?.message || label, "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (d: { tanggalRAT?: string; tempat?: string }) =>
      api(`/api/rat/${selectedId}`, { method: "PATCH", body: JSON.stringify(d) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rat", selectedId] });
      setEditMode(false);
      toast("RAT diperbarui", "success");
    },
    onError: (err: any) => toast(err?.message || "Gagal memperbarui", "error"),
  });

  const agendaMutation = useMutation({
    mutationFn: ({ ratId, judul }: { ratId: string; judul: string }) =>
      api(`/api/rat/${ratId}/agenda`, {
        method: "POST",
        body: JSON.stringify({ judul }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rat", selectedId] });
      setNewAgenda("");
      toast("Agenda ditambahkan", "success");
    },
    onError: (err: any) => toast(err?.message || "Gagal tambah agenda", "error"),
  });

  const deleteAgendaMutation = useMutation({
    mutationFn: ({ ratId, agendaId }: { ratId: string; agendaId: string }) =>
      api(`/api/rat/${ratId}/agenda/${agendaId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rat", selectedId] });
      toast("Agenda dihapus", "success");
    },
    onError: (err: any) => toast(err?.message || "Gagal hapus agenda", "error"),
  });

  const kehadiranMutation = useMutation({
    mutationFn: ({ ratId, kehadiran }: { ratId: string; kehadiran: any[] }) =>
      api(`/api/rat/${ratId}/kehadiran`, {
        method: "POST",
        body: JSON.stringify({ kehadiran }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rat", selectedId] });
      toast("Kehadiran disimpan", "success");
    },
    onError: (err: any) => toast(err?.message || "Gagal simpan kehadiran", "error"),
  });

  const voteMutation = useMutation({
    mutationFn: ({ ratId, agendaId, hasil, suaraSetuju, suaraTolak, suaraDitunda, catatan }: any) =>
      api(`/api/rat/${ratId}/vote-agenda`, {
        method: "PATCH",
        body: JSON.stringify({ agendaId, hasil, suaraSetuju, suaraTolak, suaraDitunda, catatan }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rat", selectedId] });
      toast("Hasil voting disimpan", "success");
    },
    onError: (err: any) => toast(err?.message || "Gagal simpan voting", "error"),
  });

  const generateMutation = useMutation({
    mutationFn: ({ ratId, tipe }: { ratId: string; tipe: string }) =>
      api(`/api/rat/${ratId}/generate-laporan`, {
        method: "POST",
        body: JSON.stringify({ tipe }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rat", selectedId] });
      toast("Dokumen berhasil digenerate", "success");
    },
    onError: (err: any) => toast(err?.message || "Gagal generate dokumen", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api(`/api/rat/${selectedId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rat"] });
      setDialog(null);
      setSelectedId(null);
      toast("RAT berhasil dihapus", "success");
    },
    onError: (err: any) => toast(err?.message || "Gagal menghapus", "error"),
  });

  // ── Helpers ──
  const handleCreate = () => {
    const errs = validate(form, {
      periode: [rules.required("Periode"), rules.year("Periode")],
      tanggalRAT: [rules.required("Tanggal RAT")],
      tempat: [rules.required("Tempat"), rules.minLength(3, "Tempat")],
    });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    createMutation.mutate(form);
  };

  const openDetail = (id: string) => {
    setSelectedId(id);
    setDialog("detail");
    setVoteResults({});
    setVoteCounts({});
    setVoteNotes({});
    setEditMode(false);
  };

  const openDocument = (doc: DokumenItem) => {
    setSelectedDokumen(doc);
    setDialog("viewDoc");
  };

  const handleCatatKehadiran = () => {
    const kehadiran = anggotaAktif.map((a) => ({
      anggotaId: a.id,
      hadir: kehadiranInput[a.id] ?? false,
      suratKuasa: suratKuasaInput[a.id] ?? false,
    }));
    kehadiranMutation.mutate({ ratId: selectedId!, kehadiran });
  };

  const handleVoteAgenda = (agendaId: string) => {
    const hasil = voteResults[agendaId];
    if (!hasil) return;
    const counts = voteCounts[agendaId] ?? { setuju: 0, tolak: 0, ditunda: 0 };
    voteMutation.mutate({
      ratId: selectedId!,
      agendaId,
      hasil,
      suaraSetuju: counts.setuju,
      suaraTolak: counts.tolak,
      suaraDitunda: counts.ditunda,
      catatan: voteNotes[agendaId] || undefined,
    });
  };

  const handleUpdateDetail = () => {
    const payload: any = {};
    if (editForm.tanggalRAT) payload.tanggalRAT = editForm.tanggalRAT;
    if (editForm.tempat) payload.tempat = editForm.tempat;
    if (Object.keys(payload).length === 0) {
      setEditMode(false);
      return;
    }
    updateMutation.mutate(payload);
  };

  const startEdit = () => {
    if (!detail) return;
    setEditForm({ tanggalRAT: detail.tanggalRAT, tempat: detail.tempat });
    setEditMode(true);
  };

  const currentYear = new Date().getFullYear();
  const tahunOptions = Array.from({ length: 5 }, (_, i) => String(currentYear - 2 + i));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">RAT (Rapat Anggota Tahunan)</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola Rapat Anggota Tahunan — forum tertinggi koperasi
          </p>
        </div>
        {isAdmin && (
          <Dialog open={dialog === "create"} onOpenChange={(v) => { setDialog(v ? "create" : null); setErrors({}); }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Buat RAT Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-0 shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  Buat RAT Baru
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <FormField label="Periode Tahun Buku" error={errors.periode} required>
                  <select
                    className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm"
                    value={form.periode}
                    onChange={(e) => { setForm({ ...form, periode: e.target.value }); setErrors((prev) => ({ ...prev, periode: "" })); }}
                  >
                    <option value="">Pilih tahun...</option>
                    {tahunOptions.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Tanggal RAT" error={errors.tanggalRAT} required>
                  <Input
                    type="date"
                    value={form.tanggalRAT}
                    onChange={(e) => { setForm({ ...form, tanggalRAT: e.target.value }); setErrors((prev) => ({ ...prev, tanggalRAT: "" })); }}
                  />
                </FormField>
                <FormField label="Tempat" error={errors.tempat} required>
                  <Input
                    value={form.tempat}
                    onChange={(e) => { setForm({ ...form, tempat: e.target.value }); setErrors((prev) => ({ ...prev, tempat: "" })); }}
                    placeholder="Nama ruang / lokasi"
                  />
                </FormField>
                <FormField label="Catatan">
                  <textarea
                    className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-input bg-background text-sm resize-y"
                    value={form.catatan}
                    onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                    placeholder="Catatan opsional..."
                  />
                </FormField>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setDialog(null)}>Batal</Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleCreate}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                    Buat RAT
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg font-medium">Belum ada RAT</p>
            <p className="text-muted-foreground text-sm">{isAdmin ? "Buat RAT baru untuk memulai" : "Tunggu publikasi RAT dari pengurus"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {list.map((item) => {
            const cfg = statusConfig[item.status] || statusConfig.draft;
            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
                        <Calendar className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">
                            RAT Tahun Buku {item.periode}
                          </h3>
                          <Badge className={`${cfg.className} font-medium text-[11px] px-2 py-0.5`} variant="outline">
                            {cfg.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {item.tanggalRAT} — {item.tempat}
                        </p>
                        <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            Hadir: {item.totalHadir}/{item.totalAnggota}
                          </span>
                          {item.kuorum ? (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Kuorum ✓
                            </span>
                          ) : item.status !== "draft" ? (
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Belum kuorum
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openDetail(item.id)}>
                      <Eye className="w-4 h-4 mr-1" />
                      Detail
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={dialog === "detail"}
        onOpenChange={(v) => {
          if (!v) { setDialog(null); setSelectedId(null); setEditMode(false); }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-0 shadow-xl">
          {detail ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  RAT Tahun Buku {detail.periode}
                  <Badge className={`${(statusConfig[detail.status] || statusConfig.draft).className} font-medium text-[11px] px-2 py-0.5`} variant="outline">
                    {(statusConfig[detail.status] || statusConfig.draft).label}
                  </Badge>
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {editMode ? (
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex gap-2">
                        <Input type="date" value={editForm.tanggalRAT} onChange={(e) => setEditForm({ ...editForm, tanggalRAT: e.target.value })} />
                        <Input value={editForm.tempat} onChange={(e) => setEditForm({ ...editForm, tempat: e.target.value })} placeholder="Tempat" />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleUpdateDetail} disabled={updateMutation.isPending}>
                          {updateMutation.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                          Simpan
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>Batal</Button>
                      </div>
                    </div>
                  ) : (
                    <span className="flex items-center gap-2">
                      {detail.tanggalRAT} — {detail.tempat}
                      {isAdmin && (detail.status === "draft" || detail.status === "dipublikasi") && (
                        <Button variant="ghost" size="sm" className="h-6 px-2" onClick={startEdit}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                      )}
                    </span>
                  )}
                </p>
              </DialogHeader>

              {/* Status & Actions */}
              {isAdmin && (
                <div className="flex items-center gap-2 flex-wrap">
                  {detail.status === "draft" && (
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                      onClick={() => setConfirmAction("publikasi")}
                      disabled={actionMutation.isPending}
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Publikasi & Generate Agenda
                    </Button>
                  )}
                  {detail.status === "dipublikasi" && (
                    <Button size="sm" onClick={() => setConfirmAction("mulai-voting")} disabled={actionMutation.isPending}>
                      <Vote className="w-4 h-4 mr-1" />
                      Mulai Voting
                    </Button>
                  )}
                  {detail.status === "voting" && (
                    <>
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        size="sm"
                        onClick={() => setConfirmAction("sahkan")}
                        disabled={actionMutation.isPending || !detail.kuorum}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Sahkan RAT
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setConfirmAction("perpanjang")} disabled={actionMutation.isPending}>
                        <Clock className="w-4 h-4 mr-1" />
                        Perpanjang (RAT Ulang)
                      </Button>
                    </>
                  )}
                  {detail.status === "diperpanjang" && (
                    <Button size="sm" onClick={() => setConfirmAction("clone")} disabled={actionMutation.isPending}>
                      <Copy className="w-4 h-4 mr-1" />
                      Buat RAT Ulang
                    </Button>
                  )}
                  {(detail.status === "draft" || detail.status === "diperpanjang") && (
                    <Button variant="outline" size="sm" className="text-red-600" onClick={() => setConfirmAction("hapus")} disabled={deleteMutation.isPending}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Hapus
                    </Button>
                  )}
                </div>
              )}

              {/* Confirm action dialog */}
              {confirmAction && isAdmin && (
                <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          {confirmAction === "publikasi" && "Publikasi RAT ini? Agenda default akan digenerate otomatis."}
                          {confirmAction === "mulai-voting" && "Mulai sesi voting? Pastikan kehadiran sudah dicatat."}
                          {confirmAction === "sahkan" && `Sahkan RAT? (Hadir: ${detail.totalHadir}/${detail.totalAnggota})`}
                          {confirmAction === "perpanjang" && "RAT ulang karena kuorum tidak terpenuhi?"}
                          {confirmAction === "clone" && "Buat draft RAT baru dari RAT yang diperpanjang ini?"}
                          {confirmAction === "hapus" && "Hapus RAT ini? Data kehadiran & agenda akan ikut terhapus."}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => {
                              if (confirmAction === "hapus") {
                                deleteMutation.mutate();
                              } else {
                                actionMutation.mutate({ action: confirmAction });
                              }
                            }}
                            disabled={actionMutation.isPending || deleteMutation.isPending}
                          >
                            {(actionMutation.isPending || deleteMutation.isPending) && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                            Ya, Lanjutkan
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setConfirmAction(null)}>Batal</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tabs */}
              <Tabs defaultValue="agenda" className="mt-4">
                <TabsList>
                  <TabsTrigger value="agenda">
                    <FileText className="w-4 h-4 mr-1.5" />
                    Agenda & Voting
                  </TabsTrigger>
                  <TabsTrigger value="kehadiran">
                    <Users className="w-4 h-4 mr-1.5" />
                    Kehadiran ({detail.totalHadir}/{detail.totalAnggota})
                  </TabsTrigger>
                  <TabsTrigger value="dokumen">
                    <BookOpen className="w-4 h-4 mr-1.5" />
                    Dokumen
                  </TabsTrigger>
                  <TabsTrigger value="info">
                    <Eye className="w-4 h-4 mr-1.5" />
                    Info
                  </TabsTrigger>
                </TabsList>

                {/* TAB: Agenda */}
                <TabsContent value="agenda" className="space-y-4">
                  {isAdmin && (detail.status === "draft" || detail.status === "dipublikasi") && (
                    <div className="flex gap-2">
                      <Input
                        value={newAgenda}
                        onChange={(e) => setNewAgenda(e.target.value)}
                        placeholder="Tambah agenda..."
                        onKeyDown={(e) => e.key === "Enter" && newAgenda.trim() && agendaMutation.mutate({ ratId: selectedId!, judul: newAgenda.trim() })}
                      />
                      <Button size="sm" onClick={() => newAgenda.trim() && agendaMutation.mutate({ ratId: selectedId!, judul: newAgenda.trim() })} disabled={agendaMutation.isPending}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {detail.agendaList.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Belum ada agenda. {isAdmin && "Publikasi RAT untuk generate agenda default."}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {detail.agendaList.map((agenda, idx) => (
                        <Card key={agenda.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                                  {idx + 1}
                                </div>
                                <div>
                                  <p className="font-medium text-foreground text-sm">{agenda.judul}</p>
                                  {agenda.hasilVoting && (
                                    <Badge
                                      className={`mt-1 font-medium text-[11px] px-2 py-0.5 ${
                                        agenda.hasilVoting === "setuju" ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" :
                                        agenda.hasilVoting === "ditolak" ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900" :
                                        "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900"
                                      }`}
                                      variant="outline"
                                    >
                                      {agenda.hasilVoting === "setuju" ? "✓ Disetujui" :
                                       agenda.hasilVoting === "ditolak" ? "✗ Ditolak" : "⏳ Ditunda"}
                                    </Badge>
                                  )}
                                  {(agenda.suaraSetuju + agenda.suaraTolak + agenda.suaraDitunda) > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Suara: {agenda.suaraSetuju} setuju, {agenda.suaraTolak} menolak, {agenda.suaraDitunda} ditunda
                                    </p>
                                  )}
                                  {agenda.catatan && <p className="text-xs text-muted-foreground mt-1">{agenda.catatan}</p>}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {isAdmin && detail.status === "voting" && !agenda.hasilVoting && (
                                  <div className="flex flex-col gap-2 min-w-[200px]">
                                    <div className="flex gap-2">
                                      <Input
                                        type="number"
                                        min={0}
                                        placeholder="Setuju"
                                        className="h-8 text-xs"
                                        value={voteCounts[agenda.id]?.setuju ?? ""}
                                        onChange={(e) => setVoteCounts({
                                          ...voteCounts,
                                          [agenda.id]: { ...(voteCounts[agenda.id] ?? { setuju: 0, tolak: 0, ditunda: 0 }), setuju: Number(e.target.value) }
                                        })}
                                      />
                                      <Input
                                        type="number"
                                        min={0}
                                        placeholder="Tolak"
                                        className="h-8 text-xs"
                                        value={voteCounts[agenda.id]?.tolak ?? ""}
                                        onChange={(e) => setVoteCounts({
                                          ...voteCounts,
                                          [agenda.id]: { ...(voteCounts[agenda.id] ?? { setuju: 0, tolak: 0, ditunda: 0 }), tolak: Number(e.target.value) }
                                        })}
                                      />
                                      <Input
                                        type="number"
                                        min={0}
                                        placeholder="Ditunda"
                                        className="h-8 text-xs"
                                        value={voteCounts[agenda.id]?.ditunda ?? ""}
                                        onChange={(e) => setVoteCounts({
                                          ...voteCounts,
                                          [agenda.id]: { ...(voteCounts[agenda.id] ?? { setuju: 0, tolak: 0, ditunda: 0 }), ditunda: Number(e.target.value) }
                                        })}
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <select
                                        className="h-8 text-xs rounded-lg border border-input bg-background px-2 flex-1"
                                        value={voteResults[agenda.id] ?? ""}
                                        onChange={(e) => setVoteResults({ ...voteResults, [agenda.id]: e.target.value as any })}
                                      >
                                        <option value="">Hasil</option>
                                        <option value="setuju">Setuju</option>
                                        <option value="ditolak">Ditolak</option>
                                        <option value="ditunda">Ditunda</option>
                                      </select>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleVoteAgenda(agenda.id)}
                                        disabled={!voteResults[agenda.id] || voteMutation.isPending}
                                      >
                                        Simpan
                                      </Button>
                                    </div>
                                    <Input
                                      placeholder="Catatan voting..."
                                      className="h-8 text-xs"
                                      value={voteNotes[agenda.id] ?? ""}
                                      onChange={(e) => setVoteNotes({ ...voteNotes, [agenda.id]: e.target.value })}
                                    />
                                  </div>
                                )}

                                {isAdmin && detail.status === "voting" && agenda.hasilVoting && (
                                  <p className="text-xs text-muted-foreground shrink-0">Sudah divote</p>
                                )}

                                {isAdmin && (detail.status === "draft" || detail.status === "dipublikasi") && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 h-7 w-7 p-0"
                                    onClick={() => deleteAgendaMutation.mutate({ ratId: selectedId!, agendaId: agenda.id })}
                                    disabled={deleteAgendaMutation.isPending}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* TAB: Kehadiran */}
                <TabsContent value="kehadiran" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Hadir: <strong>{detail.totalHadir}</strong> dari <strong>{detail.totalAnggota}</strong> anggota aktif
                      {detail.kuorum ? (
                        <span className="text-emerald-600 dark:text-emerald-400 ml-2">✓ Kuorum</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 ml-2">Belum kuorum (min 50%+1)</span>
                      )}
                    </p>
                    {isAdmin && (detail.status === "dipublikasi" || detail.status === "voting") && (
                      <Button size="sm" onClick={handleCatatKehadiran} disabled={kehadiranMutation.isPending}>
                        {kehadiranMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                        Simpan Kehadiran
                      </Button>
                    )}
                  </div>

                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {anggotaAktif.length > 0 ? (
                      anggotaAktif.map((a) => {
                        const existing = detail.kehadiranList?.find((k) => k.anggotaId === a.id);
                        const isHadir = kehadiranInput[a.id] ?? existing?.hadir ?? false;
                        const isKuasa = suratKuasaInput[a.id] ?? existing?.suratKuasa ?? false;
                        return (
                          <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                {a.nama.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{a.nama}</p>
                                <p className="text-xs text-muted-foreground">{a.noAnggota}</p>
                              </div>
                            </div>
                            {isAdmin && (detail.status === "dipublikasi" || detail.status === "voting") ? (
                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isKuasa}
                                    onChange={(e) => setSuratKuasaInput({ ...suratKuasaInput, [a.id]: e.target.checked })}
                                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-[11px] text-muted-foreground">Kuasa</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isHadir}
                                    onChange={(e) => setKehadiranInput({ ...kehadiranInput, [a.id]: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                  />
                                  <span className="text-xs text-muted-foreground">{isHadir ? "Hadir" : "Tidak"}</span>
                                </label>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                {isKuasa && (
                                  <Badge className="font-medium text-[11px] px-2 py-0.5 bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900" variant="outline">
                                    Kuasa
                                  </Badge>
                                )}
                                <Badge
                                  className={`font-medium text-[11px] px-2 py-0.5 ${isHadir ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" : "bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400"}`}
                                  variant="outline"
                                >
                                  {isHadir ? "Hadir" : "Tidak Hadir"}
                                </Badge>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-center py-4 text-sm text-muted-foreground">
                        {isAdmin ? "Memuat data anggota..." : "Data kehadiran tersedia di sini."}
                      </p>
                    )}
                  </div>
                </TabsContent>

                {/* TAB: Dokumen */}
                <TabsContent value="dokumen" className="space-y-4">
                  {isAdmin && (
                    <div className="flex flex-wrap gap-2">
                      {["lpj_pengurus", "laporan_keuangan", "laporan_pengawas", "shu", "rencana_kerja", "rapb"].map((tipe) => {
                        const exists = detail.dokumenList?.some((d) => d.tipe === tipe);
                        return (
                          <Button
                            key={tipe}
                            variant={exists ? "outline" : "secondary"}
                            size="sm"
                            onClick={() => generateMutation.mutate({ ratId: selectedId!, tipe })}
                            disabled={generateMutation.isPending || exists}
                          >
                            {exists ? <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-500" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                            {tipeDokumenLabel[tipe]}
                          </Button>
                        );
                      })}
                    </div>
                  )}

                  {detail.dokumenList?.length > 0 ? (
                    <div className="space-y-2">
                      {detail.dokumenList.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{doc.nama}</span>
                            <Badge
                              className={`font-medium text-[11px] px-2 py-0.5 ${doc.status === "final" ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" : "bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400"}`}
                              variant="outline"
                            >
                              {doc.status === "final" ? "Final" : "Disiapkan"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[11px]">{tipeDokumenLabel[doc.tipe]}</Badge>
                            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openDocument(doc)}>
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              Lihat
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-4 text-sm text-muted-foreground">
                      Belum ada dokumen. {isAdmin && "Generate dokumen dari data sistem."}
                    </p>
                  )}
                </TabsContent>

                {/* TAB: Info */}
                <TabsContent value="info" className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Periode</p>
                      <p className="text-sm font-medium">{detail.periode}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tanggal RAT</p>
                      <p className="text-sm font-medium">{detail.tanggalRAT}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tempat</p>
                      <p className="text-sm font-medium">{detail.tempat}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge className={`${(statusConfig[detail.status] || statusConfig.draft).className} font-medium text-[11px] px-2 py-0.5`} variant="outline">
                        {(statusConfig[detail.status] || statusConfig.draft).label}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Anggota</p>
                      <p className="text-sm font-medium">{detail.totalAnggota}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Hadir</p>
                      <p className="text-sm font-medium">{detail.totalHadir}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Kuorum</p>
                      <p className="text-sm font-medium">
                        {detail.kuorum ? (
                          <span className="text-emerald-600 dark:text-emerald-400">Terpenuhi ✓</span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">Belum</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Dibuat</p>
                      <p className="text-sm font-medium">{detail.createdAt}</p>
                    </div>
                  </div>
                  {detail.catatan && (
                    <div>
                      <p className="text-xs text-muted-foreground">Catatan</p>
                      <p className="text-sm whitespace-pre-wrap bg-muted/30 rounded-lg p-3 mt-1">{detail.catatan}</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Viewer Dialog */}
      <Dialog open={dialog === "viewDoc"} onOpenChange={(v) => { if (!v) { setDialog("detail"); setSelectedDokumen(null); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-0 shadow-xl">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              {selectedDokumen?.nama ?? "Dokumen"}
            </DialogTitle>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1" />
              Cetak
            </Button>
          </DialogHeader>
          {dokumenData?.data?.content ? (
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: dokumenData.data.content }}
            />
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
