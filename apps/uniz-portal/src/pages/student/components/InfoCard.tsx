import { memo } from "react";
import { cn } from "@/lib/utils";
import { portalInputClass } from "@/lib/portal-ui";
import { Skeleton } from "@/components/ui/Skeleton";

function displayValue(
  value: unknown,
  type: string,
  options?: { v: string; l: string }[],
): string {
  const match = (options || []).find((opt) => opt.v === value);
  if (match) return match.l;
  if (type === "date" && typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }
  if (value === undefined || value === null) return "";
  return String(value);
}

export const InfoCard = memo(
  ({
    icon: _icon,
    label,
    name,
    value,
    editable,
    isEditing,
    isLoading,
    onValueChange,
    type = "text",
    fullWidth,
    options,
  }: any) => {
    void _icon;
    const handleChange = (e: any) => onValueChange(name, e.target.value);
    const empty = value === undefined || value === null || value === "";
    const shown = displayValue(value, type, options);

    return (
      <div
        className={cn(
          "border-b border-border py-3",
          fullWidth && "min-[821px]:col-span-2",
        )}
      >
        <dt>
          {isEditing && editable ? (
            <label htmlFor={name} className="text-dense font-medium text-text-2">
              {label}
            </label>
          ) : (
            <span className="text-dense font-medium text-text-2">{label}</span>
          )}
        </dt>
        <dd className="mt-1">
          {isLoading ? (
            <Skeleton className="h-6 w-3/4" />
          ) : isEditing && editable ? (
            type === "select" ? (
              <select
                id={name}
                name={name}
                value={value}
                onChange={handleChange}
                className={portalInputClass}
              >
                <option value="">Select {label}</option>
                {(options || []).map((opt: any) => (
                  <option key={opt.v} value={opt.v}>
                    {opt.l}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={name}
                type={type}
                name={name}
                value={value}
                onChange={handleChange}
                className={portalInputClass}
                autoComplete="off"
                placeholder={`Enter ${String(label).toLowerCase()}`}
              />
            )
          ) : (
            <p className="text-body text-head [overflow-wrap:anywhere]">
              {empty ? (
                <span className="text-text-2">No data</span>
              ) : (
                shown
              )}
            </p>
          )}
        </dd>
      </div>
    );
  },
);
