import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "warning" | "info" | "success";
  onConfirm: () => void;
  disabled?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Ya, Lanjutkan",
  cancelLabel = "Batal",
  variant = "destructive",
  onConfirm,
  disabled = false,
}: ConfirmDialogProps) {
  const iconMap = {
    destructive: <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />,
    success: <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
  };

  const confirmClassMap = {
    destructive: "bg-red-600 hover:bg-red-700 text-white",
    warning: "bg-amber-600 hover:bg-amber-700 text-white",
    info: "bg-blue-600 hover:bg-blue-700 text-white",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white",
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
          <div className="flex items-start gap-3">
            {iconMap[variant]}
            <div className="flex-1">
              <DialogPrimitive.Title asChild>
                <h2 className="text-base font-semibold text-foreground">{title}</h2>
              </DialogPrimitive.Title>
              <DialogPrimitive.Description asChild>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              </DialogPrimitive.Description>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={disabled}>
              {cancelLabel}
            </Button>
            <Button
              size="sm"
              className={cn("text-white", confirmClassMap[variant])}
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
              disabled={disabled}
            >
              {confirmLabel}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
