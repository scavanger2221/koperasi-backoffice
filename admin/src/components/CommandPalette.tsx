import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, LayoutDashboard, Users, Wallet, HandCoins } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

const commands = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Daftar Anggota", path: "/anggota", icon: Users },
  { label: "Simpanan", path: "/simpanan", icon: Wallet },
  { label: "Pinjaman", path: "/pinjaman", icon: HandCoins },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
    setQuery("");
    setSelected(0);
  }, [open]);

  const onSelect = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((i) => (i + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter" && filtered[selected]) {
      e.preventDefault();
      onSelect(filtered[selected].path);
    }
  };

  return (
    <>
      {/* Top bar trigger */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-sm text-muted-foreground transition-colors border border-border min-w-[240px]"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="text-muted-foreground/60">Cari data...</span>
        <kbd className="ml-auto text-[10px] font-mono bg-card px-1.5 py-0.5 rounded border text-muted-foreground">
          {navigator.platform.includes("Mac") ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 gap-0 border-0 shadow-2xl max-w-lg overflow-hidden bg-card">
          <DialogTitle className="sr-only">Command Palette</DialogTitle>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
              onKeyDown={onInputKeyDown}
              placeholder="Cari menu atau navigasi..."
              className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
            />
            <kbd className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground shrink-0">
              ESC
            </kbd>
          </div>
          <div className="max-h-[320px] overflow-y-auto py-2">
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Tidak ada hasil untuk &quot;{query}&quot;
              </div>
            )}
            {filtered.map((cmd, i) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.path}
                  onClick={() => onSelect(cmd.path)}
                  onMouseEnter={() => setSelected(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    i === selected
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1 text-left">{cmd.label}</span>
                  {i === selected && <span className="text-[10px] text-muted-foreground">↵</span>}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3 px-4 py-2 border-t border-border bg-muted/30 text-[11px] text-muted-foreground">
            <span>↑↓ navigasi</span>
            <span>↵ pilih</span>
            <span>ESC tutup</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
