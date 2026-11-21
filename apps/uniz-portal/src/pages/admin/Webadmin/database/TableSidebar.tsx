import { adminInputClass, adminSelectClass } from "@/components/admin/admin-ui";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import type { TableSummary } from "./databaseApi";
import { formatEstimate } from "./model";

export function TableSidebar({
  databaseLabel,
  schemas,
  schema,
  onSchema,
  query,
  onQuery,
  tables,
  loading,
  selected,
  onSelect,
}: {
  databaseLabel: string;
  schemas: string[];
  schema: string;
  onSchema: (schema: string) => void;
  query: string;
  onQuery: (query: string) => void;
  tables: TableSummary[];
  loading: boolean;
  selected: string;
  onSelect: (table: string) => void;
}) {
  const needle = query.trim().toLowerCase();
  const shown = needle ? tables.filter((table) => table.name.toLowerCase().includes(needle)) : tables;

  return (
    <aside className="flex max-h-64 min-h-0 shrink-0 flex-col overflow-hidden border-b border-border bg-surface min-[821px]:h-full min-[821px]:max-h-none min-[821px]:w-[280px] min-[821px]:border-b-0 min-[821px]:border-r">
      <div className="space-y-3 border-b border-border px-3 py-3">
        {databaseLabel ? <p className="truncate text-caption text-text-3">{databaseLabel}</p> : null}
        <label className="block">
          <span className="mb-1.5 block text-caption font-medium text-text-2">Schema</span>
          <select
            aria-label="Schema"
            className={cn(adminSelectClass, "h-9 min-h-9 py-0 text-small")}
            value={schema}
            onChange={(event) => onSchema(event.target.value)}
          >
            {schemas.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <input
          className={cn(adminInputClass, "h-9 min-h-9 text-small")}
          value={query}
          placeholder="Search tables"
          aria-label="Search tables"
          onChange={(event) => onQuery(event.target.value)}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {loading ? (
          <div className="space-y-2 px-1 py-1">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        ) : null}
        {!loading && shown.length === 0 ? (
          <p className="px-2 py-6 text-center text-small text-text-2">{tables.length === 0 ? "No tables in this schema." : "No tables match that search."}</p>
        ) : null}
        <ul className="space-y-0.5" aria-label="Tables">
          {shown.map((table) => {
            const active = table.name === selected;
            return (
              <li key={table.name}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-small",
                    active ? "bg-tint font-medium text-head" : "text-text hover:bg-surface-2",
                  )}
                  aria-current={active ? "true" : undefined}
                  onClick={() => onSelect(table.name)}
                >
                  <span className="min-w-0 flex-1 truncate">{table.name}</span>
                  {table.estimatedRows !== null ? (
                    <span className="shrink-0 text-caption tabular-nums text-text-3" title="Approximate row count">
                      {formatEstimate(table.estimatedRows)}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
