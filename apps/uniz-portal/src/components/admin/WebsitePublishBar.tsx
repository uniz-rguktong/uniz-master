import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";

type WebsitePublishBarProps = {
  visible: boolean;
  saving: boolean;
  subtitle: string;
  onDiscard: () => void;
  onPublish: () => void;
};

export function WebsitePublishBar({
  visible,
  saving,
  subtitle,
  onDiscard,
  onPublish,
}: WebsitePublishBarProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[min(560px,calc(100vw-2rem))]"
        >
          <div className="flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl bg-zinc-900 text-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.45)] border border-zinc-700/50">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold truncate">Unpublished changes</p>
              <p className="text-[11px] text-zinc-400 truncate">{subtitle}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onDiscard}
                disabled={saving}
                className="h-9 px-3 rounded-lg text-[12px] font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={onPublish}
                disabled={saving}
                className="h-9 px-4 rounded-lg bg-white text-zinc-900 text-[12px] font-bold flex items-center gap-1.5 hover:bg-zinc-100 transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                Publish
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
