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
    <div className="bg-white border border-navy-100 rounded-[2px] p-8 text-center shadow-sm">
      <div className="w-14 h-14 bg-navy-50 rounded-[2px] flex items-center justify-center text-navy-600 mx-auto mb-5">
        <AlertCircle size={28} />
      </div>
      <h3 className="text-lg font-semibold text-navy-900 mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-navy-500 max-w-sm mx-auto font-medium text-[15px] leading-relaxed mb-6">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-[2px] font-bold text-xs tracking-[0.14em] transition-all"
        >
          <RefreshCw size={14} />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
