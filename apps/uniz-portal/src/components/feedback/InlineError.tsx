import { Button } from "@/components/Button";
import { EmptyState } from "@/components/ui/empty-state";

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
    <EmptyState
      tone="error"
      title={title}
      body={message}
      action={
        onRetry ? (
          <Button type="button" variant="outline" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : null
      }
    />
  );
}
