import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/utils";
import { BookOpen, Scale, TrendingUp, FileBarChart, Wallet, Loader2 } from "lucide-react";

interface Akun {
  id: string;
  kode: string;
  nama: string;
  tipe: string;
  saldoNormal: string;
}

interface BukuBesarRow {
  id: string;
  tanggal: string;
  noJurnal: string;
  keterangan: string;
  debit: string;
  kredit: string;
  saldo: number;
}

interface NeracaSaldoRow {
  akun: Akun;
  debit: number;
  kredit: number;
  saldo: number;
}

interface LabaRugiData {
  pendapatan: { akun: Akun; total: number }[];
  biaya: { akun: Akun; total: number }[];
  totalPendapatan: number;
  totalBiaya: number;
  labaRugi: number;
  isProfit: boolean;
}

interface NeracaData {
  aset: { akun: Akun; saldo: number }[];
  kewajiban: { akun: Akun; saldo: number }[];
  ekuitas: { akun: Akun; saldo: number }[];
  totalAset: number;
  totalKewajiban: number;
  totalEkuitas: number;
  totalLiabilitasEkuitas: number;
  balanced: boolean;
}

interface ArusKasItem {
  tanggal: string;
  keterangan: string;
  masuk: number;
  keluar: number;
  akun: string;
}

interface ArusKasData {
  saldoAwal: number;
  saldoAkhir: number;
  netCashFlow: number;
  operasi: ArusKasItem[];
  investasi: ArusKasItem[];
  pendanaan: ArusKasItem[];
  totalOperasi: { masuk: number; keluar: number; total: number };
  totalInvestasi: { masuk: number; keluar: number; total: number };
  totalPendanaan: { masuk: number; keluar: number; total: number };
}

