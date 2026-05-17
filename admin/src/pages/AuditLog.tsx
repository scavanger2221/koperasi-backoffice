import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, User, Database } from "lucide-react";

interface AuditEntry {
  id: string;
  userEmail: string | null;
  userRole: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  detail: string | null;
  createdAt: string;
}

const actionColors: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  LOGIN: "bg-purple-100 text-purple-700",
  APPROVE: "bg-amber-100 text-amber-700",
  PAYMENT: "bg-teal-100 text-teal-700",
};

function getActionColor(action: string) {
  for (const key of Object.keys(actionColors)) {
    if (action.toUpperCase().includes(key)) return actionColors[key];
  }
  return "bg-gray-100 text-gray-700";
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api<{ success: boolean; data: AuditEntry[]; meta: { page: number; limit: number; total: number } }>(
        `/api/audit?page=${page}&limit=50`
      );
      setLogs(res.data);
      setTotal(res.meta.total);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
        <p className="text-muted-foreground text-sm mt-1">Jejak aktivitas pengguna sistem</p>
      </div>

      <Card className="border border-border shadow-sm" noHover>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Riwayat Aktivitas</span>
          </div>
        </CardHeader>
        <CardContent>
          {loading && <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>}
          {!loading && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Waktu</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">User</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Aksi</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Tipe</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-border/50 hover:bg-muted/60 transition-colors">
                      <td className="py-3 px-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(log.createdAt).toLocaleString("id-ID")}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{log.userEmail || "System"}</span>
                        </div>
                        {log.userRole && <Badge variant="outline" className="text-[10px] mt-0.5">{log.userRole}</Badge>}
                      </td>
                      <td className="py-3 px-3">
                        <Badge className={`text-[10px] ${getActionColor(log.action)}`}>{log.action}</Badge>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <Database className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs capitalize">{log.entityType || "-"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-xs text-muted-foreground max-w-xs truncate">{log.detail || "-"}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">Tidak ada log aktivitas</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {total > 50 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">Halaman {page} dari {Math.ceil(total / 50)}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 text-sm border rounded hover:bg-muted disabled:opacity-50">Sebelumnya</button>
                <button onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(total / 50)} className="px-3 py-1 text-sm border rounded hover:bg-muted disabled:opacity-50">Selanjutnya</button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
