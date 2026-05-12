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
  Building2,
  Settings,
  Moon,
  Sun,
  Receipt,
  ClipboardList,
  BarChart3,
} from "lucide-react";
import { CommandPalette } from "./CommandPalette";
import { useAuth } from "@/hooks/useAuth";
import { useDarkMode } from "@/hooks/useDarkMode";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Anggota", icon: Users, path: "/anggota" },
  { label: "Simpanan", icon: Wallet, path: "/simpanan" },
  { label: "Pinjaman", icon: HandCoins, path: "/pinjaman" },
  { label: "Buku Kas", icon: BookOpen, path: "/buku-kas" },
  { label: "Tagihan", icon: Receipt, path: "/tagihan" },
  { label: "Laporan", icon: BarChart3, path: "/laporan" },
  { label: "Audit Log", icon: ClipboardList, path: "/audit" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggle } = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();

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
                      <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors">
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        Pengaturan
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
          <div className="p-3 space-y-0.5">
            <div className="px-3 py-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Menu Utama
            </div>
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    active
                      ? "bg-emerald-600 text-white dark:bg-emerald-950/30 dark:text-emerald-400 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-[18px] h-[18px]", active ? "text-white dark:text-emerald-400" : "text-gray-500 dark:text-gray-400")} />
                  {item.label}
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white dark:bg-emerald-500" />}
                </Link>
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
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
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
    </div>
  );
}
