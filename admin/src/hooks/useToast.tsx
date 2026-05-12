import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 3500);
    },
    [removeToast]
  );

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    error: <XCircle className="w-4 h-4 text-red-500" />,
    info: <AlertCircle className="w-4 h-4 text-blue-500" />,
  };

  const borders: Record<ToastType, string> = {
    success: "border-emerald-200 dark:border-emerald-900",
    error: "border-red-200 dark:border-red-900",
    info: "border-blue-200 dark:border-blue-900",
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container — bottom on mobile, top-right on desktop */}
      <div className="fixed z-[100] bottom-20 left-4 right-4 lg:bottom-auto lg:top-4 lg:left-auto lg:right-4 lg:w-[360px] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl bg-card border shadow-lg",
              "animate-in slide-in-from-bottom-4 lg:slide-in-from-bottom-0 lg:slide-in-from-right-4 fade-in duration-300",
              borders[t.type]
            )}
          >
            {icons[t.type]}
            <span className="flex-1 text-sm font-medium text-foreground">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
