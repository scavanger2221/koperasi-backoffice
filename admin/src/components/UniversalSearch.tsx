import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, Users, Wallet, HandCoins, Receipt, PiggyBank, Building2, UserCog, BookOpen, FileText, LayoutDashboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────

interface SearchResult {
  type: string;
  id: string;
  label: string;
  subtitle: string;
  url: string;
}

interface SearchResponse {
  success: boolean;
  data: SearchResult[];
}

// ── Result group config ─────────────────────────────────

const typeConfig: Record<string, { icon: React.ElementType; label: string; order: number }> = {
  anggota:   { icon: Users,      label: "Anggota",      order: 1 },
  pinjaman:  { icon: HandCoins,  label: "Pinjaman",     order: 2 },
  simpanan:  { icon: Wallet,     label: "Simpanan",     order: 3 },
  tagihan:   { icon: Receipt,    label: "Tagihan",      order: 4 },
  shu:       { icon: PiggyBank,  label: "SHU",          order: 5 },
  rat:       { icon: Building2,  label: "RAT",          order: 6 },
  user:      { icon: UserCog,    label: "Pengguna",     order: 7 },
  akun:      { icon: BookOpen,   label: "Akun",         order: 8 },
  jurnal:    { icon: FileText,   label: "Jurnal",       order: 9 },
};

const fallbackNavItems = [
  { label: "Dashboard",        icon: LayoutDashboard, path: "/" },
  { label: "Anggota",          icon: Users,           path: "/anggota" },
  { label: "Simpanan",         icon: Wallet,          path: "/simpanan" },
  { label: "Pinjaman",         icon: HandCoins,       path: "/pinjaman" },
  { label: "Tagihan",          icon: Receipt,         path: "/tagihan" },
  { label: "Buku Kas",         icon: BookOpen,        path: "/buku-kas" },
  { label: "SHU",              icon: PiggyBank,       path: "/shu" },
  { label: "RAT",              icon: Building2,       path: "/rat" },
  { label: "Pengguna",         icon: UserCog,         path: "/users" },
];

// ── Component ──────────────────────────────────────────

export function UniversalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [debounced, setDebounced] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Debounce query (300ms)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Reset on open
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
    setQuery("");
    setDebounced("");
    setSelected(0);
  }, [open]);

  // Keyboard shortcut: Cmd/Ctrl + K
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

  // ── API query ───────────────────────────────────────

  const shouldSearch = debounced.trim().length >= 2;

  const { data: searchData, isFetching } = useQuery({
    queryKey: ["universal-search", debounced],
    queryFn: () => api<SearchResponse>(`/api/search?q=${encodeURIComponent(debounced)}`),
    enabled: shouldSearch && open,
    staleTime: 30_000,
  });

  const results = searchData?.data ?? [];

  // Group results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  // Order groups
  const sortedTypes = Object.entries(grouped).sort(
    ([a], [b]) => (typeConfig[a]?.order ?? 99) - (typeConfig[b]?.order ?? 99)
  );

  // Flatten for keyboard nav
  const allItems: SearchResult[] = results;

  const onSelect = (url: string) => {
    setOpen(false);
    navigate(url);
  };

  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (!shouldSearch && fallbackNavItems[selected]) {
        onSelect(fallbackNavItems[selected].path);
      } else if (allItems[selected]) {
        onSelect(allItems[selected].url);
      }
    }
  };

  const isFallbackMode = !shouldSearch;

  return (
    <>
      {/* Top bar trigger button */}
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

      {/* Search dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 gap-0 border-0 shadow-2xl max-w-lg overflow-hidden bg-card">
          <DialogTitle className="sr-only">Pencarian Universal</DialogTitle>

          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            {isFetching ? (
              <Loader2 className="w-4 h-4 text-muted-foreground shrink-0 animate-spin" />
            ) : (
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
              onKeyDown={onInputKeyDown}
              placeholder="Cari anggota, pinjaman, jurnal..."
              className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
            />
            <kbd className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground shrink-0">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto py-1">
            {/* Fallback: quick nav when no query */}
            {isFallbackMode && (
              <div>
                <p className="px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Navigasi Cepat
                </p>
                {fallbackNavItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => onSelect(item.path)}
                      onMouseEnter={() => setSelected(i)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                        i === selected
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {i === selected && <span className="text-[10px] text-muted-foreground">↵</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Loading state */}
            {shouldSearch && isFetching && results.length === 0 && (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Mencari...
              </div>
            )}

            {/* Search results */}
            {shouldSearch && !isFetching && sortedTypes.length > 0 && (
              <div>
                {sortedTypes.map(([type, items]) => {
                  const cfg = typeConfig[type] || { icon: Search, label: type, order: 99 };
                  const Icon = cfg.icon;

                  // Compute flat indices for highlighting
                  const startIdx = results.indexOf(items[0]);

                  return (
                    <div key={type}>
                      {/* Group header */}
                      <div className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                        <span className="text-[10px] text-muted-foreground/50">• {items.length}</span>
                      </div>

                      {items.map((item, j) => {
                        const flatIdx = startIdx + j;
                        const ItemIcon = typeConfig[type]?.icon || Search;
                        return (
                          <button
                            key={`${type}-${item.id}`}
                            onClick={() => onSelect(item.url)}
                            onMouseEnter={() => setSelected(flatIdx)}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                              flatIdx === selected
                                ? "bg-muted text-foreground"
                                : "text-muted-foreground hover:bg-muted/50"
                            )}
                          >
                            <ItemIcon className="w-4 h-4 shrink-0" />
                            <span className="flex-1 text-left truncate">
                              <span className="text-foreground">{item.label}</span>
                              <span className="text-muted-foreground ml-1.5 text-xs">
                                {item.subtitle}
                              </span>
                            </span>
                            {flatIdx === selected && <span className="text-[10px] text-muted-foreground shrink-0">↵</span>}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {/* No results */}
            {shouldSearch && !isFetching && sortedTypes.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                Tidak ada hasil untuk "<span className="text-foreground font-medium">{debounced}</span>"
              </div>
            )}
          </div>

          {/* Footer hints */}
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
