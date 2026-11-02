interface DisabledStateProps {
  reason: string;
  detail?: string;
}

/** Shown when a module is live but a key or setup it needs is missing. */
export function DisabledState({ reason, detail }: DisabledStateProps) {
  return (
    <div
      role="status"
 className="mx-auto max-w-md rounded-xl border border-slate-200 bg-slate-50 p-6 text-center"
    >
 <p className="text-base font-semibold text-slate-800">{reason}</p>
 {detail ? <p className="mt-2 text-sm text-slate-500">{detail}</p> : null}
    </div>
  );
}

export default DisabledState;
