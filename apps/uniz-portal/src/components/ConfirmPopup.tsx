import { AlertCircle } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  message,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="p-3 rounded-full text-red-600">
              <AlertCircle size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Confirm Action
              </h3>
              <p className="text-[14px] font-medium text-slate-500 mt-1.5 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={onClose}
              className=" border-2 flex-1 py-2.5 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 py-2.5 rounded-xl bg-blue-600  text-white font-bold shadow-md shadow-blue-200"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
