import { AlertCircle, RefreshCw } from "lucide-react";

interface InlineErrorProps {
  title: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function InlineError({
  title,
  message,
  onRetry,
  retryLabel = "Try again",
}: InlineErrorProps) {
  return (
    <div className="bg-white border border-zinc-100 rounded-2xl p-8 text-center shadow-sm">
      <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-600 mx-auto mb-5">
        <AlertCircle size={28} />
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-zinc-500 max-w-sm mx-auto font-medium text-[15px] leading-relaxed mb-6">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.14em] transition-all"
        >
          <RefreshCw size={14} />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
