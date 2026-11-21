import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { adminPageWrapClass } from "@/components/admin/admin-ui";
import { DbAdminError, listDatabases } from "./databaseApi";
import DatabaseBrowse from "./DatabaseBrowse";
import DatabaseSqlConsole from "./DatabaseSqlConsole";
import DatabaseHistory from "./DatabaseHistory";

const TABS = [
  { id: "browse", label: "Tables" },
  { id: "sql", label: "Command" },
  { id: "history", label: "History" },
];

export default function DatabaseSection() {
  const [tab, setTab] = useState("browse");
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
    <div className={adminPageWrapClass}>
      <PageHeader
        title="Database"
        meta="Look up a table, fix a row, or run a command. Every change is kept in History and can be undone."
      />
      <p className="text-body leading-6 text-text-2">
        Everyday fixes belong here. The emergency Adminer site is a separate login at dbadmin.rguktong.in.
      </p>
      {databaseLabel ? (
        <p className="text-body font-medium text-head">{databaseLabel}</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-body text-error">
          {error}
        </p>
      ) : null}
      <Tabs tabs={TABS} value={tab} onChange={setTab} label="Database sections" />
      {databaseId && tab === "browse" ? <DatabaseBrowse databaseId={databaseId} /> : null}
      {databaseId && tab === "sql" ? <DatabaseSqlConsole databaseId={databaseId} /> : null}
      {databaseId && tab === "history" ? <DatabaseHistory databaseId={databaseId} /> : null}
    </div>
  );
}
