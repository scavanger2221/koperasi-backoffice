import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { Search, ChevronDown, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableOption {
  value: string;
  label: string;
  searchLabel?: string;
  /** Optional suffix rendered dimly after the label */
  hint?: string;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  /** If true, shows a loading spinner instead of the search */
  loading?: boolean;
  /** Minimum characters to start filtering (default: 0) */
  minSearchLength?: number;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  /** Renders a custom item (receives option + whether it's selected) */
  renderItem?: (option: SearchableOption, selected: boolean) => ReactNode;
  /** Renders custom content when no options match */
  emptyText?: string;
  /** If true, always show the search input (default: true) */
  showSearch?: boolean;
  /** Passthrough for form integration */
  name?: string;
  /** Called when the dropdown opens */
  onOpen?: () => void;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Pilih...",
  loading = false,
  minSearchLength = 0,
  className,
  triggerClassName,
  disabled = false,
  renderItem,
  emptyText = "Tidak ada data",
  showSearch = true,
  name,
  onOpen,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIdx, setHighlightedIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  // Filter options based on search
  const filtered = options.filter((o) => {
    const q = search.toLowerCase().trim();
    if (q.length < minSearchLength) return true;
    const haystack = [o.label, o.searchLabel, o.hint]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });

  // Reset highlight when filter changes
  useEffect(() => {
    setHighlightedIdx(0);
  }, [search]);

  // Focus search input when opening
  useEffect(() => {
    if (open && showSearch) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    if (!open) {
      setSearch("");
    }
  }, [open, showSearch]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen(true);
          onOpen?.();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIdx((prev) =>
            prev < filtered.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIdx((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          e.preventDefault();
          if (filtered[highlightedIdx]) {
            onValueChange(filtered[highlightedIdx].value);
            setOpen(false);
          }
          break;
        case "Escape":
          e.preventDefault();
          setOpen(false);
          break;
        case "Tab":
          setOpen(false);
          break;
      }
    },
    [open, filtered, highlightedIdx, onValueChange, onOpen]
  );

  // Scroll highlighted item into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const items = listRef.current.querySelectorAll<HTMLElement>(
      "[data-option-index]"
    );
    const el = items[highlightedIdx];
    if (el) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIdx, open]);

  // Click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    // Delay to avoid immediate close from trigger click
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for form integration */}
      {name && (
        <input type="hidden" name={name} value={value} />
      )}

      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!open) onOpen?.();
          setOpen((prev) => !prev);
        }}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background",
          "placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-1 focus:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "ring-1 ring-ring",
          triggerClassName
        )}
      >
        <span
          className={cn(
            "truncate",
            !selectedOption && "text-muted-foreground"
          )}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[var(--radix-select-trigger-width)] rounded-md border bg-popover text-popover-foreground shadow-md">
          {/* Search input */}
          {showSearch && !loading && (
            <div className="flex items-center border-b border-border px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari..."
                className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                onKeyDown={(e) => {
                  // Prevent keydown from bubbling to container when typing
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (filtered[highlightedIdx]) {
                      onValueChange(filtered[highlightedIdx].value);
                      setOpen(false);
                    }
                  }
                  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                    // Let container handle
                  } else {
                    e.stopPropagation();
                  }
                }}
              />
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Options list */}
          {!loading && (
            <div
              ref={listRef}
              className="max-h-60 overflow-y-auto p-1"
              role="listbox"
            >
              {filtered.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {emptyText}
                </div>
              ) : (
                filtered.map((option, idx) => {
                  const isSelected = option.value === value;
                  const isHighlighted = idx === highlightedIdx;

                  return (
                    <div
                      key={option.value}
                      data-option-index={idx}
                      role="option"
                      aria-selected={isSelected}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onValueChange(option.value);
                        setOpen(false);
                      }}
                      onMouseEnter={() => setHighlightedIdx(idx)}
                      className={cn(
                        "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                        "transition-colors",
                        isHighlighted && "bg-accent text-accent-foreground",
                        isSelected && "font-medium"
                      )}
                    >
                      {renderItem ? (
                        renderItem(option, isSelected)
                      ) : (
                        <>
                          <span className="flex-1 truncate">
                            {option.label}
                          </span>
                          {option.hint && (
                            <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                              {option.hint}
                            </span>
                          )}
                        </>
                      )}
                      {isSelected && (
                        <Check className="ml-2 h-4 w-4 shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
