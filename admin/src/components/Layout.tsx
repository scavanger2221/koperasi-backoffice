import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Wallet,
  HandCoins,
  BookOpen,
  LogOut,
  Menu,
  Bell,
  ChevronDown,
  ChevronRight,
  Building2,
  Moon,
  Sun,
  Receipt,
  ClipboardList,
  BarChart3,
  PiggyBank,
  UserCog,
  Key,
  Lock,
  Loader2,
  MoreHorizontal,
  X,
} from "lucide-react";
import { CommandPalette } from "./CommandPalette";
import { useAuth } from "@/hooks/useAuth";
import { useDarkMode } from "@/hooks/useDarkMode";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { rules, validate, type FieldErrors } from "@/lib/validation";

const navGroups: { label: string | null; items: { label: string; icon: React.ElementType; path: string }[] }[] = [
  { label: null, items: [{ label: "Dashboard", icon: LayoutDashboard, path: "/" }] },
  { label: "Data Master", items: [
    { label: "Anggota", icon: Users, path: "/anggota" },
    { label: "Simpanan", icon: Wallet, path: "/simpanan" },
    { label: "Pinjaman", icon: HandCoins, path: "/pinjaman" },
  ]},
  { label: "Keuangan", items: [
    { label: "Buku Kas", icon: BookOpen, path: "/buku-kas" },
    { label: "Tagihan", icon: Receipt, path: "/tagihan" },
    { label: "Laporan", icon: BarChart3, path: "/laporan" },
  ]},
  { label: "Akuntansi & SHU", items: [
    { label: "SHU", icon: PiggyBank, path: "/shu" },
    { label: "RAT", icon: Building2, path: "/rat" },
  ]},
  { label: "Manajemen", items: [
    { label: "Audit Log", icon: ClipboardList, path: "/audit" },
    { label: "Pengguna", icon: UserCog, path: "/users" },
  ]},
];

const mobileNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Anggota", icon: Users, path: "/anggota" },
  { label: "Simpanan", icon: Wallet, path: "/simpanan" },
  { label: "Pinjaman", icon: HandCoins, path: "/pinjaman" },
  { label: "Lainnya", icon: MoreHorizontal, path: "#more" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Data Master", "Keuangan", "Akuntansi & SHU", "Manajemen"]));
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ passwordLama: "", passwordBaru: "" });
  const [pwErrors, setPwErrors] = useState<FieldErrors>({});
  const [pwLoading, setPwLoading] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggle } = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          {/* Left: Logo + mobile toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-foreground hidden sm:block">Koperasi</span>
            </Link>
          </div>

          {/* Center: Command palette search */}
          <CommandPalette />

          {/* Right: Actions + User */}
          <div className="flex items-center gap-1">
            <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
              <Bell className="w-4.5 h-4.5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-card" />
            </button>

            <div className="relative ml-2">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 hover:bg-muted rounded-xl transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {user?.nama?.charAt(0)?.toUpperCase() || "A"}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-foreground leading-tight">{user?.nama}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">{user?.role}</p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-card rounded-xl shadow-lg border border-border z-50 overflow-hidden">
                    <div className="p-4 border-b border-border">
                      <p className="font-semibold text-foreground">{user?.nama}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={() => { setPasswordOpen(true); setUserMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                      >
                        <Key className="w-4 h-4 text-muted-foreground" />
                        Ganti Password
                      </button>
                      <button
                        onClick={() => { toggle(); setUserMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                      >
                        {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
                        {isDark ? "Light Mode" : "Dark Mode"}
                      </button>
                    </div>
                    <div className="p-1.5 border-t border-border">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Keluar
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation — Desktop only */}
        <aside
          className={cn(
            "fixed lg:sticky top-16 z-40 h-[calc(100vh-4rem)] w-64 lg:w-56 bg-card border-r border-border transition-transform duration-200 ease-out lg:translate-x-0 hidden lg:block",
            sidebarOpen ? "translate-x-0 block" : "-translate-x-full"
          )}
        >
          <div className="p-3 space-y-1">
            {navGroups.map((group) => {
              const isExpanded = expandedGroups.has(group.label ?? "");
              const hasGroupLabel = group.label !== null;
              return (
                <div key={group.label ?? "dashboard"} className="space-y-0.5">
                  {hasGroupLabel && (
                    <button
                      onClick={() => {
                        const next = new Set(expandedGroups);
                        if (isExpanded) next.delete(group.label!);
                        else next.add(group.label!);
                        setExpandedGroups(next);
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                    >
                      {group.label}
                      <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", isExpanded && "rotate-90")} />
                    </button>
                  )}
                  <div className={cn("space-y-0.5 overflow-hidden transition-all", hasGroupLabel && !isExpanded && "h-0 opacity-0 pointer-events-none")}>
                    {group.items.map((item) => {
                      const active = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all border-l-[3px]",
                            active
                              ? "border-l-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/15 text-emerald-700 dark:text-emerald-400"
                              : "border-l-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <item.icon className={cn("w-[18px] h-[18px]", active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")} />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>


        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 lg:p-8 pb-24 lg:pb-8">{children}</main>
      </div>

      {/* Bottom Navigation — Mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border lg:hidden safe-area-pb">
        <div className="flex items-center justify-around h-16">
          {mobileNavItems.map((item) => {
            const isMore = item.path === "#more";
            const active = !isMore && location.pathname === item.path;
            return isMore ? (
              <button
                key="more"
                onClick={() => setMobileMoreOpen(true)}
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors text-muted-foreground"
              >
                <MoreHorizontal className="w-5 h-5" />
                <span className="text-[10px] font-medium">Lainnya</span>
              </button>
            ) : (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                  active
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", active && "stroke-[2.5]")} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {active && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile More Drawer */}
      {mobileMoreOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden" onClick={() => setMobileMoreOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl shadow-2xl border border-border lg:hidden animate-slide-up max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card">
              <h3 className="font-semibold text-foreground">Menu Lainnya</h3>
              <button onClick={() => setMobileMoreOpen(false)} className="p-1 hover:bg-muted rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-3 space-y-3">
              {navGroups.filter(g => g.label !== null && g.label !== "Data Master").map((group) => (
                <div key={group.label}>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1.5">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileMoreOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                            active
                              ? "bg-emerald-50/80 dark:bg-emerald-950/15 text-emerald-700 dark:text-emerald-400"
                              : "text-muted-foreground hover:bg-muted"
                          )}
                        >
                          <item.icon className={cn("w-[18px] h-[18px]", active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")} />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Ganti Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={(v) => { setPasswordOpen(v); if (!v) { setPwErrors({}); setPwForm({ passwordLama: "", passwordBaru: "" }); } }}>
        <DialogContent className="max-w-sm border-0 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-600" />
              Ganti Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label="Password Lama" required error={pwErrors.passwordLama}>
              <Input
                type="password"
                value={pwForm.passwordLama}
                onChange={(e) => { setPwForm({ ...pwForm, passwordLama: e.target.value }); setPwErrors((prev) => ({ ...prev, passwordLama: "" })); }}
                placeholder="Password saat ini"
              />
            </FormField>
            <FormField label="Password Baru" required error={pwErrors.passwordBaru}>
              <Input
                type="password"
                value={pwForm.passwordBaru}
                onChange={(e) => { setPwForm({ ...pwForm, passwordBaru: e.target.value }); setPwErrors((prev) => ({ ...prev, passwordBaru: "" })); }}
                placeholder="Minimal 6 karakter"
              />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setPasswordOpen(false); setPwErrors({}); setPwForm({ passwordLama: "", passwordBaru: "" }); }}>Batal</Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={pwLoading}
                onClick={async () => {
                  const errs = validate(pwForm, {
                    passwordLama: [rules.required("Password lama"), rules.minLength(6, "Password lama")],
                    passwordBaru: [rules.required("Password baru"), rules.minLength(6, "Password baru")],
                  });
                  setPwErrors(errs);
                  if (Object.keys(errs).length > 0) return;

                  setPwLoading(true);
                  try {
                    await api("/api/auth/password", {
                      method: "PATCH",
                      body: JSON.stringify(pwForm),
                    });
                    toast("Password berhasil diubah", "success");
                    setPasswordOpen(false);
                    setPwForm({ passwordLama: "", passwordBaru: "" });
                    setPwErrors({});
                  } catch (err: any) {
                    toast(err?.message || "Gagal mengubah password", "error");
                  } finally {
                    setPwLoading(false);
                  }
                }}
              >
                {pwLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
