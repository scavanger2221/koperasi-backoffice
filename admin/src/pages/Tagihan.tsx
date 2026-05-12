import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Receipt, Plus, AlertTriangle, CheckCircle, Clock, Loader2 } from "lucide-react";

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

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function statusBadge(status: string) {
  if (status === "lunas") return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><CheckCircle className="w-3 h-3 mr-1" />Lunas</Badge>;
  if (status === "tunggakan") return <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><AlertTriangle className="w-3 h-3 mr-1" />Tunggakan</Badge>;
  return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100"><Clock className="w-3 h-3 mr-1" />Belum Bayar</Badge>;
}

export default function TagihanPage() {
  const [tagihan, setTagihan] = useState<Tagihan[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [periodeFilter, setPeriodeFilter] = useState(new Date().toISOString().slice(0, 7));
  const [generatePeriode, setGeneratePeriode] = useState(new Date().toISOString().slice(0, 7));
  const [generateJumlah, setGenerateJumlah] = useState("50000");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchTagihan();
    fetchSummary();
  }, [periodeFilter]);

  const fetchTagihan = async () => {
    setLoading(true);
    try {
      const res = await api<{ success: boolean; data: Tagihan[]; meta: any }>(`/api/tagihan?periode=${periodeFilter}&limit=100`);
      setTagihan(res.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await api<{ success: boolean; data: Summary }>(`/api/tagihan/summary?periode=${periodeFilter}`);
      setSummary(res.data);
    } catch {
      setSummary(null);
    }
  };

  const handleGenerate = async () => {
    setGenerateLoading(true);
    try {
      await api("/api/tagihan/generate", {
        method: "POST",
        body: JSON.stringify({ periode: generatePeriode, jumlah: generateJumlah }),
      });
      setDialogOpen(false);
      fetchTagihan();
      fetchSummary();
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleBayar = async (id: string) => {
    const tanggalBayar = new Date().toISOString().split("T")[0];
    await api("/api/tagihan/bayar", {
      method: "POST",
      body: JSON.stringify({ tagihanId: id, tanggalBayar }),
    });
    fetchTagihan();
    fetchSummary();
  };

  const handleCekTunggakan = async () => {
    await api("/api/tagihan/cek-tunggakan", { method: "POST" });
    fetchTagihan();
    fetchSummary();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tagihan Simpanan Wajib</h1>
          <p className="text-muted-foreground text-sm mt-1">Kelola tagihan simpanan wajib bulanan anggota</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Generate Tagihan</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Tagihan Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Periode (YYYY-MM)</label>
                <Input value={generatePeriode} onChange={(e) => setGeneratePeriode(e.target.value)} placeholder="2025-05" />
              </div>
              <div>
                <label className="text-sm font-medium">Jumlah per Anggota</label>
                <Input value={generateJumlah} onChange={(e) => setGenerateJumlah(e.target.value)} type="number" />
              </div>
              <Button onClick={handleGenerate} disabled={generateLoading} className="w-full">
                {generateLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Generate
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground text-xs">Total Tagihan</p>
              <p className="text-2xl font-bold">{summary.belum_bayar + summary.lunas + summary.tunggakan}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground text-xs">Belum Bayar</p>
              <p className="text-2xl font-bold text-amber-600">{summary.belum_bayar}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground text-xs">Lunas</p>
              <p className="text-2xl font-bold text-emerald-600">{summary.lunas}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground text-xs">Tunggakan</p>
              <p className="text-2xl font-bold text-red-600">{summary.tunggakan}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Daftar Tagihan</CardTitle>
          <div className="flex gap-2">
            <Input type="month" value={periodeFilter} onChange={(e) => setPeriodeFilter(e.target.value)} className="w-[160px]" />
            <Button variant="outline" onClick={handleCekTunggakan} size="sm">Cek Tunggakan</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>}
          {!loading && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">No Anggota</th>
                    <th className="text-left py-2 px-3 font-medium">Nama</th>
                    <th className="text-left py-2 px-3 font-medium">Periode</th>
                    <th className="text-right py-2 px-3 font-medium">Jumlah</th>
                    <th className="text-left py-2 px-3 font-medium">Status</th>
                    <th className="text-right py-2 px-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {tagihan.map((t) => (
                    <tr key={t.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-2 px-3 font-mono text-xs">{t.anggota?.noAnggota}</td>
                      <td className="py-2 px-3">{t.anggota?.nama}</td>
                      <td className="py-2 px-3">{t.periode}</td>
                      <td className="py-2 px-3 text-right">{formatRupiah(Number(t.jumlah))}</td>
                      <td className="py-2 px-3">{statusBadge(t.status)}</td>
                      <td className="py-2 px-3 text-right">
                        {t.status !== "lunas" && (
                          <Button size="sm" variant="outline" onClick={() => handleBayar(t.id)}>
                            <Receipt className="w-3 h-3 mr-1" />Bayar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {tagihan.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Tidak ada data tagihan untuk periode ini</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
