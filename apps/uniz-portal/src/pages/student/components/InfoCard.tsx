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
  }: any) => {
    const handleChange = (e: any) => onValueChange(name, e.target.value);

    return (
      <div
        className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] hover:border-blue-100 transition-all duration-300 ${fullWidth ? "col-span-full" : ""}`}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <span className="p-2 bg-blue-50 rounded-xl text-blue-600">
            {icon}
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            {label}
          </span>
        </div>

        {isLoading ? (
          <div className="bg-slate-50 rounded-lg w-3/4 h-6 animate-pulse"></div>
        ) : isEditing && editable ? (
          <input
            type={type}
            name={name}
            value={value}
            onChange={handleChange}
            className="w-full bg-slate-50 text-slate-900 text-[15px] font-semibold p-3 rounded-xl border border-slate-100 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
            autoComplete="off"
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        ) : (
          <p className="text-slate-900 text-[15px] font-bold truncate leading-tight tracking-tight px-1">
            {value ? (
              value
            ) : (
              <span className="text-slate-300 font-medium italic text-sm">
                No data
              </span>
            )}
          </p>
        )}
      </div>
    );
  },
);
