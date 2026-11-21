import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type WebsitePublishBarProps = {
  visible: boolean;
  saving: boolean;
  subtitle: string;
  autoSave?: boolean;
  onDiscard: () => void;
  onPublish: () => void;
};

export function WebsitePublishBar({
  visible,
  saving,
  subtitle,
  autoSave = false,
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
          className="fixed bottom-6 left-1/2 z-50 w-[min(560px,calc(100vw-2rem))] -translate-x-1/2"
        >
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-dense font-medium text-text">
                {saving ? "Publishing…" : autoSave ? "Auto-publishing" : "Unpublished changes"}
              </p>
              <p className="truncate text-caption text-text-3">{subtitle}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="compact"
                onClick={onDiscard}
                disabled={saving}
              >
                Discard
              </Button>
              {!autoSave && (
                <Button
                  type="button"
                  size="compact"
                  onClick={onPublish}
                  disabled={saving}
                  isLoading={saving}
                >
                  Publish
                </Button>
              )}
              {autoSave && saving && (
                <Loader2 size={16} className="animate-spin text-text-3" />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
