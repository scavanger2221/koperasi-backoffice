import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Wallet, ArrowUpRight } from "lucide-react";
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
import { api } from "@/lib/api";
import { formatRupiah, formatDate } from "@/lib/utils";
import { rules, validate, type FieldErrors } from "@/lib/validation";
import { useToast } from "@/hooks/useToast";

interface SimpananItem {
  id: string;
  anggotaId: string;
  jenis: string;
  jumlah: string;
  tanggal: string;
  metodeBayar: string;
  anggota?: { nama: string; noAnggota: string };
}

const jenisColors: Record<string, string> = {
  pokok: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900",
  wajib: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900",
  sukarela: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900",
  deposito: "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900",
};

export default function SimpananPage() {
  const [open, setOpen] = useState(false);
  const [formAnggota, setFormAnggota] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["simpanan"],
    queryFn: () => api<{ data: SimpananItem[]; meta: any }>("/api/simpanan"),
  });

  const { data: anggotaList } = useQuery({
    queryKey: ["anggota-list"],
    queryFn: () => api<{ data: any[] }>("/api/anggota?limit=100"),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api("/api/simpanan", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simpanan"] });
      setOpen(false);
      setFormAnggota("");
      setErrors({});
      toast("Setoran berhasil dicatat", "success");
    },
    onError: () => toast("Gagal mencatat setoran", "error"),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const values = {
      anggotaId: formAnggota,
      jenis: (form.get("jenis") as string) || "",
      jumlah: (form.get("jumlah") as string) || "",
      tanggal: (form.get("tanggal") as string) || "",
    };

    const errs = validate(values, {
      anggotaId: [rules.required("Anggota")],
      jenis: [rules.required("Jenis simpanan")],
      jumlah: [rules.required("Jumlah"), rules.positiveNumber("Jumlah")],
      tanggal: [rules.required("Tanggal")],
    });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    createMutation.mutate({
      anggotaId: formAnggota,
      jenis: form.get("jenis"),
      jumlah: form.get("jumlah"),
      tanggal: form.get("tanggal"),
      metodeBayar: form.get("metodeBayar"),
      keterangan: form.get("keterangan"),
    });
  };

  const totalSimpanan = data?.data?.reduce((acc, s) => acc + Number(s.jumlah), 0) ?? 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Simpanan</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Kelola simpanan anggota koperasi</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900">
              <Plus className="w-4 h-4 mr-1.5" />
              Catat Setoran
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md border-0 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-lg">Catat Setoran Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2" noValidate>
              <FormField label="Anggota" required error={errors.anggotaId}>
                <SearchableSelect
                  name="anggotaId"
                  value={formAnggota}
                  onValueChange={(v) => {
                    setFormAnggota(v);
                    setErrors((prev) => ({ ...prev, anggotaId: "" }));
                  }}
                  options={(anggotaList?.data || []).map((a: any) => ({
                    value: a.id,
                    label: `${a.noAnggota} - ${a.nama}`,
                    searchLabel: `${a.nama} ${a.noAnggota}`,
                    hint: a.noAnggota,
                  }))}
                  placeholder="Pilih anggota"
                  triggerClassName="h-10 bg-muted border-border"
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Jenis" required error={errors.jenis}>
                  <Select
                    name="jenis"
                    onValueChange={() => setErrors((prev) => ({ ...prev, jenis: "" }))}
                  >
                    <SelectTrigger className="h-10 bg-muted border-border">
                      <SelectValue placeholder="Pilih jenis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pokok">Pokok</SelectItem>
                      <SelectItem value="wajib">Wajib</SelectItem>
                      <SelectItem value="sukarela">Sukarela</SelectItem>
                      <SelectItem value="deposito">Deposito</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Jumlah" required error={errors.jumlah}>
                  <Input
                    name="jumlah"
                    type="number"
                    min="1000"
                    step="500"
                    placeholder="Rp"
                    className="h-10 bg-muted border-border"
                    onChange={() => setErrors((prev) => ({ ...prev, jumlah: "" }))}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Tanggal" required error={errors.tanggal}>
                  <Input
                    name="tanggal"
                    type="date"
                    className="h-10 bg-muted border-border"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    onChange={() => setErrors((prev) => ({ ...prev, tanggal: "" }))}
                  />
                </FormField>

                <FormField label="Metode Bayar">
                  <Select name="metodeBayar" defaultValue="tunai">
                    <SelectTrigger className="h-10 bg-muted border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tunai">Tunai</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="qris">QRIS</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              {Object.keys(errors).length > 0 && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-3 text-xs text-red-700 dark:text-red-400">
                  Harap perbaiki <strong>{Object.keys(errors).length}</strong> field yang bermasalah sebelum menyimpan
                </div>
              )}

              <Button type="submit" className="w-full h-10 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Setoran"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {["pokok", "wajib", "sukarela", "deposito"].map((jenis) => {
          const total = data?.data?.filter(s => s.jenis === jenis).reduce((acc, s) => acc + Number(s.jumlah), 0) ?? 0;
          return (
            <Card key={jenis} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground capitalize mb-1">Simpanan {jenis}</p>
                <p className="text-lg font-bold text-foreground">{formatRupiah(total)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Riwayat Simpanan</span>
            </div>
            <span className="text-sm font-bold text-foreground">{formatRupiah(totalSimpanan)}</span>
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
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Tanggal</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Anggota</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Jenis</th>
                      <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Jumlah</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Metode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data?.map((s) => (
                      <tr key={s.id} className="border-b border-border/50 hover:bg-muted/60 transition-colors">
                        <td className="py-3 px-3 text-muted-foreground">{formatDate(s.tanggal)}</td>
                        <td className="py-3 px-3">
                          <p className="font-medium text-foreground">{s.anggota?.nama || "-"}</p>
                          <p className="text-xs text-muted-foreground">{s.anggota?.noAnggota || s.anggotaId}</p>
                        </td>
                        <td className="py-3 px-3">
                          <Badge className={`${jenisColors[s.jenis] || ""} font-medium text-[11px] px-2 py-0.5 capitalize`} variant="outline">
                            {s.jenis}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-foreground">{formatRupiah(s.jumlah)}</td>
                        <td className="py-3 px-3">
                          <span className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                            {s.metodeBayar}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!data?.data || data.data.length === 0) && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">
                          Belum ada data simpanan
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {data?.data?.map((s) => (
                  <div key={s.id} className="p-4 rounded-xl bg-card border border-border shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-foreground">{s.anggota?.nama || "-"}</p>
                        <p className="text-xs text-muted-foreground">{s.anggota?.noAnggota || s.anggotaId}</p>
                      </div>
                      <Badge className={`${jenisColors[s.jenis] || ""} font-medium text-[11px] px-2 py-0.5 capitalize shrink-0`} variant="outline">
                        {s.jenis}
                      </Badge>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Tanggal</p>
                        <p className="text-foreground">{formatDate(s.tanggal)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Jumlah</p>
                        <p className="text-foreground font-semibold">{formatRupiah(s.jumlah)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Metode</p>
                        <p className="text-foreground capitalize">{s.metodeBayar}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!data?.data || data.data.length === 0) && (
                  <div className="py-12 text-center text-muted-foreground text-sm">
                    Belum ada data simpanan
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
