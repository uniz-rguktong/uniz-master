import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { DbAdminError, listDatabases } from "./databaseApi";
import DatabaseBrowser from "./DatabaseBrowser";

export default function DatabaseSection() {
  const [databaseId, setDatabaseId] = useState("");
  const [databaseLabel, setDatabaseLabel] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    listDatabases()
      .then((result) => {
        if (cancelled) return;
        const first = result.databases[0];
        if (!first) {
          setError("No database is configured for the editor yet.");
          return;
        }
        setDatabaseId(first.id);
        setDatabaseLabel(first.label);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof DbAdminError ? err.message : "The database editor could not be opened.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100dvh-60px)] min-h-[32rem] flex-col bg-bg min-[821px]:-mx-10 min-[821px]:-my-8 min-[821px]:h-[calc(100dvh-4rem)]">
      {error ? (
        <p role="alert" className="px-4 py-6 text-body text-error">
          {error}
        </p>
      ) : null}
      {databaseId ? <DatabaseBrowser databaseId={databaseId} databaseLabel={databaseLabel} /> : null}
      {!databaseId && !error ? (
        <div className="space-y-3 p-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : null}
    </div>
  );
}
