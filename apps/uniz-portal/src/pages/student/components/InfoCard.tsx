import { memo } from "react";
import { cn } from "@/lib/utils";
import { portalInputClass, portalLabelClass } from "@/lib/portal-ui";

export const InfoCard = memo(
  ({
    icon,
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
    const handleChange = (e: any) => onValueChange(name, e.target.value);

    return (
      <div
        className={cn(
          "rounded-portal-xl border border-navy-200 bg-white p-4 md:p-5 shadow-whisper transition-all duration-200 hover:border-navy-300",
          fullWidth && "col-span-full",
        )}
      >
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-navy-700">{icon}</span>
          <span className={cn(portalLabelClass, "!mb-0")}>{label}</span>
        </div>

        {isLoading ? (
          <div className="h-6 w-3/4 animate-pulse rounded-portal-lg bg-navy-50" />
        ) : isEditing && editable ? (
          type === "select" ? (
            <select
              name={name}
              value={value}
              onChange={handleChange}
              className={cn(portalInputClass, "font-semibold")}
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
              type={type}
              name={name}
              value={value}
              onChange={handleChange}
              className={cn(portalInputClass, "font-semibold")}
              autoComplete="off"
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          )
        ) : (
          <p className="truncate px-0.5 text-[15px] font-semibold leading-tight tracking-normal text-navy-900">
            {value ? (
              value
            ) : (
              <span className="text-sm font-medium italic text-navy-300">
                No data
              </span>
            )}
          </p>
        )}
      </div>
    );
  },
);
