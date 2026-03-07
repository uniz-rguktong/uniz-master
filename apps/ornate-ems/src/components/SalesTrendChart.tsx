"use client";
import React, { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { InfoTooltip } from "./InfoTooltip";

type TrendRange = "Weekly" | "Monthly" | "Yearly";

interface SalesTrendItem {
  label: string;
  registered: number;
  attended: number;
}

interface SalesTrendDatasets {
  Weekly: SalesTrendItem[];
  Monthly: SalesTrendItem[];
  Yearly: SalesTrendItem[];
}

interface SalesTrendChartProps {
  data?:
    | (Partial<SalesTrendDatasets> | Record<string, SalesTrendItem[]>)
    | undefined;
}

interface ChartPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const defaultDatasets: SalesTrendDatasets = {
  Weekly: [],
  Monthly: [],
  Yearly: [],
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function buildChartLinePath(
  values: number[],
  scaleMax: number,
  width: number,
  height: number,
  padding: ChartPadding,
) {
  if (values.length === 0) return "";

  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const safeScale = scaleMax || 1;

  const pts = values.map((v: any, i: any) => {
    const x =
      padding.left +
      (values.length === 1 ? innerW / 2 : (i / (values.length - 1)) * innerW);
    const y = padding.top + (1 - v / safeScale) * innerH;
    return { x, y };
  });

  return `M ${pts.map((p: any) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" L ")}`;
}

function getHoveredIndexFromX(clientX: number, rect: DOMRect, count: number) {
  if (count <= 0) return null;
  if (count === 1) return 0;

  const x = clamp(clientX - rect.left, 0, rect.width);
  const ratio = rect.width === 0 ? 0 : x / rect.width;
  return clamp(Math.round(ratio * (count - 1)), 0, count - 1);
}

export function SalesTrendChart({ data }: SalesTrendChartProps) {
  const [activeRange, setActiveRange] = useState<TrendRange>("Monthly");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const datasets: SalesTrendDatasets = {
    Weekly: data?.Weekly ?? defaultDatasets.Weekly,
    Monthly: data?.Monthly ?? defaultDatasets.Monthly,
    Yearly: data?.Yearly ?? defaultDatasets.Yearly,
  };
  const points = datasets[activeRange] || [];
  const hasTrendData =
    datasets.Weekly.length > 0 ||
    datasets.Monthly.length > 0 ||
    datasets.Yearly.length > 0;
  const maxValue =
    points.length > 0 ? Math.max(...points.map((p: any) => p.registered)) : 0;
  const scaleMax = Math.ceil(maxValue / 100) * 100 || 100;
  const yTicks = 5;

  const totalRegistered = points.reduce(
    (sum: any, p: any) => sum + p.registered,
    0,
  );
  const totalAttended = points.reduce(
    (sum: any, p: any) => sum + p.attended,
    0,
  );
  const overallRate =
    totalRegistered === 0
      ? 0
      : Math.round((totalAttended / totalRegistered) * 1000) / 10;

  const registeredSeries = points.map((p: any) => p.registered);
  const attendedSeries = points.map((p: any) => p.attended);

  const chart = {
    width: 620,
    height: 320,
    padding: { top: 14, right: 12, bottom: 36, left: 12 },
  };

  const registeredPath = buildChartLinePath(
    registeredSeries,
    scaleMax,
    chart.width,
    chart.height,
    chart.padding,
  );
  const attendedPath = buildChartLinePath(
    attendedSeries,
    scaleMax,
    chart.width,
    chart.height,
    chart.padding,
  );

  const hoveredPoint = hoveredIndex === null ? null : points[hoveredIndex];
  const hoveredXPercent =
    hoveredIndex === null || points.length <= 1
      ? 0
      : hoveredIndex / (points.length - 1);
  const hoveredAttendedYPercent =
    hoveredIndex === null
      ? 0
      : (() => {
          const innerH =
            chart.height - chart.padding.top - chart.padding.bottom;
          const attendedValue = attendedSeries[hoveredIndex] ?? 0;
          const y =
            chart.padding.top + (1 - attendedValue / (scaleMax || 1)) * innerH;
          return y / chart.height;
        })();

  return (
    <div className="bg-[#F4F2F0] rounded-[18px] p-[10px] h-full flex flex-col transition-colors duration-300">
      <div className="flex items-center justify-between mt-[10px] mb-[16px] px-[12px]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-[#7A7772] tracking-[0.05em] uppercase opacity-80">
            Participation Trends
          </h3>
          <InfoTooltip text="Visual representation of student registration vs actual attendance over time." />
        </div>
        <div className="flex items-center justify-center mb-5 bg-transparent p-1.5 rounded-full cursor-pointer"></div>
      </div>

      <div className="bg-white rounded-[16px] p-4 md:p-8 shadow-sm relative flex-1 flex flex-col min-h-[400px] md:min-h-[500px]">
        {!hasTrendData && (
          <div className="mb-4 text-center">
            <p className="text-sm text-[#9CA3AF]">
              No participation data available from database.
            </p>
          </div>
        )}
        <div className="flex-1 flex flex-col">
          {/* Header Stats & Legend/Toggle Area */}
          <div className="flex flex-wrap items-start justify-between gap-6 mb-[32px]">
            <div>
              <div className="text-xs font-bold text-[#7A7772] tracking-wider uppercase mb-1.5">
                OVERALL PARTICIPATION RATE
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[24px] md:text-[32px] font-bold text-[#1F1F1F] tracking-tight">
                  {overallRate.toFixed(1)}%
                </span>
                <span className="text-[10px] md:text-[11px] font-semibold text-[#4F8A6B] bg-[#EDF6F1] px-2.5 py-0.5 rounded-full border border-[#4F8A6B]/15">
                  Healthy engagement
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 md:gap-8 ml-auto pb-1">
              <div className="flex items-center gap-4 md:gap-6 mr-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-[#93C5FD]" />
                  <span className="text-[10px] font-bold text-[#7A7772] tracking-wider uppercase">
                    Registered
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-[#4F8A6B]" />
                  <span className="text-[10px] font-bold text-[#7A7772] tracking-wider uppercase">
                    Attended
                  </span>
                </div>
              </div>

              <div className="flex bg-[#F4F2F0] p-1 rounded-full">
                {(["Weekly", "Monthly", "Yearly"] as const).map(
                  (range: any) => (
                    <button
                      key={range}
                      onClick={() => setActiveRange(range)}
                      className={`px-3 md:px-5 py-1.5 rounded-full text-[10px] font-bold transition-all duration-200 ${
                        activeRange === range
                          ? "bg-white text-[#1F1F1F] shadow-[0_2px_4px_rgba(0,0,0,0.05)]"
                          : "text-[#9A9792] hover:text-[#3A3A3A]"
                      }`}
                    >
                      {range}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* Chart Area */}
          <div className="flex gap-4 md:gap-10 overflow-x-hidden">
            {/* Y Axis Labels */}
            <div className="flex flex-col justify-between h-[280px] md:h-[320px] text-[10px] md:text-[11px] font-bold text-[#9A9792] pb-[32px]">
              {Array.from({ length: yTicks + 1 }).map((_: any, idx: any) => {
                const value = (scaleMax / yTicks) * (yTicks - idx);
                return (
                  <span
                    key={idx}
                    className={
                      idx === yTicks ? "flex items-end" : "flex items-center"
                    }
                  >
                    {value}
                  </span>
                );
              })}
            </div>

            {/* Grid + Bars */}
            <div className="flex-1">
              <div className="relative">
                <div className="relative h-[320px]">
                  {/* Static line chart (always visible). Hover to see point details. */}
                  <div
                    className="absolute inset-0"
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredIndex(
                        getHoveredIndexFromX(e.clientX, rect, points.length),
                      );
                    }}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <svg
                      viewBox={`0 0 ${chart.width} ${chart.height}`}
                      width="100%"
                      height="100%"
                      className="block"
                      preserveAspectRatio="none"
                      aria-label="Event participation line chart"
                    >
                      <defs>
                        <linearGradient
                          id="attendedArea"
                          x1="0"
                          x2="0"
                          y1="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#10B981"
                            stopOpacity="0.18"
                          />
                          <stop
                            offset="100%"
                            stopColor="#10B981"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>

                      {/* horizontal grid lines */}
                      {Array.from({ length: yTicks + 1 }).map(
                        (_: any, idx: any) => {
                          const y =
                            chart.padding.top +
                            (idx / yTicks) *
                              (chart.height -
                                chart.padding.top -
                                chart.padding.bottom);
                          const isBottom = idx === yTicks;
                          return (
                            <line
                              key={idx}
                              x1={chart.padding.left}
                              x2={chart.width - chart.padding.right}
                              y1={y}
                              y2={y}
                              stroke="#E6E3DE"
                              strokeWidth={1}
                              strokeDasharray={isBottom ? "0" : "4 4"}
                            />
                          );
                        },
                      )}

                      {/* hover guideline */}
                      {hoveredIndex !== null && points.length > 1 && (
                        <line
                          x1={
                            chart.padding.left +
                            (hoveredIndex / (points.length - 1)) *
                              (chart.width -
                                chart.padding.left -
                                chart.padding.right)
                          }
                          x2={
                            chart.padding.left +
                            (hoveredIndex / (points.length - 1)) *
                              (chart.width -
                                chart.padding.left -
                                chart.padding.right)
                          }
                          y1={chart.padding.top}
                          y2={chart.height - chart.padding.bottom}
                          stroke="#9A9792"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                          opacity="0.6"
                        />
                      )}

                      {/* attended area fill */}
                      {attendedPath && (
                        <path
                          d={`${attendedPath} L ${(
                            chart.width - chart.padding.right
                          ).toFixed(
                            2,
                          )} ${(chart.height - chart.padding.bottom).toFixed(2)} L ${chart.padding.left.toFixed(
                            2,
                          )} ${(chart.height - chart.padding.bottom).toFixed(2)} Z`}
                          fill="url(#attendedArea)"
                        />
                      )}

                      {/* registered line */}
                      <path
                        d={registeredPath}
                        fill="none"
                        stroke="#93C5FD"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* attended line */}
                      <path
                        d={attendedPath}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* dots */}
                      {points.map((p: any, i: any) => {
                        const innerW =
                          chart.width -
                          chart.padding.left -
                          chart.padding.right;
                        const innerH =
                          chart.height -
                          chart.padding.top -
                          chart.padding.bottom;
                        const x =
                          chart.padding.left +
                          (points.length === 1
                            ? innerW / 2
                            : (i / (points.length - 1)) * innerW);
                        const yReg =
                          chart.padding.top +
                          (1 - p.registered / (scaleMax || 1)) * innerH;
                        const yAtt =
                          chart.padding.top +
                          (1 - p.attended / (scaleMax || 1)) * innerH;
                        const isHovered = hoveredIndex === i;

                        return (
                          <g key={p.label}>
                            <circle
                              cx={x}
                              cy={yReg}
                              r={isHovered ? 4.25 : 3.25}
                              fill="#93C5FD"
                              stroke="white"
                              strokeWidth="2"
                              opacity={isHovered ? 1 : 0.9}
                            />

                            <circle
                              cx={x}
                              cy={yAtt}
                              r={isHovered ? 4.25 : 3.25}
                              fill="#10B981"
                              stroke="white"
                              strokeWidth="2"
                              opacity={isHovered ? 1 : 0.95}
                            />
                          </g>
                        );
                      })}
                    </svg>

                    {/* Hover tooltip (details for that week/month/year) */}
                    {hoveredPoint && (
                      <div
                        className="absolute z-20 bg-white border border-[#E6E3DE] rounded-2xl shadow-xl px-4 py-3 min-w-[190px]"
                        style={{
                          left: `${hoveredXPercent * 100}%`,
                          top: `${Math.max(0.08, hoveredAttendedYPercent) * 100}%`,
                          transform: "translate(-10%, -110%)",
                        }}
                      >
                        <div className="text-[11px] font-bold text-[#9A9792] mb-2">
                          {hoveredPoint.label}{" "}
                          {activeRange === "Yearly"
                            ? ""
                            : activeRange === "Monthly"
                              ? "2025"
                              : ""}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-[4px] bg-[#5B6F8A]" />
                              <span className="text-[12px] text-[#3A3A3A] font-medium">
                                Registered
                              </span>
                            </div>
                            <span className="text-[12px] font-semibold text-[#1F1F1F]">
                              {hoveredPoint.registered.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-[4px] bg-[#4F8A6B]" />
                              <span className="text-[12px] text-[#3A3A3A] font-medium">
                                Attended
                              </span>
                            </div>
                            <span className="text-[12px] font-semibold text-[#1F1F1F]">
                              {hoveredPoint.attended.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-dashed border-[#E6E3DE] mt-1">
                            <span className="text-[11px] text-[#9A9792]">
                              Participation rate
                            </span>
                            <span className="text-[12px] font-semibold text-[#4F8A6B]">
                              {(hoveredPoint.registered === 0
                                ? 0
                                : Math.round(
                                    (hoveredPoint.attended /
                                      hoveredPoint.registered) *
                                      1000,
                                  ) / 10
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* X-axis labels */}
                <div
                  className="flex justify-between mt-6"
                  style={{
                    paddingLeft: chart.padding.left,
                    paddingRight: chart.padding.right,
                  }}
                >
                  {points.map((p: any, idx: any) => (
                    <span
                      key={p.label}
                      className={`text-[11px] font-bold text-[#9A9792] uppercase tracking-wider ${idx % 2 !== 0 ? "hidden sm:inline" : "inline"}`}
                    >
                      {p.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
