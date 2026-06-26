import { memo } from "react";

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
        className={`bg-white p-5 rounded-xl border border-zinc-100 shadow-sm hover:border-zinc-100 transition-all duration-300 ${fullWidth ? "col-span-full" : ""}`}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-zinc-900">{icon}</span>
          <span className="text-[10px] font-bold tracking-[0.14em] text-zinc-400">
            {label}
          </span>
        </div>

        {isLoading ? (
          <div className="bg-zinc-50 rounded-lg w-3/4 h-6 animate-pulse"></div>
        ) : isEditing && editable ? (
          type === "select" ? (
            <select
              name={name}
              value={value}
              onChange={handleChange}
              className="w-full bg-zinc-50 text-zinc-900 text-[15px] font-semibold p-3.5 rounded-xl border border-zinc-100 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all appearance-none"
            >
              <option value="">Select {label}</option>
              {(options || []).map((opt: any) => (
                <option key={opt.v} value={opt.v}>{opt.l}</option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              name={name}
              value={value}
              onChange={handleChange}
              className="w-full bg-zinc-50 text-zinc-900 text-[15px] font-semibold p-3 rounded-xl border border-zinc-100 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all placeholder:text-zinc-400 placeholder:font-normal"
              autoComplete="off"
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          )
        ) : (
          <p className="text-zinc-900 text-[15px] font-semibold truncate leading-tight tracking-normal px-1">
            {value ? (
              value
            ) : (
              <span className="text-zinc-300 font-medium italic text-sm">
                No data
              </span>
            )}
          </p>
        )}
      </div>
    );
  },
);