export default function LaporanPage() {
  const [activeTab, setActiveTab] = useState("buku-besar");
  const [akunList, setAkunList] = useState<Akun[]>([]);
  const [selectedAkun, setSelectedAkun] = useState("");
  const [bukuBesar, setBukuBesar] = useState<{ data: BukuBesarRow[]; meta: any; akun: Akun | null } | null>(null);
  const [neracaSaldo, setNeracaSaldo] = useState<{ data: NeracaSaldoRow[]; totalDebit: number; totalKredit: number } | null>(null);
  const [labaRugi, setLabaRugi] = useState<LabaRugiData | null>(null);
  const [neraca, setNeraca] = useState<NeracaData | null>(null);
  const [arusKas, setArusKas] = useState<ArusKasData | null>(null);
  const [loading, setLoading] = useState(false);
  const [periodeMulai, setPeriodeMulai] = useState("");
  const [periodeSelesai, setPeriodeSelesai] = useState("");
  const [nsPeriodeMulai, setNsPeriodeMulai] = useState("");
  const [nsPeriodeSelesai, setNsPeriodeSelesai] = useState("");
  const [nPeriodeMulai, setNPeriodeMulai] = useState("");
  const [nPeriodeSelesai, setNPeriodeSelesai] = useState("");

  useEffect(() => {
    fetchAkun();
  }, []);

  useEffect(() => {
    if (activeTab === "neraca-saldo") fetchNeracaSaldo(nsPeriodeMulai, nsPeriodeSelesai);
    if (activeTab === "laba-rugi") fetchLabaRugi();
    if (activeTab === "neraca") fetchNeraca(nPeriodeMulai, nPeriodeSelesai);
    if (activeTab === "arus-kas") fetchArusKas();
  }, [activeTab]);

  // Auto-fetch buku besar when akun is selected
  useEffect(() => {
    if (selectedAkun) {
      fetchBukuBesar();
    }
  }, [selectedAkun]);

  const fetchAkun = async () => {
    try {
      const res = await api<{ success: boolean; data: { data: { akun: Akun }[] } }>("/api/jurnal/neraca-saldo");
      const akunIds = res.data.data.map((r: { akun: Akun }) => r.akun);
      setAkunList(akunIds);
    } catch {
      // fallback
    }
  };

  const fetchBukuBesar = async () => {
    if (!selectedAkun) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (periodeMulai) params.set("tanggalMulai", periodeMulai);
      if (periodeSelesai) params.set("tanggalSelesai", periodeSelesai);
      const res = await api<{ success: boolean; data: BukuBesarRow[]; meta: any; akun: Akun }>(`/api/jurnal/buku-besar/${selectedAkun}?${params}`);
      setBukuBesar(res);
    } finally {
      setLoading(false);
    }
  };

  const fetchNeracaSaldo = async (tanggalMulai?: string, tanggalSelesai?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tanggalMulai) params.set("tanggalMulai", tanggalMulai);
      if (tanggalSelesai) params.set("tanggalSelesai", tanggalSelesai);
      const qs = params.toString();
      const res = await api<{ success: boolean; data: { data: NeracaSaldoRow[]; totalDebit: number; totalKredit: number } }>(`/api/jurnal/neraca-saldo${qs ? `?${qs}` : ""}`);
      setNeracaSaldo(res.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchLabaRugi = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (periodeMulai) params.set("tanggalMulai", periodeMulai);
      if (periodeSelesai) params.set("tanggalSelesai", periodeSelesai);
      const res = await api<{ success: boolean; data: LabaRugiData }>(`/api/jurnal/laba-rugi?${params}`);
      setLabaRugi(res.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchNeraca = async (tanggalMulai?: string, tanggalSelesai?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tanggalMulai) params.set("tanggalMulai", tanggalMulai);
      if (tanggalSelesai) params.set("tanggalSelesai", tanggalSelesai);
      const qs = params.toString();
      const res = await api<{ success: boolean; data: NeracaData }>(`/api/jurnal/neraca${qs ? `?${qs}` : ""}`);
      setNeraca(res.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchArusKas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (periodeMulai) params.set("tanggalMulai", periodeMulai);
      if (periodeSelesai) params.set("tanggalSelesai", periodeSelesai);
      const res = await api<{ success: boolean; data: ArusKasData }>(`/api/jurnal/arus-kas?${params}`);
      setArusKas(res.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Laporan Keuangan</h1>
          <p className="text-muted-foreground text-sm mt-1">Lihat buku besar, neraca saldo, laba rugi, dan neraca</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="buku-besar"><BookOpen className="w-4 h-4 mr-2" />Buku Besar</TabsTrigger>
          <TabsTrigger value="neraca-saldo"><Scale className="w-4 h-4 mr-2" />Neraca Saldo</TabsTrigger>
          <TabsTrigger value="laba-rugi"><TrendingUp className="w-4 h-4 mr-2" />Laba Rugi</TabsTrigger>
          <TabsTrigger value="neraca"><FileBarChart className="w-4 h-4 mr-2" />Neraca</TabsTrigger>
          <TabsTrigger value="arus-kas"><Wallet className="w-4 h-4 mr-2" />Arus Kas</TabsTrigger>
        </TabsList>

        <TabsContent value="buku-besar" className="space-y-4">
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Filter Buku Besar</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <SearchableSelect
                value={selectedAkun}
                onValueChange={setSelectedAkun}
                options={akunList.map((a) => ({
                  value: a.id,
                  label: `${a.kode} - ${a.nama}`,
                  searchLabel: `${a.kode} ${a.nama} ${a.tipe}`,
                  hint: a.tipe,
                }))}
                placeholder="Pilih akun"
                triggerClassName="w-[280px]"
              />
              <Input type="date" value={periodeMulai} onChange={(e) => setPeriodeMulai(e.target.value)} className="w-[160px]" placeholder="Dari" />
              <Input type="date" value={periodeSelesai} onChange={(e) => setPeriodeSelesai(e.target.value)} className="w-[160px]" placeholder="Sampai" />
              <Button onClick={fetchBukuBesar} disabled={!selectedAkun || loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Tampilkan
              </Button>
            </CardContent>
          </Card>

          {bukuBesar && (
            <Card className="border border-border shadow-sm" noHover>
              <CardHeader>
                <CardTitle className="text-base">
                  {bukuBesar.akun?.kode} - {bukuBesar.akun?.nama} ({bukuBesar.akun?.saldoNormal})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Tanggal</th>
                        <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">No Jurnal</th>
                        <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Keterangan</th>
                        <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Debit</th>
                        <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Kredit</th>
                        <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bukuBesar.data.map((row) => (
                        <tr key={row.id} className="border-b border-border/50 hover:bg-muted/60 transition-colors">
                          <td className="py-3 px-3">{row.tanggal}</td>
                          <td className="py-3 px-3 font-mono text-xs">{row.noJurnal}</td>
                          <td className="py-3 px-3">{row.keterangan}</td>
                          <td className="py-3 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400">{Number(row.debit) > 0 ? formatRupiah(Number(row.debit)) : "-"}</td>
                          <td className="py-3 px-3 text-right font-medium text-red-600 dark:text-red-400">{Number(row.kredit) > 0 ? formatRupiah(Number(row.kredit)) : "-"}</td>
                          <td className="py-3 px-3 text-right font-bold text-foreground">{formatRupiah(row.saldo)}</td>
                        </tr>
                      ))}
                      {bukuBesar.data.length === 0 && (
                        <tr><td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">Tidak ada data</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="neraca-saldo" className="space-y-4">
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Filter Periode</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Input type="date" value={nsPeriodeMulai} onChange={(e) => setNsPeriodeMulai(e.target.value)} className="w-[180px]" />
              <Input type="date" value={nsPeriodeSelesai} onChange={(e) => setNsPeriodeSelesai(e.target.value)} className="w-[180px]" />
              <Button onClick={() => fetchNeracaSaldo(nsPeriodeMulai, nsPeriodeSelesai)} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Tampilkan
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm" noHover>
            <CardHeader>
              <CardTitle className="text-base">Neraca Saldo</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>}
              {neracaSaldo && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Kode</th>
                        <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Nama Akun</th>
                        <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Tipe</th>
                        <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Debit</th>
                        <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Kredit</th>
                        <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {neracaSaldo.data.map((row) => (
                        <tr key={row.akun.id} className="border-b border-border/50 hover:bg-muted/60 transition-colors">
                          <td className="py-3 px-3 font-mono text-xs">{row.akun.kode}</td>
                          <td className="py-3 px-3">{row.akun.nama}</td>
                          <td className="py-3 px-3 capitalize">{row.akun.tipe}</td>
                          <td className="py-3 px-3 text-right font-medium text-foreground">{formatRupiah(row.debit)}</td>
                          <td className="py-3 px-3 text-right font-medium text-foreground">{formatRupiah(row.kredit)}</td>
                          <td className="py-3 px-3 text-right font-bold text-foreground">{formatRupiah(row.saldo)}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-foreground font-semibold">
                        <td colSpan={3} className="py-3 px-3 text-foreground">Total</td>
                        <td className="py-3 px-3 text-right text-foreground">{formatRupiah(neracaSaldo.totalDebit)}</td>
                        <td className="py-3 px-3 text-right text-foreground">{formatRupiah(neracaSaldo.totalKredit)}</td>
                        <td className="py-3 px-3 text-right text-foreground">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="laba-rugi" className="space-y-4">
          <Card className="border border-border shadow-sm" noHover>
            <CardHeader>
              <CardTitle className="text-base">Filter Periode</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Input type="date" value={periodeMulai} onChange={(e) => setPeriodeMulai(e.target.value)} className="w-[180px]" />
              <Input type="date" value={periodeSelesai} onChange={(e) => setPeriodeSelesai(e.target.value)} className="w-[180px]" />
              <Button onClick={fetchLabaRugi} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Tampilkan
              </Button>
            </CardContent>
          </Card>

          {labaRugi && (
            <Card className="border border-border shadow-sm" noHover>
              <CardHeader>
                <CardTitle className="text-base">Laporan Laba Rugi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-emerald-600 mb-2">Pendapatan</h3>
                  <div className="space-y-1">
                    {labaRugi.pendapatan.map((p) => (
                      <div key={p.akun.id} className="flex justify-between py-1 border-b border-border/30">
                        <span>{p.akun.nama}</span>
                        <span className="font-medium">{formatRupiah(p.total)}</span>
                      </div>
                    ))}
                    {labaRugi.pendapatan.length === 0 && <p className="text-muted-foreground text-sm">Tidak ada data pendapatan</p>}
                    <div className="flex justify-between py-2 font-semibold text-emerald-700">
                      <span>Total Pendapatan</span>
                      <span>{formatRupiah(labaRugi.totalPendapatan)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-red-600 mb-2">Beban / Biaya</h3>
                  <div className="space-y-1">
                    {labaRugi.biaya.map((b) => (
                      <div key={b.akun.id} className="flex justify-between py-1 border-b border-border/30">
                        <span>{b.akun.nama}</span>
                        <span className="font-medium">{formatRupiah(b.total)}</span>
                      </div>
                    ))}
                    {labaRugi.biaya.length === 0 && <p className="text-muted-foreground text-sm">Tidak ada data biaya</p>}
                    <div className="flex justify-between py-2 font-semibold text-red-700">
                      <span>Total Biaya</span>
                      <span>{formatRupiah(labaRugi.totalBiaya)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t-2 border-foreground pt-4">
                  <div className={`flex justify-between text-lg font-bold ${labaRugi.isProfit ? "text-emerald-600" : "text-red-600"}`}>
                    <span>{labaRugi.isProfit ? "Laba Bersih" : "Rugi Bersih"}</span>
                    <span>{formatRupiah(Math.abs(labaRugi.labaRugi))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="neraca" className="space-y-4">
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Filter Periode</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Input type="date" value={nPeriodeMulai} onChange={(e) => setNPeriodeMulai(e.target.value)} className="w-[180px]" />
              <Input type="date" value={nPeriodeSelesai} onChange={(e) => setNPeriodeSelesai(e.target.value)} className="w-[180px]" />
              <Button onClick={() => fetchNeraca(nPeriodeMulai, nPeriodeSelesai)} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Tampilkan
              </Button>
            </CardContent>
          </Card>

          {neraca && (
            <Card className="border border-border shadow-sm" noHover>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Neraca</CardTitle>
                <span className={`text-xs px-2 py-1 rounded-full ${neraca.balanced ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {neraca.balanced ? "Seimbang" : "Tidak Seimbang"}
                </span>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-blue-600 mb-2">Aset</h3>
                  <div className="space-y-1">
                    {neraca.aset.map((a) => (
                      <div key={a.akun.id} className="flex justify-between py-1 border-b border-border/30">
                        <span>{a.akun.nama}</span>
                        <span className="font-medium">{formatRupiah(a.saldo)}</span>
                      </div>
                    ))}
                    {neraca.aset.length === 0 && <p className="text-muted-foreground text-sm">Tidak ada data aset</p>}
                    <div className="flex justify-between py-2 font-semibold">
                      <span>Total Aset</span>
                      <span>{formatRupiah(neraca.totalAset)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-orange-600 mb-2">Kewajiban</h3>
                  <div className="space-y-1">
                    {neraca.kewajiban.map((k) => (
                      <div key={k.akun.id} className="flex justify-between py-1 border-b border-border/30">
                        <span>{k.akun.nama}</span>
                        <span className="font-medium">{formatRupiah(k.saldo)}</span>
                      </div>
                    ))}
                    {neraca.kewajiban.length === 0 && <p className="text-muted-foreground text-sm">Tidak ada data kewajiban</p>}
                    <div className="flex justify-between py-2 font-semibold">
                      <span>Total Kewajiban</span>
                      <span>{formatRupiah(neraca.totalKewajiban)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-purple-600 mb-2">Ekuitas</h3>
                  <div className="space-y-1">
                    {neraca.ekuitas.map((e) => (
                      <div key={e.akun.id} className="flex justify-between py-1 border-b border-border/30">
                        <span>{e.akun.nama}</span>
                        <span className="font-medium">{formatRupiah(e.saldo)}</span>
                      </div>
                    ))}
                    {neraca.ekuitas.length === 0 && <p className="text-muted-foreground text-sm">Tidak ada data ekuitas</p>}
                    <div className="flex justify-between py-2 font-semibold">
                      <span>Total Ekuitas</span>
                      <span>{formatRupiah(neraca.totalEkuitas)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t-2 border-foreground pt-4 space-y-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total Kewajiban + Ekuitas</span>
                    <span>{formatRupiah(neraca.totalLiabilitasEkuitas)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Selisih</span>
                    <span className={neraca.balanced ? "text-emerald-600" : "text-red-600"}>
                      {formatRupiah(Math.abs(neraca.totalAset - neraca.totalLiabilitasEkuitas))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="arus-kas" className="space-y-4">
          <Card className="border border-border shadow-sm" noHover>
            <CardHeader>
              <CardTitle className="text-base">Filter Periode</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Input type="date" value={periodeMulai} onChange={(e) => setPeriodeMulai(e.target.value)} className="w-[180px]" />
              <Input type="date" value={periodeSelesai} onChange={(e) => setPeriodeSelesai(e.target.value)} className="w-[180px]" />
              <Button onClick={fetchArusKas} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Tampilkan
              </Button>
            </CardContent>
          </Card>

          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {arusKas && !loading && (
            <>
              {/* Summary card */}
              <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <CardContent className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-emerald-100 font-medium">Saldo Awal</p>
                      <p className="text-lg font-bold mt-0.5">{formatRupiah(arusKas.saldoAwal)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-100 font-medium">Penerimaan</p>
                      <p className="text-lg font-bold mt-0.5">
                        {formatRupiah(arusKas.totalOperasi.masuk + arusKas.totalInvestasi.masuk + arusKas.totalPendanaan.masuk)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-100 font-medium">Pengeluaran</p>
                      <p className="text-lg font-bold mt-0.5">
                        {formatRupiah(arusKas.totalOperasi.keluar + arusKas.totalInvestasi.keluar + arusKas.totalPendanaan.keluar)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-100 font-medium">Saldo Akhir</p>
                      <p className="text-lg font-bold mt-0.5">{formatRupiah(arusKas.saldoAkhir)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Kas masuk / keluar net */}
              <Card className="border border-border shadow-sm" noHover>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Arus Kas Bersih</span>
                    <span className={`text-lg font-bold ${arusKas.netCashFlow >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {arusKas.netCashFlow >= 0 ? "+" : ""}{formatRupiah(arusKas.netCashFlow)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Aktivitas Operasi */}
              {renderArusKasSection("Aktivitas Operasi", "text-blue-600", arusKas.operasi, arusKas.totalOperasi)}

              {/* Aktivitas Investasi */}
              {renderArusKasSection("Aktivitas Investasi", "text-purple-600", arusKas.investasi, arusKas.totalInvestasi)}

              {/* Aktivitas Pendanaan */}
              {renderArusKasSection("Aktivitas Pendanaan", "text-orange-600", arusKas.pendanaan, arusKas.totalPendanaan)}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function renderArusKasSection(title: string, colorClass: string, items: ArusKasItem[], total: { masuk: number; keluar: number; total: number }) {
  return (
    <Card className="border border-border shadow-sm" noHover>
      <CardHeader className="pb-2">
        <CardTitle className={`text-base ${colorClass}`}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Tidak ada transaksi</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Tanggal</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Keterangan</th>
                  <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Masuk</th>
                  <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Keluar</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b border-border/50 hover:bg-muted/60 transition-colors">
                    <td className="py-3 px-3 text-muted-foreground">{item.tanggal}</td>
                    <td className="py-3 px-3">
                      <p className="font-medium text-foreground">{item.keterangan}</p>
                      <p className="text-[10px] text-muted-foreground">{item.akun}</p>
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-600 font-medium">
                      {item.masuk > 0 ? formatRupiah(item.masuk) : "-"}
                    </td>
                    <td className="py-3 px-3 text-right text-red-600 font-medium">
                      {item.keluar > 0 ? formatRupiah(item.keluar) : "-"}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-foreground/20 font-semibold">
                  <td colSpan={2} className="py-3 px-3 text-foreground">Subtotal {title}</td>
                  <td className="py-3 px-3 text-right text-emerald-600">{formatRupiah(total.masuk)}</td>
                  <td className="py-3 px-3 text-right text-red-600">{formatRupiah(total.keluar)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-end pt-2 border-t border-border/50 mt-1">
          <span className={`text-sm font-bold ${total.total >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {total.total >= 0 ? "+" : ""}{formatRupiah(total.total)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
