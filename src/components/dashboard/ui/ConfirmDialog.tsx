import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/dashboard/ui/Modal";
import { Button } from "@/components/dashboard/ui/Button";

export type ConfirmRequest = {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
};

type ConfirmDialogProps = {
  request: ConfirmRequest | null;
  onClose: () => void;
};

export function ConfirmDialog({ request, onClose }: ConfirmDialogProps) {
  return (
    <Modal open={!!request} onClose={onClose}>
      {request && (
        <div className="px-6 py-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <AlertTriangle size={22} />
          </div>
          <h2 className="text-base font-black text-ink">{request.title}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{request.message}</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                request.onConfirm();
                onClose();
              }}
            >
              {request.confirmLabel ?? "Remove"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
